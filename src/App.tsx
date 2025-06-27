// src/App.tsx
import React, { useState } from "react";
import { addNoteToAnki } from "./ankiConnect";

function App() {
  const [word, setWord] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!word.trim()) {
      setMessage("単語を入力してください。");
      return;
    }

    try {
      setMessage("Ankiに追加中...");
      const result = await addNoteToAnki(word);
      console.log("Anki-Connect response:", result);
      setMessage(`「${word}」をAnkiに追加しました！ (Note ID: ${result})`);
      setWord("");
    } catch (error) {
      console.error(error);
      if (error instanceof Error) {
        setMessage(
          `エラー: ${error.message}。Ankiが起動しているか、Anki-Connectがインストールされているか確認してください。`
        );
      } else {
        setMessage("不明なエラーが発生しました。");
      }
    }
  };

  return (
    <div style={{ width: "300px", padding: "15px", fontFamily: "sans-serif" }}>
      <h3 style={{ marginTop: 0 }}>Ankiに単語を追加</h3>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={word}
          onChange={(e) => setWord(e.target.value)}
          placeholder="登録したい単語"
          autoFocus
          style={{ width: "95%", padding: "8px", marginBottom: "10px" }}
        />
        <button type="submit" style={{ width: "100%", padding: "8px" }}>
          Ankiに追加
        </button>
      </form>
      {message && (
        <p
          style={{
            marginTop: "10px",
            color: message.startsWith("エラー") ? "red" : "green",
          }}
        >
          {message}
        </p>
      )}
    </div>
  );
}

export default App;
