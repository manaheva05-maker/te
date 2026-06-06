const { aiJson, aiChat } = require('./ai.service');
const Question = require('../models/Question');

const generateQuestion = async (anime, soul, difficulty = 5, lang = 'fr') => {
  try {
    const data = await aiJson(
      `Tu es une IA experte en anime. Génère une question de quiz sur l'anime "${anime}".\nDifficulté: ${difficulty}/10. Catégorie: ${soul}.\nRéponds UNIQUEMENT en JSON valide:\n{"text_fr":"question fr","text_en":"question en","options_fr":["a","b","c","d"],"options_en":["a","b","c","d"],"correct_index":0,"arc":""}`,
      { maxTokens: 500, systemPrompt: 'Tu réponds uniquement en JSON valide, sans markdown.' }
    );

    const question = new Question({
      text: { fr: data.text_fr, en: data.text_en },
      type: 'classique',
      options: data.options_fr.map((fr, i) => ({ fr, en: data.options_en[i] })),
      correct_index: data.correct_index,
      anime,
      arc: data.arc || '',
      category: soul,
      soul,
      difficulty,
      isAIGenerated: true,
      isValidated: false,
    });

    await question.save();
    return question;
  } catch (err) {
    console.error('Sensei AI error:', err.message);
    return null;
  }
};

const judgeDebate = async (question, userArgument, lang = 'fr') => {
  try {
    return await aiJson(
      `Question anime: "${question.text[lang]}"\nRéponse correcte index: ${question.correct_index}\nArgument joueur: "${userArgument}"\nL'argument est-il valide du point de vue lore anime?\nJSON uniquement: {"valid":true/false,"reason":"explication courte"}`,
      { maxTokens: 200 }
    );
  } catch {
    return { valid: false, reason: 'Erreur évaluation' };
  }
};

const moderateChat = async (message) => {
  const bannedWords = ['spam','insulte','hack','cheat','hack'];
  return bannedWords.some(w => message.toLowerCase().includes(w));
};

const calibrateQuestions = async () => {
  const questions = await Question.find({ times_asked: { $gte: 10 } });
  for (const q of questions) {
    if (q.success_rate < 0.2 && q.difficulty < 10) {
      await Question.findByIdAndUpdate(q._id, { $inc: { difficulty: 1 } });
    } else if (q.success_rate > 0.95 && q.difficulty > 1) {
      await Question.findByIdAndUpdate(q._id, { $inc: { difficulty: -1 } });
    }
  }
};

module.exports = { generateQuestion, judgeDebate, moderateChat, calibrateQuestions };
