// src/options/OptionsApp.tsx

import React, { useState, useEffect } from "react";

function OptionsApp() {
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

  return (
    <div style={{ padding: "20px", fontFamily: "sans-serif", width: "450px" }}>
      <h1>設定</h1>

      <div style={{ marginBottom: "10px" }}>
        <label
          htmlFor="deckNameSelect"
          style={{ display: "block", marginBottom: "5px" }}
        >
          登録先のAnkiデッキを選択:
        </label>
        <select
          id="deckNameSelect"
          value={deckName}
          onChange={(e) => setDeckName(e.target.value)}
          style={{ width: "100%", padding: "8px" }}
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

      <div style={{ marginBottom: "20px" }}>
        <label
          htmlFor="newDeckInput"
          style={{ display: "block", marginBottom: "5px" }}
        >
          新しいデッキを作成:
        </label>
        <div style={{ display: "flex", alignItems: "center" }}>
          <input
            id="newDeckInput"
            type="text"
            value={newDeckInput}
            onChange={(e) => setNewDeckInput(e.target.value)}
            placeholder="新しいデッキ名を入力"
            style={{ flexGrow: 1, padding: "8px" }}
          />
          <button
            onClick={handleCreateDeck}
            style={{ marginLeft: "10px", padding: "8px" }}
          >
            作成
          </button>
        </div>
      </div>

      <div style={{ marginBottom: "20px" }}>
        <label htmlFor="tags" style={{ display: "block", marginBottom: "5px" }}>
          自動で付与するタグ:
        </label>
        <div
          style={{
            border: "1px solid #ccc",
            padding: "5px",
            borderRadius: "4px",
            display: "flex",
            flexWrap: "wrap",
            gap: "5px",
          }}
        >
          {tags.map((tag) => (
            <span
              key={tag}
              style={{
                backgroundColor: "#e0e0e0",
                padding: "3px 8px",
                borderRadius: "12px",
                display: "flex",
                alignItems: "center",
              }}
            >
              {tag}
              <button
                onClick={() => removeTag(tag)}
                style={{
                  border: "none",
                  background: "none",
                  color: "#555",
                  marginLeft: "5px",
                  cursor: "pointer",
                  fontSize: "16px",
                }}
              >
                &times;
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
            style={{
              border: "none",
              outline: "none",
              flexGrow: 1,
              padding: "4px",
            }}
          />

          <datalist id="tag-list">
            {availableTags.map((tag) => (
              <option key={tag} value={tag} />
            ))}
          </datalist>
        </div>
      </div>

      <button
        onClick={handleSave}
        style={{ padding: "10px 15px", fontSize: "16px" }}
      >
        設定を保存
      </button>

      {status.message && (
        <p style={{ marginTop: "10px", color: status.error ? "red" : "green" }}>
          {status.message}
        </p>
      )}
    </div>
  );
}

export default OptionsApp;
