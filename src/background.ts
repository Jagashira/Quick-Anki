/// <reference types="vite/client" />

import { invokeAnkiConnect } from "./ankiConnect";
import { prompts } from "./definition";
import { buildBackContent } from "./lib/buildBackContent";
import type { WordInfo } from "./types";

const API_URL = import.meta.env.VITE_API_URL;

const DEFAULT_ICON_PATH = "icons/icon48.png";

/**
 * showNotification関数に渡す引数の型を定義
 * titleとmessageを必須にする
 */
type NotificationInfo = {
  title: string;
  message: string;
} & Omit<
  chrome.notifications.NotificationOptions,
  "title" | "message" | "type" | "iconUrl"
>;

/**
 * 汎用的な通知表示関数
 * @param info 通知のタイトル、メッセージ、および追加オプション
 */
function showNotification(info: NotificationInfo) {
  // 中間変数を使わずに、create関数に直接オブジェクトを渡す
  chrome.notifications.create({
    type: "basic",
    iconUrl: DEFAULT_ICON_PATH,
    priority: 0,
    ...info, // 必須のtitle, messageを含むinfoオブジェクトを展開する
  });
}

/**
 * Ankiの接続状態をチェックし、アイコンバッジを更新する
 * @returns {boolean} 接続されていれば true
 */
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

/**
 * Anki内に指定した単語が既に存在するかチェックする
 * @param word チェックする単語
 * @param deckName 対象のデッキ名
 * @returns {boolean} 存在すれば true
 */
async function isDuplicate(word: string, deckName: string): Promise<boolean> {
  const duplicateNotes = await invokeAnkiConnect("findNotes", {
    query: `deck:"${deckName}" Front:"${word}"`,
  });
  return duplicateNotes.length > 0;
}

// =================================================================
// メイン処理（単語追加）
// =================================================================

/**
 * 【コンテキストメニュー用】ChatGPT API経由で詳細なノートを作成・追加する
 * @param word 選択された単語
 */
async function handleContextMenuAddition(word: string) {
  try {
    const settings = await chrome.storage.sync.get({
      deckName: "Default",
      tags: ["chrome-extension", "chatgpt-generated"],
    });

    if (await isDuplicate(word, settings.deckName)) {
      showNotification({
        title: "登録済みです",
        message: `単語「${word}」は既にAnkiに登録されています。`,
      });
      return;
    }

    // ChatGPT APIから詳細情報を取得
    const prompt = prompts.english.prompt(word); // ./definition.ts に定義されていると仮定
    const apiResponse = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ word, prompt }),
    });
    const apiData = (await apiResponse.json()) as WordInfo;

    if (!apiResponse.ok) {
      throw new Error(apiData.error || "APIサーバーでエラーが発生しました");
    }

    // HTMLの裏面コンテンツを構築
    const backContent = buildBackContent(apiData);

    await invokeAnkiConnect("addNote", {
      note: {
        deckName: settings.deckName,
        modelName: "Basic",
        fields: { Front: word, Back: backContent },
        tags: settings.tags,
      },
    });

    showNotification({
      title: `「${word}」を追加しました！`,
      message: `デッキ: ${settings.deckName}`,
      contextMessage: `タグ: ${settings.tags.join(", ")}`,
    });
  } catch (error) {
    showNotification({
      title: "エラーが発生しました",
      message: error instanceof Error ? error.message : "不明なエラーです。",
    });
    console.error("コンテキストメニュー処理中にエラー:", error);
  }
}

/**
 * 【ポップアップ用】シンプルなノートを追加する
 * @param note ポップアップから受け取ったノート情報
 */
async function handlePopupAddition(note: {
  word: string;
  deckName: string;
  tags: string[];
}) {
  const { word, deckName, tags } = note;
  try {
    if (await isDuplicate(word, deckName)) {
      showNotification({
        title: "登録済みです",
        message: `単語「${deckName}」は既にAnkiに登録されています。`,
      });
      return;
    }

    // ChatGPT APIから詳細情報を取得
    const prompt = prompts.english.prompt(word); // ./definition.ts に定義されていると仮定
    const apiResponse = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ word, prompt }),
    });
    const apiData = (await apiResponse.json()) as WordInfo;
    if (!apiResponse.ok) {
      throw new Error(apiData.error || "APIサーバーでエラーが発生しました");
    }

    // HTMLの裏面コンテンツを構築
    const backContent = buildBackContent(apiData);

    await invokeAnkiConnect("addNote", {
      note: {
        deckName: note.deckName,
        modelName: "Basic",
        fields: { Front: word, Back: backContent }, // ポップアップからは裏面は空
        tags: tags,
      },
    });

    showNotification({
      title: "Ankiに登録完了",
      message: `単語「${note.word}」を登録しました。`,
    });

    return { success: true };
  } catch (error) {
    console.error("ポップアップ処理中にエラー:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "不明なエラーです。",
    };
  }
}

// =================================================================
// Chromeイベントリスナー
// =================================================================

// 拡張機能インストール時・更新時
chrome.runtime.onInstalled.addListener(() => {
  console.log("Extension installed or updated.");
  chrome.contextMenus.create({
    id: "add-word-via-api",
    title: "「%s」をAnkiに追加 (ChatGPT利用)",
    contexts: ["selection"],
  });
  checkAnkiConnectStatus();
});

// ブラウザ起動時
chrome.runtime.onStartup.addListener(() => {
  console.log("Browser started.");
  checkAnkiConnectStatus();
});

// コンテキストメニュークリック時
chrome.contextMenus.onClicked.addListener(async (info) => {
  if (info.menuItemId !== "add-word-via-api" || !info.selectionText) return;

  if (!(await checkAnkiConnectStatus())) {
    showNotification({
      title: "Ankiに接続できません",
      message: "Ankiアプリが起動しているか確認してください。",
    });
    return;
  }

  handleContextMenuAddition(info.selectionText.trim());
});

// ポップアップやオプションページからのメッセージ受信時
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
      // ★★★ ポップアップからの単語追加リクエストをここに追加 ★★★
      case "addNote": {
        const result = await handlePopupAddition(request.note);
        sendResponse(result);
        break;
      }
      default:
        sendResponse({ success: false, error: "不明なリクエストタイプです。" });
        break;
    }
  })();

  return true; //非同期処理を正しく待つために必要
});
