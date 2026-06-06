const mongoose = require('mongoose');

// Extended Question model supporting unlimited languages
const multiLangQuestionSchema = new mongoose.Schema({
  // Core content - always required in EN + FR
  text: {
    en: { type: String, required: true },
    fr: { type: String, required: true },
    // Dynamic language fields - added as needed
    es: String, de: String, it: String, pt: String,
    ja: String, ko: String, zh: String, ar: String,
    hi: String, sw: String, nl: String, pl: String,
    th: String, id: String, ha: String, wo: String,
  },
  options: [{
    en: { type: String, required: true },
    fr: { type: String, required: true },
    es: String, de: String, it: String, pt: String,
    ja: String, ko: String, zh: String, ar: String,
    hi: String, sw: String, nl: String, pl: String,
    th: String, id: String, ha: String, wo: String,
  }],
  correct_index: { type: Number, required: true },

  // Metadata
  anime: { type: String, required: true },
  arc: { type: String, default: '' },
  category: { type: String, required: true },
  soul: {
    type: String,
    enum: ['shonen','isekai','seinen','mystere','dark','mecha','slice','fantasy','gore','wildcard'],
    default: 'shonen',
  },
  type: {
    type: String,
    enum: ['classique','flash','image_blind','audio','chronologie','confrontation','wildcard'],
    default: 'classique',
  },
  difficulty: { type: Number, min: 1, max: 10, default: 5 },
  success_rate: { type: Number, default: 0 },
  times_asked: { type: Number, default: 0 },
  media_url: { type: String, default: null },
  isAIGenerated: { type: Boolean, default: false },
  isValidated: { type: Boolean, default: true },

  // Which languages are available
  availableLanguages: {
    type: [String],
    default: ['en', 'fr'],
  },
  // Translation pending for these langs
  pendingTranslation: {
    type: [String],
    default: [],
  },
}, { timestamps: true });

// ── HELPERS ───────────────────────────────────────────────────

/**
 * Get question text in target language, fallback to EN then FR
 */
multiLangQuestionSchema.methods.getInLang = function(lang = 'en') {
  const fallbackChain = [lang, 'en', 'fr'];
  for (const l of fallbackChain) {
    if (this.text[l]) {
      return {
        text: this.text[l],
        options: this.options.map(o => o[l] || o.en || o.fr),
        correct_index: this.correct_index,
        lang: l,
        isTranslated: l !== lang,
      };
    }
  }
  return null;
};

/**
 * Static: get question for a specific player language
 */
multiLangQuestionSchema.statics.getForPlayer = function(questionId, playerLang) {
  return this.findById(questionId).then(q => {
    if (!q) return null;
    return q.getInLang(playerLang);
  });
};

/**
 * Check if translation exists for a language
 */
multiLangQuestionSchema.methods.hasLang = function(lang) {
  return this.availableLanguages.includes(lang) && !!this.text[lang];
};

/**
 * Add translation for a language
 */
multiLangQuestionSchema.methods.addTranslation = function(lang, textTranslated, optionsTranslated) {
  this.text[lang] = textTranslated;
  optionsTranslated.forEach((opt, i) => {
    if (this.options[i]) this.options[i][lang] = opt;
  });
  if (!this.availableLanguages.includes(lang)) {
    this.availableLanguages.push(lang);
  }
  this.pendingTranslation = this.pendingTranslation.filter(l => l !== lang);
};

multiLangQuestionSchema.index({ soul: 1, difficulty: 1, isValidated: 1 });
multiLangQuestionSchema.index({ anime: 1 });

module.exports = mongoose.model('MultiLangQuestion', multiLangQuestionSchema);
