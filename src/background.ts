/// <reference types="vite/client" />

import { invokeAnkiConnect } from "./_lib/ankiConnect";
import { prompts } from "./definition";
import { buildBackContent } from "./_lib/buildBackContent";
import type { HistoryItem, WordInfo } from "./types";

const API_URL = import.meta.env.VITE_API_URL;
const DEFAULT_ICON_PATH = "icons/icon48.png";
const HISTORY_KEY = "quickAnkiHistory";
const MAX_HISTORY_ITEMS = 10;

type NotificationInfo = {
  title: string;
  message: string;
} & Omit<
  chrome.notifications.NotificationOptions,
  "title" | "message" | "type" | "iconUrl"
>;

function showNotification(info: NotificationInfo) {
  chrome.notifications.create({
    type: "basic",
    iconUrl: DEFAULT_ICON_PATH,
    priority: 0,
    ...info,
  });
}

async function checkAnkiConnectStatus(): Promise<boolean> {
  let isConnected = false;
  try {
    const response = await invokeAnkiConnect("version", {});
    isConnected = !!response;
  } catch (_error) {
    isConnected = false;
  }

  const badgeText = isConnected ? "ON" : "OFF";
  const badgeColor = isConnected ? "#4CAF50" : "#F44336";
  const title = isConnected
    ? "Ankiに接続済みです"
    : "Ankiに接続されていません。Ankiを起動してください。";

  chrome.action.setBadgeText({ text: badgeText });
  chrome.action.setBadgeBackgroundColor({ color: badgeColor });
  chrome.action.setTitle({ title });

  return isConnected;
}

async function isDuplicate(word: string, deckName: string): Promise<boolean> {
  const duplicateNotes = await invokeAnkiConnect("findNotes", {
    query: `deck:"${deckName}" Front:"${word}"`,
  });
  return duplicateNotes.length > 0;
}

async function updateHistory(word: string, details: WordInfo) {
  try {
    const result = await chrome.storage.local.get([HISTORY_KEY]);
    const currentHistory: HistoryItem[] = result[HISTORY_KEY] || [];

    // 履歴に既に同じ単語があれば一旦削除（先頭に移動させるため）
    const filteredHistory = currentHistory.filter((item) => item.word !== word);

    // 新しい履歴アイテムを作成
    const newHistoryItem: HistoryItem = {
      word: word,
      timestamp: Date.now(),
      details: details,
    };

    // 新しいアイテムを履歴の先頭に追加
    const newHistory = [newHistoryItem, ...filteredHistory];

    // 履歴を最大件数に制限
    const trimmedHistory = newHistory.slice(0, MAX_HISTORY_ITEMS);

    await chrome.storage.local.set({ [HISTORY_KEY]: trimmedHistory });
    console.log("History updated with details for:", word);
  } catch (error) {
    console.error("Failed to update history:", error);
  }
}
async function handleAddWord(
  word: string,
  inputDeckName?: string,
  inputTags?: string[]
) {
  console.log("handleAddWord called with:", { word, inputDeckName, inputTags });
  try {
    let deckName = inputDeckName?.trim() || "";
    let tags = inputTags?.map((tag) => tag.trim()) || [];

    if (!inputDeckName || inputDeckName.length === 0) {
      await chrome.storage.sync
        .get({
          deckName: "Default",
        })
        .then((result) => {
          deckName = result.deckName;
        });
    }
    if (!inputTags || inputTags.length === 0) {
      await chrome.storage.sync
        .get({
          tags: ["chrome-extension", "chatgpt-generated"],
        })
        .then((result) => {
          tags = result.tags;
        });
    }
    const apiKey = await chrome.storage.sync
      .get("apiKey")
      .then((result) => result.apiKey);

    if (await isDuplicate(word, deckName)) {
      showNotification({
        title: `登録済みです`,
        message: `単語「${word}」 (${deckName})は既にAnkiに登録されています。`,
      });
      const result = await chrome.storage.local.get([HISTORY_KEY]);
      const history: HistoryItem[] = result[HISTORY_KEY] || [];
      const existingItem = history.find((item) => item.word === word);
      if (existingItem) {
        await updateHistory(word, existingItem.details);
      }
      return;
    }

    const prompt = prompts.english.prompt(word);
    const apiResponse = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ word, prompt, apiKey }),
    });
    const apiData = (await apiResponse.json()) as WordInfo;

    if (!apiResponse.ok) {
      throw new Error(apiData.error || "APIサーバーでエラーが発生しました");
    }

    const backContent = buildBackContent(apiData);

    await invokeAnkiConnect("addNote", {
      note: {
        deckName: deckName,
        modelName: "Basic",
        fields: { Front: word, Back: backContent },
        tags: tags,
      },
    });

    await updateHistory(word, apiData);

    showNotification({
      title: `「${word}」を追加しました！`,
      message: `デッキ: ${deckName}`,
      contextMessage: `タグ: ${tags.join(", ")}`,
    });

    return { success: true };
  } catch (error) {
    showNotification({
      title: "エラーが発生しました",
      message: error instanceof Error ? error.message : "不明なエラーです。",
    });
    console.error(error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "不明なエラーです。",
    };
  }
}

chrome.runtime.onInstalled.addListener(() => {
  console.log("Extension installed or updated.");
  chrome.contextMenus.create({
    id: "add-word-via-api",
    title: "「%s」をAnkiに追加",
    contexts: ["selection"],
  });
  checkAnkiConnectStatus();
});

chrome.runtime.onStartup.addListener(() => {
  console.log("Browser started.");
  checkAnkiConnectStatus();
});

chrome.contextMenus.onClicked.addListener(async (info) => {
  if (info.menuItemId !== "add-word-via-api" || !info.selectionText) return;

  if (!(await checkAnkiConnectStatus())) {
    showNotification({
      title: "Ankiに接続できません",
      message: "Ankiアプリが起動しているか確認してください。",
    });
    return;
  }
  handleAddWord(info.selectionText);
});

//app.tsxでのrequest
chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  (async () => {
    switch (request.type) {
      case "getAnkiData": {
        try {
          const [decks, tags] = await Promise.all([
            invokeAnkiConnect("deckNames"),
            invokeAnkiConnect("getTags"),
          ]);
          sendResponse({ success: true, decks, tags });
        } catch (error) {
          sendResponse({
            success: false,
            error:
              error instanceof Error ? error.message : "不明なエラーです。",
          });
        }
        break;
      }
      case "createDeck": {
        try {
          if (!request.deckName)
            throw new Error("デッキ名が指定されていません。");
          await invokeAnkiConnect("createDeck", { deck: request.deckName });
          const newDecks = await invokeAnkiConnect("deckNames");
          sendResponse({ success: true, decks: newDecks });
        } catch (error) {
          sendResponse({
            success: false,
            error:
              error instanceof Error ? error.message : "不明なエラーです。",
          });
        }
        break;
      }
      case "addNote": {
        const { word, deckName, tags } = request.note;
        const result = await handleAddWord(word, deckName, tags);
        sendResponse(result);
        break;
      }
      default:
        sendResponse({ success: false, error: "不明なリクエストタイプです。" });
        break;
    }
  })();

  return true;
});
