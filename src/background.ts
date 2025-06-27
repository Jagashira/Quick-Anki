import { addNoteToAnki } from "./ankiConnect"; // Anki連携関数を再利用

const ANKI_CONNECT_URL = "http://localhost:8765";

chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  if (request.type === "SAVE_WORD") {
    const wordToSave = request.word;
    console.log(`Saving word to Anki: ${wordToSave}`);

    fetch(ANKI_CONNECT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        action: "addNote",
        version: 6,
        params: {
          note: {
            deckName: "Default",
            modelName: "Basic",
            fields: {
              Front: wordToSave,
              Back: "TODO: Add definition here",
            },
            tags: ["chrome_extension"],
          },
        },
      }),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.error) {
          console.error("Anki Connect Error:", data.error);
          sendResponse({ success: false, error: data.error });
        } else {
          console.log("Word saved to Anki:", data.result);
          sendResponse({ success: true, result: data.result });
        }
      })
      .catch((error) => {
        console.error("Fetch Error:", error);
        sendResponse({ success: false, error: error.message });
      });
    return true;
  }
});

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "add-to-anki-direct",
    title: "「%s」をAnkiに直接追加",
    contexts: ["selection"],
  });
});
chrome.contextMenus.onClicked.addListener(async (info) => {
  if (info.menuItemId === "add-to-anki-direct" && info.selectionText) {
    const word = info.selectionText.trim();
    if (!word) return;

    try {
      // Ankiにノートを追加
      await addNoteToAnki(word);

      const notificationId = `anki-success-${Date.now()}`;
      chrome.notifications.create({
        type: "basic",
        iconUrl: "icons/icon48.png", // publicフォルダなどに置いたアイコンのパス
        title: "Ankiに追加しました！",
        message: `「${word}」をAnkiに保存しました。`,
      });
      setTimeout(() => {
        chrome.notifications.clear(notificationId);
      }, 3000);
    } catch (error) {
      // --- ↓↓↓ 失敗通知を追加 ↓↓↓ ---
      chrome.notifications.create({
        type: "basic",
        iconUrl: "icons/icon48.png", // publicフォルダなどに置いたアイコンのパス
        title: "Ankiへの追加に失敗しました",
        message: error instanceof Error ? error.message : "不明なエラーです。",
      });
      console.error("Failed to add note to Anki:", error);
    }
  }
});
