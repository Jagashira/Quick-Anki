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

// --- イベントリスナーのセットアップ ---

// 拡張機能がインストールされたとき
chrome.runtime.onInstalled.addListener(() => {
  console.log("Extension installed.");
  // 右クリックメニューを作成
  chrome.contextMenus.create({
    id: "add-word-via-api",
    title: "「%s」をAnkiに追加 (ChatGPT利用)",
    contexts: ["selection"],
  });
  // 接続状態をチェック
  checkAnkiConnectStatus();
});

// ブラウザが起動したとき
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
  const deckName = "Default";
  const tags = ["chrome-extension", "chatgpt-generated"];
  if (!word) return;

  try {
    // 1. 重複チェック
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

    // 2. Next.js APIから全てのパーツを取得
    const prompt = prompts.english.prompt(word);
    const apiResponse = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ word, prompt }),
    });
    const apiData = await apiResponse.json();
    if (!apiResponse.ok)
      throw new Error(apiData.error || "APIサーバーでエラーが発生しました");

    let backContent = ""; // まず空の文字列を用意

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

    // 4. Anki-Connectを呼び出してノートを追加
    const noteParams = {
      note: {
        deckName,
        modelName: "Basic",
        fields: { Front: word, Back: backContent }, // 組み立てたHTMLを裏面に設定
        tags,
      },
    };
    await invokeAnkiConnect("addNote", noteParams);

    // 5. 成功を通知
    chrome.notifications.create({
      type: "basic",
      iconUrl: "icons/icon48.png",
      title: "Ankiに追加しました！",
      message: `「${word}」をAnkiに保存しました。`,
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
