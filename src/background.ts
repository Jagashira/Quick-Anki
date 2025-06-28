/// <reference types="vite/client" />

import { prompts } from "./definition";

const API_URL = import.meta.env.VITE_API_URL;

let isAnkiConnected = false;

async function invokeAnkiConnect(action: string, params: object = {}) {
  try {
    const response = await fetch("http://127.0.0.1:8765", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, version: 6, params }),
    });
    const data = await response.json();
    if (data.error) throw new Error(data.error);
    return data.result;
  } catch (error) {
    console.error("Anki-Connect Error:", error);
    throw new Error(
      "Anki-Connectに接続できませんでした。Ankiが起動しているか確認してください。"
    );
  }
}

function updateIconBadge(isConnected: boolean) {
  if (isConnected) {
    chrome.action.setBadgeText({ text: "ON" });
    chrome.action.setBadgeBackgroundColor({ color: "#4CAF50" }); // 緑色
    chrome.action.setTitle({ title: "Ankiに接続済みです" });
  } else {
    chrome.action.setBadgeText({ text: "OFF" });
    chrome.action.setBadgeBackgroundColor({ color: "#F44336" }); // 赤色
    chrome.action.setTitle({
      title: "Ankiに接続されていません。Ankiを起動してください。",
    });
  }
}

async function checkAnkiConnectStatus() {
  try {
    const response = await fetch("http://127.0.0.1:8765", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "version", version: 6 }),
    });
    const data = await response.json();
    isAnkiConnected = data.error === null && !!data.result;
  } catch (_error) {
    isAnkiConnected = false;
  }
  updateIconBadge(isAnkiConnected);
}

// install
chrome.runtime.onInstalled.addListener(() => {
  console.log("Extension installed.");
  chrome.contextMenus.create({
    id: "add-word-via-api",
    title: "「%s」をAnkiに追加 (ChatGPT利用)",
    contexts: ["selection"],
  });
  checkAnkiConnectStatus();
});

// Browser launch
chrome.runtime.onStartup.addListener(() => {
  console.log("Browser started.");
  checkAnkiConnectStatus();
});

chrome.contextMenus.onClicked.addListener(async (info) => {
  if (info.menuItemId !== "add-word-via-api" || !info.selectionText) return;

  await checkAnkiConnectStatus();
  if (!isAnkiConnected) {
    chrome.notifications.create({
      type: "basic",
      iconUrl: "icons/icon48.png",
      title: "Ankiに接続できません",
      message: "Ankiアプリが起動しているか確認してください。",
    });
    return;
  }

  const word = info.selectionText.trim();
  const settings = await chrome.storage.sync.get({
    deckName: "Default",
    tags: ["chrome-extension", "chatgpt-generated"],
  });

  const deckName = settings.deckName;
  const tags = settings.tags;
  if (!word) return;

  try {
    const duplicateNotes = await invokeAnkiConnect("findNotes", {
      query: `deck:"${deckName}" Front:"${word}"`,
    });
    if (duplicateNotes.length > 0) {
      chrome.notifications.create({
        type: "basic",
        iconUrl: "icons/icon48.png",
        title: "登録済みです",
        message: `単語「${word}」は既にAnkiに登録されています。`,
      });
      return;
    }

    const prompt = prompts.english.prompt(word);
    const apiResponse = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        word,
        prompt,
      }),
    });
    const apiData = await apiResponse.json();
    if (!apiResponse.ok)
      throw new Error(apiData.error || "APIサーバーでエラーが発生しました");

    let backContent = "";

    if (apiData.pronunciation) {
      backContent += `<b>発音:</b> /${apiData.pronunciation}/<hr>`;
    }

    if (apiData.meanings && apiData.meanings.length > 0) {
      backContent += `<b>意味:</b><ul>`;
      apiData.meanings.forEach(
        (m: { partOfSpeech: string; definition: string }) => {
          backContent += `<li><b>[${m.partOfSpeech}]</b> ${m.definition}</li>`;
        }
      );
      backContent += `</ul>`;
    }

    if (apiData.examples && apiData.examples.length > 0) {
      backContent += `<b>例文:</b><ul>`;
      apiData.examples.forEach((ex: { english: string; japanese: string }) => {
        backContent += `<li>${ex.english}<br><i>${ex.japanese}</i></li>`;
      });
      backContent += `</ul>`;
    }

    if (apiData.synonyms && apiData.synonyms.length > 0) {
      backContent += `<b>類義語:</b><ul>`;
      apiData.synonyms.forEach(
        (s: { word: string; meaning: string; difference: string }) => {
          backContent += `<li><b>${s.word}</b>: ${s.meaning} (${s.difference})</li>`;
        }
      );
      backContent += `</ul>`;
    }

    if (apiData.usageNotes) {
      backContent += `<br><b>使い方:</b><br>${apiData.usageNotes}`;
    }

    const noteParams = {
      note: {
        deckName,
        modelName: "Basic",
        fields: { Front: word, Back: backContent },
        tags,
      },
    };
    await invokeAnkiConnect("addNote", noteParams);

    chrome.notifications.create({
      type: "basic",
      iconUrl: "icons/icon48.png",
      title: `「 ${word}」をAnkiに追加しました！`,
      message: ``,
      contextMessage: `デッキ: ${deckName} | タグ: ${tags.join(", ")}`,
      priority: 0,
    });
  } catch (error) {
    chrome.notifications.create({
      type: "basic",
      iconUrl: "icons/icon48.png",
      title: "エラーが発生しました",
      message: error instanceof Error ? error.message : "不明なエラーです。",
    });
    console.error("処理中にエラーが発生しました:", error);
  }
});

chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  (async () => {
    try {
      if (request.type === "getAnkiData") {
        const [decks, tags] = await Promise.all([
          invokeAnkiConnect("deckNames"),
          invokeAnkiConnect("getTags"),
        ]);
        sendResponse({ success: true, decks, tags });
      } else if (request.type === "createDeck") {
        if (!request.deckName) {
          throw new Error("デッキ名が指定されていません。");
        }
        await invokeAnkiConnect("createDeck", { deck: request.deckName });
        const newDecks = await invokeAnkiConnect("deckNames");
        sendResponse({ success: true, decks: newDecks });
      }
    } catch (error) {
      sendResponse({
        success: false,
        error: error instanceof Error ? error.message : "不明なエラーです。",
      });
    }
  })();

  return true;
});
