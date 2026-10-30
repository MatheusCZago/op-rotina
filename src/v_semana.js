/* ===== OP% · tela SEMANA (visão da semana + revisão semanal) ===== */
var MARK = { 'Concluído': '✓', 'Parcial': '½', 'Não feito': '✕', 'Dispensado': '–', 'Pendente': '' };

VIEWS.semana = function (M) {
  var S = Store.get(), cfg = S.cfg, w = App.week ? OPX.toN(App.week) : OPX.mondayOf(M.ref), wISO = OPX.toISO(w);
  App.week = wISO;
  var A = M.weekAgg(w), cur = w === OPX.mondayOf(M.ref);
  var html = '', cells = '', blocks = '';
  for (var i = 0; i < 7; i++) {
    var n = w + i, iso = OPX.toISO(n), D = M.dia(iso), st = D.st, ex = (n >= M.ini && n <= M.ref) ? st.exec : null;
    var cls = n === M.ref ? 'today ' : '', txt = '·';
    if (D.folga) { txt = 'folga'; cls += 'fut'; }
    else if (n > M.ref || n < M.ini) { cls += 'fut'; txt = n > M.ref ? '' : '—'; }
    else if (ex != null) { txt = Math.round(ex * 100) + '%'; cls += ex >= cfg.metaDia - 1e-9 ? 'h3' : ex >= 0.6 ? 'h2' : ex > 0 ? 'h1' : 'h0'; }
    else if (st.F > 0) { if (n < M.ref) { txt = '0%'; cls += 'h0'; } else txt = '—'; }
    cells += '<button type="button" class="' + cls + '" data-a="irdia" data-d="' + iso + '"><span class="wd">' + OPX.DIAS_ABREV[i] + '</span><span class="dn">' + iso.slice(8) + '</span><span class="ex">' + txt + '</span></button>';
    var open = n === M.ref || (!cur && i === 0);
    var items = D.list.map(function (it) {
      var m = it.fixo ? '' : (it.entry ? MARK[it.entry.s] : (n < M.ref && !D.folga ? '' : ''));
      return '<button type="button" class="' + (it.fixo ? 'fx' : '') + '" data-a="rotedit" data-id="' + it.row.id + '"><span class="t">' + it.row.ini + '–' + it.row.fim + '</span><span class="n">' + esc(it.row.nome) + '</span><span class="chip' + (it.entry ? (it.entry.s === 'Concluído' ? ' good' : it.entry.s === 'Não feito' ? ' bad' : it.entry.s === 'Parcial' ? ' warn' : '') : '') + '" style="' + (m || it.fixo ? '' : 'visibility:hidden') + '">' + (it.fixo ? 'fixo' : esc(m)) + '</span></button>';
    }).join('');
    blocks += '<details class="dayblock"' + (open ? ' open' : '') + '><summary>' + OPX.DIAS_NOME[i] + ' <span class="faint">' + F.dm(iso) + '</span>' +
      (D.folga ? '<span class="chip acc">' + esc(D.folga) + '</span>' : (D.planejadas ? '<span class="chip">' + D.planejadas + ' a registrar</span>' : '')) + ic('chevD', 'sm chev') + '</summary><div class="mini-l">' +
      (items || '<span class="faint" style="padding:6px 0">Nada planejado.</span>') + '</div></details>';
  }
  var a = OPX.toISO(w), b = OPX.toISO(w + 6);
  html += '<div class="wk">' + cells + '</div>';
  html += '<div class="kpis" style="margin-top:12px">' +
    '<div class="kpi"><div class="l">Execução</div><div class="v">' + F.pct(A.exec) + '</div><div class="s">meta ' + F.pct(cfg.metaDia) + ' por dia</div></div>' +
    '<div class="kpi"><div class="l">Dias bons</div><div class="v">' + A.bons + '<small> / ' + A.dias + '</small></div><div class="s">dias registrados</div></div>' +
    '<div class="kpi"><div class="l">Horas realizadas</div><div class="v">' + F.dec(A.horas, 1) + '<small> h</small></div><div class="s">de ' + F.dec(A.hplan, 1) + ' h registradas</div></div>' +
    '<div class="kpi"><div class="l">XP da semana</div><div class="v">' + F.int(A.xp) + '</div><div class="s">sono médio ' + (A.sono == null ? '—' : F.dec(A.sono, 1) + ' h') + '</div></div></div>';
  // metas semanais por categoria
  var goals = cfg.cats.filter(function (c) { return c.meta != null && +c.meta > 0; }).map(function (c) {
    var h = M.regs.filter(function (r) { return r.sem === w && r.cat === c.nome && r.cred != null; }).reduce(function (s, r) { return s + r.min; }, 0) / 60, p = h / c.meta;
    return '<div class="goal"><div class="goal-h">' + catDot(cfg, c.nome) + esc(c.nome) + '<span class="v">' + F.dec(h, 1) + ' / ' + F.dec(+c.meta, 1) + ' h</span></div><div class="bar' + (p >= 1 ? ' over' : '') + '"><i style="width:' + Math.min(100, Math.round(p * 100)) + '%"></i></div></div>';
  }).join('');
  html += '<div class="sec"><h2>Metas da semana por categoria</h2></div><section class="card">' + (goals || '<p class="muted">Defina metas de horas por semana em Rotina › Categorias.</p>') + '</section>';
  html += '<div class="sec"><h2>Plano da semana</h2><span class="sub">toque numa atividade para editar</span></div><div class="card flat">' + blocks + '</div>';
  // revisão
  var rv = S.rev[wISO] || {}, n10 = '';
  for (var k = 1; k <= 10; k++) n10 += '<button type="button" data-a="revnota" data-v="' + k + '" aria-pressed="' + (rv.nota === k) + '">' + k + '</button>';
  html += '<div class="sec"><h2>Revisão da semana</h2><span class="sub">' + (rv.foco || rv.ok || rv.ajustar || rv.nota ? 'preenchida' : 'pendente') + '</span></div><section class="card"><div class="form">' +
    '<div><div class="chk-l" style="margin-bottom:8px">Como foi a semana? <span class="hint">nota de 1 a 10</span></div><div class="scale n10" role="group">' + n10 + '</div></div>' +
    '<label class="f">O que funcionou<textarea data-c="rev" data-f="ok" placeholder="Ex.: acordei cedo e o SQL rendeu">' + esc(rv.ok || '') + '</textarea></label>' +
    '<label class="f">O que ajustar<textarea data-c="rev" data-f="ajustar" placeholder="Ex.: sexta é o dia mais fraco">' + esc(rv.ajustar || '') + '</textarea></label>' +
    '<label class="f">Foco da próxima semana<textarea data-c="rev" data-f="foco" placeholder="Uma frase">' + esc(rv.foco || '') + '</textarea></label></div></section>';
  var nav = '<div class="daynav"><button class="icon-btn" type="button" data-a="sem" data-d="-7" aria-label="Semana anterior">' + ic('chevL') + '</button>' +
    (cur ? '' : '<button class="btn sm" type="button" data-a="sem" data-d="0">Esta semana</button>') +
    '<button class="icon-btn" type="button" data-a="sem" data-d="7" aria-label="Próxima semana">' + ic('chevR') + '</button></div>';
  return { title: 'Semana de ' + F.dm(a), sub: F.dm(a) + ' a ' + F.dm(b) + (cur ? ' · semana atual' : ''), actions: nav, html: html };
};
ACT.sem = function (el) {
  var d = +el.getAttribute('data-d'); App.week = d === 0 ? null : OPX.toISO(OPX.toN(App.week) + d); render(false);
};
ACT.irdia = function (el) { App.date = el.getAttribute('data-d'); App.tab = 'hoje'; App.open = null; render(false); };
ACT.revnota = function (el) {
  var v = +el.getAttribute('data-v'), w = App.week;
  Store.mutate(function (S) { var r = S.rev[w] || (S.rev[w] = {}); if (r.nota === v) delete r.nota; else r.nota = v; }, ['rev']);
};
CHG.rev = function (el) {
  var f = el.getAttribute('data-f'), w = App.week, v = el.value.trim();
  Store.mutate(function (S) { var r = S.rev[w] || (S.rev[w] = {}); if (v) r[f] = v; else delete r[f]; if (!Object.keys(r).length) delete S.rev[w]; }, ['rev']);
};

/* ===== METAS ===== */
var SIT = { 'Concluída': 'good', 'No ritmo': 'acc', 'Atenção': 'warn', 'Atrasada': 'bad', 'Prazo vencido': 'bad', 'Em início': '' };
VIEWS.metas = function (M) {
  var cfg = Store.get().cfg, ms = M.metas(), html = '';
  if (!ms.length) html = '<div class="card empty"><h3>Nenhuma meta ainda</h3><p>Metas de horas ou de sessões concluídas, com prazo. O progresso se atualiza sozinho a cada registro.</p></div>';
  else html = ms.map(function (m) {
    var un = m.tipo === 'Horas' ? 'h' : 'sessões', p = m.pct == null ? 0 : m.pct;
    return '<section class="card meta"><div class="row" style="align-items:flex-start"><div class="grow"><h3>' + esc(m.nome) + '</h3><div class="row wrap" style="margin-top:6px"><span class="chip">' + (m.cat === 'Todas' ? 'Todas as categorias' : catDot(cfg, m.cat) + esc(m.cat)) + '</span>' +
      (m.sit ? '<span class="chip ' + (SIT[m.sit] || '') + '">' + m.sit + '</span>' : '') + '</div></div><button class="icon-btn" type="button" data-a="metaedit" data-id="' + m.id + '" aria-label="Editar meta">' + ic('edit') + '</button></div>' +
      '<div class="bar' + (p >= 1 ? ' over' : '') + '"><i style="width:' + Math.min(100, Math.round(p * 100)) + '%"></i><u style="left:' + Math.round(m.tempo * 100) + '%"></u></div>' +
      '<div class="nums"><span><b>' + F.dec(m.real, m.tipo === 'Horas' ? 1 : 0) + '</b> de ' + F.dec(+m.alvo, m.tipo === 'Horas' ? 0 : 0) + ' ' + un + '</span><span><b>' + F.pct(m.pct) + '</b> da meta</span><span>ritmo esperado hoje: <b>' + F.pct(m.tempo) + '</b></span><span>prazo ' + F.dmy(m.fim) + (m.restam ? ' · restam ' + m.restam + ' dias' : '') + '</span></div></section>';
  }).join('<div style="height:12px"></div>');
  return { title: 'Metas', sub: 'objetivos com prazo, acompanhados sozinhos', html: html, fab: '<button class="fab" type="button" data-a="metaedit" data-id="">' + ic('plus') + 'Nova meta</button>' };
};
ACT.metaedit = function (el) {
  var S = Store.get(), id = el.getAttribute('data-id'), m = id ? S.metas.filter(function (x) { return x.id === id; })[0] : null;
  var ano = Store.todayISO().slice(0, 4);
  m = m || { id: '', nome: '', cat: S.cfg.cats.length ? S.cfg.cats[0].nome : 'Todas', tipo: 'Horas', alvo: '', ini: Store.todayISO(), fim: ano + '-12-31' };
  var cats = ['Todas'].concat(S.cfg.cats.map(function (c) { return c.nome; }));
  var s = Sheet.open({
    title: id ? 'Editar meta' : 'Nova meta', sub: '“Horas” soma o tempo realizado; “Sessões” conta registros Concluídos.',
    body: '<div class="form"><label class="f">Nome da meta<input type="text" id="m-nome" maxlength="90" value="' + esc(m.nome) + '" placeholder="Ex.: Estudar Excel 55 horas"></label>' +
      '<div class="f2"><label class="f">Categoria<select id="m-cat">' + cats.map(function (c) { return '<option' + (c === m.cat ? ' selected' : '') + '>' + esc(c) + '</option>'; }).join('') + '</select></label>' +
      '<label class="f">Tipo<select id="m-tipo"><option' + (m.tipo === 'Horas' ? ' selected' : '') + '>Horas</option><option' + (m.tipo === 'Sessões' ? ' selected' : '') + '>Sessões</option></select></label></div>' +
      '<label class="f">Alvo<input type="number" id="m-alvo" min="1" step="any" inputmode="decimal" value="' + esc(m.alvo) + '" placeholder="Ex.: 55"></label>' +
      '<div class="f2"><label class="f">Início<input type="date" id="m-ini" value="' + m.ini + '"></label><label class="f">Prazo<input type="date" id="m-fim" value="' + m.fim + '"></label></div></div>',
    foot: (id ? '<button class="btn danger" type="button" data-k="del">Excluir</button>' : '') + '<button class="btn" type="button" data-k="x">Cancelar</button><button class="btn primary" type="button" data-k="ok">Salvar</button>'
  });
  $('[data-k="x"]', s).onclick = function () { Sheet.close(); };
  if (id) $('[data-k="del"]', s).onclick = function () {
    Sheet.close(); Store.checkpoint(); Store.mutate(function (S2) { S2.metas = S2.metas.filter(function (x) { return x.id !== id; }); }, ['cfg']);
    Toast('Meta excluída', { label: 'Desfazer', fn: function () { Store.undo(); } });
  };
  $('[data-k="ok"]', s).onclick = function () {
    var f = { nome: $('#m-nome', s).value.trim(), cat: $('#m-cat', s).value, tipo: $('#m-tipo', s).value, alvo: +$('#m-alvo', s).value, ini: $('#m-ini', s).value, fim: $('#m-fim', s).value };
    if (!f.nome) return Toast('Dê um nome à meta.');
    if (!(f.alvo > 0)) return Toast('Informe um alvo maior que zero.');
    if (!f.ini || !f.fim || OPX.toN(f.fim) <= OPX.toN(f.ini)) return Toast('O prazo precisa ser depois do início.');
    Store.mutate(function (S2) {
      if (id) Object.assign(S2.metas.filter(function (x) { return x.id === id; })[0], f); else S2.metas.push(Object.assign({ id: OPD.newId() }, f));
    }, ['cfg']);
    Sheet.close(); Toast(id ? 'Meta atualizada' : 'Meta criada');
  };
};
