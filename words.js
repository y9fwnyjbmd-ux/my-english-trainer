/* My English Trainer: vocabulary data for Distinction 1-6 compatible storage. */
const WORDS = [
  { id: 1, book: "distinction1", chapter: 1, number: 1, word: "achieve", meaning: "達成する", part: "動詞", level: "中級", example: "She achieved her goal through daily practice.", translation: "彼女は毎日の練習で目標を達成しました。" },
  { id: 2, book: "distinction1", chapter: 1, number: 2, word: "improve", meaning: "改善する、上達する", part: "動詞", level: "初級", example: "I want to improve my English speaking skills.", translation: "英語を話す力を上達させたいです。" },
  { id: 3, book: "distinction1", chapter: 1, number: 3, word: "opportunity", meaning: "機会", part: "名詞", level: "中級", example: "This is a great opportunity to learn.", translation: "これは学ぶための素晴らしい機会です。" },
  { id: 4, book: "distinction1", chapter: 1, number: 4, word: "confident", meaning: "自信のある", part: "形容詞", level: "中級", example: "You will feel more confident after practicing.", translation: "練習すれば、もっと自信がつきます。" },
  { id: 5, book: "distinction1", chapter: 1, number: 5, word: "habit", meaning: "習慣", part: "名詞", level: "初級", example: "Reading every morning is a good habit.", translation: "毎朝読むことはよい習慣です。" },
  { id: 6, book: "distinction1", chapter: 2, number: 1, word: "focus", meaning: "集中する、焦点", part: "動詞・名詞", level: "初級", example: "Please focus on the most important words.", translation: "最も大切な単語に集中してください。" },
  { id: 7, book: "distinction1", chapter: 2, number: 2, word: "review", meaning: "復習する、復習", part: "動詞・名詞", level: "初級", example: "I review new words before I go to bed.", translation: "寝る前に新しい単語を復習します。" },
  { id: 8, book: "distinction1", chapter: 2, number: 3, word: "remember", meaning: "覚えている、思い出す", part: "動詞", level: "初級", example: "Do you remember this word from yesterday?", translation: "昨日のこの単語を覚えていますか？" },
  { id: 9, book: "distinction1", chapter: 2, number: 4, word: "challenge", meaning: "挑戦、挑戦する", part: "名詞・動詞", level: "中級", example: "Learning a new language is a fun challenge.", translation: "新しい言語を学ぶことは楽しい挑戦です。" },
  { id: 10, book: "distinction1", chapter: 2, number: 5, word: "progress", meaning: "進歩、進歩する", part: "名詞・動詞", level: "中級", example: "You are making great progress.", translation: "あなたは大きく進歩しています。" },
  { id: 11, book: "distinction1", chapter: 3, number: 1, word: "practice", meaning: "練習する、練習", part: "動詞・名詞", level: "初級", example: "Practice makes your pronunciation clearer.", translation: "練習すると発音がより明瞭になります。" },
  { id: 12, book: "distinction1", chapter: 3, number: 2, word: "discover", meaning: "発見する", part: "動詞", level: "中級", example: "I discovered a useful way to study.", translation: "役に立つ勉強法を発見しました。" },
  { id: 13, book: "distinction1", chapter: 3, number: 3, word: "express", meaning: "表現する", part: "動詞", level: "中級", example: "It is important to express your ideas clearly.", translation: "自分の考えを明確に表現することが大切です。" },
  { id: 14, book: "distinction1", chapter: 3, number: 4, word: "meaningful", meaning: "意味のある", part: "形容詞", level: "中級", example: "Every small step can be meaningful.", translation: "小さな一歩にも意味があります。" },
  { id: 15, book: "distinction1", chapter: 3, number: 5, word: "necessary", meaning: "必要な", part: "形容詞", level: "中級", example: "Rest is necessary for effective learning.", translation: "効果的な学習には休息が必要です。" },
  { id: 16, book: "distinction1", chapter: 4, number: 1, word: "similar", meaning: "似ている", part: "形容詞", level: "中級", example: "These two words have similar meanings.", translation: "この2つの単語は似た意味を持っています。" },
  { id: 17, book: "distinction1", chapter: 4, number: 2, word: "simple", meaning: "簡単な、単純な", part: "形容詞", level: "初級", example: "Start with a simple sentence.", translation: "簡単な文から始めましょう。" },
  { id: 18, book: "distinction1", chapter: 4, number: 3, word: "continue", meaning: "続ける", part: "動詞", level: "初級", example: "Continue studying at your own pace.", translation: "自分のペースで勉強を続けてください。" },
  { id: 19, book: "distinction1", chapter: 4, number: 4, word: "prepare", meaning: "準備する", part: "動詞", level: "中級", example: "I prepare a short study plan every Sunday.", translation: "毎週日曜日に短い学習計画を準備します。" },
  { id: 20, book: "distinction1", chapter: 4, number: 5, word: "success", meaning: "成功", part: "名詞", level: "初級", example: "Small daily actions lead to success.", translation: "毎日の小さな行動が成功につながります。" }
];

function filterWordsByBook(book) {
  return WORDS.filter(function (item) {
    return item.book === book;
  });
}

function filterWordsByChapter(book, chapter) {
  return WORDS.filter(function (item) {
    return item.book === book && item.chapter === chapter;
  });
}

window.WORDS = WORDS;
window.filterWordsByBook = filterWordsByBook;
window.filterWordsByChapter = filterWordsByChapter;