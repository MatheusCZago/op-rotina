/* ===== OP% · estado, persistência (db do artefato + localStorage) ===== */
var Store = (function () {
  var LS = 'opx:v1', CLIENT = Math.random().toString(36).slice(2, 10);
  var S = null, localT = {}, dirty = {}, remoteIds = {}, col = null, timer = null, sync = 'local', listeners = [], undoBox = null, busy = false;

  var todayISO = function () { var d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
  var clone = function (o) { return JSON.parse(JSON.stringify(o)); };
  var emit = function (kind) { listeners.forEach(function (f) { try { f(kind || 'data'); } catch (e) { console.error(e); } }); };

  function norm(x) {                                         // completa campos que faltarem (backup antigo / importação)
    var b = OPD.baseCfg(x && x.cfg && x.cfg.inicio || todayISO());
    x = x || {}; x.cfg = Object.assign(b, x.cfg || {});
    ['status', 'pri', 'notas', 'niveis'].forEach(function (k) { if (!x.cfg[k] || !x.cfg[k].length) x.cfg[k] = b[k]; });
    x.cfg.cats = x.cfg.cats || [];
    x.rot = (x.rot || []).map(function (r) { return Object.assign({ id: OPD.newId(), de: x.cfg.inicio, ate: '', fixo: false, pri: '', dias: [0, 0, 0, 0, 0, 0, 0] }, r); });
    x.reg = x.reg || {}; x.chk = x.chk || {}; x.metas = x.metas || []; x.rev = x.rev || {}; x.folgas = x.folgas || {};
    return x;
  }
  function shardIds(s) {
    var ids = { cfg: 1, rev: 1 };
    Object.keys(s.reg).concat(Object.keys(s.chk)).forEach(function (k) { ids['m-' + k.slice(0, 7)] = 1; });
    return Object.keys(ids);
  }
  function shardData(id) {
    if (id === 'cfg') return { cfg: S.cfg, rot: S.rot, metas: S.metas, folgas: S.folgas };
    if (id === 'rev') return { rev: S.rev };
    var ym = id.slice(2), reg = {}, chk = {};
    Object.keys(S.reg).forEach(function (k) { if (k.slice(0, 7) === ym) reg[k] = S.reg[k]; });
    Object.keys(S.chk).forEach(function (k) { if (k.slice(0, 7) === ym) chk[k] = S.chk[k]; });
    return { reg: reg, chk: chk };
  }
  function applyShard(id, d) {
    if (id === 'cfg') { S.cfg = Object.assign(OPD.baseCfg(d.cfg && d.cfg.inicio || todayISO()), d.cfg || {}); S.rot = d.rot || []; S.metas = d.metas || []; S.folgas = d.folgas || {}; norm(S); }
    else if (id === 'rev') { S.rev = d.rev || {}; }
    else {
      var ym = id.slice(2);
      Object.keys(S.reg).forEach(function (k) { if (k.slice(0, 7) === ym) delete S.reg[k]; });
      Object.keys(S.chk).forEach(function (k) { if (k.slice(0, 7) === ym) delete S.chk[k]; });
      Object.assign(S.reg, d.reg || {}); Object.assign(S.chk, d.chk || {});
    }
  }
  function persistLocal() {
    try { localStorage.setItem(LS, JSON.stringify({ v: 1, t: localT, state: S })); } catch (e) { /* sem armazenamento local */ }
  }
  function loadLocal() {
    try {
      var raw = localStorage.getItem(LS); if (!raw) return false;
      var o = JSON.parse(raw); if (!o || !o.state) return false;
      S = norm(o.state); localT = o.t || {}; return true;
    } catch (e) { return false; }
  }
  function touch(ids) {
    var now = Date.now();
    ids.forEach(function (id) { localT[id] = now; dirty[id] = 1; });
    persistLocal(); scheduleFlush();
  }
  function scheduleFlush() { if (!col) return; sync = 'wait'; emit('sync'); clearTimeout(timer); timer = setTimeout(flush, 700); }
  async function flush() {
    if (!col || busy) { if (busy) timer = setTimeout(flush, 500); return; }
    busy = true;
    try {
      var ids = Object.keys(dirty);
      for (var i = 0; i < ids.length; i++) {
        var id = ids[i], t = localT[id];
        var body = Object.assign({}, shardData(id), { _t: t, _by: CLIENT });
        await col.doc(id).set(body);
        remoteIds[id] = 1;
        if (localT[id] === t) delete dirty[id];
      }
      sync = Object.keys(dirty).length ? 'wait' : 'ok';
    } catch (e) {
      sync = (e && e.code === 'quota_exceeded') ? 'cheio' : 'erro';
      clearTimeout(timer); timer = setTimeout(flush, 8000);
    }
    busy = false; emit('sync');
  }
  async function connect() {
    var cl = window.claude;
    if (STANDALONE || !cl || !cl.use) return false;
    try {
      var r = await Promise.all([cl.use('db'), cl.use('user')]);
      var db = r[0], user = r[1]; if (!db || !user) return false;
      var uid = await user.id(); if (!uid) return false;
      col = db.collection('data/users/' + uid);
    } catch (e) { return false; }
    sync = 'wait'; emit('sync');
    await new Promise(function (resolve) {
      var first = true, guard = setTimeout(function () { if (first) { first = false; resolve(); } }, 6000);
      try {
        col.onSnapshot(function (snap) {
          var changed = false, remote = {};
          snap.docs.forEach(function (d) { if (d.exists) remote[d.id] = d.data(); });
          remoteIds = {}; Object.keys(remote).forEach(function (id) { remoteIds[id] = 1; });
          var hadLocal = !!S;
          if (!S && Object.keys(remote).length) S = norm({});
          Object.keys(remote).forEach(function (id) {
            var d = remote[id], rt = d._t || 0, lt = localT[id] || 0;
            if (d._by === CLIENT && hadLocal && !first) return;               // eco da própria gravação
            if (rt > lt) { applyShard(id, d); localT[id] = rt; changed = true; delete dirty[id]; }
            else if (lt > rt && !dirty[id]) dirty[id] = 1;
          });
          if (first && S) { shardIds(S).forEach(function (id) { if (!remote[id] && !dirty[id]) dirty[id] = 1; if (!localT[id]) localT[id] = Date.now(); }); }
          if (changed) persistLocal();
          if (Object.keys(dirty).length) { clearTimeout(timer); timer = setTimeout(flush, 300); } else sync = 'ok';
          if (first) { first = false; clearTimeout(guard); resolve(); }
          else if (changed) emit('remote');
        }, function () { sync = 'erro'; if (first) { first = false; resolve(); } emit('sync'); });
      } catch (e) { first = false; resolve(); }
    });
    return true;
  }
  async function pruneRemote() {
    if (!col) return;
    var keep = {}; shardIds(S).forEach(function (id) { keep[id] = 1; });
    var gone = Object.keys(remoteIds).filter(function (id) { return !keep[id]; });
    for (var i = 0; i < gone.length; i++) { try { await col.doc(gone[i]).delete(); delete remoteIds[gone[i]]; } catch (e) { /* ignora */ } }
  }

  var api = {
    CLIENT: CLIENT, todayISO: todayISO,
    get: function () { return S; },
    has: function () { return !!S; },
    syncState: function () { return col ? sync : 'local'; },
    on: function (f) { listeners.push(f); },
    initLocal: function () { return loadLocal(); },
    connect: connect,
    flushNow: flush,
    /* altera o estado e grava os blocos afetados */
    mutate: function (fn, ids) { fn(S); touch(ids || ['cfg']); emit(); },
    dateShard: function (iso) { return 'm-' + iso.slice(0, 7); },
    /* desfazer: guarda uma cópia antes de uma ação destrutiva */
    checkpoint: function () { undoBox = { s: clone(S), t: Object.assign({}, localT) }; },
    undo: function () {
      if (!undoBox) return false;
      var before = shardIds(S).concat(shardIds(undoBox.s));
      S = undoBox.s; undoBox = null; touch(before.filter(function (v, i, a) { return a.indexOf(v) === i; })); emit(); return true;
    },
    replaceAll: async function (ns) {
      S = norm(ns); var ids = shardIds(S); localT = {}; dirty = {};
      touch(ids); emit(); await pruneRemote();
    },
    wipe: async function () {
      var ids = Object.keys(remoteIds); S = null; localT = {}; dirty = {};
      try { localStorage.removeItem(LS); } catch (e) { /* ok */ }
      if (col) for (var i = 0; i < ids.length; i++) { try { await col.doc(ids[i]).delete(); } catch (e) { /* ignora */ } }
      remoteIds = {}; emit();
    },
    start: function (ns) { S = norm(ns); var ids = shardIds(S); localT = {}; touch(ids); emit(); },
    norm: norm, shardIds: shardIds
  };
  return api;
})();
