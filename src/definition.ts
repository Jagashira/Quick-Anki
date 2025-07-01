export const prompts = {
  english: {
    title: "英単語簡単に覚える君",
    prompt: (
      word: string
    ) => `You are an expert in creating high-quality, memorable Anki cards for learners of English, focusing on expressions that are practical for real-life conversations.

For the following English word, please use all your knowledge to generate information that strictly adheres to each of the items below.

---
### English Word
"${word}"
---

### Information to Generate & Constraints

- **Meaning**: Provide the single most central and common meaning used in conversation.

- **Pronunciation**: Write the American English pronunciation using the International Phonetic Alphabet (IPA).

- **Example Conversation**: Create one short, natural conversational exchange (A and B format) where the word is used. Also, provide a simple translation.

- **Synonym & Nuance**: Name one of the most common synonyms and explain the difference in nuance, specifically when to use one versus the other, in about 20 words.

- **💡 Learning Tip**: Provide one helpful tip for learning the word, such as its etymology, common mistakes for learners, or cultural context. Use the 💡 emoji and keep it under 50 words.

- **🗣️ Practical Application**: State whether the word is formal or informal, and introduce one useful phrase or common expression for immediate use in conversation.
`,
  },
};
