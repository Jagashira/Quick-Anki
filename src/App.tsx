import React, { useState, useEffect } from "react";
import type { HistoryItem } from "./types";
import { HistoryDetailModal } from "./components/HistoryDetailModal";

const HISTORY_KEY = "quickAnkiHistory";

function App() {
  // State for form inputs
  const [word, setWord] = useState("");
  const [deckName, setDeckName] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [currentTagInput, setCurrentTagInput] = useState("");

  // State for available choices from Anki
  const [availableDecks, setAvailableDecks] = useState<string[]>([]);
  const [availableTags, setAvailableTags] = useState<string[]>([]);

  // State for UI status
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [selectedHistory, setSelectedHistory] = useState<HistoryItem | null>(
    null
  );

  const updateHistory = () => {
    chrome.storage.local.get([HISTORY_KEY], (result) => {
      if (result[HISTORY_KEY]) {
        setHistory(result[HISTORY_KEY]);
      }
    });
  };
  // Load default settings and Anki data on component mount
  useEffect(() => {
    // 1. Load default settings from storage
    chrome.storage.sync.get(["deckName", "tags"], (settings) => {
      setDeckName(settings.deckName || "Default");
      setTags(settings.tags || []);
    });

    // 2. Fetch all available decks and tags from Anki via background script
    chrome.runtime.sendMessage({ type: "getAnkiData" }, (response) => {
      if (response && response.success) {
        setAvailableDecks(response.decks || []);
        setAvailableTags(response.tags || []);
      } else {
        showStatus(
          `Ankiデータ取得失敗: ${response?.error || "接続を確認してください"}`,
          true
        );
      }
      setIsDataLoaded(true); // Mark data loading as complete
    });

    updateHistory(); // Load initial history
  }, []);

  /**
   * Display a status message for a few seconds
   */
  const showStatus = (message: string, isError = false) => {
    setStatusMessage(message);
    setIsError(isError);
    // if (!isError) {
    //   setTimeout(() => setStatusMessage(""), 3000);
    // }
  };

  /**
   * Handle form submission
   */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!word.trim() || isSubmitting) return;

    setIsSubmitting(true);
    showStatus("Ankiに追加中...");

    // Send all note data to the background script
    chrome.runtime.sendMessage(
      {
        type: "addNote", // Use a more descriptive type
        note: {
          word: word.trim(),
          deckName: deckName,
          tags: tags,
        },
      },
      (response) => {
        if (response && response.success) {
          showStatus("Ankiに登録しました！");
          setIsSubmitting(false);
          updateHistory(); // Update history after successful submission
          // setTimeout(() => window.close(), 1500); // Close popup on success
        } else {
          showStatus(`エラー: ${response?.error || "不明なエラー"}`, true);
          setIsSubmitting(false); // Re-enable form on error
        }
      }
    );
  };

  // --- Tag input handlers ---
  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && currentTagInput) {
      e.preventDefault();
      const newTag = currentTagInput.trim();
      if (newTag && !tags.includes(newTag)) {
        setTags([...tags, newTag]);
      }
      setCurrentTagInput("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  if (!isDataLoaded) {
    return (
      <div className="w-[350px] h-[450px] bg-slate-50 flex items-center justify-center">
        <p className="text-slate-500">Ankiからデータを取得中...</p>
      </div>
    );
  }

  return (
    <>
      <div className="w-[350px] bg-slate-50 dark:bg-slate-800 p-6 font-sans">
        <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-4">
          Ankiに単語を追加
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="word"
              className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1"
            >
              単語
            </label>
            <input
              id="word"
              type="text"
              value={word}
              onChange={(e) => setWord(e.target.value)}
              placeholder="登録したい単語"
              autoFocus
              disabled={isSubmitting}
              className="block w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
            />
          </div>

          {/* Deck Selection */}
          <div>
            <label
              htmlFor="deckName"
              className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1"
            >
              デッキ
            </label>
            <select
              id="deckName"
              value={deckName}
              onChange={(e) => setDeckName(e.target.value)}
              disabled={isSubmitting}
              className="block w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
            >
              {availableDecks.length === 0 ? (
                <option value="">デッキが見つかりません</option>
              ) : (
                availableDecks.map((deck) => (
                  <option key={deck} value={deck}>
                    {deck}
                  </option>
                ))
              )}
            </select>
          </div>

          {/* Tag Input */}
          <div>
            <label
              htmlFor="tags"
              className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1"
            >
              タグ
            </label>
            <div className="flex flex-wrap items-center gap-2 p-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="flex items-center bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 rounded-full px-3 py-1 text-xs font-medium"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="ml-1.5 -mr-1 p-0.5 rounded-full text-indigo-500 hover:text-white hover:bg-indigo-400 transition-colors"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-3.5 w-3.5"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                </span>
              ))}
              <input
                id="tags"
                type="text"
                list="tag-list"
                value={currentTagInput}
                onChange={(e) => setCurrentTagInput(e.target.value)}
                onKeyDown={handleTagKeyDown}
                disabled={isSubmitting}
                placeholder={tags.length === 0 ? "タグを追加してEnter" : ""}
                className="flex-grow bg-transparent focus:outline-none p-1 text-sm min-w-[100px] dark:text-white"
              />
              <datalist id="tag-list">
                {availableTags.map((tag) => (
                  <option key={tag} value={tag} />
                ))}
              </datalist>
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting || !word.trim()}
              className="w-full bg-indigo-600 text-white font-bold py-2.5 px-4 rounded-md shadow-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition disabled:bg-slate-400 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "処理中です..." : "Ankiに追加"}
            </button>
          </div>
        </form>

        {/* Status Message */}
        {statusMessage && (
          <p
            className={`mt-3 text-center text-sm font-medium ${
              isError ? "text-red-600" : "text-green-600"
            }`}
          >
            {statusMessage}
          </p>
        )}

        {history.length > 0 && (
          <div className="mt-6 border-t border-slate-200 dark:border-slate-700 pt-4">
            <h4 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-3">
              最近登録した単語
            </h4>
            <ul className="space-y-1.5 max-h-24 overflow-y-auto pr-2">
              {history.map((item) => (
                <li
                  key={item.timestamp}
                  className="text-sm text-slate-700 dark:text-slate-300 truncate bg-slate-100 dark:bg-slate-700/50 px-2 py-1 rounded-md cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                  onClick={() => setSelectedHistory(item)} // クリックで詳細表示
                >
                  {item.word}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
      {/* ▼▼▼ 詳細表示モーダルを条件付きでレンダリング ▼▼▼ */}
      {selectedHistory && (
        <HistoryDetailModal
          item={selectedHistory}
          onClose={() => setSelectedHistory(null)}
        />
      )}
    </>
  );
}

export default App;
