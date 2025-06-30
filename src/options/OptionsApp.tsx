import React, { useState, useEffect } from "react";

function OptionsApp() {
  const [deckName, setDeckName] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [currentTagInput, setCurrentTagInput] = useState("");

  const [apiKey, setApiKey] = useState<string>("");
  const [showApiKey, setShowApiKey] = useState<boolean>(false);
  const [isKeySaved, setIsKeySaved] = useState<boolean>(false);

  const [availableDecks, setAvailableDecks] = useState<string[]>([]);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [newDeckInput, setNewDeckInput] = useState("");

  const [status, setStatus] = useState({ message: "", error: false });

  useEffect(() => {
    chrome.storage.sync.get(["deckName", "tags", "apiKey"], (result) => {
      setDeckName(result.deckName || "Default");
      setTags(result.tags || ["chrome-extension"]);
      setIsKeySaved(!!result.apiKey);
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
    chrome.storage.sync.set({ deckName, tags, apiKey }, () => {
      if (apiKey && !apiKey.startsWith("sk-")) {
        showStatus(
          "無効なAPIキーです。「sk-」から始まるキーを入力してください。",
          true
        );
        return;
      }
      showStatus("設定を保存しました！");
      setIsKeySaved(true);
    });
  };

  const handleDeleteKey = () => {
    chrome.storage.sync.remove("apiKey", () => {
      setApiKey("");
      setIsKeySaved(false);
      showStatus("APIキーを削除しました。");
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
    setTimeout(() => setStatus({ message: "", error: false }), 5000);
  };
  return (
    <div className="bg-slate-50 dark:bg-slate-900 min-h-screen p-4 sm:p-6 lg:p-8 font-sans flex items-center justify-center">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 sm:p-8 w-full max-w-lg">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-white mb-6">
          設定
        </h1>

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

        <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
          <h2 className="text-lg font-semibold text-slate-700 dark:text-slate-200 mb-4">
            外部サービス設定
          </h2>
          <div>
            <div className="flex items-center justify-between mb-2">
              <label
                htmlFor="apiKeyInput"
                className="block text-sm font-medium text-slate-600 dark:text-slate-300"
              >
                OpenAI APIキー
              </label>
              <div className="flex items-center gap-3">
                {isKeySaved ? (
                  <span className="flex items-center text-xs text-green-600 dark:text-green-400">
                    <span className="h-2 w-2 rounded-full bg-green-500 mr-1.5"></span>
                    保存済み
                  </span>
                ) : (
                  <span className="flex items-center text-xs text-slate-500 dark:text-slate-400">
                    <span className="h-2 w-2 rounded-full bg-slate-400 mr-1.5"></span>
                    未設定
                  </span>
                )}

                {isKeySaved && (
                  <button
                    onClick={handleDeleteKey}
                    className="text-xs text-red-600 hover:underline dark:text-red-500 focus:outline-none"
                    aria-label="APIキーを削除する"
                  >
                    削除
                  </button>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                id="apiKeyInput"
                type={showApiKey ? "text" : "password"}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk-xxxxxxxxxxxxxxxxxxxx"
                className="flex-grow block w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white font-mono"
              />
              <button
                type="button"
                onClick={() => setShowApiKey(!showApiKey)}
                className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                aria-label={showApiKey ? "APIキーを隠す" : "APIキーを表示する"}
              >
                {showApiKey ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                    <path
                      fillRule="evenodd"
                      d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.022 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z"
                      clipRule="evenodd"
                    />
                    <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.742L2.303 6.546A10.048 10.048 0 01.458 10c1.274 4.057 5.022 7 9.542 7 .847 0 1.673-.105 2.454-.303z" />
                  </svg>
                )}
              </button>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
              APIキーはあなたのブラウザ内に安全に保存されます。空欄の場合は、開発者が用意したキーが使用されます。
            </p>
          </div>
        </div>

        <button
          onClick={handleSave}
          className="w-full bg-indigo-600 text-white font-bold py-2.5 px-4 rounded-md shadow-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-slate-800 focus:ring-indigo-500 transition"
        >
          設定を保存
        </button>

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
