export interface WordInfo {
  pronunciation: string;
  meanings: {
    partOfSpeech: string;
    definition: string;
  }[];
  examples: {
    english: string;
    japanese: string;
  }[];
  synonyms: {
    word: string;
    meaning: string;
    difference: string;
  }[];
  usageNotes: string;
  error?: string;
  audioData?: MediaData | null;
  imageData?: MediaData | null;
}

export type MediaData = {
  filename: string;
  data: string;
};

export type HistoryItem = {
  word: string;
  timestamp: number;
  details: WordInfo;
};
