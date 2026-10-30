/* ===== OP% · aplicação: navegação, eventos, inicialização ===== */
var STANDALONE = false;   // true na versão publicada fora do Claude (build.py --standalone)
var App = { tab: 'hoje', date: null, week: null, per: '30', open: null, rotView: 'dia', rotWd: null, rotFiltro: 'vigor', page: null, M: null, ready: false };
var ACT = {}, CHG = {}, VIEWS = {};
var TABS = [['hoje', 'Hoje'], ['semana', 'Semana'], ['painel', 'Painel'], ['metas', 'Metas'], ['rotina', 'Rotina']];
var SYNC_TXT = { ok: 'Sincronizado', wait: 'Salvando…', local: STANDALONE ? 'Salvo neste aparelho' : 'Só neste aparelho', erro: 'Sem conexão', cheio: 'Memória cheia' };

function lsGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
function lsSet(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* ok */ } }

function syncHTML() {
  var s = Store.syncState();
  return '<span class="sync ' + (s === 'ok' ? 'ok' : s === 'wait' ? 'wait' : '') + '" id="sync" title="' + (s === 'local' ? 'Os dados ficam só neste navegador. Faça backup em Ajustes.' : '') + '"><i></i>' + SYNC_TXT[s] + '</span>';
}
function header(v) {
  return '<header class="top"><div class="top-1">' + (v.back ? '<button class="icon-btn" type="button" data-a="voltar" aria-label="Voltar">' + ic('back') + '</button>' : '') +
    '<h1>' + v.title + (v.sub ? '<small>' + v.sub + '</small>' : '') + '</h1>' +
    (v.back ? '' : '<button class="icon-btn" type="button" data-a="ajustes" aria-label="Ajustes">' + ic('ajustes') + '</button>') + '</div>' +
    '<div class="top-2">' + (v.actions || '') + syncHTML() + '</div></header>';
}
function navHTML() {
  return '<nav class="nav" aria-label="Seções">' + TABS.map(function (t) {
    return '<button type="button" data-a="tab" data-t="' + t[0] + '"' + (!App.page && App.tab === t[0] ? ' aria-current="page"' : '') + '>' + ic(t[0], 'lg') + '<span>' + t[1] + '</span></button>';
  }).join('') + '</nav>';
}
function loadingHTML() { return '<div class="welcome"><h1>OP%</h1><p>Carregando seus dados…</p></div>'; }

function render(keep) {
  var root = $('#app'), y = window.scrollY;
  Charts.reset();
  if (!Store.has()) { root.innerHTML = App.ready ? welcomeHTML() : loadingHTML(); return; }
  var M = App.M = OPX.build(Store.get(), Store.todayISO());
  var v = App.page === 'ajustes' ? viewAjustes(M) : VIEWS[App.tab](M);
  root.innerHTML = '<div class="app">' + navHTML() + '<main class="main" id="main">' + header(v) + v.html + '</main></div>' + (v.fab || '');
  Charts.drawAll();
  if (keep) window.scrollTo(0, y); else window.scrollTo(0, 0);
}

document.addEventListener('click', function (e) {
  var el = e.target.closest && e.target.closest('[data-a]');
  if (!el || !ACT[el.getAttribute('data-a')]) return;
  e.preventDefault(); ACT[el.getAttribute('data-a')](el, e);
});
document.addEventListener('change', function (e) {
  var el = e.target.closest && e.target.closest('[data-c]');
  if (el && CHG[el.getAttribute('data-c')]) CHG[el.getAttribute('data-c')](el, e);
});

ACT.tab = function (el) { App.tab = el.getAttribute('data-t'); App.page = null; lsSet('opx:tab', App.tab); render(false); };
ACT.ajustes = function () { App.page = 'ajustes'; render(false); };
ACT.voltar = function () { App.page = null; render(false); };

Store.on(function (kind) {
  if (kind === 'sync') { var s = $('#sync'); if (s) s.outerHTML = syncHTML(); return; }
  if (!Store.has() && !App.ready) return;
  if (kind === 'remote') { var a = document.activeElement; if (a && /INPUT|TEXTAREA|SELECT/.test(a.tagName) && a.closest('#main')) return; }
  render(true);
});

var lastW = 0, rz;
window.addEventListener('resize', function () {
  clearTimeout(rz); rz = setTimeout(function () { var w = window.innerWidth; if (w !== lastW) { lastW = w; Charts.drawAll(); } }, 150);
});
window.addEventListener('beforeinstallprompt', function (e) { e.preventDefault(); App.installEv = e; if (App.page === 'ajustes') render(true); });
window.addEventListener('appinstalled', function () { App.installEv = null; App.instalado = true; });
document.addEventListener('visibilitychange', function () {
  if (!document.hidden && Store.has() && App.M && App.M.refISO !== Store.todayISO()) { App.date = null; App.week = null; render(false); }
});
setInterval(function () {
  if (document.hidden || !Store.has() || Sheet.isOpen() || App.page) return;
  var a = document.activeElement; if (a && /INPUT|TEXTAREA|SELECT/.test(a.tagName)) return;
  if (App.tab === 'hoje' && (!App.date || App.date === Store.todayISO()) || (App.M && App.M.refISO !== Store.todayISO())) render(true);
}, 60000);

/* ---- boas-vindas ---- */
function welcomeHTML() {
  return '<div class="welcome"><h1>OP%</h1><p>Planeje a rotina, registre o que aconteceu em dois toques e acompanhe sua execução, metas, XP e sequência. É o mesmo sistema do Excel, agora no celular.</p>' +
    (STANDALONE ? '<button class="opt" type="button" data-a="comecar" data-m="modelo"><b>Ver com uma rotina de exemplo</b><span>Trabalho, faculdade e estudos já cadastrados, com metas, só para você ver o app funcionando. Você edita tudo depois.</span></button>'
      : '<button class="opt" type="button" data-a="comecar" data-m="modelo"><b>Usar meu modelo de estudos</b><span>Trabalho, faculdade, inglês, SQL, Excel e carreira já cadastrados, com metas. Você edita tudo depois.</span></button>') +
    '<button class="opt" type="button" data-a="comecar" data-m="branco"><b>Começar do zero</b><span>Você cadastra as suas atividades na aba Rotina.</span></button>' +
    '<button class="opt" type="button" data-a="importar"><b>Importar meus dados</b><span>Traga o OP_Sistema.xlsx ou um backup do app (.json).</span></button>' +
    '<p class="hint" style="margin-top:18px">' + (STANDALONE ? 'Seus dados ficam guardados só neste aparelho, no navegador. Em Ajustes você faz backup (e leva para outro aparelho) quando quiser.' : 'Seus dados ficam guardados na sua conta e neste aparelho. Em Ajustes você faz backup quando quiser.') + '</p></div>';
}
ACT.comecar = function (el) { Store.start(OPD.novoEstado(el.getAttribute('data-m'), Store.todayISO())); App.tab = 'hoje'; render(false); };

async function boot() {
  Store.initLocal();
  var saved = lsGet('opx:tab'); if (saved && VIEWS[saved]) App.tab = saved;
  var hadLocal = Store.has();
  App.ready = hadLocal; render(false);
  var ok = await Store.connect();
  App.ready = true; lastW = window.innerWidth;
  render(hadLocal);
  if (STANDALONE && Store.has() && navigator.storage && navigator.storage.persist) { try { navigator.storage.persist(); } catch (e) { /* ok */ } }
  if (!ok && Store.has()) { var s = $('#sync'); if (s) s.outerHTML = syncHTML(); }
}
window.addEventListener('error', function (e) { console.error('OP% erro:', e.message); });
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
