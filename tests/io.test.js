global.window = {}; global.document = {};
const fs = require('fs');
global.OPX = require('../src/engine.js'); global.OPD = require('../src/defaults.js');
global.Store = { todayISO: () => '2026-10-26', norm: s => s };
global.Toast = () => {};
const IO = require('../src/io.js');
const AOA = require('./demo_aoa.json');
const stub = {
  read: () => ({ SheetNames: Object.keys(AOA), Sheets: Object.fromEntries(Object.keys(AOA).map(k => [k, { rows: AOA[k], '!ref': 'A1:Z' + AOA[k].length }])) }),
  utils: { sheet_to_json: ws => ws.rows.map(r => r.slice()), decode_range: () => ({ s: { r: 0, c: 0 } }) }
};
(async () => {
const { state, info } = await IO.parseWorkbook(stub, null);
const truth = require('./demo_state.json');
let bad = 0; const chk = (a, b, l) => { if (JSON.stringify(a) !== JSON.stringify(b)) { bad++; console.log('DIFF', l, JSON.stringify(a).slice(0, 160), '|', JSON.stringify(b).slice(0, 160)); } };
chk(Object.keys(state.reg).sort(), Object.keys(truth.reg).sort(), 'datas reg');
Object.keys(truth.reg).forEach(d => chk(state.reg[d], truth.reg[d], 'reg ' + d));
Object.keys(truth.chk).forEach(d => { const a = state.chk[d], b = truth.chk[d]; chk([a.sono, a.ene, a.hum], [b.sono, b.ene, b.hum], 'chk ' + d); });
chk(state.rot.map(r => [r.nome, r.cat, r.ini, r.fim, r.pri, r.dias, r.de, r.ate, r.fixo]), truth.rot.map(r => [r.nome, r.cat, r.ini, r.fim, r.pri, r.dias, r.de, r.ate, r.fixo]), 'rot');
chk(state.metas.map(m => [m.nome, m.cat, m.tipo, m.alvo, m.ini, m.fim]), truth.metas.map(m => [m.nome, m.cat, m.tipo, m.alvo, m.ini, m.fim]), 'metas');
['inicio', 'metaDia', 'bonus', 'inicioDia', 'metaSono', 'notaAlvo', 'minRank'].forEach(k => chk(state.cfg[k], truth.cfg[k], 'cfg.' + k));
chk(state.cfg.status, truth.cfg.status, 'status'); chk(state.cfg.pri, truth.cfg.pri, 'pri'); chk(state.cfg.notas, truth.cfg.notas, 'notas'); chk(state.cfg.niveis, truth.cfg.niveis, 'niveis');
chk(state.cfg.cats.map(c => [c.nome, c.meta]), truth.cfg.cats.map(c => [c.nome, c.meta]), 'cats');
console.log(info, 'revisões:', Object.keys(state.rev).length);
// o estado importado deve produzir os mesmos números do Excel
const E = OPX; const M = E.build(state, '2026-10-20'), k = M.kpis(M.periodStart('30'));
chk([k.xptot, k.seq, k.nivel, Math.round(k.exec * 1e6)], [7754, 4, 4, Math.round(0.83448275862069 * 1e6)], 'KPIs após importar');
console.log(bad ? 'FALHOU ' + bad : 'IMPORTAÇÃO OK');
process.exit(bad ? 1 : 0);
})();
