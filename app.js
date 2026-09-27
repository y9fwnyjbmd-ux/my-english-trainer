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
    history: "met-history"
  };
  const DEFAULT_MASTERY = { "1": true, "2": true, "4": true, "5": true, "8": true, "9": true, "11": true, "14": true, "17": true, "18": true, "19": true };
  const DEFAULT_WRONG = { "3": 1, "7": 2, "12": 1, "16": 1 };
  const DEFAULT_HISTORY = [
    { id: "seed-1", date: "2024-06-14", score: 8, total: 10, minutes: 9 },
    { id: "seed-2", date: "2024-06-12", score: 6, total: 8, minutes: 7 },
    { id: "seed-3", date: "2024-06-10", score: 7, total: 10, minutes: 11 }
  ];
  const QUIZ_TOTAL = 20;

  const state = {
    mastery: read(KEYS.mastery, DEFAULT_MASTERY),
    favorites: read(KEYS.favorites, [3, 8, 15]),
    wrong: read(KEYS.wrong, DEFAULT_WRONG),
    correct: read(KEYS.correct, {}),
    history: read(KEYS.history, DEFAULT_HISTORY),
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
      '<div class="main-column"><header class="topbar"><button class="menu-button" data-action="menu" aria-label="メニュー">☰</button><div class="desktop-message"><small>your small daily practice</small><strong>' + (route === "/" ? "焦らず、ひとつずつ。" : "今日も少しだけ、英語と向き合う。") + "</strong></div><a class=\"quick-button\" href=\"#/quiz\">" + icon("play", 14) + "5分クイズ</a></header>" + menu + '<main class="content">' + content + '</main><nav class="bottom-nav">' + bottomLinks(route) + "</nav></div></div>";
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
    return WORDS.filter(function (word) {
      return (state.wrong[String(word.id)] || 0) > 0 || !state.mastery[String(word.id)];
    });
  }

  function streakDays() {
    return state.history.length ? 7 : 0;
  }

  function homePage() {
    const learned = Object.keys(state.mastery).filter(function (key) { return state.mastery[key]; }).length;
    const weak = weakWords();
    const today = new Intl.DateTimeFormat("ja-JP", { month: "long", day: "numeric", weekday: "long" }).format(new Date());
    return '<div class="rise" style="margin-bottom:24px;color:var(--muted);font-size:12px;font-weight:700">' + icon("calendar", 15) + " " + today + "</div>" +
      '<section class="hero rise"><div class="hero-content"><p class="eyebrow">good to see you</p><h1>今日は、<br><strong>5分だけ。</strong></h1><p class="hero-copy">短い時間でも、続けた分だけ言葉はあなたのものになります。</p><a class="primary-button" href="#/quiz">' + icon("play", 16) + "今日の練習を始める</a></div></section>" +
      '<div class="grid two-col"><section class="card rise"><div class="card-head"><div><p class="card-title">今週のペース</p><p class="card-note">急がず、でも途切れずに。</p></div><span class="badge">7日連続</span></div><div class="bars">' + ["月", "火", "水", "木", "金", "土", "日"].map(function (day, index) { return '<div class="bar-item"><i style="height:' + [30, 48, 34, 58, 43, 64, 55][index] + 'px"></i><span>' + day + "</span></div>"; }).join("") + "</div></section>" +
      '<section class="card rise"><div class="card-head"><div><p class="card-title">単語の進み具合</p><p class="card-note">全20語のコレクション</p></div>' + icon("target", 19) + '</div><div class="progress-number"><strong>' + learned + '</strong><span>/ 20 語</span></div><div class="progress-track"><i style="width:' + (learned / WORDS.length * 100) + '%"></i></div></section></div>' +
      '<div class="section-split section"><section><div class="section-head"><div><p class="section-kicker">pick up where you left off</p><h2>復習すると、もっと残る</h2></div><a class="text-link" href="#/weak">すべて見る ›</a></div><div class="word-grid">' + weak.slice(0, 4).map(wordRow).join("") + "</div></section><section class=\"card\"><p class=\"card-title\">ひとことメモ</p><p class=\"memo\" style=\"margin-top:18px\">完璧な一日より、<br><strong style=\"color:var(--teal-deep)\">続いた一日。</strong></p><p class=\"card-note\">前回の学習 きのう</p></section></div>";
  }

  function vocabularyPage() {
    const term = state.search.toLowerCase();
    const filtered = WORDS.filter(function (word) {
      const matchesTerm = !term || word.word.indexOf(term) >= 0 || word.meaning.indexOf(state.search) >= 0;
      const matchesFilter = state.filter === "all" ||
        (state.filter === "learned" && state.mastery[String(word.id)]) ||
        (state.filter === "unlearned" && !state.mastery[String(word.id)]) ||
        (state.filter === "favorite" && state.favorites.indexOf(word.id) >= 0);
      return matchesTerm && matchesFilter;
    });
    const filters = [["all", "すべて"], ["unlearned", "まだ覚えていない"], ["learned", "覚えた"], ["favorite", "お気に入り"]];
    return pageHead("your vocabulary", "単語帳", "気になった単語をいつでも見返せます。声に出すだけでも、立派な復習です。", filtered.length + " / " + WORDS.length + " words") +
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

  function makeChoices(correct) {
    return shuffle([correct].concat(shuffle(WORDS.filter(function (word) {
      return word.id !== correct.id;
    })).slice(0, 3)));
  }

  function newQuiz() {
    const quizQuestions = shuffle(WORDS).slice(0, QUIZ_TOTAL).map(function (word) {
      return { question: word, choices: makeChoices(word) };
    });
    state.quiz = {
      quizQuestions: quizQuestions,
      currentQuestionIndex: 0,
      isAnswered: false,
      selectedAnswer: null,
      score: 0,
      historySaved: false,
      completed: false
    };
  }

  function recordQuizHistory(quiz) {
    if (quiz.historySaved) return;
    state.history.unshift({
      id: String(Date.now()),
      date: new Date().toISOString().slice(0, 10),
      score: quiz.score,
      total: QUIZ_TOTAL,
      minutes: Math.max(1, Math.round(QUIZ_TOTAL * .8))
    });
    quiz.historySaved = true;
  }

  function quizResultPage(quiz) {
    const percentage = Math.round(quiz.score / QUIZ_TOTAL * 100);
    return pageHead("twenty questions complete", "クイズ結果", "20問、おつかれさまでした。今日の学習記録に保存しました。", icon("trophy", 13) + " " + quiz.score + " / " + QUIZ_TOTAL) +
      '<div class="quiz-wrap"><section class="quiz-result rise"><p class="result-label">your score</p><div class="result-score"><strong>' + quiz.score + '</strong><span>/ ' + QUIZ_TOTAL + " correct</span></div><div class=\"result-progress\"><i style=\"width:" + percentage + '%"></i></div><p class="result-message">' + (percentage >= 80 ? "とても良いペースです。" : "間違えた単語をもう一度復習してみましょう。") + '</p><button class="primary-button result-button" data-action="new-quiz">' + icon("rotate", 15) + "もう一度クイズ</button></section></div>";
  }

  function quizPage() {
    if (!state.quiz) newQuiz();
    const quiz = state.quiz;
    if (quiz.completed) return quizResultPage(quiz);

    const current = quiz.quizQuestions[quiz.currentQuestionIndex];
    const question = current.question;
    const answered = quiz.isAnswered;
    const questionNumber = quiz.currentQuestionIndex + 1;
    const progress = (questionNumber - (answered ? 0 : 1)) / QUIZ_TOTAL * 100;
    return pageHead("a tiny daily challenge", "20問クイズ", "意味を思い出すだけで、記憶は少しずつ強くなります。", icon("trophy", 13) + " " + quiz.score + " correct") +
      '<div class="quiz-wrap"><div class="quiz-meta"><span>Question ' + questionNumber + " / " + QUIZ_TOTAL + "</span><span>" + (answered ? Math.round(quiz.score / questionNumber * 100) + "%" : "準備はできていますか？") + '</span></div><div class="quiz-progress"><i style="width:' + progress + '%"></i></div><section class="quiz-card rise"><p class="question-label">この英語の意味は？</p><button class="question-word" data-action="speak" data-id="' + question.id + '">' + question.word + icon("speaker", 20) + '</button><p class="question-pronunciation">音声で発音を確認</p><div class="choices">' + current.choices.map(function (choice, index) {
        const correct = answered && choice.id === question.id;
        const wrong = answered && quiz.selectedAnswer === choice.id && !correct;
        return '<button class="choice ' + (correct ? "correct" : wrong ? "wrong" : "") + '" data-action="answer" data-id="' + choice.id + '" ' + (answered ? "disabled" : "") + '><span class="choice-mark">' + (correct ? icon("check", 14) : wrong ? icon("x", 14) : String.fromCharCode(65 + index)) + "</span>" + choice.meaning + "</button>";
      }).join("") + "</div>" + (answered ? '<div class="feedback ' + (quiz.selectedAnswer === question.id ? "" : "wrong") + '"><div><strong>' + (quiz.selectedAnswer === question.id ? "その調子です。" : "もう一度、例文で確認しましょう。") + '</strong><span>' + question.example + '</span></div><button class="next-button" data-action="next">' + (questionNumber === QUIZ_TOTAL ? "結果を見る ›" : "次へ ›") + "</button></div>" : "") + "</section></div>";
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
      if (state.quiz.currentQuestionIndex === QUIZ_TOTAL - 1) recordQuizHistory(state.quiz);
      persist();
      render();
    } else if (action === "next") {
      if (!state.quiz || state.quiz.completed || !state.quiz.isAnswered) return;
      if (state.quiz.currentQuestionIndex === QUIZ_TOTAL - 1) {
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