import type { WordInfo } from "../types";

export function buildBackContent(apiData: WordInfo): string {
  const { pronunciation, meanings, examples, synonyms, usageNotes } = apiData;
  let backContent = "";

  if (pronunciation) {
    backContent += `<b>発音:</b> /${pronunciation}/<hr>`;
  }
  if (meanings && meanings.length > 0) {
    backContent += `<b>意味:</b><ul>`;
    meanings.forEach((m) => {
      backContent += `<li><b>[${m.partOfSpeech}]</b> ${m.definition}</li>`;
    });
    backContent += `</ul>`;
  }
  if (examples && examples.length > 0) {
    backContent += `<b>例文:</b><ul>`;
    examples.forEach((ex) => {
      backContent += `<li>${ex.english}<br><i>${ex.japanese}</i></li>`;
    });
    backContent += `</ul>`;
  }
  if (synonyms && synonyms.length > 0) {
    backContent += `<b>類義語:</b><ul>`;
    synonyms.forEach((s) => {
      backContent += `<li><b>${s.word}</b>: ${s.meaning} (${s.difference})</li>`;
    });
    backContent += `</ul>`;
  }
  if (usageNotes) {
    backContent += `<br><b>使い方:</b><br>${usageNotes}`;
  }
  return backContent;
}

export function buildAnkiNotePayload(
  word: string,
  deckName: string,
  tags: string[],
  apiData: WordInfo
) {
  const backContent = buildBackContent(apiData);

  // AnkiConnectに渡すパラメータを構築 (any型で柔軟にプロパティを追加)
  type NotePayload = {
    note: {
      deckName: string;
      modelName: string;
      fields: {
        Front: string;
        Back: string;
      };
      tags: string[];
      audio?: { data: string; filename: string; fields: string[] }[];
      picture?: { data: string; filename: string; fields: string[] }[];
    };
  };
  const notePayload: NotePayload = {
    note: {
      deckName: deckName,
      modelName: "Basic",
      fields: { Front: word, Back: backContent },
      tags: tags,
    },
  };

  // 音声データがあればペイロードに追加
  if (apiData.audioData) {
    notePayload.note.audio = [
      {
        data: apiData.audioData.data,
        filename: apiData.audioData.filename,
        fields: ["Back"], // 音声ファイルへのリンクをBackフィールドに追加
      },
    ];
  }

  // 画像データがあればペイロードに追加
  if (apiData.imageData) {
    notePayload.note.picture = [
      {
        data: apiData.imageData.data,
        filename: apiData.imageData.filename,
        fields: ["Back"], // 画像をBackフィールドに追加
      },
    ];
  }

  return notePayload;
}
