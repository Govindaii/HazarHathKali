/*
 * HazarHathKali: AI providers.
 * Every provider streams a reply: stream({key, model, system, messages, signal, onText}) -> full text.
 * Keys are sent only to the provider's own API, straight from the browser.
 */
(function () {
  'use strict';

  class ProviderError extends Error {
    constructor(kind, message, status, partial) {
      super(message);
      this.kind = kind; // auth | rate | model | server | network | blocked | empty | bad | unavailable
      this.status = status || null;
      this.partial = partial || '';
    }
  }

  async function doFetch(url, opts) {
    try {
      return await fetch(url, opts);
    } catch (e) {
      if (e && e.name === 'AbortError') throw e;
      throw new ProviderError('network', (e && e.message) || 'Network error');
    }
  }

  async function httpError(res, provider) {
    let msg = '';
    try {
      const j = await res.json();
      const err = Array.isArray(j) ? j[0] && j[0].error : j.error;
      msg = (err && (err.message || err.type)) || j.message || '';
    } catch (e) {
      /* body was not JSON */
    }
    const s = res.status;
    let kind = 'bad';
    if (s === 401 || s === 403) kind = 'auth';
    else if (s === 429) kind = 'rate';
    else if (s === 404) kind = 'model';
    else if (s >= 500) kind = 'server';
    if (provider === 'gemini' && s === 400 && /api key/i.test(msg)) kind = 'auth';
    return new ProviderError(kind, msg || 'HTTP ' + s, s);
  }

  // Reads a Server-Sent Events body and hands each parsed `data:` JSON object to onData.
  async function readSSE(res, onData) {
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buf = '';
    const handleLine = (raw) => {
      const line = raw.replace(/\r$/, '');
      if (!line.startsWith('data:')) return;
      const data = line.slice(5).trim();
      if (!data || data === '[DONE]') return;
      let json;
      try {
        json = JSON.parse(data);
      } catch (e) {
        return;
      }
      onData(json);
    };
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });
      let idx;
      while ((idx = buf.indexOf('\n')) >= 0) {
        handleLine(buf.slice(0, idx));
        buf = buf.slice(idx + 1);
      }
    }
    buf += decoder.decode();
    if (buf) handleLine(buf);
  }

  function versionDesc(a, b) {
    const va = (a.match(/\d+(\.\d+)?/) || ['0'])[0];
    const vb = (b.match(/\d+(\.\d+)?/) || ['0'])[0];
    return parseFloat(vb) - parseFloat(va) || a.localeCompare(b);
  }

  const gemini = {
    id: 'gemini',
    label: 'Google Gemini',
    short: 'Gemini',
    needsKey: true,
    note: 'Free key from Google AI Studio. Best place to start.',
    keyUrl: 'https://aistudio.google.com/apikey',
    keyHint: 'Starts with AIza',
    defaultModel: 'gemini-flash-latest',
    async listModels(key, signal) {
      const res = await doFetch('https://generativelanguage.googleapis.com/v1beta/models?pageSize=1000', {
        headers: { 'x-goog-api-key': key },
        signal,
      });
      if (!res.ok) throw await httpError(res, 'gemini');
      const j = await res.json();
      return (j.models || [])
        .filter((m) => (m.supportedGenerationMethods || []).includes('generateContent'))
        .map((m) => m.name.replace(/^models\//, ''))
        .filter((id) => /^gemini/.test(id) && !/(tts|image|live|audio|embed|vision|robotics|computer-use|native)/.test(id));
    },
    pickModel(ids) {
      if (ids.includes('gemini-flash-latest')) return 'gemini-flash-latest';
      const stable = ids.filter((i) => /flash/.test(i) && !/lite|preview|exp/.test(i)).sort(versionDesc);
      return stable[0] || ids.find((i) => /flash/.test(i)) || ids[0] || gemini.defaultModel;
    },
    async stream({ key, model, system, messages, signal, onText }) {
      const url =
        'https://generativelanguage.googleapis.com/v1beta/models/' +
        encodeURIComponent(model) +
        ':streamGenerateContent?alt=sse';
      const body = {
        systemInstruction: { parts: [{ text: system }] },
        contents: messages.map((m) => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] })),
      };
      const res = await doFetch(url, {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-goog-api-key': key },
        body: JSON.stringify(body),
        signal,
      });
      if (!res.ok) throw await httpError(res, 'gemini');
      let text = '';
      let blocked = '';
      await readSSE(res, (j) => {
        if (j.error) throw new ProviderError('server', j.error.message || 'Stream error', null, text);
        if (j.promptFeedback && j.promptFeedback.blockReason) blocked = j.promptFeedback.blockReason;
        const c = j.candidates && j.candidates[0];
        if (!c) return;
        for (const p of (c.content && c.content.parts) || []) {
          if (p.text && !p.thought) {
            text += p.text;
            onText(text);
          }
        }
        if (c.finishReason && /SAFETY|BLOCKLIST|PROHIBITED|SPII/.test(c.finishReason)) blocked = c.finishReason;
      });
      if (!text) {
        throw blocked
          ? new ProviderError('blocked', 'Gemini held back this reply (' + blocked + ').')
          : new ProviderError('empty', 'No reply came back.');
      }
      return text;
    },
  };

  function anthropicHeaders(key) {
    return {
      'content-type': 'application/json',
      'x-api-key': key,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    };
  }

  const anthropic = {
    id: 'anthropic',
    label: 'Anthropic Claude',
    short: 'Claude',
    needsKey: true,
    note: 'Pay-as-you-go key from the Claude Console.',
    keyUrl: 'https://console.anthropic.com/settings/keys',
    keyHint: 'Starts with sk-ant-',
    defaultModel: 'claude-sonnet-5',
    async listModels(key, signal) {
      const res = await doFetch('https://api.anthropic.com/v1/models?limit=100', { headers: anthropicHeaders(key), signal });
      if (!res.ok) throw await httpError(res, 'anthropic');
      const j = await res.json();
      return (j.data || []).map((m) => m.id);
    },
    pickModel(ids) {
      if (ids.includes(anthropic.defaultModel)) return anthropic.defaultModel;
      return ids.find((i) => /sonnet/.test(i)) || ids[0] || anthropic.defaultModel;
    },
    async stream({ key, model, system, messages, signal, onText }) {
      const res = await doFetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: anthropicHeaders(key),
        body: JSON.stringify({
          model,
          max_tokens: 1024,
          system,
          messages: messages.map((m) => ({ role: m.role, content: m.content })),
          stream: true,
        }),
        signal,
      });
      if (!res.ok) throw await httpError(res, 'anthropic');
      let text = '';
      await readSSE(res, (j) => {
        if (j.type === 'error') {
          const kind = j.error && j.error.type === 'overloaded_error' ? 'server' : 'bad';
          throw new ProviderError(kind, (j.error && j.error.message) || 'Stream error', null, text);
        }
        if (j.type === 'content_block_delta' && j.delta && j.delta.type === 'text_delta') {
          text += j.delta.text;
          onText(text);
        }
      });
      if (!text) throw new ProviderError('empty', 'No reply came back.');
      return text;
    },
  };

  const openai = {
    id: 'openai',
    label: 'OpenAI',
    short: 'OpenAI',
    needsKey: true,
    note: 'Pay-as-you-go key from the OpenAI platform.',
    keyUrl: 'https://platform.openai.com/api-keys',
    keyHint: 'Starts with sk-',
    defaultModel: 'gpt-5-mini',
    async listModels(key, signal) {
      const res = await doFetch('https://api.openai.com/v1/models', {
        headers: { authorization: 'Bearer ' + key },
        signal,
      });
      if (!res.ok) throw await httpError(res, 'openai');
      const j = await res.json();
      return (j.data || [])
        .map((m) => m.id)
        .filter((id) => /^(gpt-|o\d|chatgpt)/.test(id))
        .filter((id) => !/(audio|realtime|tts|transcribe|image|search|embedding|instruct|codex|moderation|\d{4}-\d{2}-\d{2})/.test(id))
        .sort(versionDesc);
    },
    pickModel(ids) {
      for (const pref of [openai.defaultModel, 'gpt-4.1-mini', 'gpt-4o-mini']) if (ids.includes(pref)) return pref;
      return ids.find((i) => /mini/.test(i)) || ids[0] || openai.defaultModel;
    },
    async stream({ key, model, system, messages, signal, onText }) {
      const res = await doFetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'content-type': 'application/json', authorization: 'Bearer ' + key },
        body: JSON.stringify({
          model,
          stream: true,
          messages: [{ role: 'system', content: system }].concat(
            messages.map((m) => ({ role: m.role, content: m.content }))
          ),
        }),
        signal,
      });
      if (!res.ok) throw await httpError(res, 'openai');
      let text = '';
      await readSSE(res, (j) => {
        if (j.error) throw new ProviderError('server', j.error.message || 'Stream error', null, text);
        const d = j.choices && j.choices[0] && j.choices[0].delta;
        if (d && typeof d.content === 'string' && d.content) {
          text += d.content;
          onText(text);
        }
      });
      if (!text) throw new ProviderError('empty', 'No reply came back.');
      return text;
    },
  };

  // Only available when the page runs as an Artifact inside claude.ai (uses the viewer's Claude account).
  const SAMPLE_KIND = {
    not_granted: 'unavailable', sampling_disabled: 'unavailable', not_declared: 'unavailable',
    capability_disabled: 'unavailable', capability_removed: 'unavailable',
    rate_limited: 'rate', session_expired: 'auth', refused: 'blocked', empty_completion: 'empty',
  };
  const builtin = {
    id: 'builtin',
    label: 'Claude, built in',
    short: 'Claude',
    needsKey: false,
    note: 'Uses your own Claude account inside claude.ai. No key needed.',
    defaultModel: 'claude.ai',
    sample: null,
    async stream({ system, messages, signal, onText }) {
      if (!builtin.sample) throw new ProviderError('unavailable', 'Built-in Claude is not available here.');
      const turns = [
        { role: 'user', content: 'Play this role for the whole conversation. Your instructions:\n\n' + system + '\n\nThe conversation starts now.' },
      ].concat(messages);
      try {
        const r = await builtin.sample(turns, {
          cache: false,
          modelTier: 'quick',
          signal,
          onText: (u) => onText(u.text),
        });
        return r.text;
      } catch (e) {
        if (e && e.code === 'cancelled') {
          const err = new DOMException('Stopped', 'AbortError');
          err.partial = e.text || '';
          throw err;
        }
        throw new ProviderError(SAMPLE_KIND[e && e.code] || 'server', (e && e.message) || 'Claude could not answer.', null, e && e.text);
      }
    },
  };

  window.HHK = Object.assign(window.HHK || {}, {
    ProviderError,
    providers: { gemini, anthropic, openai, builtin },
    providerOrder: ['gemini', 'anthropic', 'openai', 'builtin'],
  });
})();
