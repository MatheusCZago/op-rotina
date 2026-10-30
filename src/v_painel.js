/* ===== OP% · tela PAINEL (indicadores e gráficos) ===== */
function chartCard(id, title, sub, spec, legend, table) {
  spec.alt = title; spec.table = table;
  return '<section class="card"><div class="chart-h"><div><h3>' + title + '</h3><p>' + sub + '</p></div>' +
    '<button class="icon-btn" style="width:36px;height:36px;border-radius:10px" type="button" data-a="ctab" data-id="' + id + '" aria-pressed="false" aria-label="Ver como tabela" title="Gráfico / tabela">' + ic('table', 'sm') + '</button></div>' +
    Charts.host(id, spec) + (legend || '') + '</section>';
}
ACT.ctab = function (el) {
  var host = el.closest('.card').querySelector('.chart'), on = host.getAttribute('data-view') === 'tabela';
  host.setAttribute('data-view', on ? '' : 'tabela'); el.setAttribute('aria-pressed', on ? 'false' : 'true'); Charts.draw(host);
};
var kpi = function (l, v, s, cls) { return '<div class="kpi ' + (cls || '') + '"><div class="l">' + l + '</div><div class="v">' + v + '</div>' + (s ? '<div class="s">' + s + '</div>' : '') + '</div>'; };

VIEWS.painel = function (M) {
  var cfg = M.cfg, per = App.per, de = M.periodStart(per), k = M.kpis(de);
  var cats = M.porCategoria(de), acts = M.porAtividade(de), aten = M.atencao(acts), wdS = M.porDiaSemana(de), ins = M.insights(k, wdS, cats, aten);
  var metaP = F.pct(cfg.metaDia), html = '';
  html += '<div class="row" style="margin-bottom:14px"><div class="seg full" role="tablist" aria-label="Período">' + OPX.PERIODOS.map(function (p) {
    return '<button type="button" data-a="per" data-p="' + p.id + '" aria-pressed="' + (p.id === per) + '">' + p.nome.replace('Últimos ', '').replace(' dias', ' d').replace(' atual', '') + '</button>';
  }).join('') + '</div></div>';
  html += '<p class="hint" style="margin:-4px 0 12px">' + F.dmy(OPX.toISO(Math.max(de, M.ini))) + ' a ' + F.dmy(M.refISO) + ' · ' + k.perDias + ' dia' + (k.perDias === 1 ? '' : 's') + '</p>';
  if (k.alertas > 0) html += alertBanner(M);
  if (!M.regs.length) html += '<div class="card empty" style="margin-bottom:14px"><h3>Ainda sem registros</h3><p>Marque suas atividades na aba Hoje. Os indicadores e gráficos aparecem aqui assim que houver dados.</p></div>';

  html += '<div class="kpis">' +
    kpi('Execução média', F.pct(k.exec), 'meta ' + metaP) + kpi('Registro completo', F.pct(k.cons), 'atividades anotadas') +
    kpi('Dias bons', k.bons, 'de ' + k.dias + ' dia' + (k.dias === 1 ? '' : 's') + ' com registro') +
    kpi('Sequência', k.seq + '<small> dias</small>', 'recorde ' + k.seqmax) +
    kpi('Horas realizadas', F.dec(k.hreal, 1) + '<small> h</small>', 'de ' + F.dec(k.hplan, 1) + ' h registradas') + kpi('Aderência de tempo', F.pct(k.adh), 'realizado ÷ planejado') +
    kpi('XP no período', F.int(k.xp), 'total ' + F.int(k.xptot)) + kpi('Nota média', F.dec(k.nota, 1), 'alvo ' + F.dec(cfg.notaAlvo, 1)) +
    kpi('Sono médio', k.sono == null ? '—' : F.dec(k.sono, 1) + '<small> h</small>', 'meta ' + F.dec(cfg.metaSono, 1) + ' h') +
    kpi('Energia · humor', (k.ene == null ? '—' : F.dec(k.ene, 1)) + '<small> · </small>' + (k.hum == null ? '—' : F.dec(k.hum, 1)), 'escala de 1 a 5') +
    '<div class="kpi lv" style="grid-column: span 2"><div class="l">Nível ' + k.nivel + ' · ' + esc(k.titulo) + '</div><div class="v">' + F.int(k.xptot) + '<small> XP</small></div>' +
    '<div class="meter" aria-hidden="true"><i style="width:' + Math.round(k.prog * 100) + '%"></i></div><div class="s">' + (k.maxNivel ? 'Nível máximo' : 'faltam ' + F.int(k.xpprox) + ' XP para o nível ' + (k.nivel + 1)) + '</div></div></div>';

  if (M.regs.length) {
    html += '<div class="sec"><h2>Tendências</h2><span class="sub">toque nas barras para ver os valores</span></div><div class="cg">';
    // 1) execução diária
    var sd = M.serieDias(30);
    var d1 = sd.map(function (d) {
      var dm = F.dm(d.iso), fg = Store.get().folgas[d.iso];
      return { x: dm, v: d.exec, dim: d.exec != null && d.exec < cfg.metaDia - 1e-9, tip: dm + '|' + (fg ? 'Folga · ' + fg : d.antes ? 'Antes do início' : d.exec == null ? (d.F > 0 && d.G === 0 ? 'Sem registro' : 'Nada para registrar') : 'Execução ' + F.pct(d.exec) + (d.bom ? ' · dia bom' : '')) };
    });
    html += chartCard('c1', 'Execução diária', 'Últimos 30 dias. Barras claras ficaram abaixo da meta.',
      { kind: 'cols', data: d1, yMax: 1, tickFmt: F.pct, meta: cfg.metaDia, metaLabel: 'meta ' + metaP, xw: 38 },
      '<div class="legend"><span><i style="background:var(--accent)"></i>Dia bom</span><span><i style="background:var(--accent);opacity:.4"></i>Abaixo da meta</span><span><i class="ln"></i>Meta ' + metaP + '</span></div>',
      { head: ['Dia', 'Execução'], rows: sd.slice().reverse().map(function (d) { return [F.dm(d.iso), F.pct(d.exec)]; }) });
    // 2) execução semanal
    var sw = M.serieSemanas(12);
    html += chartCard('c2', 'Execução semanal', 'Média da execução dos dias, 12 semanas. Linha cinza: meta de ' + metaP + '.',
      { kind: 'line', data: sw.map(function (w) { return { x: F.dm(w.iso), v: w.exec, tip: 'Semana de ' + F.dm(w.iso) + '|Execução ' + F.pct(w.exec) + '|' + w.bons + ' dia(s) bom(ns)' }; }), yMax: 1, tickFmt: F.pct, valFmt: F.pct, meta: cfg.metaDia, metaLabel: 'meta ' + metaP },
      '', { head: ['Semana', 'Execução', 'Registro', 'Dias bons'], rows: sw.slice().reverse().map(function (w) { return [F.dm(w.iso), F.pct(w.exec), F.pct(w.cons), w.bons]; }) });
    // 3) horas por categoria
    var cs = cats.filter(function (c) { return c.hplan > 0 || c.hreal > 0; });
    if (cs.length) html += chartCard('c3', 'Horas por categoria', 'Planejado e realizado das atividades registradas no período.',
      { kind: 'hbars', valFmt: function (v) { return F.dec(v, 1) + ' h'; }, data: cs.map(function (c) { return { label: c.nome, a: c.hplan, b: c.hreal, tip: c.nome + '|Planejado ' + F.dec(c.hplan, 1) + ' h|Realizado ' + F.dec(c.hreal, 1) + ' h|' + (c.adh == null ? '' : F.pct(c.adh) + ' de aderência') }; }) },
      '<div class="legend"><span><i style="background:var(--plan)"></i>Planejado</span><span><i style="background:var(--accent)"></i>Realizado</span></div>',
      { head: ['Categoria', 'Plan. (h)', 'Real. (h)', 'Execução', 'XP'], rows: cs.map(function (c) { return [esc(c.nome), F.dec(c.hplan, 1), F.dec(c.hreal, 1), F.pct(c.exec), F.int(c.xp)]; }) });
    // 4) dia da semana
    html += chartCard('c4', 'Execução por dia da semana', 'Qual dia rende mais no período.',
      { kind: 'cols', vals: true, valFmt: F.pct, yMax: 1, tickFmt: F.pct, data: wdS.map(function (w) { return { x: w.abrev, v: w.exec, tip: w.nome + '|Execução ' + F.pct(w.exec) + '|' + w.dias + ' dia(s) com registro' }; }) },
      '', { head: ['Dia', 'Execução', 'Dias', 'XP médio'], rows: wdS.map(function (w) { return [w.nome, F.pct(w.exec), w.dias, F.int(w.xp)]; }) });
    // 5) XP por semana
    html += chartCard('c5', 'XP por semana', 'Pontos ganhos, incluindo bônus de dia bom.',
      { kind: 'cols', vals: true, valFmt: F.int, tickFmt: F.int, xw: 40, data: sw.map(function (w) { return { x: F.dm(w.iso), v: w.xp, tip: 'Semana de ' + F.dm(w.iso) + '|' + F.int(w.xp) + ' XP' }; }) },
      '', { head: ['Semana', 'XP'], rows: sw.slice().reverse().map(function (w) { return [F.dm(w.iso), F.int(w.xp)]; }) });
    // 6) horas por semana
    html += chartCard('c6', 'Horas realizadas por semana', 'Tempo contabilizado nas atividades.',
      { kind: 'line', valFmt: function (v) { return F.dec(v, 1) + ' h'; }, tickFmt: function (v) { return F.dec(v, 0); }, data: sw.map(function (w) { return { x: F.dm(w.iso), v: w.horas, tip: 'Semana de ' + F.dm(w.iso) + '|' + F.dec(w.horas, 1) + ' h realizadas' }; }) },
      '', { head: ['Semana', 'Horas'], rows: sw.slice().reverse().map(function (w) { return [F.dm(w.iso), F.dec(w.horas, 1)]; }) });
    // 7) sono x execução
    if (k.execSonoOk != null && k.execSonoBaixo != null) html += chartCard('c7', 'Sono e execução', 'Execução média conforme as horas dormidas.',
      { kind: 'cols', vals: true, valFmt: F.pct, yMax: 1, tickFmt: F.pct, data: [{ x: 'Sono ≥ ' + F.dec(cfg.metaSono, 0) + ' h', v: k.execSonoOk, tip: 'Sono na meta|Execução ' + F.pct(k.execSonoOk) }, { x: 'Sono < ' + F.dec(cfg.metaSono, 0) + ' h', v: k.execSonoBaixo, fill: 'var(--plan)', tip: 'Sono abaixo da meta|Execução ' + F.pct(k.execSonoBaixo) }] },
      '', { head: ['Sono', 'Execução'], rows: [['≥ meta', F.pct(k.execSonoOk)], ['< meta', F.pct(k.execSonoBaixo)]] });
    html += '</div>';
  }

  // metas semanais por categoria
  var gl = cats.filter(function (c) { return c.meta != null && c.meta > 0; });
  if (gl.length && M.regs.length) html += '<div class="sec"><h2>Metas semanais por categoria</h2><span class="sub">média por semana no período</span></div><section class="card">' + gl.map(function (c) {
    var p = c.pct || 0; return '<div class="goal"><div class="goal-h">' + catDot(cfg, c.nome) + esc(c.nome) + '<span class="v">' + F.dec(c.hsem, 1) + ' / ' + F.dec(c.meta, 1) + ' h · ' + F.pct(c.pct) + '</span></div><div class="bar' + (p >= 1 ? ' over' : '') + '"><i style="width:' + Math.min(100, Math.round(p * 100)) + '%"></i></div></div>';
  }).join('') + '</section>';

  html += '<div class="cols" style="margin-top:6px"><div><div class="sec"><h2>Insights</h2></div><section class="card"><ul class="ins">' + ins.map(function (t) { return '<li>' + esc(t) + '</li>'; }).join('') + '</ul></section></div>' +
    '<div><div class="sec"><h2>Precisa de atenção</h2><span class="sub">menor conclusão</span></div><section class="card">' +
    (aten.length ? aten.map(function (a) { return '<div class="goal"><div class="goal-h">' + catDot(cfg, a.cat) + esc(a.nome) + '<span class="v">' + F.pct(a.exec) + ' · ' + a.registros + ' reg.</span></div><div class="bar"><i style="width:' + Math.round(a.exec * 100) + '%"></i></div></div>'; }).join('')
      : '<p class="muted">Aparece quando uma atividade tem ' + cfg.minRank + ' ou mais registros no período.</p>') + '</section></div></div>';

  // desempenho por atividade
  var rows = acts.filter(function (a) { return !a.fixo; });
  html += '<div class="sec"><h2>Por atividade</h2></div><details class="card acc flat"><summary>Desempenho de cada atividade' + ic('chevD', 'sm chev') + '</summary><div class="body"><div class="tbl-wrap"><table class="t"><thead><tr><th>Atividade</th><th>Reg.</th><th>Feitas</th><th>Execução</th><th>Nota</th><th>Horas</th><th>XP</th><th>Última vez</th></tr></thead><tbody>' +
    rows.map(function (a) { return '<tr><td>' + esc(a.nome) + '</td><td>' + a.registros + '</td><td>' + a.concluidos + '</td><td>' + F.pct(a.exec) + '</td><td>' + F.dec(a.nota, 1) + '</td><td>' + F.dec(a.hreal, 1) + '</td><td>' + F.int(a.xp) + '</td><td>' + (a.ultima == null ? '—' : F.dm(OPX.toISO(a.ultima))) + '</td></tr>'; }).join('') + '</tbody></table></div></div></details>';
  return { title: 'Painel', sub: 'indicadores do período', html: html };
};
ACT.per = function (el) { App.per = el.getAttribute('data-p'); render(true); };
