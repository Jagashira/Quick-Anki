const ANKI_CONNECT_URL = "http://localhost:8765";

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
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
