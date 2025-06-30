// src/ankiConnect.ts

export async function invokeAnkiConnect(action: string, params: object = {}) {
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
    throw new Error(
      `Anki-Connectに接続できませんでした。Ankiが起動しているか確認してください。`
    );
  }
}
