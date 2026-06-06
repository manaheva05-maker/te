const PROVIDERS = [
  {
    name: 'anthropic',
    envKey: ['ANTHROPIC_API_KEY', 'CLAUDE_API_KEY'],
    models: { default: 'claude-sonnet-4-20250514', fast: 'claude-haiku-4-5-20251001' },
    async call(apiKey, messages, maxTokens, systemPrompt) {
      const { default: Anthropic } = await import('@anthropic-ai/sdk');
      const client = new Anthropic({ apiKey });
      const params = { model: this.models.default, max_tokens: maxTokens, messages };
      if (systemPrompt) params.system = systemPrompt;
      const res = await client.messages.create(params);
      return res.content[0].text;
    }
  },
  {
    name: 'openai',
    envKey: ['OPENAI_API_KEY'],
    models: { default: 'gpt-4o-mini', fast: 'gpt-4o-mini' },
    async call(apiKey, messages, maxTokens, systemPrompt) {
      const msgs = systemPrompt ? [{ role: 'system', content: systemPrompt }, ...messages] : messages;
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: this.models.default, messages: msgs, max_tokens: maxTokens })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || 'OpenAI error');
      return data.choices[0].message.content;
    }
  },
  {
    name: 'groq',
    envKey: ['GROQ_API_KEY'],
    models: { default: 'llama-3.3-70b-versatile', fast: 'llama-3.1-8b-instant' },
    async call(apiKey, messages, maxTokens, systemPrompt) {
      const msgs = systemPrompt ? [{ role: 'system', content: systemPrompt }, ...messages] : messages;
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: this.models.default, messages: msgs, max_tokens: maxTokens })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || 'Groq error');
      return data.choices[0].message.content;
    }
  },
  {
    name: 'gemini',
    envKey: ['GEMINI_API_KEY'],
    models: { default: 'gemini-1.5-flash', fast: 'gemini-1.5-flash-8b' },
    async call(apiKey, messages, maxTokens, systemPrompt) {
      const contents = messages.map(m => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] }));
      const body = { contents, generationConfig: { maxOutputTokens: maxTokens } };
      if (systemPrompt) body.systemInstruction = { parts: [{ text: systemPrompt }] };
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${this.models.default}:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || 'Gemini error');
      return data.candidates[0].content.parts[0].text;
    }
  },
  {
    name: 'openrouter',
    envKey: ['OPENROUTER_API_KEY'],
    models: { default: 'meta-llama/llama-3.3-70b-instruct:free', fast: 'meta-llama/llama-3.1-8b-instruct:free' },
    async call(apiKey, messages, maxTokens, systemPrompt) {
      const msgs = systemPrompt ? [{ role: 'system', content: systemPrompt }, ...messages] : messages;
      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://shinken.app',
          'X-Title': 'SHINKEN'
        },
        body: JSON.stringify({ model: this.models.default, messages: msgs, max_tokens: maxTokens })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || 'OpenRouter error');
      return data.choices[0].message.content;
    }
  }
];

const getAvailableProvider = () => {
  for (const provider of PROVIDERS) {
    for (const envKey of provider.envKey) {
      const key = process.env[envKey];
      if (key && key.length > 10) {
        return { provider, apiKey: key };
      }
    }
  }
  return null;
};

const aiChat = async (messages, { maxTokens = 1000, systemPrompt = null } = {}) => {
  const found = getAvailableProvider();
  if (!found) throw new Error('Aucun provider IA configuré dans les variables ENV');

  try {
    const text = await found.provider.call(found.apiKey, messages, maxTokens, systemPrompt);
    return { text, provider: found.provider.name };
  } catch (err) {
    const idx = PROVIDERS.indexOf(found.provider);
    for (let i = idx + 1; i < PROVIDERS.length; i++) {
      for (const envKey of PROVIDERS[i].envKey) {
        const key = process.env[envKey];
        if (key && key.length > 10) {
          try {
            const text = await PROVIDERS[i].call(key, messages, maxTokens, systemPrompt);
            return { text, provider: PROVIDERS[i].name };
          } catch {}
        }
      }
    }
    throw err;
  }
};

const aiJson = async (prompt, { maxTokens = 500, systemPrompt = null } = {}) => {
  const { text } = await aiChat([{ role: 'user', content: prompt }], { maxTokens, systemPrompt });
  const clean = text.replace(/```json|```/g, '').trim();
  return JSON.parse(clean);
};

const getProviderInfo = () => {
  const found = getAvailableProvider();
  return found ? { name: found.provider.name, model: found.provider.models.default } : null;
};

module.exports = { aiChat, aiJson, getProviderInfo };
