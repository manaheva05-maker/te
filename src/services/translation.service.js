// Supported languages with their full names
const SUPPORTED_LANGUAGES = {
  en: 'English', fr: 'Français', es: 'Español', de: 'Deutsch',
  it: 'Italiano', pt: 'Português', ja: '日本語', ko: '한국어',
  zh: '中文', ar: 'العربية', hi: 'हिन्दी', sw: 'Kiswahili',
  nl: 'Nederlands', pl: 'Polski', th: 'ไทย', id: 'Bahasa Indonesia',
  ha: 'Hausa', wo: 'Wolof',
};

// RTL languages
const RTL_LANGUAGES = ['ar'];

// Language → fallback chain
const FALLBACK_CHAIN = {
  default: ['en', 'fr'],
  ja: ['ja', 'en'],
  ko: ['ko', 'en'],
  zh: ['zh', 'en'],
  ar: ['ar', 'fr', 'en'],
  hi: ['hi', 'en'],
  sw: ['sw', 'en'],
  ha: ['ha', 'fr', 'en'],
  wo: ['wo', 'fr', 'en'],
};

/**
 * Get question text for a specific player language
 * Falls back to EN or FR if translation missing
 */
const getQuestionForPlayer = (question, playerLang = 'en') => {
  const chain = FALLBACK_CHAIN[playerLang] || [playerLang, 'en', 'fr'];

  for (const lang of chain) {
    const text = question.text?.[lang];
    if (text) {
      const options = (question.options || []).map(opt => opt[lang] || opt.en || opt.fr || '');
      return {
        _id: question._id,
        text: text,
        options,
        correct_index: question.correct_index,
        anime: question.anime,
        soul: question.soul,
        type: question.type,
        difficulty: question.difficulty,
        media_url: question.media_url,
        lang,                         // actual language served
        isTranslated: lang !== playerLang,
        isRTL: RTL_LANGUAGES.includes(lang),
      };
    }
  }

  // Ultimate fallback
  return {
    _id: question._id,
    text: question.text?.en || question.text?.fr || '',
    options: (question.options || []).map(o => o.en || o.fr || ''),
    correct_index: question.correct_index,
    anime: question.anime,
    soul: question.soul,
    type: question.type,
    difficulty: question.difficulty,
    media_url: question.media_url,
    lang: 'en',
    isTranslated: true,
    isRTL: false,
  };
};

/**
 * Get multiple questions for a player in their language
 * Used during duel question loading
 */
const getQuestionsForPlayer = (questions, playerLang = 'en') => {
  return questions.map(q => getQuestionForPlayer(q, playerLang));
};

/**
 * Translate question using Claude AI
 * Returns translated text + options
 */
const translateQuestion = async (question, targetLang) => {
  // Check if already translated
  if (question.hasLang?.(targetLang)) {
    return getQuestionForPlayer(question, targetLang);
  }

  let Anthropic;
  try { Anthropic = require('@anthropic-ai/sdk'); } catch { return null; }
  if (!process.env.ANTHROPIC_API_KEY) return null;

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const langName = SUPPORTED_LANGUAGES[targetLang] || targetLang;
  const sourceText = question.text.en || question.text.fr;
  const sourceOptions = (question.options || []).map(o => o.en || o.fr);

  try {
    const prompt = `Translate this anime quiz question from English to ${langName}.
Keep anime character names, technique names, and proper nouns UNCHANGED.
Only translate the surrounding text.

Question: "${sourceText}"
Options:
${sourceOptions.map((o, i) => `${i + 1}. ${o}`).join('\n')}

Respond ONLY with valid JSON, no markdown:
{
  "question": "translated question",
  "options": ["option1", "option2", "option3", "option4"]
}`;

    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 600,
      messages: [{ role: 'user', content: prompt }]
    });

    const raw = response.content[0].text.trim();
    const clean = raw.replace(/```json|```/g, '').trim();
    const data = JSON.parse(clean);

    // Save translation to DB
    if (question.addTranslation) {
      question.addTranslation(targetLang, data.question, data.options);
      await question.save();
    }

    return {
      _id: question._id,
      text: data.question,
      options: data.options,
      correct_index: question.correct_index,
      anime: question.anime,
      soul: question.soul,
      type: question.type,
      difficulty: question.difficulty,
      lang: targetLang,
      isTranslated: false,
      isRTL: RTL_LANGUAGES.includes(targetLang),
    };
  } catch (err) {
    console.error('Translation error:', err.message);
    return getQuestionForPlayer(question, targetLang); // fallback
  }
};

/**
 * Batch translate questions for a language
 * Called when new language is added to the system
 */
const batchTranslate = async (soul, targetLang, limit = 20) => {
  const MultiLangQuestion = require('../models/MultiLangQuestion');
  const questions = await MultiLangQuestion.find({
    soul,
    isValidated: true,
    availableLanguages: { $nin: [targetLang] }
  }).limit(limit);

  const results = { success: 0, failed: 0 };

  for (const q of questions) {
    try {
      await translateQuestion(q, targetLang);
      results.success++;
      await new Promise(r => setTimeout(r, 200)); // rate limit
    } catch {
      results.failed++;
    }
  }

  return results;
};

/**
 * Detect language from text (simple heuristic)
 * Used as fallback when player lang not set
 */
const detectLanguage = (text) => {
  if (!text) return 'en';
  const patterns = {
    ar: /[\u0600-\u06FF]/,
    ko: /[\uAC00-\uD7AF]/,
    zh: /^[\u4E00-\u9FFF\u3400-\u4DBF\s，。！？、；：""''（）【】《》]+$/,
    ja: /[\u3040-\u30FF]/,
    hi: /[\u0900-\u097F]/,
    th: /[\u0E00-\u0E7F]/,
    fr: /\b(je|tu|il|nous|vous|ils|est|sont|avec|pour|dans)\b/i,
    es: /\b(el|la|los|las|una|del|que|con|por|para)\b/i,
    de: /\b(der|die|das|ein|eine|ist|und|mit|für|von)\b/i,
    pt: /\b(um|uma|do|da|com|por|para|que|não|mas)\b/i,
  };
  for (const [lang, pattern] of Object.entries(patterns)) {
    if (pattern.test(text)) return lang;
  }
  return 'en';
};

/**
 * Format question for duel socket event
 * Each player gets question in their own language
 */
const formatDuelQuestion = (question, player1Lang, player2Lang) => {
  return {
    forPlayer1: getQuestionForPlayer(question, player1Lang),
    forPlayer2: getQuestionForPlayer(question, player2Lang),
    // Common fields
    correct_index: question.correct_index,
    anime: question.anime,
    soul: question.soul,
    type: question.type,
    difficulty: question.difficulty,
  };
};

module.exports = {
  SUPPORTED_LANGUAGES,
  RTL_LANGUAGES,
  getQuestionForPlayer,
  getQuestionsForPlayer,
  translateQuestion,
  batchTranslate,
  detectLanguage,
  formatDuelQuestion,
};
