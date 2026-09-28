/* My English Trainer: standalone static PWA, no build step required. */
(function () {
  "use strict";

  const WORDS = window.WORDS;
  if (!Array.isArray(WORDS)) {
    throw new Error("words.js must be loaded before app.js");
  }

  const KEYS = {
    mastery: "met-mastery",
    favorites: "met-favorites",
    wrong: "met-wrong",
    correct: "met-correct",
    history: "met-history",
    selectedBook: "met-selected-book",
    selectedChapter: "met-selected-chapter",
    quizMode: "met-quiz-mode",
    quizCount: "met-quiz-count"
  };
  const DEFAULT_MASTERY = { "1": true, "2": true, "4": true, "5": true, "8": true, "9": true, "11": true, "14": true, "17": true, "18": true, "19": true };
  const DEFAULT_WRONG = { "3": 1, "7": 2, "12": 1, "16": 1 };
  const DEFAULT_HISTORY = [
    { id: "seed-1", date: "2024-06-14", score: 8, total: 10, minutes: 9 },
    { id: "seed-2", date: "2024-06-12", score: 6, total: 8, minutes: 7 },
    { id: "seed-3", date: "2024-06-10", score: 7, total: 10, minutes: 11 }
  ];
  const QUIZ_COUNTS = [10, 20, 30, 50];
  const QUIZ_MODES = [
    { id: "en-ja", label: "英語 → 日本語", description: "英単語を見て、日本語の意味を4択から選ぶ", status: "利用可能" },
    { id: "ja-en", label: "日本語 → 英語", description: "日本語の意味を見て、英単語を4択から選ぶ", status: "利用可能" },
    { id: "example-word", label: "例文 → 単語", description: "例文の正解部分を隠して、該当する英単語を4択から選ぶ", status: "利用可能" },
    { id: "multiple-choice", label: "4択", description: "英単語を見て、4つの日本語から選ぶ", status: "利用可能" }
  ];

  const state = {
    mastery: read(KEYS.mastery, DEFAULT_MASTERY),
    favorites: read(KEYS.favorites, [3, 8, 15]),
    wrong: read(KEYS.wrong, DEFAULT_WRONG),
    correct: read(KEYS.correct, {}),
    history: read(KEYS.history, DEFAULT_HISTORY),
    selectedBook: read(KEYS.selectedBook, "distinction1"),
    selectedChapter: read(KEYS.selectedChapter, "all"),
    quizMode: read(KEYS.quizMode, "multiple-choice"),
    quizCount: read(KEYS.quizCount, 20),
    search: "",
    filter: "all",
    mobileMenu: false,
    quiz: null
  };

  function read(key, fallback) {
    try {
      const value = localStorage.getItem(key);
      return value ? JSON.parse(value) : fallback;
    } catch (_) {
      return fallback;
    }
  }

  function save(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (_) {}
  }

  function persist() {
    save(KEYS.mastery, state.mastery);
    save(KEYS.favorites, state.favorites);
    save(KEYS.wrong, state.wrong);
    save(KEYS.correct, state.correct);
    save(KEYS.history, state.history);
  }

  const BOOKS = [
    { id: "distinction1", label: "Distinction 1" },
    { id: "distinction2", label: "Distinction 2" },
    { id: "distinction3", label: "Distinction 3" },
    { id: "distinction4", label: "Distinction 4" },
    { id: "distinction5", label: "Distinction 5" },
    { id: "distinction6", label: "Distinction 6" }
  ];

  function selectedBookLabel() {
    const book = BOOKS.find(function (item) { return item.id === state.selectedBook; });
    return book ? book.label : "Distinction 1";
  }

  function selectedChapterLabel() {
    return state.selectedChapter === "all" ? "全Chapter" : "Chapter " + state.selectedChapter;
  }

  function selectedWords() {
    if (state.selectedChapter === "all") return window.filterWordsByBook(state.selectedBook);
    return window.filterWordsByChapter(state.selectedBook, Number(state.selectedChapter));
  }

  function selectedQuizMode() {
    return QUIZ_MODES.find(function (mode) { return mode.id === state.quizMode; }) || QUIZ_MODES[3];
  }

  function setQuizMode(modeId) {
    const mode = QUIZ_MODES.find(function (item) { return item.id === modeId; });
    if (!mode) return;
    if (["multiple-choice", "en-ja", "ja-en", "example-word"].indexOf(mode.id) === -1) return;
    state.quizMode = mode.id;
    save(KEYS.quizMode, state.quizMode);
    state.quiz = null;
  }

  function setQuizCount(count) {
    const value = Number(count);
    if (QUIZ_COUNTS.indexOf(value) === -1) return;
    state.quizCount = value;
    save(KEYS.quizCount, state.quizCount);
    state.quiz = null;
  }

  function getSelectedBook() {
    return state.selectedBook;
  }

  function getSelectedChapter() {
    return state.selectedChapter;
  }

  function getSelectedWords() {
    return selectedWords();
  }

  window.getSelectedBook = getSelectedBook;
  window.getSelectedChapter = getSelectedChapter;
  window.getSelectedWords = getSelectedWords;

  function setStudySelection(book, chapter) {
    const validBook = BOOKS.some(function (item) { return item.id === book; }) ? book : "distinction1";
    state.selectedBook = validBook;
    state.selectedChapter = chapter === "all" || [1, 2, 3, 4].indexOf(Number(chapter)) >= 0 ? String(chapter) : "all";
    save(KEYS.selectedBook, state.selectedBook);
    save(KEYS.selectedChapter, state.selectedChapter);
    state.quiz = null;
  }

  function ensureStudySelection() {
    if (!BOOKS.some(function (item) { return item.id === state.selectedBook; })) state.selectedBook = "distinction1";
    if (!(state.selectedChapter === "all" || [1, 2, 3, 4].indexOf(Number(state.selectedChapter)) >= 0)) state.selectedChapter = "all";
    save(KEYS.selectedBook, state.selectedBook);
    save(KEYS.selectedChapter, state.selectedChapter);
  }

  ensureStudySelection();
  if (!QUIZ_MODES.some(function (mode) { return mode.id === state.quizMode; })) {
    state.quizMode = "multiple-choice";
    save(KEYS.quizMode, state.quizMode);
  }
  if (QUIZ_COUNTS.indexOf(Number(state.quizCount)) === -1) {
    state.quizCount = 20;
    save(KEYS.quizCount, state.quizCount);
  } else {
    state.quizCount = Number(state.quizCount);
  }

  function icon(name, size) {
    const s = size || 18;
    const paths = {
      home: '<path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1Z"/><path d="M9 21v-6h6v6"/>',
      book: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z"/>',
      brain: '<path d="M9.5 2a3 3 0 0 0-3 3v.2A3.8 3.8 0 0 0 3 9a3.8 3.8 0 0 0 2 3.4A3.8 3.8 0 0 0 8 18h1.5"/><path d="M14.5 2a3 3 0 0 1 3 3v.2A3.8 3.8 0 0 1 21 9a3.8 3.8 0 0 1-2 3.4 3.8 3.8 0 0 1-3 5.6h-1.5"/><path d="M9.5 2v20M14.5 2v20M6.5 8h3M14.5 8h3M6 13h3M15 13h3"/>',
      rotate: '<path d="M3 12a9 9 0 0 1 15.3-6.4L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-15.3 6.4L3 16"/><path d="M3 21v-5h5"/>',
      history: '<path d="M3 12a9 9 0 1 0 3-6.7L3 8.5"/><path d="M3 3v5.5h5.5"/><path d="M12 7v5l3 2"/>',
      search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',
      star: '<path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9Z"/>',
      speaker: '<path d="M11 5 6 9H3v6h3l5 4Z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M18 5a9 9 0 0 1 0 14"/>',
      play: '<circle cx="12" cy="12" r="9"/><path d="m10 8 5 4-5 4Z"/>',
      check: '<path d="m5 12 4 4L19 6"/>',
      x: '<path d="m6 6 12 12M18 6 6 18"/>',
      target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
      calendar: '<rect x="3" y="4" width="18" height="17" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
      trophy: '<path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0Z"/><path d="M7 6H3v2a4 4 0 0 0 4 4M17 6h4v2a4 4 0 0 1-4 4"/>'
    };
    return '<svg xmlns="http://www.w3.org/2000/svg" width="' + s + '" height="' + s + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (paths[name] || "") + "</svg>";
  }

  const NAV = [
    { route: "/", label: "今日", icon: "home" },
    { route: "/vocabulary", label: "単語帳", icon: "book" },
    { route: "/quiz", label: "クイズ", icon: "brain" },
    { route: "/weak", label: "苦手単語", icon: "rotate" },
    { route: "/history", label: "記録", icon: "history" }
  ];

  function currentRoute() {
    const raw = location.hash.replace(/^#/, "") || "/";
    return raw.charAt(0) === "/" ? raw : "/" + raw;
  }

  function isActive(route, current) {
    return route === "/" ? current === "/" : current.indexOf(route) === 0;
  }

  function navLinks(className, current) {
    return NAV.map(function (item) {
      return '<a class="nav-link ' + (isActive(item.route, current) ? "active" : "") + '" href="#' + item.route + '">' +
        icon(item.icon, 17) + "<span>" + item.label + "</span></a>";
    }).join("");
  }

  function bottomLinks(current) {
    return NAV.map(function (item) {
      return '<a class="' + (isActive(item.route, current) ? "active" : "") + '" href="#' + item.route + '">' +
        icon(item.icon, 18) + "<span>" + item.label + "</span></a>";
    }).join("");
  }

  function shell(content) {
    const route = currentRoute();
    const menu = state.mobileMenu ? '<div class="mobile-menu">' + navLinks("mobile", route) + "</div>" : "";
    return '<div class="app-shell">' +
      '<aside class="sidebar"><a class="sidebar-brand" href="#/"><span class="brand-mark">m</span><span><span class="brand-name">My English</span><span class="brand-sub">trainer</span></span></a><p class="nav-label">学習メニュー</p><nav class="side-nav">' + navLinks("side", route) + '</nav><div class="streak-box"><div class="streak-title"><span>習慣</span><span>7 DAYS</span></div><div class="streak-number">' + streakDays() + '<small>日連続</small></div><div class="streak-bars"><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div></div></aside>' +
      '<div class="main-column"><header class="topbar"><button class="menu-button" data-action="menu" aria-label="メニュー">☰</button><a class="study-selector" href="#/study"><span class="study-selector-book">' + selectedBookLabel() + '</span><span class="study-selector-chapter">' + selectedChapterLabel() + '</span></a><div class="desktop-message"><small>your small daily practice</small><strong>' + (route === "/" ? "焦らず、ひとつずつ。" : "今日も少しだけ、英語と向き合う。") + "</strong></div><a class=\"quick-button\" href=\"#/quiz\">" + icon("play", 14) + "5分クイズ</a></header>" + menu + '<main class="content">' + content + '</main><nav class="bottom-nav">' + bottomLinks(route) + "</nav></div></div>";
  }

  function pageHead(eyebrow, title, description, count) {
    return '<div class="page-head rise"><div><p class="eyebrow">' + eyebrow + "</p><h1>" + title + "</h1>" + (description ? '<p class="page-description">' + description + "</p>" : "") + "</div>" + (count ? '<span class="page-count">' + count + "</span>" : "") + "</div>";
  }

  function wordRow(word) {
    const learned = !!state.mastery[String(word.id)];
    const favorite = state.favorites.indexOf(word.id) >= 0;
    return '<div class="word-row ' + (learned ? "" : "unlearned") + '">' +
      '<a class="word-link" href="#/word/' + word.id + '"><span class="word-number">' + String(word.id).padStart(2, "0") + '</span><span class="word-text"><strong>' + word.word + "</strong><span>" + word.meaning + "</span></span></a>" +
      '<button class="favorite-button ' + (favorite ? "active" : "") + '" data-action="favorite" data-id="' + word.id + '" aria-label="' + word.word + 'をお気に入り">' + icon("star", 17) + "</button>" +
      '<span class="status ' + (learned ? "" : "unlearned") + '">' + (learned ? "習得済み" : "未学習") + "</span></div>";
  }

  function weakWords() {
    return selectedWords().filter(function (word) {
      return (state.wrong[String(word.id)] || 0) > 0 || !state.mastery[String(word.id)];
    });
  }

  function streakDays() {
    return state.history.length ? 7 : 0;
  }

  function studyPage() {
    const currentWords = selectedWords();
    const counts = [1, 2, 3, 4].map(function (chapter) {
      return window.filterWordsByChapter(state.selectedBook, chapter).length;
    });
    return pageHead("choose your study set", "教材・Chapter", "勉強したい教材とChapterを選んでください。選んだ範囲が単語帳とクイズの対象になります。", currentWords.length + " words") +
      '<section class="study-panel rise"><div class="study-panel-head"><div><p class="card-title">教材</p><p class="card-note">現在はDistinction 1〜6に対応しています。</p></div></div><div class="study-book-grid">' +
      BOOKS.map(function (book) {
        const active = state.selectedBook === book.id;
        const count = window.filterWordsByBook(book.id).length;
        return '<button class="study-book-button ' + (active ? "active" : "") + '" data-action="select-book" data-book="' + book.id + '"><strong>' + book.label + '</strong><span>' + count + '語登録済み</span></button>';
      }).join("") +
      '</div></section>' +
      '<section class="study-panel rise"><div class="study-panel-head"><div><p class="card-title">Chapter</p><p class="card-note">教材を変更するとChapterは「全Chapter」に戻ります。</p></div></div><div class="chapter-grid">' +
      '<button class="chapter-button ' + (state.selectedChapter === "all" ? "active" : "") + '" data-action="select-chapter" data-chapter="all"><strong>全Chapter</strong><span>' + window.filterWordsByBook(state.selectedBook).length + '語</span></button>' +
      [1, 2, 3, 4].map(function (chapter, index) {
        return '<button class="chapter-button ' + (String(state.selectedChapter) === String(chapter) ? "active" : "") + '" data-action="select-chapter" data-chapter="' + chapter + '"><strong>Chapter ' + chapter + '</strong><span>' + counts[index] + '語</span></button>';
      }).join("") +
      '</div></section>' +
      (currentWords.length ? '<section class="study-current card rise"><div><p class="eyebrow">current study set</p><h2>' + selectedBookLabel() + ' · ' + selectedChapterLabel() + '</h2><p class="card-note">' + currentWords.length + '語が学習対象です。</p></div><a class="primary-button" href="#/quiz">' + icon("play", 15) + 'クイズを始める</a></section>' : '<section class="empty rise"><strong>この教材・Chapterにはまだ単語が登録されていません。</strong><p>単語データを追加すると、ここから学習できるようになります。</p></section>');
  }

  function homePage() {
    const studyWords = selectedWords();
    const studyLearned = studyWords.filter(function (word) { return !!state.mastery[String(word.id)]; }).length;
    const weak = weakWords();
    const today = new Intl.DateTimeFormat("ja-JP", { month: "long", day: "numeric", weekday: "long" }).format(new Date());
    return '<div class="rise" style="margin-bottom:24px;color:var(--muted);font-size:12px;font-weight:700">' + icon("calendar", 15) + " " + today + "</div>" +
      '<section class="hero rise"><div class="hero-content"><p class="eyebrow">' + selectedBookLabel() + ' · ' + selectedChapterLabel() + '</p><h1>今日は、<br><strong>5分だけ。</strong></h1><p class="hero-copy">短い時間でも、続けた分だけ言葉はあなたのものになります。</p><a class="primary-button" href="#/quiz">' + icon("play", 16) + "今日の練習を始める</a></div></section>" +
      '<div class="grid two-col"><section class="card rise"><div class="card-head"><div><p class="card-title">今週のペース</p><p class="card-note">急がず、でも途切れずに。</p></div><span class="badge">7日連続</span></div><div class="bars">' + ["月", "火", "水", "木", "金", "土", "日"].map(function (day, index) { return '<div class="bar-item"><i style="height:' + [30, 48, 34, 58, 43, 64, 55][index] + 'px"></i><span>' + day + "</span></div>"; }).join("") + "</div></section>" +
      '<section class="card rise"><div class="card-head"><div><p class="card-title">単語の進み具合</p><p class="card-note">' + selectedBookLabel() + ' · ' + selectedChapterLabel() + '</p></div>' + icon("target", 19) + '</div><div class="progress-number"><strong>' + studyLearned + '</strong><span>/ ' + studyWords.length + ' 語</span></div><div class="progress-track"><i style="width:' + (studyWords.length ? studyLearned / studyWords.length * 100 : 0) + '%"></i></div></section></div>' +
      '<div class="section-split section"><section><div class="section-head"><div><p class="section-kicker">pick up where you left off</p><h2>復習すると、もっと残る</h2></div><a class="text-link" href="#/weak">すべて見る ›</a></div><div class="word-grid">' + weak.slice(0, 4).map(wordRow).join("") + "</div></section><section class=\"card\"><p class=\"card-title\">ひとことメモ</p><p class=\"memo\" style=\"margin-top:18px\">完璧な一日より、<br><strong style=\"color:var(--teal-deep)\">続いた一日。</strong></p><p class=\"card-note\">前回の学習 きのう</p></section></div>";
  }

  function vocabularyPage() {
    const term = state.search.toLowerCase();
    const studyWords = selectedWords();
    const filtered = studyWords.filter(function (word) {
      const matchesTerm = !term || word.word.indexOf(term) >= 0 || word.meaning.indexOf(state.search) >= 0;
      const matchesFilter = state.filter === "all" ||
        (state.filter === "learned" && state.mastery[String(word.id)]) ||
        (state.filter === "unlearned" && !state.mastery[String(word.id)]) ||
        (state.filter === "favorite" && state.favorites.indexOf(word.id) >= 0);
      return matchesTerm && matchesFilter;
    });
    const filters = [["all", "すべて"], ["unlearned", "まだ覚えていない"], ["learned", "覚えた"], ["favorite", "お気に入り"]];
    return pageHead("your vocabulary", "単語帳", selectedBookLabel() + " · " + selectedChapterLabel() + " の単語を表示しています。", filtered.length + " / " + studyWords.length + " words") +
      '<div class="search-row"><label class="search-box">' + icon("search", 18) + '<input id="word-search" class="search-input" type="search" value="' + escapeHtml(state.search) + '" placeholder="英単語や意味を検索" autocomplete="off"></label><div class="filter-row">' + filters.map(function (filter) { return '<button class="filter-button ' + (state.filter === filter[0] ? "active" : "") + '" data-action="filter" data-filter="' + filter[0] + '">' + filter[1] + "</button>"; }).join("") + "</div></div>" +
      (filtered.length ? '<div class="word-grid">' + filtered.map(wordRow).join("") + "</div>" : '<div class="empty"><strong>見つかりませんでした</strong><p>検索語やフィルターを変えてみてください。</p></div>');
  }

  function detailPage(id) {
    const word = WORDS.find(function (item) { return item.id === id; }) || WORDS[0];
    const learned = !!state.mastery[String(word.id)];
    const favorite = state.favorites.indexOf(word.id) >= 0;
    return '<a class="back-link" href="#/vocabulary">← 単語帳に戻る</a><div class="detail-wrap"><section class="detail-hero rise"><div class="detail-top"><span class="pill">' + word.level + " · " + word.part + '</span><button class="favorite-button ' + (favorite ? "active" : "") + '" data-action="favorite" data-id="' + word.id + '" aria-label="お気に入り">' + icon("star", 18) + '</button></div><p class="detail-pronunciation">sound it out</p><div class="detail-word-line"><h1 class="detail-word">' + word.word + '</h1><button class="speak-button" data-action="speak" data-id="' + word.id + '" aria-label="発音を聞く">' + icon("speaker", 19) + "</button></div><p class=\"meaning\">" + word.meaning + "</p></section>" +
      '<div class="detail-grid"><section class="example-card"><p class="example-label">example sentence</p><p class="example-text">' + word.example + '</p><p class="example-translation">' + word.translation + '</p></section><section class="mastery-card"><p class="mastery-title">習熟度を記録</p><div class="mastery-buttons"><button class="mastery-button ' + (learned ? "active" : "") + '" data-action="mastery" data-value="true" data-id="' + word.id + '">' + icon("check", 17) + "覚えた</button><button class=\"mastery-button " + (!learned ? "active" : "") + '" data-action="mastery" data-value="false" data-id="' + word.id + '">' + icon("x", 17) + "まだ覚えていない</button></div></section></div></div>";
  }

  function shuffle(items) {
    return items.slice().sort(function () { return Math.random() - .5; });
  }

  function makeChoices(correct, pool) {
    const source = pool && pool.length ? pool : WORDS;
    return shuffle([correct].concat(shuffle(source.filter(function (word) {
      return word.id !== correct.id;
    })).slice(0, 3)));
  }

  function newQuiz() {
    const pool = selectedWords();
    const total = Math.min(state.quizCount, pool.length);
    if (!total) {
      state.quiz = null;
      return;
    }
    const mode = state.quizMode;
    const quizQuestions = shuffle(pool).slice(0, total).map(function (word) {
      return { question: word, choices: makeChoices(word, pool) };
    });
    state.quiz = {
      quizQuestions: quizQuestions,
      total: total,
      currentQuestionIndex: 0,
      isAnswered: false,
      selectedAnswer: null,
      score: 0,
      historySaved: false,
      completed: false,
      mode: mode,
      requestedTotal: state.quizCount,
      book: state.selectedBook,
      chapter: state.selectedChapter
    };
  }

  function recordQuizHistory(quiz) {
    if (quiz.historySaved) return;
    state.history.unshift({
      id: String(Date.now()),
      date: new Date().toISOString().slice(0, 10),
      score: quiz.score,
      total: quiz.total,
      minutes: Math.max(1, Math.round(quiz.total * .8)),
      book: quiz.book,
      chapter: quiz.chapter,
      mode: quiz.mode || "multiple-choice"
    });
    quiz.historySaved = true;
  }

  function quizModeSelector() {
    const currentMode = selectedQuizMode();
    return '<section class="quiz-mode-panel rise"><div class="quiz-mode-head"><div><p class="card-title">クイズ方式</p><p class="card-note">方式を切り替えると、新しいクイズが始まります。</p></div><span class="badge">現在：' + currentMode.label + '</span></div><div class="quiz-mode-grid">' + QUIZ_MODES.map(function (mode) {
      const active = state.quizMode === mode.id;
      const available = mode.id === "multiple-choice" || mode.id === "en-ja" || mode.id === "ja-en" || mode.id === "example-word";
      return '<button class="quiz-mode-button ' + (active ? "active" : "") + (!available ? " disabled" : "") + '" data-action="select-quiz-mode" data-mode="' + mode.id + '" ' + (!available ? 'aria-disabled="true"' : "") + '><span class="quiz-mode-title">' + mode.label + '</span><span class="quiz-mode-description">' + mode.description + '</span><span class="quiz-mode-status">' + (available ? (active ? "選択中" : "選択する") : mode.status) + '</span></button>';
    }).join("") + '</div></section>';
  }

  function quizCountSelector() {
    return '<section class="quiz-count-panel rise"><div class="quiz-mode-head"><div><p class="card-title">問題数</p><p class="card-note">問題数を変更すると、新しいクイズが始まります。</p></div><span class="badge">現在：' + state.quizCount + '問</span></div><div class="quiz-count-grid">' + QUIZ_COUNTS.map(function (count) {
      const active = state.quizCount === count;
      return '<button class="quiz-count-button ' + (active ? "active" : "") + '" data-action="select-quiz-count" data-count="' + count + '"><strong>' + count + '</strong><span>問</span></button>';
    }).join("") + '</div>' + (selectedWords().length < state.quizCount ? '<p class="quiz-count-note">現在の学習対象は ' + selectedWords().length + '語なので、実際の出題数は ' + selectedWords().length + '問になります。</p>' : '') + '</section>';
  }

  function maskExampleSentence(example, answerWord) {
    const source = String(example || "");
    const target = String(answerWord || "");
    if (!target) return source;
    const escaped = target.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const pattern = new RegExp("\\b" + escaped + "\\b", "i");
    if (pattern.test(source)) return source.replace(pattern, "□□□□");
    const fallback = new RegExp(escaped, "i");
    return fallback.test(source) ? source.replace(fallback, "□□□□") : "□□□□";
  }

  function quizResultPage(quiz) {
    const percentage = Math.round(quiz.score / quiz.total * 100);
    return pageHead("quiz complete", "クイズ結果", selectedBookLabel() + " · " + selectedChapterLabel() + " の学習記録を保存しました。", icon("trophy", 13) + " " + quiz.score + " / " + quiz.total) +
      `<div class="quiz-wrap"><section class="quiz-result rise"><p class="result-label">your score</p><div class="result-score"><strong>${quiz.score}</strong><span>/ ${quiz.total} correct</span></div><div class="result-progress"><i style="width:${percentage}%"></i></div><p class="result-message">${percentage >= 80 ? "とても良いペースです。" : "間違えた単語をもう一度復習してみましょう。"}</p><button class="primary-button result-button" data-action="new-quiz">${icon("rotate", 15)}もう一度クイズ</button></section></div>`;
  }

  function quizPage() {
    if (!state.quiz) newQuiz();
    const quiz = state.quiz;
    if (!quiz) {
      return pageHead("no words yet", "クイズ", selectedBookLabel() + " · " + selectedChapterLabel() + " にはまだ単語が登録されていません。", "") +
        '<div class="empty"><strong>学習できる単語がありません。</strong><p>教材・Chapterを変更するか、単語データを追加してください。</p><a class="primary-button" href="#/study">教材・Chapterを選ぶ</a></div>';
    }
    if (quiz.completed) return quizResultPage(quiz);

    const current = quiz.quizQuestions[quiz.currentQuestionIndex];
    const question = current.question;
    const answered = quiz.isAnswered;
    const questionNumber = quiz.currentQuestionIndex + 1;
    const progress = (questionNumber - (answered ? 0 : 1)) / quiz.total * 100;
    const isJapaneseToEnglish = quiz.mode === "ja-en";
    const isExampleToWord = quiz.mode === "example-word";
    const questionLabel = isExampleToWord ? "この例文に当てはまる英単語は？" : (isJapaneseToEnglish ? "この日本語に合う英単語は？" : "この英単語の意味は？");
    const choiceText = function (choice) {
      if (isJapaneseToEnglish || isExampleToWord) return choice.word;
      return choice.meaning;
    };
    const questionDisplay = isExampleToWord ? maskExampleSentence(question.example, question.word) : (isJapaneseToEnglish ? question.meaning : question.word);
    const questionClass = isExampleToWord ? "question-word question-example" : "question-word";
    const questionHint = isExampleToWord ? "例文の意味を考えて、単語を選んでください" : (isJapaneseToEnglish ? "英単語を選んでください" : "音声で発音を確認");
    const speakIcon = isExampleToWord ? icon("speaker", 20) : (isJapaneseToEnglish ? "" : icon("speaker", 20));
    return pageHead("a tiny daily challenge", quiz.total + "問クイズ", selectedBookLabel() + " · " + selectedChapterLabel() + " · " + selectedQuizMode().label + "で出題します。", icon("trophy", 13) + " " + quiz.score + " correct") +
      quizModeSelector() + quizCountSelector() +
      '<div class="quiz-wrap"><div class="quiz-meta"><span>Question ' + questionNumber + " / " + quiz.total + "</span><span>" + (answered ? Math.round(quiz.score / questionNumber * 100) + "%" : "準備はできていますか？") + '</span></div><div class="quiz-progress"><i style="width:' + progress + '%"></i></div><section class="quiz-card rise"><p class="question-label">' + questionLabel + '</p><button class="' + questionClass + '" data-action="speak" data-id="' + question.id + '">' + questionDisplay + speakIcon + '</button><p class="question-pronunciation">' + questionHint + '</p><div class="choices">' + current.choices.map(function (choice, index) {
        const correct = answered && choice.id === question.id;
        const wrong = answered && quiz.selectedAnswer === choice.id && !correct;
        return '<button class="choice ' + (correct ? "correct" : wrong ? "wrong" : "") + '" data-action="answer" data-id="' + choice.id + '" ' + (answered ? "disabled" : "") + '><span class="choice-mark">' + (correct ? icon("check", 14) : wrong ? icon("x", 14) : String.fromCharCode(65 + index)) + "</span>" + choiceText(choice) + "</button>";
      }).join("") + "</div>" + (answered ? '<div class="feedback ' + (quiz.selectedAnswer === question.id ? "" : "wrong") + '"><div><strong>' + (quiz.selectedAnswer === question.id ? "その調子です。" : "もう一度、例文で確認しましょう。") + '</strong><span>' + question.example + '</span><span>' + question.translation + '</span></div><button class="next-button" data-action="next">' + (questionNumber === quiz.total ? "結果を見る ›" : "次へ ›") + "</button></div>" : "") + "</section></div>";
  }

  function weakPage() {
    const weak = weakWords();
    return pageHead("come back gently", "苦手単語", "間違えた単語と、まだ出会っていない単語をここにまとめています。", '<a class="primary-button" style="min-height:36px;font-size:11px" href="#/quiz">' + icon("play", 13) + "復習クイズ</a>") +
      '<div class="weak-banner">' + icon("rotate", 16) + "<span><strong>" + weak.length + "語</strong>を自分のペースで復習しましょう。</span></div>" +
      (weak.length ? '<div class="word-grid">' + weak.map(wordRow).join("") + "</div>" : '<div class="empty"><strong>復習する単語はありません</strong><p>いいペースです。新しい単語にも挑戦してみましょう。</p></div>');
  }

  function historyPage() {
    const average = state.history.length ? Math.round(state.history.reduce(function (sum, item) { return sum + item.score / item.total; }, 0) / state.history.length * 100) : 0;
    const minutes = state.history.reduce(function (sum, item) { return sum + item.minutes; }, 0);
    return pageHead("your learning trail", "学習の記録", "積み重ねは、あとから見るとちゃんと道になっています。") +
      '<div class="summary-grid"><section class="card"><p class="card-title">連続日数</p><div class="summary-value"><strong>' + streakDays() + '</strong><span>日</span></div></section><section class="card"><p class="card-title">平均正答率</p><div class="summary-value"><strong>' + average + '</strong><span>%</span></div></section><section class="card"><p class="card-title">学習時間</p><div class="summary-value"><strong>' + minutes + '</strong><span>分</span></div></section></div>' +
      '<section class="history-list"><div class="section-head" style="padding:20px 16px 8px;margin:0"><h2>最近のセッション</h2><span class="page-count">local history</span></div>' +
      (state.history.length ? state.history.map(function (entry) {
        const date = new Intl.DateTimeFormat("ja-JP", { month: "short", day: "numeric" }).format(new Date(entry.date));
         return '<div class="history-row"><span style="color:var(--teal-deep)">' + icon("calendar", 18) + '</span><div class="history-date"><strong>' + date + ' の練習</strong><span>' + entry.minutes + "分 · " + entry.total + "問クイズ</span></div><div class=\"history-score\">" + entry.score + '<small>/' + entry.total + "</small></div></div>";
      }).join("") : '<div class="empty" style="border:0;border-radius:0">まだ学習履歴がありません。</div>') + "</section>";
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, function (char) {
      return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[char];
    });
  }

  function speak(word) {
    if (!("speechSynthesis" in window)) {
      alert("このブラウザでは音声機能を利用できません。");
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(word.word);
    utterance.lang = "en-US";
    utterance.rate = .82;
    window.speechSynthesis.speak(utterance);
  }

  function render() {
    const route = currentRoute();
    let content;
    if (route === "/") content = homePage();
    else if (route === "/study") content = studyPage();
    else if (route === "/vocabulary") content = vocabularyPage();
    else if (route === "/quiz") content = quizPage();
    else if (route === "/weak") content = weakPage();
    else if (route === "/history") content = historyPage();
    else if (/^\/word\/\d+$/.test(route)) content = detailPage(Number(route.split("/")[2]));
    else content = homePage();
    document.getElementById("app").innerHTML = shell(content);
    if (route === "/vocabulary") {
      const search = document.getElementById("word-search");
      if (search) {
        search.focus();
        search.setSelectionRange(search.value.length, search.value.length);
      }
    }
  }

  document.addEventListener("click", function (event) {
    const target = event.target.closest("[data-action]");
    if (!target) return;
    const action = target.dataset.action;
    if (action === "menu") {
      state.mobileMenu = !state.mobileMenu;
      render();
    } else if (action === "select-book") {
      setStudySelection(target.dataset.book, "all");
      render();
    } else if (action === "select-chapter") {
      setStudySelection(state.selectedBook, target.dataset.chapter);
      render();
    } else if (action === "select-quiz-mode") {
      setQuizMode(target.dataset.mode);
      render();
    } else if (action === "select-quiz-count") {
      setQuizCount(target.dataset.count);
      render();
    } else if (action === "favorite") {
      const id = Number(target.dataset.id);
      state.favorites = state.favorites.indexOf(id) >= 0 ? state.favorites.filter(function (item) { return item !== id; }) : state.favorites.concat(id);
      persist();
      render();
    } else if (action === "filter") {
      state.filter = target.dataset.filter;
      render();
    } else if (action === "speak") {
      const word = WORDS.find(function (item) { return item.id === Number(target.dataset.id); });
      if (word) speak(word);
    } else if (action === "mastery") {
      state.mastery[target.dataset.id] = target.dataset.value === "true";
      persist();
      render();
    } else if (action === "answer") {
      if (!state.quiz || state.quiz.completed || state.quiz.isAnswered) return;
      const id = Number(target.dataset.id);
      const current = state.quiz.quizQuestions[state.quiz.currentQuestionIndex];
      const questionId = current.question.id;
      state.quiz.selectedAnswer = id;
      state.quiz.isAnswered = true;
      if (id === questionId) {
        state.quiz.score += 1;
        state.mastery[String(id)] = true;
        state.correct[String(id)] = (state.correct[String(id)] || 0) + 1;
      } else {
        state.wrong[String(questionId)] = (state.wrong[String(questionId)] || 0) + 1;
      }
      if (state.quiz.currentQuestionIndex === state.quiz.total - 1) recordQuizHistory(state.quiz);
      persist();
      render();
    } else if (action === "next") {
      if (!state.quiz || state.quiz.completed || !state.quiz.isAnswered) return;
      if (state.quiz.currentQuestionIndex === state.quiz.total - 1) {
        state.quiz.completed = true;
        render();
        return;
      }
      state.quiz.currentQuestionIndex += 1;
      state.quiz.isAnswered = false;
      state.quiz.selectedAnswer = null;
      render();
    } else if (action === "new-quiz") {
      newQuiz();
      render();
    }
  });

  document.addEventListener("input", function (event) {
    if (event.target.id === "word-search") {
      state.search = event.target.value;
      render();
    }
  });

  window.addEventListener("hashchange", function () {
    state.mobileMenu = false;
    render();
  });

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", function () {
      navigator.serviceWorker.register("./service-worker.js").catch(function () {});
    });
  }

  render();
})();