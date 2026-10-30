/* ===== OP% · utilidades de interface ===== */
var $ = function (s, r) { return (r || document).querySelector(s); };
var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
var F = {
  pct: function (v) { return v == null ? '—' : Math.round(v * 100) + '%'; },
  dec: function (v, d) { d = d == null ? 1 : d; return v == null ? '—' : (+v).toLocaleString('pt-BR', { minimumFractionDigits: d, maximumFractionDigits: d }); },
  int: function (v) { return v == null ? '—' : Math.round(v).toLocaleString('pt-BR'); },
  h: function (v) { return v == null ? '—' : (v < 1 && v > 0 ? Math.round(v * 60) + ' min' : F.dec(v, 1) + ' h'); },
  min: function (m) { m = Math.round(m); return m < 60 ? m + ' min' : Math.floor(m / 60) + 'h' + (m % 60 ? String(m % 60).padStart(2, '0') : ''); },
  dm: function (iso) { return iso.slice(8, 10) + '/' + iso.slice(5, 7); },
  dmy: function (iso) { return iso.slice(8, 10) + '/' + iso.slice(5, 7) + '/' + iso.slice(0, 4); },
  long: function (iso) { return new Date(OPX.toN(iso) * 86400000).toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' }); },
  mes: function (iso) { return new Date(OPX.toN(iso) * 86400000).toLocaleDateString('pt-BR', { month: 'short', timeZone: 'UTC' }).replace('.', ''); },
  cap: function (s) { return s.charAt(0).toUpperCase() + s.slice(1); }
};
var ICON = {
  check: '<path d="M20 6 9 17l-5-5"/>', x: '<path d="M18 6 6 18M6 6l12 12"/>', plus: '<path d="M12 5v14M5 12h14"/>',
  chevL: '<path d="m15 18-6-6 6-6"/>', chevR: '<path d="m9 18 6-6-6-6"/>', chevD: '<path d="m6 9 6 6 6-6"/>',
  more: '<circle cx="5" cy="12" r="1.3" fill="currentColor"/><circle cx="12" cy="12" r="1.3" fill="currentColor"/><circle cx="19" cy="12" r="1.3" fill="currentColor"/>',
  trash: '<path d="M4 7h16M9 7V4.5h6V7M6.5 7l1 13h9l1-13"/>', edit: '<path d="M4 20h4L19.5 8.5l-4-4L4 16v4zM13.5 6.5l4 4"/>',
  hoje: '<circle cx="12" cy="12" r="9"/><path d="m8 12.5 2.8 2.8L16 9.5"/>',
  semana: '<rect x="3.5" y="5" width="17" height="15" rx="2.5"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
  painel: '<path d="M5 20V10M12 20V4M19 20v-7"/>', metas: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.2" fill="currentColor"/>',
  rotina: '<path d="M8 6h12M8 12h12M8 18h12"/><circle cx="4" cy="6" r="1" fill="currentColor"/><circle cx="4" cy="12" r="1" fill="currentColor"/><circle cx="4" cy="18" r="1" fill="currentColor"/>',
  ajustes: '<path d="M4 7h9M17 7h3M4 17h3M11 17h9"/><circle cx="15" cy="7" r="2"/><circle cx="9" cy="17" r="2"/>',
  moon: '<path d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5z"/>', bolt: '<path d="M13 3 5 13.5h6L10 21l8-10.5h-6z"/>',
  smile: '<circle cx="12" cy="12" r="9"/><path d="M8.5 14a4 4 0 0 0 7 0M9 9.5h.01M15 9.5h.01"/>',
  flame: '<path d="M12 3c1 3.5 5 5.5 5 10a5 5 0 0 1-10 0c0-2 1-3 2-4 0 2 1 2.5 2 2.5C11 9 11 6 12 3z"/>',
  star: '<path d="m12 3.5 2.6 5.4 5.9.8-4.3 4.1 1 5.9L12 17l-5.2 2.7 1-5.9L3.5 9.7l5.9-.8z"/>',
  download: '<path d="M12 4v11m0 0-4-4m4 4 4-4M5 20h14"/>', upload: '<path d="M12 16V5m0 0-4 4m4-4 4 4M5 20h14"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>', warn: '<path d="M12 4 3 20h18zM12 10v4M12 17h.01"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>', skip: '<circle cx="12" cy="12" r="9"/><path d="M8 12h8"/>',
  half: '<circle cx="12" cy="12" r="9"/><path d="M12 3a9 9 0 0 1 0 18z" fill="currentColor"/>', back: '<path d="M19 12H5m0 0 6-6m-6 6 6 6"/>',
  copy: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/>',
  table: '<path d="M4 6h16v12H4zM4 11h16M10 6v12"/>', book: '<path d="M5 4h10a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3zM5 17a3 3 0 0 1 3-3h10"/>'
};
var ic = function (n, cls) { return '<svg class="ic ' + (cls || '') + '" viewBox="0 0 24 24" aria-hidden="true">' + ICON[n] + '</svg>'; };
var catColor = function (cfg, nome) {
  var i = -1; cfg.cats.forEach(function (x, k) { if (x.nome === nome) i = k; });
  var c = i >= 0 ? cfg.cats[i] : null, k = c && c.cor >= 0 && c.cor <= 8 ? c.cor : (c && c.cor == null ? (c.nome.toLowerCase() === 'compromisso' ? 0 : (i % 8) + 1) : 0);
  return 'var(--c' + k + ')';
};
var catDot = function (cfg, nome) { return '<span class="dot" style="background:' + catColor(cfg, nome) + '"></span>'; };

/* ---- toast ---- */
var Toast = (function () {
  var el, tm;
  return function (msg, act) {
    if (el) el.remove(); clearTimeout(tm);
    el = document.createElement('div'); el.className = 'toast'; el.setAttribute('role', 'status');
    el.innerHTML = '<span>' + esc(msg) + '</span>' + (act ? '<button type="button">' + esc(act.label) + '</button>' : '');
    document.body.appendChild(el);
    if (act) el.querySelector('button').onclick = function () { act.fn(); el.remove(); };
    tm = setTimeout(function () { if (el) el.remove(); }, act ? 7000 : 3200);
  };
})();

/* ---- folhas (modais) ---- */
var Sheet = (function () {
  var cur = null;
  function close(v) { if (!cur) return; var c = cur; cur = null; c.el.remove(); document.removeEventListener('keydown', c.key); if (c.done) c.done(v); }
  function open(o) {
    close();
    var ov = document.createElement('div'); ov.className = 'ov';
    ov.innerHTML = '<div class="sheet" role="dialog" aria-modal="true" aria-label="' + esc(o.title) + '"><h2>' + esc(o.title) + '</h2>' +
      (o.sub ? '<p class="sub">' + o.sub + '</p>' : '<div style="height:10px"></div>') + '<div class="sb">' + (o.body || '') + '</div>' +
      (o.foot ? '<div class="foot">' + o.foot + '</div>' : '') + '</div>';
    document.body.appendChild(ov);
    var key = function (e) { if (e.key === 'Escape') close(null); };
    document.addEventListener('keydown', key);
    cur = { el: ov, key: key, done: o.onClose };
    ov.addEventListener('mousedown', function (e) { if (e.target === ov) close(null); });
    if (o.onMount) o.onMount(ov.querySelector('.sheet'));
    return ov.querySelector('.sheet');
  }
  function confirm(o) {
    return new Promise(function (res) {
      var s = open({
        title: o.title, sub: o.text, body: o.body || '',
        foot: '<button class="btn" type="button" data-x="0">' + esc(o.no || 'Cancelar') + '</button><button class="btn ' + (o.danger ? 'danger' : 'primary') + '" type="button" data-x="1">' + esc(o.ok || 'Confirmar') + '</button>',
        onClose: function (v) { res(v === true); }
      });
      s.querySelector('[data-x="0"]').onclick = function () { close(false); };
      s.querySelector('[data-x="1"]').onclick = function () { close(true); };
    });
  }
  return { open: open, close: close, confirm: confirm, isOpen: function () { return !!cur; } };
})();

/* ---- tooltip dos gráficos ---- */
var Tip = (function () {
  var el;
  function show(txt, x, y) {
    if (!el) { el = document.createElement('div'); el.className = 'tip'; document.body.appendChild(el); }
    var p = txt.split('|'); el.innerHTML = '<b>' + esc(p[0]) + '</b>' + p.slice(1).map(esc).join('<br>');
    el.style.opacity = 1;
    var w = el.offsetWidth, h = el.offsetHeight, vw = window.innerWidth;
    el.style.left = Math.max(8, Math.min(vw - w - 8, x - w / 2)) + 'px';
    el.style.top = Math.max(8, y - h - 12) + 'px';
  }
  function hide() { if (el) el.style.opacity = 0; }
  document.addEventListener('pointerover', function (e) { var t = e.target.closest && e.target.closest('[data-tip]'); if (t) { var r = t.getBoundingClientRect(); show(t.getAttribute('data-tip'), e.clientX || r.left + r.width / 2, r.top); } else hide(); });
  document.addEventListener('pointerdown', function (e) { var t = e.target.closest && e.target.closest('[data-tip]'); if (t) { var r = t.getBoundingClientRect(); show(t.getAttribute('data-tip'), e.clientX, r.top); } else hide(); });
  window.addEventListener('scroll', hide, { passive: true });
  return { hide: hide };
})();
