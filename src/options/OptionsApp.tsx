import React, { useState, useEffect } from "react";

function OptionsApp() {
  // ----- ここから下のロジック部分は一切変更ありません -----
  const [deckName, setDeckName] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [currentTagInput, setCurrentTagInput] = useState("");

  const [availableDecks, setAvailableDecks] = useState<string[]>([]);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [newDeckInput, setNewDeckInput] = useState("");

  const [status, setStatus] = useState({ message: "", error: false });

  useEffect(() => {
    chrome.storage.sync.get(["deckName", "tags"], (result) => {
      setDeckName(result.deckName || "Default");
      setTags(result.tags || ["chrome-extension"]);
    });

    chrome.runtime.sendMessage({ type: "getAnkiData" }, (response) => {
      if (response && response.success) {
        setAvailableDecks(response.decks || []);
        setAvailableTags(response.tags || []);
      } else {
        const errorMessage = response?.error || "不明なエラーです。";
        showStatus(
          "Ankiデータの取得に失敗しました。Ankiが起動しているか確認してください。",
          true
        );
        console.error("Ankiデータの取得に失敗:", errorMessage);
      }
    });
  }, []);

  const handleSave = () => {
    chrome.storage.sync.set({ deckName, tags }, () => {
      showStatus("設定を保存しました！");
    });
  };

  const handleCreateDeck = async () => {
    const newDeckName = newDeckInput.trim();
    if (!newDeckName) {
      showStatus("作成するデッキ名が入力されていません。", true);
      return;
    }
    if (availableDecks.includes(newDeckName)) {
      showStatus("そのデッキ名は既に存在します。", true);
      return;
    }

    chrome.runtime.sendMessage(
      { type: "createDeck", deckName: newDeckName },
      (response) => {
        if (response.success) {
          showStatus(`デッキ「${newDeckName}」を作成しました！`);
          setAvailableDecks(response.decks);
          setDeckName(newDeckName);
          setNewDeckInput("");
        } else {
          showStatus(response.error, true);
        }
      }
    );
  };

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

  const showStatus = (message: string, isError = false) => {
    setStatus({ message, error: isError });
    setTimeout(() => setStatus({ message: "", error: false }), 3000);
  };
  // ----- ここまでのロジック部分は一切変更ありません -----

  // ----- ここから下のJSX部分のスタイルをTailwind CSSに変更します -----
  return (
    <div className="bg-slate-50 dark:bg-slate-900 min-h-screen p-4 sm:p-6 lg:p-8 font-sans flex items-center justify-center">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 sm:p-8 w-full max-w-lg">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-white mb-6">
          設定
        </h1>

        {/* --- デッキ選択 --- */}
        <div className="mb-6">
          <label
            htmlFor="deckNameSelect"
            className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2"
          >
            登録先のAnkiデッキを選択:
          </label>
          <select
            id="deckNameSelect"
            value={deckName}
            onChange={(e) => setDeckName(e.target.value)}
            className="block w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:text-white"
          >
            {availableDecks.length === 0 && (
              <option value="">デッキが見つかりません</option>
            )}
            {availableDecks.map((deck) => (
              <option key={deck} value={deck}>
                {deck}
              </option>
            ))}
          </select>
        </div>

        {/* --- 新規デッキ作成 --- */}
        <div className="mb-6">
          <label
            htmlFor="newDeckInput"
            className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2"
          >
            新しいデッキを作成:
          </label>
          <div className="flex items-center gap-3">
            <input
              id="newDeckInput"
              type="text"
              value={newDeckInput}
              onChange={(e) => setNewDeckInput(e.target.value)}
              placeholder="新しいデッキ名を入力"
              className="flex-grow block w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:text-white"
            />
            <button
              onClick={handleCreateDeck}
              className="bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-200 font-semibold py-2 px-4 rounded-md hover:bg-slate-300 dark:hover:bg-slate-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-slate-800 focus:ring-slate-400 transition"
            >
              作成
            </button>
          </div>
        </div>

        {/* --- タグ設定 --- */}
        <div className="mb-8">
          <label
            htmlFor="tags"
            className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2"
          >
            自動で付与するタグ:
          </label>
          <div className="flex flex-wrap items-center gap-2 p-2 border border-slate-300 dark:border-slate-600 rounded-md">
            {tags.map((tag) => (
              <span
                key={tag}
                className="flex items-center bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 rounded-full px-3 py-1 text-sm font-medium"
              >
                {tag}
                <button
                  onClick={() => removeTag(tag)}
                  className="ml-2 -mr-1 p-0.5 rounded-full text-indigo-500 hover:text-white hover:bg-indigo-400 dark:hover:text-white dark:hover:bg-indigo-500 transition-colors"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
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
              list="tag-list"
              type="text"
              value={currentTagInput}
              onChange={(e) => setCurrentTagInput(e.target.value)}
              onKeyDown={handleTagKeyDown}
              placeholder="タグを追加してEnter"
              className="flex-grow bg-transparent focus:outline-none p-1 min-w-[150px] dark:text-white"
            />
            <datalist id="tag-list">
              {availableTags.map((tag) => (
                <option key={tag} value={tag} />
              ))}
            </datalist>
          </div>
        </div>

        {/* --- 保存ボタン --- */}
        <button
          onClick={handleSave}
          className="w-full bg-indigo-600 text-white font-bold py-2.5 px-4 rounded-md shadow-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-slate-800 focus:ring-indigo-500 transition"
        >
          設定を保存
        </button>

        {/* --- ステータスメッセージ --- */}
        {status.message && (
          <p
            className={`mt-4 text-center text-sm font-medium ${
              status.error
                ? "text-red-600 dark:text-red-400"
                : "text-green-600 dark:text-green-400"
            }`}
          >
            {status.message}
          </p>
        )}
      </div>
    </div>
  );
}

export default OptionsApp;
