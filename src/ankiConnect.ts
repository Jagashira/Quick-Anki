// src/ankiConnect.ts

async function invokeAnkiConnect(action: string, params: object) {
  const response = await fetch("http://127.0.0.1:8765", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ action, version: 6, params }),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const jsonResponse = await response.json();
  if (jsonResponse.error) {
    throw new Error(jsonResponse.error);
  }
  return jsonResponse.result;
}

export async function addNoteToAnki(word: string): Promise<number> {
  const params = {
    note: {
      deckName: "Default",
      modelName: "Basic",
      fields: {
        Front: word,
        Back: "",
      },
      tags: ["chrome-extension"],
    },
  };

  try {
    const result = await invokeAnkiConnect("addNote", params);
    if (result === null) {
      throw new Error(
        "ノートの追加に失敗しました。同じ内容のカードが既に存在する可能性があります。"
      );
    }
    return result;
  } catch (e) {
    console.error("Anki-Connect request failed:", e);
    throw e;
  }
}
