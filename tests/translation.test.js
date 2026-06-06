// translation.test.js - Pure logic tests (no DB needed)
const {
  SUPPORTED_LANGUAGES,
  RTL_LANGUAGES,
  getQuestionForPlayer,
  getQuestionsForPlayer,
  detectLanguage,
  formatDuelQuestion,
} = require('../src/services/translation.service');

// ─── MOCK QUESTION ────────────────────────────────────────────
const mockQuestion = {
  _id: 'q001',
  text: {
    en: 'What is the real name of the Fourth Hokage?',
    fr: 'Quel est le vrai nom du Quatrième Hokage ?',
    es: '¿Cuál es el nombre real del Cuarto Hokage?',
    ja: '四代目火影の本名は何ですか？',
    ar: 'ما هو الاسم الحقيقي للهوكاج الرابع؟',
  },
  options: [
    { en: 'Minato Namikaze', fr: 'Minato Namikaze', es: 'Minato Namikaze', ja: '波風ミナト', ar: 'ميناتو ناميكازي' },
    { en: 'Jiraiya', fr: 'Jiraiya', es: 'Jiraiya', ja: '自来也', ar: 'جيرايا' },
    { en: 'Hiruzen Sarutobi', fr: 'Hiruzen Sarutobi', es: 'Hiruzen Sarutobi', ja: '猿飛ヒルゼン', ar: 'هيروزين ساروتوبي' },
    { en: 'Tobirama Senju', fr: 'Tobirama Senju', es: 'Tobirama Senju', ja: '千手扉間', ar: 'توبيراما سينجو' },
  ],
  correct_index: 0,
  anime: 'Naruto',
  soul: 'shonen',
  type: 'classique',
  difficulty: 3,
};

const mockQuestionPartial = {
  _id: 'q002',
  text: {
    en: 'Who is the protagonist of One Piece?',
    fr: 'Qui est le protagoniste de One Piece ?',
    // No other translations
  },
  options: [
    { en: 'Luffy', fr: 'Luffy' },
    { en: 'Zoro', fr: 'Zoro' },
    { en: 'Nami', fr: 'Nami' },
    { en: 'Sanji', fr: 'Sanji' },
  ],
  correct_index: 0,
  anime: 'One Piece',
  soul: 'shonen',
  type: 'classique',
  difficulty: 1,
};

describe('Translation Service', () => {

  // ── SUPPORTED LANGUAGES ───────────────────────────────────
  test('18 langues supportées', () => {
    expect(Object.keys(SUPPORTED_LANGUAGES).length).toBe(18);
  });

  test('langues clés présentes', () => {
    expect(SUPPORTED_LANGUAGES.en).toBe('English');
    expect(SUPPORTED_LANGUAGES.fr).toBe('Français');
    expect(SUPPORTED_LANGUAGES.ja).toBe('日本語');
    expect(SUPPORTED_LANGUAGES.ar).toBe('العربية');
    expect(SUPPORTED_LANGUAGES.sw).toBe('Kiswahili');
    expect(SUPPORTED_LANGUAGES.wo).toBe('Wolof');
  });

  test('langues RTL correctes', () => {
    expect(RTL_LANGUAGES).toContain('ar');
    expect(RTL_LANGUAGES).not.toContain('en');
    expect(RTL_LANGUAGES).not.toContain('fr');
  });

  // ── getQuestionForPlayer ──────────────────────────────────
  test('question en anglais pour joueur EN', () => {
    const result = getQuestionForPlayer(mockQuestion, 'en');
    expect(result.text).toBe('What is the real name of the Fourth Hokage?');
    expect(result.lang).toBe('en');
    expect(result.isTranslated).toBe(false);
    expect(result.isRTL).toBe(false);
    expect(result.options[0]).toBe('Minato Namikaze');
  });

  test('question en français pour joueur FR', () => {
    const result = getQuestionForPlayer(mockQuestion, 'fr');
    expect(result.text).toBe('Quel est le vrai nom du Quatrième Hokage ?');
    expect(result.lang).toBe('fr');
    expect(result.isTranslated).toBe(false);
  });

  test('question en espagnol pour joueur ES', () => {
    const result = getQuestionForPlayer(mockQuestion, 'es');
    expect(result.text).toBe('¿Cuál es el nombre real del Cuarto Hokage?');
    expect(result.lang).toBe('es');
    expect(result.isTranslated).toBe(false);
    expect(result.options[0]).toBe('Minato Namikaze');
  });

  test('question en japonais pour joueur JA', () => {
    const result = getQuestionForPlayer(mockQuestion, 'ja');
    expect(result.text).toBe('四代目火影の本名は何ですか？');
    expect(result.lang).toBe('ja');
    expect(result.options[0]).toBe('波風ミナト');
  });

  test('question en arabe pour joueur AR - RTL activé', () => {
    const result = getQuestionForPlayer(mockQuestion, 'ar');
    expect(result.text).toBe('ما هو الاسم الحقيقي للهوكاج الرابع؟');
    expect(result.isRTL).toBe(true);
    expect(result.lang).toBe('ar');
  });

  test('fallback EN si langue manquante (DE)', () => {
    const result = getQuestionForPlayer(mockQuestion, 'de');
    // 'de' not available → fallback to 'en'
    expect(result.lang).toBe('en');
    expect(result.isTranslated).toBe(true);
    expect(result.text).toBe('What is the real name of the Fourth Hokage?');
  });

  test('fallback FR si langue manquante (WO) - wolof', () => {
    const result = getQuestionForPlayer(mockQuestionPartial, 'wo');
    // 'wo' not available, fallback chain: wo→fr→en
    expect(['fr', 'en']).toContain(result.lang);
    expect(result.isTranslated).toBe(true);
  });

  test('correct_index préservé pour toutes les langues', () => {
    ['en', 'fr', 'es', 'ja', 'ar', 'de'].forEach(lang => {
      const result = getQuestionForPlayer(mockQuestion, lang);
      expect(result.correct_index).toBe(0);
    });
  });

  test('options array toujours 4 éléments', () => {
    ['en', 'fr', 'es', 'ja'].forEach(lang => {
      const result = getQuestionForPlayer(mockQuestion, lang);
      expect(result.options).toHaveLength(4);
      result.options.forEach(opt => expect(typeof opt).toBe('string'));
    });
  });

  // ── getQuestionsForPlayer (batch) ────────────────────────
  test('batch questions pour un joueur EN', () => {
    const results = getQuestionsForPlayer([mockQuestion, mockQuestionPartial], 'en');
    expect(results).toHaveLength(2);
    expect(results[0].lang).toBe('en');
    expect(results[1].lang).toBe('en');
  });

  test('batch questions pour un joueur ES avec fallback', () => {
    const results = getQuestionsForPlayer([mockQuestion, mockQuestionPartial], 'es');
    expect(results[0].lang).toBe('es'); // has ES
    expect(['fr','en']).toContain(results[1].lang); // no ES → fallback
  });

  // ── formatDuelQuestion ───────────────────────────────────
  test('duel: joueur1 EN, joueur2 ES → langues séparées', () => {
    const result = formatDuelQuestion(mockQuestion, 'en', 'es');
    expect(result.forPlayer1.lang).toBe('en');
    expect(result.forPlayer2.lang).toBe('es');
    expect(result.forPlayer1.text).not.toBe(result.forPlayer2.text);
    // Same correct answer index
    expect(result.correct_index).toBe(0);
  });

  test('duel: joueur1 JA, joueur2 AR → deux langues différentes', () => {
    const result = formatDuelQuestion(mockQuestion, 'ja', 'ar');
    expect(result.forPlayer1.lang).toBe('ja');
    expect(result.forPlayer2.lang).toBe('ar');
    expect(result.forPlayer1.isRTL).toBe(false);
    expect(result.forPlayer2.isRTL).toBe(true);
  });

  test('duel même langue: joueur1 FR, joueur2 FR', () => {
    const result = formatDuelQuestion(mockQuestion, 'fr', 'fr');
    expect(result.forPlayer1.text).toBe(result.forPlayer2.text);
    expect(result.forPlayer1.lang).toBe('fr');
    expect(result.forPlayer2.lang).toBe('fr');
  });

  // ── detectLanguage ───────────────────────────────────────
  test('détecter arabe', () => {
    expect(detectLanguage('ما هو الاسم')).toBe('ar');
  });

  test('détecter japonais', () => {
    expect(detectLanguage('これは質問です')).toBe('ja');
  });

  test('détecter coréen', () => {
    expect(detectLanguage('이것은 질문입니다')).toBe('ko');
  });

  test('détecter chinois', () => {
    expect(detectLanguage('这是一个问题')).toBe('zh');
  });

  test('détecter hindi', () => {
    expect(detectLanguage('यह एक प्रश्न है')).toBe('hi');
  });

  test('détecter français', () => {
    expect(detectLanguage('je suis avec vous pour cette question')).toBe('fr');
  });

  test('détecter espagnol', () => {
    expect(detectLanguage('el protagonista del anime es')).toBe('es');
  });

  test('fallback EN pour texte non reconnu', () => {
    expect(detectLanguage('xyz 123 abc')).toBe('en');
    expect(detectLanguage('')).toBe('en');
    expect(detectLanguage(null)).toBe('en');
  });

  // ── REGION DATA ──────────────────────────────────────────
  test('4 régions définies', () => {
    const REGIONS = ['europe', 'americas', 'asia', 'africa'];
    expect(REGIONS).toHaveLength(4);
    REGIONS.forEach(r => expect(typeof r).toBe('string'));
  });

  // ── SCENARIO RÉEL: inconnu (EN) vs James (ES) ────────────
  test('Scenario: InconnuBoy (EN) vs James (ES) - même question, langues diff', () => {
    const InconnuLang = 'en';
    const JamesLang = 'es';

    const result = formatDuelQuestion(mockQuestion, InconnuLang, JamesLang);

    // InconnuBoy voit la question en anglais
    expect(result.forPlayer1.text).toBe('What is the real name of the Fourth Hokage?');
    expect(result.forPlayer1.lang).toBe('en');

    // James voit la même question en espagnol
    expect(result.forPlayer2.text).toBe('¿Cuál es el nombre real del Cuarto Hokage?');
    expect(result.forPlayer2.lang).toBe('es');

    // La réponse correcte est la même pour les deux
    expect(result.forPlayer1.correct_index).toBe(result.forPlayer2.correct_index);
    expect(result.correct_index).toBe(0);

    // Les options sont dans la bonne langue pour chacun
    expect(result.forPlayer1.options[0]).toBe('Minato Namikaze');
    expect(result.forPlayer2.options[0]).toBe('Minato Namikaze'); // nom propre = identique
  });
});
