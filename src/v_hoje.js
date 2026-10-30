/* ===== OP% · tela HOJE (plano do dia, registro, check-in) ===== */
var STS = [['Concluído', 'Feito', 'check', 'a-ok'], ['Parcial', 'Parcial', 'half', 'a-parc'], ['Não feito', 'Não fiz', 'x', 'a-no'], ['Dispensado', 'Dispensar', 'skip', 'a-disp']];
var NODE = { 'Concluído': ['s-ok', 'check'], 'Parcial': ['s-parc', ''], 'Não feito': ['s-no', 'x'], 'Dispensado': ['s-disp', ''] };

function relDia(M, iso) {
  var d = OPX.toN(iso) - M.ref;
  return d === 0 ? 'Hoje' : d === -1 ? 'Ontem' : d === 1 ? 'Amanhã' : d < 0 ? 'Há ' + (-d) + ' dias' : 'Em ' + d + ' dias';
}
function nowMin() { var d = new Date(); return d.getHours() * 60 + d.getMinutes(); }
function inWindow(r, now) { var s = OPX.hm(r.ini); return r.dur > 0 && ((now - s + 1440) % 1440) < r.dur; }

function heroHTML(M, D, cfg) {
  var st = D.st, ex = st.exec, meta = cfg.metaDia, hint = '';
  if (D.folga) hint = '<span class="chip acc">Folga · ' + esc(D.folga) + '</span> <span class="muted">As atividades do dia não contam na execução.</span>';
  else if (D.antes) hint = '<span class="muted">Dia anterior ao início do sistema (' + F.dmy(cfg.inicio) + '). Registros daqui são ignorados.</span>';
  else if (D.futuro) hint = '<span class="muted">Dia futuro: o plano abaixo é só para consulta.</span>';
  else if (D.planejadas === 0) hint = '<span class="muted">Nada para registrar neste dia.</span>';
  else if (ex == null) hint = '<span class="muted">Marque as atividades abaixo para ver sua execução.</span>';
  else if (ex >= meta - 1e-9) hint = '<span class="chip good">Dia bom</span> <span class="muted">+' + cfg.bonus + ' XP de bônus</span>';
  else if (D.pendentes > 0 && !D.futuro) {
    var need = Math.ceil(meta * Math.max(st.F - (st.G - st.H), st.H) - st.pts - 1e-9);
    hint = need <= D.pendentes ? '<span class="muted">Conclua mais <b>' + need + '</b> atividade' + (need > 1 ? 's' : '') + ' para um dia bom (meta ' + F.pct(meta) + ').</span>'
      : '<span class="muted">Meta do dia fora de alcance, mas cada atividade ainda gera XP.</span>';
  } else hint = '<span class="muted">Meta do dia: ' + F.pct(meta) + '.</span>';
  var seq = st.seq != null && !D.futuro && !D.antes ? st.seq : null;
  return '<section class="card hero"><div class="hero-top"><div><div class="eyebrow">Execução do dia</div>' +
    (ex == null ? '<div class="pct dash">—</div>' : '<div class="pct num">' + Math.round(ex * 100) + '<small>%</small></div>') + '</div>' +
    '<div style="text-align:right;max-width:58%;font-size:13.5px">' + hint + '</div></div>' +
    '<div class="meter" aria-hidden="true"><i style="width:' + Math.round((ex || 0) * 100) + '%"></i><u style="left:' + Math.round(meta * 100) + '%"></u></div>' +
    '<div class="meter-l"><span>0%</span><span>meta ' + F.pct(meta) + '</span><span>100%</span></div>' +
    '<div class="mini"><div><b>' + D.registradas + '<span class="faint">/' + D.planejadas + '</span></b><span>registradas</span></div>' +
    '<div><b>' + F.int(st.xp) + '</b><span>XP do dia</span></div>' +
    '<div><b>' + (seq == null ? '—' : seq) + '</b><span>sequência (dias)</span></div></div></section>';
}

function nowStripHTML(D, today) {
  if (!today) return '';
  var now = nowMin(), cur = null, nxt = null, best = 1e9;
  D.list.forEach(function (it) {
    if (it.fixo) return;
    if (inWindow(it.row, now)) cur = cur || it;
    var delta = (OPX.hm(it.row.ini) - now + 1440) % 1440;
    if (!it.entry && delta > 0 && delta < best && OPX.hm(it.row.ini) > now) { best = delta; nxt = it; }
  });
  if (D.folga) return '';
  if (cur) return '<div class="now-strip">' + ic('clock') + '<span>Agora: <span class="mono">' + cur.row.ini + '</span> ' + esc(cur.row.nome) + '</span></div>';
  if (nxt) return '<div class="now-strip">' + ic('clock') + '<span>A seguir, em ' + F.min(best) + ': <span class="mono">' + nxt.row.ini + '</span> ' + esc(nxt.row.nome) + '</span></div>';
  return '';
}

function detalhesHTML(cfg, it, i) {
  var e = it.entry, r = it.row, n10 = '';
  for (var k = 1; k <= 10; k++) n10 += '<button type="button" data-a="nota" data-i="' + i + '" data-v="' + k + '" aria-pressed="' + (e.n === k) + '">' + k + '</button>';
  return '<div class="det"><div class="f2"><label class="f">Tempo realizado (min)<input type="number" inputmode="numeric" min="0" max="1440" data-c="min" data-i="' + i + '" value="' + (e.m == null ? '' : e.m) + '" placeholder="' + r.dur + ' (planejado)"></label>' +
    '<div class="f"><span style="font-size:12.5px;font-weight:600;color:var(--ink-2)">Nota da execução</span><span class="hint">1 a 10. Nota 9+ rende mais XP.</span></div></div>' +
    '<div class="scale n10" role="group" aria-label="Nota de 1 a 10">' + n10 + '</div>' +
    '<label class="f">Observação<textarea data-c="obs" data-i="' + i + '" placeholder="Opcional">' + esc(e.o || '') + '</textarea></label></div>';
}

function itemHTML(M, D, it, i, today, now) {
  var cfg = Store.get().cfg, r = it.row, e = it.entry, reg = it.reg, cls = ['tl-i'];
  if (it.fixo) cls.push('fixo');
  var live = today && inWindow(r, now) && !it.fixo; if (live) cls.push('now');
  var node;
  if (it.fixo) node = '<span class="node fixo"></span>';
  else if (e && NODE[e.s]) node = '<span class="node ' + NODE[e.s][0] + '">' + (NODE[e.s][1] ? ic(NODE[e.s][1]) : '') + '</span>';
  else node = '<span class="node"></span>';
  var meta = '<span class="cat">' + catDot(cfg, r.cat) + esc(r.cat) + '</span><span>' + F.min(r.dur) + '</span>';
  if (it.fixo) meta += '<span class="chip">Compromisso fixo</span>';
  else {
    if (r.pri) meta += '<span class="chip' + (r.pri === 'Alta' ? ' acc' : '') + '">' + esc(r.pri) + '</span>';
    if (reg && reg.xp != null) meta += '<span class="xp-got">+' + reg.xp + ' XP</span>';
    if (reg && reg.alerta !== 'OK') meta += '<span class="chip bad">' + esc(reg.alerta) + '</span>';
  }
  var body = '<div class="tl-name">' + esc(r.nome) + (live ? ' <span class="chip acc">agora</span>' : '') + '</div><div class="tl-meta">' + meta + '</div>';
  if (!it.fixo && !D.folga && !D.futuro && !D.antes) {
    body += '<div class="acts" role="group" aria-label="Status de ' + esc(r.nome) + '">' + STS.map(function (s) {
      return '<button type="button" class="act ' + s[3] + '" data-a="st" data-i="' + i + '" data-s="' + s[0] + '" aria-pressed="' + (!!e && e.s === s[0]) + '">' + ic(s[2]) + s[1] + '</button>';
    }).join('') + '</div>';
    if (e && (e.s === 'Concluído' || e.s === 'Parcial')) {
      var open = App.open === r.nome, sum = [];
      if (e.n != null) sum.push('nota ' + e.n); if (e.m != null) sum.push(e.m + ' min'); if (e.o) sum.push('com observação');
      body += '<button type="button" class="btn ghost sm" style="margin-top:6px;padding:0 4px" data-a="det" data-i="' + i + '">' + (open ? 'Fechar detalhes' : (sum.length ? 'Detalhes: ' + sum.join(' · ') : '+ Nota e tempo')) + '</button>';
      if (open) body += detalhesHTML(cfg, it, i);
    }
  }
  return '<li class="' + cls.join(' ') + '"><div class="tl-t">' + r.ini + '<span>' + r.fim + '</span></div><div class="tl-n">' + node + '</div><div class="tl-b">' + body + '</div></li>';
}

function extrasHTML(M, D) {
  if (!D.extras.length) return '';
  var cfg = Store.get().cfg;
  return '<div class="sec"><h2>Fora do plano</h2><span class="sub">contam como esforço extra</span></div><div class="card flat"><ul class="tl">' + D.extras.map(function (x, j) {
    var e = x.entry, reg = x.reg;
    return '<li class="tl-i"><div class="tl-t">extra</div><div class="tl-n"><span class="node ' + (NODE[e.s] ? NODE[e.s][0] : '') + '">' + (NODE[e.s] && NODE[e.s][1] ? ic(NODE[e.s][1]) : '') + '</span></div><div class="tl-b"><div class="tl-name">' + esc(x.nome) + '</div>' +
      '<div class="tl-meta"><span class="chip">' + esc(e.s) + '</span>' + (reg && reg.xp != null ? '<span class="xp-got">+' + reg.xp + ' XP</span>' : '') + (reg && reg.alerta !== 'OK' ? '<span class="chip bad">' + esc(reg.alerta) + '</span>' : '') +
      '<button class="btn ghost sm" type="button" data-a="rmextra" data-n="' + esc(x.nome) + '">Remover</button></div></div></li>';
  }).join('') + '</ul></div>';
}

function checkinHTML(D, iso, ro) {
  var c = D.chk || {}, sc = function (field, cur) {
    var h = ''; for (var k = 1; k <= 5; k++) h += '<button type="button" data-a="chk" data-f="' + field + '" data-v="' + k + '" aria-pressed="' + (cur === k) + '"' + (ro ? ' disabled' : '') + '>' + k + '</button>';
    return '<div class="scale" role="group">' + h + '</div>';
  };
  return '<div class="sec"><h2>Check-in</h2><span class="sub">30 segundos</span></div><section class="card">' +
    '<div class="chk-row"><div class="chk-l">' + ic('moon') + 'Sono da noite anterior<span class="hint">meta ' + F.dec(Store.get().cfg.metaSono, 1) + ' h</span></div>' +
    '<div class="stepper"><button type="button" class="icon-btn" data-a="sono" data-d="-0.5" aria-label="Menos meia hora"' + (ro ? ' disabled' : '') + '>' + ic('chevL') + '</button><b>' + (c.sono == null ? '—' : F.dec(c.sono, 1) + ' h') + '</b>' +
    '<button type="button" class="icon-btn" data-a="sono" data-d="0.5" aria-label="Mais meia hora"' + (ro ? ' disabled' : '') + '>' + ic('chevR') + '</button></div></div>' +
    '<div class="chk-row"><div class="chk-l">' + ic('bolt') + 'Energia<span class="hint">1 baixa · 5 alta</span></div>' + sc('ene', c.ene) + '</div>' +
    '<div class="chk-row"><div class="chk-l">' + ic('smile') + 'Humor<span class="hint">1 baixo · 5 alto</span></div>' + sc('hum', c.hum) + '</div>' + '</section>';
}

VIEWS.hoje = function (M) {
  var S = Store.get(), cfg = S.cfg, iso = App.date || M.refISO; App.date = iso;
  var D = M.dia(iso), today = iso === M.refISO, now = nowMin(), ro = D.futuro || D.antes;
  var html = '';
  if (M.ref === OPX.toN(iso) && OPX.wdOf(M.ref) === 6 && !S.rev[OPX.toISO(OPX.mondayOf(M.ref))])
    html += '<div class="banner info" style="margin-bottom:12px">' + ic('book') + '<span>Domingo é dia da revisão semanal: 5 minutos para aprender com os números.</span><button class="btn sm" type="button" data-a="irsemana">Fazer agora</button></div>';
  if (M.kpis(M.ref).alertas > 0) html += alertBanner(M);
  html += backupBanner(M);
  html += heroHTML(M, D, cfg);
  html += nowStripHTML(D, today && !D.folga);
  html += '<div class="sec"><h2>Plano do dia</h2><span class="sub">' + (D.list.length ? D.list.length + ' itens por horário' : '') + '</span></div>';
  if (!D.list.length) html += '<div class="card empty"><h3>Nada planejado</h3><p>' + (S.rot.length ? 'Não há atividades da rotina para este dia da semana.' : 'Cadastre suas atividades na aba Rotina para o plano aparecer aqui.') + '</p></div>';
  else html += '<div class="card flat"><ul class="tl">' + D.list.map(function (it, i) { return itemHTML(M, D, it, i, today, now); }).join('') + '</ul></div>';
  if (!ro && !D.folga && S.rot.length) html += '<div class="row" style="margin-top:12px"><button class="btn block" type="button" data-a="extra">' + ic('plus') + ' Registrar atividade fora do plano</button></div>';
  html += extrasHTML(M, D);
  html += checkinHTML(D, iso, ro);
  var nav = '<div class="daynav"><button class="icon-btn" type="button" data-a="dia" data-d="-1" aria-label="Dia anterior">' + ic('chevL') + '</button>' +
    (today ? '' : '<button class="btn sm" type="button" data-a="dia" data-d="0">Hoje</button>') +
    '<button class="icon-btn" type="button" data-a="dia" data-d="1" aria-label="Próximo dia">' + ic('chevR') + '</button>' +
    '<button class="icon-btn" type="button" data-a="diamenu" aria-label="Mais ações do dia">' + ic('more') + '</button></div>';
  return { title: F.cap(F.long(iso)), sub: relDia(M, iso) + (D.antes || D.futuro ? '' : ' · dia ' + (OPX.toN(iso) - M.ini + 1) + ' do sistema'), actions: nav, html: html };
};

function backupBanner(M) {
  if (Store.syncState() !== 'local') return '';
  var nreg = M.regs.length; if (nreg < 5) return '';
  var lb = lsGet('opx:lastbk'), sn = lsGet('opx:bksnooze');
  if (lb && M.ref - OPX.toN(lb) <= 14) return '';
  if (sn && M.ref - OPX.toN(sn) < 3) return '';
  return '<div class="banner info" style="margin-bottom:12px">' + ic('download') + '<span>' + (lb ? 'Seu último backup foi em ' + F.dmy(lb) + '.' : 'Você ainda não fez backup.') + ' Os dados ficam só neste aparelho.</span>' +
    '<button class="btn sm" type="button" data-a="bkjson">Fazer backup</button><button class="btn sm" type="button" data-a="bksoneca">Depois</button></div>';
}
ACT.bksoneca = function () { lsSet('opx:bksnooze', Store.todayISO()); render(true); };
function alertBanner(M) {
  var n = M.kpis(M.ref).alertas;
  return '<div class="banner bad" style="margin-bottom:12px">' + ic('warn') + '<span>' + n + ' registro' + (n > 1 ? 's' : '') + ' com problema (ignorado' + (n > 1 ? 's' : '') + ' nos cálculos até corrigir).</span><button class="btn sm" type="button" data-a="alertas">Ver</button></div>';
}

/* ---- ações ---- */
function curDia(M) { return M.dia(App.date || M.refISO); }
function setStatus(iso, nome, s) {
  var M0 = App.M, k0 = M0.kpis(M0.ref).xptot;
  Store.mutate(function (S) {
    var day = S.reg[iso] || (S.reg[iso] = {}), e = day[nome];
    if (e && e.s === s) { delete day[nome]; if (!Object.keys(day).length) delete S.reg[iso]; return; }
    e = e || {}; e.s = s; if (s === 'Dispensado' || s === 'Não feito') { delete e.m; delete e.n; } day[nome] = e;
  }, [Store.dateShard(iso)]);
  var M1 = App.M, k1 = M1.kpis(M1.ref);
  if (k1.nivel > M0.kpis(M0.ref).nivel) Toast('Nível ' + k1.nivel + ': ' + k1.titulo + '. Continue assim!');
  else if (s === 'Concluído' || s === 'Parcial') { var rg = M1.regs.filter(function (r) { return r.iso === iso && r.nome === nome; })[0]; if (rg && rg.xp != null) Toast(s + ' · +' + rg.xp + ' XP'); }
}
ACT.dia = function (el) {
  var d = +el.getAttribute('data-d'), M = App.M;
  App.date = d === 0 ? M.refISO : OPX.toISO(OPX.toN(App.date || M.refISO) + d); App.open = null; render(false);
};
ACT.st = function (el) {
  var M = App.M, D = curDia(M), it = D.list[+el.getAttribute('data-i')]; if (!it) return;
  setStatus(D.iso, it.row.nome, el.getAttribute('data-s'));
};
ACT.det = function (el) { var D = curDia(App.M), it = D.list[+el.getAttribute('data-i')]; App.open = App.open === it.row.nome ? null : it.row.nome; render(true); };
ACT.nota = function (el) {
  var D = curDia(App.M), it = D.list[+el.getAttribute('data-i')], v = +el.getAttribute('data-v');
  Store.mutate(function (S) { var e = S.reg[D.iso][it.row.nome]; if (e.n === v) delete e.n; else e.n = v; }, [Store.dateShard(D.iso)]);
};
CHG.min = function (el) {
  var D = curDia(App.M), it = D.list[+el.getAttribute('data-i')], v = el.value === '' ? null : Math.max(0, Math.min(1440, Math.round(+el.value)));
  Store.mutate(function (S) { var e = S.reg[D.iso][it.row.nome]; if (v == null) delete e.m; else e.m = v; }, [Store.dateShard(D.iso)]);
};
CHG.obs = function (el) {
  var D = curDia(App.M), it = D.list[+el.getAttribute('data-i')], v = el.value.trim();
  Store.mutate(function (S) { var e = S.reg[D.iso][it.row.nome]; if (v) e.o = v; else delete e.o; }, [Store.dateShard(D.iso)]);
};
ACT.rmextra = function (el) {
  var iso = App.date || App.M.refISO, nome = el.getAttribute('data-n');
  Store.mutate(function (S) { var day = S.reg[iso]; delete day[nome]; if (!Object.keys(day).length) delete S.reg[iso]; }, [Store.dateShard(iso)]);
};
function setChk(iso, field, fn) {
  Store.mutate(function (S) {
    var c = S.chk[iso] || (S.chk[iso] = {}); fn(c);
    if (c.sono == null && c.ene == null && c.hum == null && !c.obs) delete S.chk[iso];
  }, [Store.dateShard(iso)]);
}
ACT.chk = function (el) {
  var iso = App.date || App.M.refISO, f = el.getAttribute('data-f'), v = +el.getAttribute('data-v');
  setChk(iso, f, function (c) { if (c[f] === v) delete c[f]; else c[f] = v; });
};
ACT.sono = function (el) {
  var iso = App.date || App.M.refISO, d = +el.getAttribute('data-d');
  setChk(iso, 'sono', function (c) { var cur = c.sono == null ? App.M.cfg.metaSono - d : c.sono; c.sono = Math.max(0, Math.min(16, Math.round((cur + d) * 2) / 2)); });
};
ACT.irsemana = function () { App.tab = 'semana'; App.week = null; render(false); };
ACT.dia0 = function () { App.date = null; render(false); };

ACT.extra = function () {
  var M = App.M, D = curDia(M), iso = D.iso, S = Store.get();
  var inPlan = {}; D.list.forEach(function (it) { inPlan[it.row.nome] = 1; }); D.extras.forEach(function (x) { inPlan[x.nome] = 1; });
  var seen = {}, opts = S.rot.filter(function (r) { if (r.fixo || inPlan[r.nome] || seen[r.nome]) return false; seen[r.nome] = 1; return true; });
  if (!opts.length) { Toast('Todas as atividades já estão neste dia.'); return; }
  var s = Sheet.open({
    title: 'Atividade fora do plano', sub: 'Escolha uma atividade da rotina que você fez neste dia mesmo sem estar planejada.',
    body: '<div class="card flat">' + opts.map(function (r) { return '<button type="button" class="item" data-x="' + esc(r.nome) + '"><span><span class="n">' + esc(r.nome) + '</span><span class="sub">' + catDot(S.cfg, r.cat) + esc(r.cat) + ' · ' + F.min(OPX.durMin(r.ini, r.fim)) + '</span></span></button>'; }).join('') + '</div>',
    foot: '<button class="btn" type="button" data-x="">Fechar</button>'
  });
  $$('[data-x]', s).forEach(function (b) { b.onclick = function () { var n = b.getAttribute('data-x'); Sheet.close(); if (n) setStatus(iso, n, 'Concluído'); }; });
};

ACT.alertas = function () {
  var M = App.M, bad = M.regs.filter(function (r) { return r.alerta !== 'OK'; });
  var s = Sheet.open({
    title: 'Registros com problema', sub: 'Registros com atividade inexistente, fixa ou fora da vigência não entram nos cálculos. Remova ou ajuste a Rotina.',
    body: '<div class="card flat">' + bad.map(function (r, i) { return '<div class="item"><span><span class="n">' + esc(r.nome) + '</span><span class="sub"><span>' + F.dmy(r.iso) + '</span><span class="chip bad">' + esc(r.alerta) + '</span></span></span><button class="btn sm danger" type="button" data-k="' + i + '">Remover</button></div>'; }).join('') + '</div>',
    foot: '<button class="btn" type="button" data-k="x">Fechar</button>'
  });
  $$('[data-k]', s).forEach(function (b) {
    b.onclick = function () {
      var k = b.getAttribute('data-k'); if (k === 'x') return Sheet.close();
      var r = bad[+k]; Store.mutate(function (S) { var day = S.reg[r.iso]; delete day[r.nome]; if (!Object.keys(day).length) delete S.reg[r.iso]; }, [Store.dateShard(r.iso)]);
      Sheet.close(); if (App.M.kpis(App.M.ref).alertas) ACT.alertas();
    };
  });
};

/* ---- dispensar dias / folgas ---- */
function folgaRanges(S) {
  var ds = Object.keys(S.folgas || {}).sort(), out = [];
  ds.forEach(function (d) {
    var last = out[out.length - 1];
    if (last && OPX.toN(d) === OPX.toN(last.fim) + 1 && S.folgas[d] === last.motivo) last.fim = d; else out.push({ ini: d, fim: d, motivo: S.folgas[d] });
  });
  return out;
}
ACT.diamenu = function () {
  var M = App.M, iso = App.date || M.refISO, S = Store.get(), D = M.dia(iso);
  var s = Sheet.open({
    title: F.cap(F.long(iso)), sub: 'Ações deste dia',
    body: '<div class="stack">' +
      '<button class="opt" type="button" data-k="folga"><b>Folga, viagem ou imprevisto</b><span>Marque um ou vários dias em que a rotina não se aplica. Eles não contam na execução e não quebram a sequência.</span></button>' +
      (D.list.some(function (x) { return !x.fixo && x.entry; }) ? '<button class="opt" type="button" data-k="limpar"><b>Limpar registros deste dia</b><span>Remove os status e anotações das atividades deste dia.</span></button>' : '') +
      (D.list.some(function (x) { return !x.fixo && !x.entry; }) && !D.futuro && !D.antes && !D.folga ? '<button class="opt" type="button" data-k="disp"><b>Dispensar as atividades pendentes</b><span>Marca o que sobrou como Dispensado (imprevisto justificado).</span></button>' : '') +
      '</div>', foot: '<button class="btn" type="button" data-k="x">Fechar</button>'
  });
  $$('[data-k]', s).forEach(function (b) {
    b.onclick = function () {
      var k = b.getAttribute('data-k'); Sheet.close();
      if (k === 'folga') folgaSheet(iso);
      else if (k === 'limpar') { Store.checkpoint(); Store.mutate(function (S2) { delete S2.reg[iso]; }, [Store.dateShard(iso)]); Toast('Registros do dia removidos', { label: 'Desfazer', fn: function () { Store.undo(); } }); }
      else if (k === 'disp') Store.mutate(function (S2) { var day = S2.reg[iso] || (S2.reg[iso] = {}); D.list.forEach(function (x) { if (!x.fixo && !x.entry) day[x.row.nome] = { s: 'Dispensado' }; }); }, [Store.dateShard(iso)]);
    };
  });
};
function folgaSheet(iso) {
  var S = Store.get(), rs = folgaRanges(S), motivos = ['Viagem', 'Folga', 'Doença', 'Imprevisto'];
  var s = Sheet.open({
    title: 'Folgas e viagens', sub: 'Dias marcados aqui aparecem no plano, mas não entram na execução, no XP nem na sequência.',
    body: '<div class="form"><div class="f2"><label class="f">De<input type="date" id="fg-de" value="' + iso + '"></label><label class="f">Até<input type="date" id="fg-ate" value="' + iso + '"></label></div>' +
      '<label class="f">Motivo<input type="text" id="fg-mot" value="Viagem" maxlength="40"></label>' +
      '<div class="row wrap">' + motivos.map(function (m) { return '<button class="chip" type="button" data-m="' + m + '">' + m + '</button>'; }).join('') + '</div>' +
      (rs.length ? '<div class="eyebrow" style="margin-top:6px">Já marcados</div><div class="card flat">' + rs.map(function (r, i) {
        return '<div class="item"><span><span class="n">' + (r.ini === r.fim ? F.dmy(r.ini) : F.dm(r.ini) + ' a ' + F.dmy(r.fim)) + '</span><span class="sub">' + esc(r.motivo) + '</span></span><button class="btn sm danger" type="button" data-r="' + i + '">Remover</button></div>';
      }).join('') + '</div>' : '') + '</div>',
    foot: '<button class="btn" type="button" data-k="x">Fechar</button><button class="btn primary" type="button" data-k="ok">Marcar dias</button>'
  });
  $$('[data-m]', s).forEach(function (b) { b.onclick = function () { $('#fg-mot', s).value = b.getAttribute('data-m'); }; });
  $$('[data-r]', s).forEach(function (b) {
    b.onclick = function () {
      var r = rs[+b.getAttribute('data-r')], ids = {};
      Store.mutate(function (S2) { for (var n = OPX.toN(r.ini); n <= OPX.toN(r.fim); n++) delete S2.folgas[OPX.toISO(n)]; }, ['cfg']);
      Sheet.close(); folgaSheet(iso);
    };
  });
  $('[data-k="x"]', s).onclick = function () { Sheet.close(); };
  $('[data-k="ok"]', s).onclick = function () {
    var de = $('#fg-de', s).value, ate = $('#fg-ate', s).value || de, mot = $('#fg-mot', s).value.trim() || 'Folga';
    if (!de || OPX.toN(ate) < OPX.toN(de)) { Toast('Confira as datas: "Até" não pode ser antes de "De".'); return; }
    if (OPX.toN(ate) - OPX.toN(de) > 120) { Toast('Escolha um período de até 120 dias.'); return; }
    Store.mutate(function (S2) { for (var n = OPX.toN(de); n <= OPX.toN(ate); n++) S2.folgas[OPX.toISO(n)] = mot; }, ['cfg']);
    Sheet.close(); Toast((OPX.toN(ate) > OPX.toN(de) ? 'Dias marcados: ' : 'Dia marcado: ') + mot);
  };
}
