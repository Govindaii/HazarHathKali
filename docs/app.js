/*
 * HazarHathKali web UI.
 * The Devi canvas, the hand finder, the chat drawer and the API key dialog.
 */
(function () {
  'use strict';

  const { HANDS, CATEGORIES, buildSystemPrompt, greeting, providers, providerOrder } = window.HHK;
  const $ = (id) => document.getElementById(id);
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const inArtifact = !!(window.claude && typeof window.claude.use === 'function');

  // ---------- Storage (every access may throw in private modes) ----------
  function read(storage, key, fallback) {
    try {
      const v = window[storage].getItem(key);
      return v == null ? fallback : JSON.parse(v);
    } catch (e) {
      return fallback;
    }
  }
  function write(storage, key, value) {
    try {
      if (value === undefined) window[storage].removeItem(key);
      else window[storage].setItem(key, JSON.stringify(value));
    } catch (e) {
      /* storage unavailable: keep it in memory only */
    }
  }

  // ---------- State ----------
  const state = {
    realm: 'all',
    query: '',
    shown: 80,
    visited: new Set(read('localStorage', 'hhk:visited', [])),
    active: null,
    msgs: [],
    busy: false,
    ctl: null,
    pending: '',
    conn: read('localStorage', 'hhk:conn', null) || read('sessionStorage', 'hhk:conn', null),
    builtinReady: false,
    matchSet: null,
  };
  if (state.conn && (!providers[state.conn.provider] || state.conn.provider === 'builtin')) state.conn = null;

  function colorOf(h, dl) {
    const [hue, sat, light] = h.cat.hsl;
    return `hsl(${hue} ${sat}% ${light + (dl || 0)}%)`;
  }
  function catColor(cat) {
    const [hue, sat, light] = cat.hsl;
    return `hsl(${hue} ${sat}% ${light}%)`;
  }

  // ---------- Markdown (escaped first, then a small safe subset) ----------
  function esc(s) {
    return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  }
  function inline(s) {
    return esc(s)
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/(^|[^*\w])\*(?!\s)([^*]+?)\*(?!\w)/g, '$1<em>$2</em>')
      .replace(/`([^`]+)`/g, '<code>$1</code>');
  }
  function md(src) {
    let html = '';
    let para = [];
    let list = null;
    const flushPara = () => {
      if (para.length) html += '<p>' + para.map(inline).join('<br>') + '</p>';
      para = [];
    };
    const flushList = () => {
      if (list) html += `<${list.t}>` + list.items.map((i) => '<li>' + inline(i) + '</li>').join('') + `</${list.t}>`;
      list = null;
    };
    for (const raw of src.replace(/\r/g, '').split('\n')) {
      const line = raw.trimEnd();
      let m;
      if (!line.trim()) {
        flushPara();
        flushList();
      } else if ((m = line.match(/^\s*[-*•]\s+(.*)$/))) {
        flushPara();
        if (!list || list.t !== 'ul') { flushList(); list = { t: 'ul', items: [] }; }
        list.items.push(m[1]);
      } else if ((m = line.match(/^\s*\d+[.)]\s+(.*)$/))) {
        flushPara();
        if (!list || list.t !== 'ol') { flushList(); list = { t: 'ol', items: [] }; }
        list.items.push(m[1]);
      } else if ((m = line.match(/^#{1,6}\s+(.*)$/))) {
        flushPara();
        flushList();
        html += '<p><strong>' + inline(m[1]) + '</strong></p>';
      } else {
        flushList();
        para.push(line);
      }
    }
    flushPara();
    flushList();
    return html;
  }

  // ---------- The Devi and her thousand hands (drawn in devi.js) ----------
  const deviCanvas = $('devi');
  const devi = window.HHK.createDevi(deviCanvas, {
    count: HANDS.length,
    sectors: CATEGORIES.length,
    colorOf: (i) => colorOf(HANDS[i]),
    isOn: (i) => !state.matchSet || state.matchSet.has(HANDS[i].n),
    isMet: (i) => state.visited.has(HANDS[i].n),
    activeIndex: () => (state.active ? state.active.n - 1 : -1),
    reduceMotion,
  });

  // ---------- Stage interactions ----------
  const stage = $('stage');
  const tip = $('tip');
  let lastPointer = 'mouse';

  function stageXY(e) {
    const r = deviCanvas.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }

  deviCanvas.addEventListener('pointerdown', (e) => { lastPointer = e.pointerType || 'mouse'; });
  deviCanvas.addEventListener('pointermove', (e) => {
    if (e.pointerType && e.pointerType !== 'mouse') return;
    const { x, y } = stageXY(e);
    const hit = devi.pick(x, y, false);
    const idx = typeof hit === 'number' ? hit : -1;
    devi.setHover(idx, hit === 'devi');
    deviCanvas.classList.toggle('is-pointing', hit !== -1);
    if (hit === -1) {
      tip.hidden = true;
      return;
    }
    tip.textContent = '';
    const strong = document.createElement('strong');
    const meta = document.createElement('span');
    if (hit === 'devi') {
      strong.textContent = 'Hazar Hath Kali';
      meta.textContent = 'Tap the Devi for a random hand';
    } else {
      const hand = HANDS[idx];
      strong.textContent = hand.name;
      meta.textContent = `Hand ${hand.n} · ${hand.voice.en} · ${hand.cat.en}`;
    }
    tip.append(strong, meta);
    tip.hidden = false;
    const sr = stage.getBoundingClientRect();
    const tx = Math.min(x + 16, sr.width - tip.offsetWidth - 8);
    const ty = y + 16 + tip.offsetHeight > sr.height ? y - tip.offsetHeight - 12 : y + 16;
    tip.style.left = Math.max(8, tx) + 'px';
    tip.style.top = Math.max(8, ty) + 'px';
  });
  deviCanvas.addEventListener('pointerleave', () => {
    devi.setHover(-1, false);
    tip.hidden = true;
  });
  deviCanvas.addEventListener('click', (e) => {
    const { x, y } = stageXY(e);
    const hit = devi.pick(x, y, lastPointer !== 'mouse');
    tip.hidden = true;
    if (hit === 'devi') openRandom();
    else if (hit >= 0) openChat(HANDS[hit]);
  });

  if (window.ResizeObserver) new ResizeObserver(() => devi.resize()).observe(stage);
  else window.addEventListener('resize', () => devi.resize());

  // ---------- Finder: realms, search and list ----------
  const realmsEl = $('realms');
  const listEl = $('handList');

  function renderRealms() {
    realmsEl.textContent = '';
    const make = (id, label, color, count) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'realm' + (id === 'all' ? ' all' : '');
      b.dataset.realm = id;
      b.setAttribute('aria-pressed', String(state.realm === id));
      const sw = document.createElement('span');
      sw.className = 'realm-swatch';
      sw.style.background = color;
      const name = document.createElement('span');
      name.className = 'realm-name';
      const bl = document.createElement('b');
      bl.textContent = label;
      name.append(bl);
      const c = document.createElement('span');
      c.className = 'realm-count';
      c.textContent = count;
      b.append(sw, name, c);
      realmsEl.append(b);
    };
    make('all', 'All realms', 'conic-gradient(' + CATEGORIES.map((c) => catColor(c)).join(',') + ')', 1000);
    CATEGORIES.forEach((c) => make(c.id, c.en, catColor(c), 100));
  }
  realmsEl.addEventListener('click', (e) => {
    const b = e.target.closest('.realm');
    if (!b) return;
    state.realm = b.dataset.realm;
    state.shown = 80;
    renderRealms();
    applyFilter();
  });

  function matches(h, q) {
    if (!q) return true;
    if (/^\d+$/.test(q)) return String(h.n) === q;
    return (
      h.name.toLowerCase().includes(q) ||
      h.angle.toLowerCase().includes(q) ||
      h.cat.en.toLowerCase().includes(q) ||
      h.voice.en.toLowerCase().includes(q)
    );
  }

  function filteredHands() {
    const q = state.query.trim().toLowerCase();
    return HANDS.filter((h) => (state.realm === 'all' || h.cat.id === state.realm) && matches(h, q));
  }

  function applyFilter() {
    const list = filteredHands();
    state.matchSet = list.length === HANDS.length ? null : new Set(list.map((h) => h.n));
    devi.refresh();
    renderList(list);
  }

  function renderList(list) {
    list = list || filteredHands();
    listEl.textContent = '';
    $('listCount').textContent =
      list.length === HANDS.length ? 'Showing all 1000' : `${list.length} of 1000 hands`;
    if (!list.length) {
      const li = document.createElement('li');
      li.className = 'empty';
      li.textContent = 'No hand matches that. Try a word like calm, chai or courage.';
      listEl.append(li);
    }
    const frag = document.createDocumentFragment();
    list.slice(0, state.shown).forEach((h) => {
      const li = document.createElement('li');
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'hand' + (state.visited.has(h.n) ? ' is-met' : '') + (state.active && state.active.n === h.n ? ' is-active' : '');
      b.dataset.n = h.n;
      const num = document.createElement('span');
      num.className = 'hand-num';
      num.style.background = colorOf(h);
      num.textContent = h.n;
      num.title = 'Hand ' + h.n;
      const text = document.createElement('span');
      text.className = 'hand-text';
      const bn = document.createElement('b');
      bn.textContent = h.name;
      const sm = document.createElement('small');
      sm.textContent = `${h.voice.en} · ${h.cat.en}`;
      text.append(bn, sm);
      b.append(num, text);
      li.append(b);
      frag.append(li);
    });
    listEl.append(frag);
    $('moreBtn').hidden = list.length <= state.shown;
  }
  listEl.addEventListener('click', (e) => {
    const b = e.target.closest('.hand');
    if (b) openChat(HANDS[Number(b.dataset.n) - 1]);
  });
  $('moreBtn').addEventListener('click', () => {
    state.shown += 120;
    renderList();
  });
  let searchTimer = 0;
  $('search').addEventListener('input', (e) => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      state.query = e.target.value;
      state.shown = 80;
      applyFilter();
    }, 120);
  });

  function openRandom() {
    const pool = filteredHands();
    const from = pool.length ? pool : HANDS;
    openChat(from[Math.floor(Math.random() * from.length)]);
  }
  $('randomBtn').addEventListener('click', openRandom);

  function updateStats() {
    $('stageStats').textContent = `1000 hands · ${state.visited.size} met`;
  }

  // ---------- Connection ----------
  function activeProvider() {
    return state.conn ? providers[state.conn.provider] : null;
  }

  function saveConn(conn, remember) {
    state.conn = conn;
    if (conn.provider === 'builtin') {
      write('localStorage', 'hhk:conn', undefined);
      write('sessionStorage', 'hhk:conn', undefined);
    } else if (remember) {
      write('localStorage', 'hhk:conn', conn);
      write('sessionStorage', 'hhk:conn', undefined);
    } else {
      write('sessionStorage', 'hhk:conn', conn);
      write('localStorage', 'hhk:conn', undefined);
    }
    renderConn();
  }

  function renderConn() {
    const p = activeProvider();
    const btn = $('connBtn');
    btn.classList.toggle('is-on', !!p);
    $('connLabel').textContent = p
      ? p.id === 'builtin' ? 'Claude · built in' : `${p.short} · ${state.conn.model}`
      : 'Add API key';
    renderChatFoot();
  }

  function renderChatFoot() {
    const foot = $('chatFoot');
    foot.textContent = '';
    const p = activeProvider();
    foot.append(
      document.createTextNode(
        p ? (p.id === 'builtin' ? 'Replies come from Claude, built in. ' : `Replies come from ${p.label} (${state.conn.model}). `) : 'No AI connected yet. '
      )
    );
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = p ? 'Change' : 'Add API key';
    b.addEventListener('click', () => openKeyDialog());
    foot.append(b);
  }

  // ---------- Key dialog ----------
  const dlg = $('keyDialog');
  const providerList = $('providerList');
  let selected = 'gemini';

  function renderProviders() {
    providerList.textContent = '';
    providerOrder.forEach((id) => {
      const p = providers[id];
      if (id === 'builtin' && !state.builtinReady) return;
      const disabled = inArtifact && p.needsKey;
      const label = document.createElement('label');
      label.className = 'provider' + (disabled ? ' is-disabled' : '');
      const input = document.createElement('input');
      input.type = 'radio';
      input.name = 'provider';
      input.value = id;
      input.id = 'provider-' + id;
      input.checked = id === selected;
      input.disabled = disabled;
      const b = document.createElement('b');
      b.textContent = p.label;
      const sm = document.createElement('small');
      sm.textContent = disabled ? 'Works on the web version, not inside Claude.' : p.note;
      label.append(input, b, sm);
      providerList.append(label);
    });
  }

  function selectProvider(id, fill) {
    selected = id;
    const p = providers[id];
    $('keyFields').hidden = !p.needsKey;
    $('keyNote').textContent = p.needsKey
      ? `Your key stays in this browser. It is sent only to ${p.label}.`
      : 'Uses your Claude account and its usage limits. Nothing else to set up.';
    if (p.needsKey) {
      $('keyLink').href = p.keyUrl;
      $('keyInput').placeholder = p.keyHint;
      const same = state.conn && state.conn.provider === id;
      if (fill) {
        $('keyInput').value = same ? state.conn.key : '';
        $('modelInput').value = same ? state.conn.model : p.defaultModel;
      } else {
        $('modelInput').value = p.defaultModel;
      }
      $('modelList').textContent = '';
    }
    setStatus('');
    $('connectBtn').textContent = p.needsKey ? 'Check key and connect' : 'Use built-in Claude';
  }

  function setStatus(text, kind) {
    const el = $('keyStatus');
    el.textContent = text;
    el.className = 'keys-status' + (kind ? ' is-' + kind : '');
  }

  function openKeyDialog() {
    if (state.conn) selected = state.conn.provider;
    else if (inArtifact && state.builtinReady) selected = 'builtin';
    else if (inArtifact) selected = 'gemini';
    const warn = $('keyWarn');
    warn.hidden = !inArtifact;
    warn.textContent =
      "You're viewing this inside Claude, where outside AI services are blocked. Here the hands talk through your Claude account. To use your own API key, open the web version of HazarHathKali.";
    renderProviders();
    selectProvider(selected, true);
    $('forgetKey').hidden = !(state.conn && state.conn.provider !== 'builtin');
    $('rememberKey').checked = !(state.conn && read('sessionStorage', 'hhk:conn', null));
    if (!dlg.open) dlg.showModal();
    if (providers[selected].needsKey && !$('keyInput').value) $('keyInput').focus();
  }

  providerList.addEventListener('change', (e) => {
    if (e.target.name === 'provider') selectProvider(e.target.value, true);
  });
  $('toggleKey').addEventListener('click', () => {
    const k = $('keyInput');
    const show = k.type === 'password';
    k.type = show ? 'text' : 'password';
    $('toggleKey').textContent = show ? 'Hide' : 'Show';
  });
  $('laterBtn').addEventListener('click', () => {
    state.pending = '';
    dlg.close();
  });
  dlg.addEventListener('cancel', () => {
    state.pending = '';
  });
  $('forgetKey').addEventListener('click', () => {
    write('localStorage', 'hhk:conn', undefined);
    write('sessionStorage', 'hhk:conn', undefined);
    state.conn = null;
    $('keyInput').value = '';
    $('forgetKey').hidden = true;
    renderConn();
    setStatus('Key removed from this device.', 'ok');
  });

  function keyErrorText(e, p) {
    switch (e.kind) {
      case 'auth': return `${p.label} did not accept this key. Check that you copied all of it.`;
      case 'rate': return `${p.label} says this key has hit a limit. Wait a minute, or check the key's quota.`;
      case 'network': return inArtifact
        ? 'Outside AI services are blocked inside Claude. Choose Claude, built in.'
        : `Could not reach ${p.label}. Check your internet connection and try again.`;
      default: return `${p.label} returned an error: ${e.message}`;
    }
  }

  $('keyForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const p = providers[selected];
    if (!p.needsKey) {
      saveConn({ provider: 'builtin', model: 'claude.ai' }, false);
      dlg.close();
      resumePending();
      return;
    }
    const key = $('keyInput').value.trim();
    if (!key) {
      setStatus('Paste your API key first.', 'error');
      $('keyInput').focus();
      return;
    }
    const btn = $('connectBtn');
    btn.disabled = true;
    setStatus('Checking your key…');
    try {
      const ids = await p.listModels(key);
      const dl = $('modelList');
      dl.textContent = '';
      ids.forEach((id) => {
        const o = document.createElement('option');
        o.value = id;
        dl.append(o);
      });
      let model = $('modelInput').value.trim();
      let swapped = false;
      if (!model || (ids.length && !ids.includes(model))) {
        swapped = !!model;
        model = p.pickModel(ids);
      }
      $('modelInput').value = model;
      saveConn({ provider: p.id, key, model }, $('rememberKey').checked);
      setStatus(
        swapped ? `Connected. That model isn't available for this key, so using ${model}.` : `Connected to ${p.label}. The hands can speak now.`,
        'ok'
      );
      $('forgetKey').hidden = false;
      setTimeout(() => {
        if (dlg.open) dlg.close();
        resumePending();
      }, swapped ? 1600 : 700);
    } catch (err) {
      setStatus(keyErrorText(err, p), 'error');
    } finally {
      btn.disabled = false;
    }
  });

  $('connBtn').addEventListener('click', () => openKeyDialog());

  function resumePending() {
    const text = state.pending;
    state.pending = '';
    if (text && state.active) send(text);
  }

  // ---------- Chat ----------
  const chat = $('chat');
  const messagesEl = $('messages');
  const input = $('input');

  function chatKey(n) {
    return 'hhk:chat:' + n;
  }

  function openChat(h) {
    if (state.ctl) state.ctl.abort();
    state.active = h;
    state.msgs = read('localStorage', chatKey(h.n), []);
    if (!state.visited.has(h.n)) {
      state.visited.add(h.n);
      write('localStorage', 'hhk:visited', Array.from(state.visited));
      devi.refresh();
      updateStats();
    }
    const badge = $('chatBadge');
    badge.textContent = h.n;
    badge.style.background = colorOf(h);
    badge.title = 'Hand ' + h.n;
    $('chatName').textContent = h.name;
    $('chatMeta').textContent = `Hand ${h.n} · ${h.voice.en} · ${h.cat.en}`;
    $('promptText').textContent = buildSystemPrompt(h);
    $('promptBox').open = false;
    renderMessages();
    renderChatFoot();
    chat.classList.add('is-open');
    chat.setAttribute('aria-hidden', 'false');
    renderList();
    devi.redraw();
    if (window.matchMedia('(pointer: fine)').matches) setTimeout(() => input.focus(), 50);
  }

  function closeChat() {
    if (state.ctl) state.ctl.abort();
    chat.classList.remove('is-open');
    chat.setAttribute('aria-hidden', 'true');
    state.active = null;
    renderList();
    devi.redraw();
  }
  $('closeChat').addEventListener('click', closeChat);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !dlg.open && chat.classList.contains('is-open')) closeChat();
  });

  function bubble(role, text) {
    const d = document.createElement('div');
    d.className = 'msg ' + (role === 'user' ? 'me' : 'bot');
    if (role === 'user') d.textContent = text;
    else d.innerHTML = md(text);
    messagesEl.append(d);
    return d;
  }

  function renderMessages() {
    messagesEl.textContent = '';
    const h = state.active;
    bubble('assistant', greeting(h));
    state.msgs.forEach((m) => bubble(m.role, m.content));
    renderStarters();
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function renderStarters() {
    const box = $('starters');
    box.textContent = '';
    const h = state.active;
    const talked = state.msgs.some((m) => m.role === 'user');
    box.hidden = talked || !h;
    if (box.hidden) return;
    h.cat.starters.forEach((s) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'starter';
      b.textContent = s;
      b.addEventListener('click', () => send(s));
      box.append(b);
    });
  }

  function nearBottom() {
    return messagesEl.scrollHeight - messagesEl.scrollTop - messagesEl.clientHeight < 80;
  }

  // Merge same-role neighbours, start on a user turn, keep the last 20 turns.
  function apiHistory(msgs) {
    const out = [];
    msgs.forEach((m) => {
      if (!m.content || !m.content.trim()) return;
      const last = out[out.length - 1];
      if (last && last.role === m.role) last.content += '\n\n' + m.content;
      else out.push({ role: m.role, content: m.content });
    });
    let trimmed = out.slice(-20);
    while (trimmed.length && trimmed[0].role !== 'user') trimmed = trimmed.slice(1);
    return trimmed;
  }

  function errorText(e, p) {
    const label = p ? p.label : 'The AI';
    switch (e.kind) {
      case 'auth': return { text: `${label} did not accept your key. It may be mistyped or revoked.`, action: 'Change key' };
      case 'rate': return { text: `${label} says you've hit a usage limit. Wait a minute and try again, or check your plan.`, action: null };
      case 'model': return { text: `The model "${state.conn.model}" isn't available for your key. Pick another one.`, action: 'Change model' };
      case 'network': return inArtifact
        ? { text: 'Inside Claude this page cannot reach outside AI services. Switch to Claude, built in.', action: 'Switch' }
        : { text: `Couldn't reach ${label}. Check your connection and try again.`, action: null };
      case 'blocked': return { text: 'The AI held back this reply. Try saying it another way.', action: null };
      case 'unavailable': return { text: 'Built-in Claude is not available here. Add an API key instead.', action: 'Add key' };
      case 'empty': return { text: 'No reply came back. Try sending again.', action: null };
      default: return { text: `${label} had a problem: ${e.message}`, action: null };
    }
  }

  function showError(e, p) {
    const { text, action } = errorText(e, p);
    const box = document.createElement('div');
    box.className = 'msg-error';
    box.setAttribute('role', 'alert');
    box.append(document.createTextNode(text));
    if (action) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'ghost-btn';
      b.textContent = action;
      b.addEventListener('click', () => openKeyDialog());
      box.append(document.createElement('br'), b);
    }
    messagesEl.append(box);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function setBusy(busy) {
    state.busy = busy;
    $('sendBtn').hidden = busy;
    $('stopBtn').hidden = !busy;
  }

  async function send(raw) {
    const text = (raw || '').trim();
    if (!text || state.busy || !state.active) return;
    const p = activeProvider();
    if (!p) {
      state.pending = text;
      openKeyDialog();
      return;
    }
    const h = state.active;
    const msgs = state.msgs;
    const save = () => write('localStorage', chatKey(h.n), msgs.slice(-60));

    msgs.push({ role: 'user', content: text });
    save();
    bubble('user', text);
    $('starters').hidden = true;
    input.value = '';
    autosize();

    const out = bubble('assistant', '');
    out.classList.add('thinking');
    out.textContent = 'Thinking';
    messagesEl.scrollTop = messagesEl.scrollHeight;

    const ctl = new AbortController();
    state.ctl = ctl;
    setBusy(true);
    let partial = '';
    let frame = 0;
    const paint = () => {
      frame = 0;
      const stick = nearBottom();
      out.classList.remove('thinking');
      out.innerHTML = md(partial);
      if (stick) messagesEl.scrollTop = messagesEl.scrollHeight;
    };
    try {
      const full = await p.stream({
        key: state.conn.key,
        model: state.conn.model,
        system: buildSystemPrompt(h),
        messages: apiHistory(msgs),
        signal: ctl.signal,
        onText: (t) => {
          partial = t;
          if (!frame) frame = requestAnimationFrame(paint);
        },
      });
      partial = full;
      if (frame) cancelAnimationFrame(frame);
      paint();
      msgs.push({ role: 'assistant', content: full });
      save();
    } catch (e) {
      if (frame) cancelAnimationFrame(frame);
      const kept = partial || (e && e.partial) || '';
      if (kept) {
        partial = kept;
        paint();
        msgs.push({ role: 'assistant', content: kept });
        save();
      } else {
        out.remove();
      }
      const stillHere = state.active === h;
      if (e && e.name === 'AbortError') {
        if (kept && stillHere) {
          const note = document.createElement('div');
          note.className = 'msg-note';
          note.textContent = 'Stopped';
          out.append(note);
        }
      } else if (stillHere) {
        showError(e || {}, p);
      }
    } finally {
      if (state.ctl === ctl) state.ctl = null;
      setBusy(false);
    }
  }

  function autosize() {
    input.style.height = 'auto';
    input.style.height = Math.min(input.scrollHeight, 160) + 'px';
  }
  input.addEventListener('input', autosize);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) {
      e.preventDefault();
      send(input.value);
    }
  });
  $('composer').addEventListener('submit', (e) => {
    e.preventDefault();
    send(input.value);
  });
  $('stopBtn').addEventListener('click', () => {
    if (state.ctl) state.ctl.abort();
  });
  $('clearChat').addEventListener('click', () => {
    if (!state.active || state.busy) return;
    state.msgs = [];
    write('localStorage', chatKey(state.active.n), undefined);
    renderMessages();
    $('promptBox').open = false;
  });
  $('copyPrompt').addEventListener('click', () => {
    const text = $('promptText').textContent;
    const btn = $('copyPrompt');
    const done = () => {
      btn.textContent = 'Copied';
      setTimeout(() => { btn.textContent = 'Copy prompt'; }, 1500);
    };
    try {
      navigator.clipboard.writeText(text).then(done, () => selectPrompt());
    } catch (e) {
      selectPrompt();
    }
  });
  function selectPrompt() {
    const range = document.createRange();
    range.selectNodeContents($('promptText'));
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
  }

  // ---------- Start ----------
  renderRealms();
  renderList();
  renderConn();
  updateStats();
  devi.resize();

  if (inArtifact) {
    window.claude.use('sample').then((sample) => {
      if (!sample) return;
      providers.builtin.sample = sample;
      state.builtinReady = true;
      if (!state.conn) {
        state.conn = { provider: 'builtin', model: 'claude.ai' };
        renderConn();
      }
      if (dlg.open) {
        if (selected !== 'builtin' && state.conn.provider === 'builtin') selected = 'builtin';
        renderProviders();
        selectProvider(selected, true);
      }
    }, () => {});
  }

  // Ask for a key on first visit (once per browser session).
  if (!state.conn && !read('sessionStorage', 'hhk:asked', false)) {
    write('sessionStorage', 'hhk:asked', true);
    setTimeout(() => {
      if (!dlg.open) openKeyDialog();
    }, reduceMotion ? 0 : 900);
  }
})();
