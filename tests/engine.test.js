const E = require('../src/engine.js');
const S = require('./demo_state.json'), T = require('./truth.json');
const M = E.build(S, '2026-10-20');
let bad = 0, ok = 0;
const norm = v => (v === '' || v === undefined) ? null : v;
function eq(a, b, label) {
  a = norm(a); b = norm(b);
  const same = (a == null && b == null) || (typeof a === 'number' && typeof b === 'number' && Math.abs(a - b) < 1e-9) || a === b || (a != null && b != null && String(a) === String(b));
  if (same) ok++; else { bad++; if (bad < 40) console.log('DIFF', label, 'app=', a, 'excel=', b); }
}
// BASE
T.base.filter(r => r.iso <= '2026-10-20').forEach(r => {
  const d = M.dayMap[E.toN(r.iso)];
  if (!d) { console.log('sem dia', r.iso); bad++; return; }
  ['F', 'G', 'H'].forEach(k => eq(d[k], r[k], r.iso + ' ' + k));
  eq(d.pts, r.pts, r.iso + ' pts'); eq(d.exec, r.exec, r.iso + ' exec'); eq(d.cons, r.cons, r.iso + ' cons');
  eq(d.minplan, r.minplan, r.iso + ' minplan'); eq(d.minreal, r.minreal, r.iso + ' minreal'); eq(d.xpat, r.xpat, r.iso + ' xpat');
  eq(d.bom, r.bom, r.iso + ' bom'); eq(d.bonus, r.bonus, r.iso + ' bonus'); eq(d.xp, r.xp, r.iso + ' xp');
  eq(d.nota, r.nota, r.iso + ' nota'); eq(d.seq, r.seq, r.iso + ' seq'); eq(d.sono, r.sono, r.iso + ' sono');
});
console.log('BASE ok:', ok, 'bad:', bad);
// KPIs (30 dias)
const de = M.periodStart('30'); eq(E.toISO(de), T.per.de, 'per.de');
const k = M.kpis(de);
['dias', 'exec', 'cons', 'hplan', 'hreal', 'adh', 'nota', 'bons', 'seq', 'seqmax', 'xp', 'xptot', 'nivel', 'titulo', 'xpprox', 'prog', 'sono', 'ene', 'hum', 'execSonoOk', 'execSonoBaixo', 'alertas']
  .forEach(n => eq(k[n], T.kpi[n], 'KPI ' + n));
eq(k.perDias, T.per.dias, 'perDias');
// categorias
const cats = M.porCategoria(de);
T.cat.forEach((c, i) => { const a = cats[i]; eq(a.nome, c.nome, 'cat nome');
  eq(a.registros, c.reg, c.nome + ' reg'); eq(a.exec, c.exec, c.nome + ' exec'); eq(a.hplan, c.hplan, c.nome + ' hplan'); eq(a.hreal, c.hreal, c.nome + ' hreal');
  eq(a.adh, c.adh, c.nome + ' adh'); eq(a.nota, c.nota, c.nome + ' nota'); eq(a.xp, c.xp, c.nome + ' xp'); eq(a.meta, c.meta, c.nome + ' meta');
  eq(a.hsem, c.hsem, c.nome + ' hsem'); eq(a.pct, c.pct, c.nome + ' pct'); });
// atividades (apenas registráveis têm linhas úteis; fixas ficam zeradas)
const acts = M.porAtividade(de);
T.act.forEach(c => { const a = acts.find(x => x.nome === c.nome); if (!a) { bad++; console.log('sem atividade', c.nome); return; }
  eq(a.registros, c.reg, c.nome + ' reg'); eq(a.concluidos, c.conc, c.nome + ' conc'); eq(a.exec, c.exec, c.nome + ' exec'); eq(a.nota, c.nota, c.nome + ' nota');
  eq(a.hreal, c.hreal, c.nome + ' hreal'); eq(a.xp, c.xp, c.nome + ' xp'); eq(a.ultima == null ? null : E.toISO(a.ultima), c.ult, c.nome + ' ult'); eq(a.diasSem, c.diasSem, c.nome + ' diasSem'); });
const aten = M.atencao(acts).map(a => a.nome);
const atenX = T.act.filter(a => a.pos != null).sort((a, b) => a.pos - b.pos).slice(0, 3).map(a => a.nome);
eq(aten.join('|'), atenX.join('|'), 'ranking atenção');
// dia da semana
M.porDiaSemana(de).forEach((w, i) => { eq(w.dias, T.wd[i].dias, 'wd dias ' + i); eq(w.exec, T.wd[i].exec, 'wd exec ' + i); eq(w.xp, T.wd[i].xp, 'wd xp ' + i); });
// semanas
M.serieSemanas(12).forEach((w, i) => { const t = T.w12[i]; eq(w.iso, t.iso, 'w iso ' + i); eq(w.exec || 0, t.exec, 'w exec ' + i); eq(w.cons || 0, t.cons, 'w cons ' + i);
  eq(w.horas, t.horas, 'w horas ' + i); eq(w.xp, t.xp, 'w xp ' + i); eq(w.nota || 0, t.nota, 'w nota ' + i); eq(w.bons, t.bons, 'w bons ' + i); });
M.serieMeses(12).forEach((w, i) => { const t = T.m12[i]; eq(w.iso, t.iso, 'm iso ' + i); eq(w.exec, t.exec, 'm exec ' + i); eq(w.horas, t.horas, 'm horas ' + i);
  eq(w.xp, t.xp, 'm xp ' + i); eq(w.nota, t.nota, 'm nota ' + i); eq(w.dias, t.dias, 'm dias ' + i); });
M.metas().forEach((m, i) => { const t = T.metas[i]; eq(m.real, t.real, 'meta real ' + i); eq(m.pct, t.pct, 'meta pct ' + i); eq(m.tempo, t.tempo, 'meta tempo ' + i);
  eq(m.sit, t.sit, 'meta sit ' + i); eq(m.restam, t.restam, 'meta restam ' + i); });
console.log('TOTAL ok:', ok, 'bad:', bad);
console.log(M.insights(k, M.porDiaSemana(de), cats, M.atencao(acts)).join('\n'));
console.log('conflitos:', M.conflitos(M.ref));
process.exit(bad ? 1 : 0);
