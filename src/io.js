/* ===== OP% · importar e exportar (JSON, Excel do OP%, planilha de dados) ===== */
var IO = (function () {
  var nz = function (s) { return String(s == null ? '' : s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim(); };
  var toISO = function (v) {
    if (typeof v === 'number' && v > 20000) return OPX.toISO(Math.floor(v) - 25569);
    if (v instanceof Date) return OPX.toISO(Math.round(Date.UTC(v.getFullYear(), v.getMonth(), v.getDate()) / 86400000));
    if (typeof v === 'string') {
      var m = v.match(/^(\d{4})-(\d{2})-(\d{2})/); if (m) return m[1] + '-' + m[2] + '-' + m[3];
      m = v.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/); if (m) return m[3] + '-' + m[2].padStart(2, '0') + '-' + m[1].padStart(2, '0');
    }
    return '';
  };
  var toHM = function (v) {
    if (typeof v === 'number') { var m = Math.round((v % 1) * 1440); return OPX.fmtHM(m >= 1440 ? 0 : m); }
    if (typeof v === 'string' && /^\d{1,2}:\d{2}/.test(v)) { var p = v.split(':'); return OPX.pad(+p[0]) + ':' + p[1].slice(0, 2); }
    return '';
  };
  var STATUS = { concluido: 'Concluído', parcial: 'Parcial', 'nao feito': 'Não feito', dispensado: 'Dispensado' };
  var numOrNull = function (v) { return typeof v === 'number' && isFinite(v) ? v : (typeof v === 'string' && v.trim() !== '' && isFinite(+v.replace(',', '.')) ? +v.replace(',', '.') : null); };

  function findTable(rows, needles) {                            // acha a linha de cabeçalho e mapeia colunas
    for (var i = 0; i < Math.min(rows.length, 15); i++) {
      var map = {}, hit = 0; (rows[i] || []).forEach(function (c, j) { var k = nz(c); if (k && map[k] == null) map[k] = j; });
      needles.forEach(function (n) { if (map[n] != null) hit++; });
      if (hit === needles.length) return { map: map, rows: rows.slice(i + 1) };
    }
    return null;
  }
  function cell(rows, ref) { var m = ref.match(/^([A-Z]+)(\d+)$/), c = 0; m[1].split('').forEach(function (ch) { c = c * 26 + ch.charCodeAt(0) - 64; }); var r = rows[+m[2] - 1]; return r ? r[c - 1] : null; }

  async function parseWorkbook(XLSX, data) {
    var wb = await XLSX.read(data, { type: 'array' });
    var aoa = function (name) {
      var n = wb.SheetNames.filter(function (x) { return nz(x) === nz(name); })[0]; if (!n) return null;
      var ws = wb.Sheets[n], rows = XLSX.utils.sheet_to_json(ws, { header: 1, raw: true, defval: null }), rg = ws['!ref'] ? XLSX.utils.decode_range(ws['!ref']) : { s: { r: 0, c: 0 } };
      if (rg.s.c > 0) rows = rows.map(function (r) { return new Array(rg.s.c).fill(null).concat(r); });
      for (var i = 0; i < rg.s.r; i++) rows.unshift([]);                 // alinha com a linha 1 da planilha
      return rows;
    };
    var out = { cfg: OPD.baseCfg(Store.todayISO()), rot: [], reg: {}, chk: {}, metas: [], rev: {}, folgas: {} }, info = { regs: 0, rot: 0, chk: 0, metas: 0, rev: 0 };
    var cf = aoa('CONFIG');
    if (cf) try {
      var c = out.cfg, g = function (r) { return cell(cf, r); };
      c.inicio = toISO(g('C6')) || c.inicio; c.metaDia = numOrNull(g('C8')) || c.metaDia; c.bonus = numOrNull(g('C9')) == null ? c.bonus : numOrNull(g('C9'));
      c.inicioDia = toHM(g('C10')) || c.inicioDia; c.metaSono = numOrNull(g('C11')) || c.metaSono; c.notaAlvo = numOrNull(g('C12')) || c.notaAlvo; c.minRank = numOrNull(g('C13')) || c.minRank;
      var cats = [], k = 1;
      for (var r = 18; r <= 29; r++) { var nm = g('B' + r); if (nm) { cats.push({ nome: String(nm), meta: numOrNull(g('C' + r)), cor: nz(nm) === 'compromisso' ? 0 : (k <= 8 ? k++ : 0) }); } }
      if (cats.length) c.cats = cats;
      var st = []; for (r = 6; r <= 11; r++) if (g('F' + r)) st.push({ nome: String(g('F' + r)), credito: numOrNull(g('G' + r)), conta: nz(g('H' + r)) === 'sim' }); if (st.length) c.status = st;
      var pri = []; for (r = 15; r <= 17; r++) if (g('F' + r)) pri.push({ nome: String(g('F' + r)), xp: numOrNull(g('G' + r)) || 0 }); if (pri.length) c.pri = pri;
      var nt = []; for (r = 21; r <= 24; r++) if (numOrNull(g('F' + r)) != null) nt.push({ min: numOrNull(g('F' + r)), mult: numOrNull(g('G' + r)) || 1, faixa: String(g('H' + r) || '') }); if (nt.length) c.notas = nt;
      var nv = []; for (r = 6; r <= 15; r++) if (g('L' + r)) nv.push({ xp: numOrNull(g('K' + r)) || 0, nome: String(g('L' + r)) }); if (nv.length) c.niveis = nv;
    } catch (e) { /* mantém padrões */ }
    var rt = aoa('ROTINA'), t = rt && findTable(rt, ['atividade', 'categoria', 'inicio', 'fim']);
    if (t) t.rows.forEach(function (r, i) {
      var nome = r[t.map.atividade]; if (!nome || !toHM(r[t.map.inicio]) || !toHM(r[t.map.fim])) return;
      var dias = ['seg', 'ter', 'qua', 'qui', 'sex', 'sab', 'dom'].map(function (d) { var v = r[t.map[d]]; return (v === 1 || v === '1' || v === true) ? 1 : 0; });
      var reg = r[t.map['registrar?']];
      out.rot.push({ id: OPD.newId(), nome: String(nome), cat: String(r[t.map.categoria] || 'Pessoal'), ini: toHM(r[t.map.inicio]) || '08:00', fim: toHM(r[t.map.fim]) || '09:00',
        pri: r[t.map.prioridade] ? String(r[t.map.prioridade]) : '', dias: dias, de: toISO(r[t.map['vigencia de']]) || out.cfg.inicio, ate: toISO(r[t.map['vigencia ate']]), fixo: nz(reg) === 'nao' });
      info.rot++;
    });
    var rg = aoa('REGISTRO'); t = rg && findTable(rg, ['data', 'atividade', 'status']);
    if (t) t.rows.forEach(function (r) {
      var iso = toISO(r[t.map.data]), nome = r[t.map.atividade], s = r[t.map.status]; if (!iso || !nome || !s) return;
      var e = { s: STATUS[nz(s)] || String(s) }, m = numOrNull(r[t.map['realizado (min)']]), n = numOrNull(r[t.map['nota (1-10)']]), o = r[t.map['observacoes']];
      if (m != null) e.m = m; if (n != null) e.n = n; if (o) e.o = String(o);
      (out.reg[iso] || (out.reg[iso] = {}))[String(nome)] = e; info.regs++;
    });
    var ck = aoa('CHECKIN'); t = ck && findTable(ck, ['data', 'sono (h)']);
    if (t) t.rows.forEach(function (r) {
      var iso = toISO(r[t.map.data]); if (!iso) return;
      var c2 = {}, so = numOrNull(r[t.map['sono (h)']]), en = numOrNull(r[t.map['energia (1-5)']]), hu = numOrNull(r[t.map['humor (1-5)']]), ob = r[t.map['observacao do dia']];
      if (so != null) c2.sono = so; if (en != null) c2.ene = en; if (hu != null) c2.hum = hu; if (ob) c2.obs = String(ob);
      if (Object.keys(c2).length) { out.chk[iso] = c2; info.chk++; }
    });
    var mt = aoa('METAS'); t = mt && findTable(mt, ['meta', 'categoria', 'tipo', 'alvo']);
    if (t) t.rows.forEach(function (r) {
      var nome = r[t.map.meta]; if (!nome || numOrNull(r[t.map.alvo]) == null) return;
      out.metas.push({ id: OPD.newId(), nome: String(nome), cat: String(r[t.map.categoria] || 'Todas'), tipo: nz(r[t.map.tipo]) === 'horas' ? 'Horas' : 'Sessões', alvo: numOrNull(r[t.map.alvo]), ini: toISO(r[t.map.inicio]), fim: toISO(r[t.map.prazo]) }); info.metas++;
    });
    var rv = aoa('REVISÃO') || aoa('REVISAO'); t = rv && findTable(rv, ['semana (segunda)']);
    if (t) t.rows.forEach(function (r) {
      var iso = toISO(r[t.map['semana (segunda)']]); if (!iso) return;
      var x = {}, nt = numOrNull(r[t.map['nota da semana (1-10)']]);
      if (nt != null) x.nota = nt; if (r[t.map['o que funcionou']]) x.ok = String(r[t.map['o que funcionou']]);
      if (r[t.map['o que ajustar']]) x.ajustar = String(r[t.map['o que ajustar']]); if (r[t.map['foco da proxima semana']]) x.foco = String(r[t.map['foco da proxima semana']]);
      if (Object.keys(x).length) { out.rev[iso] = x; info.rev++; }
    });
    if (!info.rot && !info.regs) throw new Error('Não encontrei as abas ROTINA e REGISTRO do OP%. Confira se é o arquivo OP_Sistema.xlsx.');
    var first = Object.keys(out.reg).sort()[0]; if (first && first < out.cfg.inicio) out.cfg.inicio = first;
    return { state: out, info: info };
  }

  function parseJSON(txt) {
    var o = JSON.parse(txt), s = o && (o.state || o);
    if (!s || !s.cfg || !s.rot) throw new Error('Este arquivo não parece um backup do OP%.');
    return { state: Store.norm(s), info: { regs: Object.keys(s.reg || {}).reduce(function (n, d) { return n + Object.keys(s.reg[d]).length; }, 0), rot: s.rot.length, chk: Object.keys(s.chk || {}).length, metas: (s.metas || []).length, rev: Object.keys(s.rev || {}).length } };
  }

  function merge(cur, inc) {
    var out = JSON.parse(JSON.stringify(cur));
    Object.keys(inc.reg).forEach(function (d) { out.reg[d] = Object.assign(out.reg[d] || {}, inc.reg[d]); });
    Object.keys(inc.chk).forEach(function (d) { out.chk[d] = Object.assign(out.chk[d] || {}, inc.chk[d]); });
    Object.keys(inc.rev).forEach(function (d) { out.rev[d] = Object.assign(out.rev[d] || {}, inc.rev[d]); });
    Object.keys(inc.folgas || {}).forEach(function (d) { out.folgas[d] = inc.folgas[d]; });
    inc.rot.forEach(function (r) { if (!out.rot.some(function (x) { return x.nome === r.nome && x.de === r.de; })) out.rot.push(r); });
    inc.metas.forEach(function (m) { if (!out.metas.some(function (x) { return x.nome === m.nome; })) out.metas.push(m); });
    inc.cfg.cats.forEach(function (c) { if (!out.cfg.cats.some(function (x) { return x.nome === c.nome; })) out.cfg.cats.push(c); });
    if (OPX.toN(inc.cfg.inicio) < OPX.toN(out.cfg.inicio)) out.cfg.inicio = inc.cfg.inicio;
    return out;
  }

  /* ---- exportação em planilha: mesmas colunas do OP_Sistema.xlsx + BASE para Power BI/Python ---- */
  function buildWorkbook(XLSX, S, M) {
    var wb = XLSX.utils.book_new();
    var D = function (iso) { return iso ? { t: 'n', v: OPX.toN(iso) + 25569, z: 'dd/mm/yyyy' } : null; };
    var T = function (hm) { return { t: 'n', v: OPX.hm(hm) / 1440, z: 'hh:mm' }; };
    var add = function (name, rows, widths) { var ws = XLSX.utils.aoa_to_sheet(rows); ws['!cols'] = widths.map(function (w) { return { wch: w }; }); XLSX.utils.book_append_sheet(wb, ws, name); };
    var reg = [['Data', 'Atividade', 'Status', 'Realizado (min)', 'Nota (1-10)', 'Observações']];
    Object.keys(S.reg).sort().forEach(function (d) { Object.keys(S.reg[d]).forEach(function (n) { var e = S.reg[d][n]; reg.push([D(d), n, e.s, e.m == null ? null : e.m, e.n == null ? null : e.n, e.o || null]); }); });
    add('REGISTRO', reg, [12, 38, 12, 15, 11, 40]);
    var chk = [['Data', 'Sono (h)', 'Energia (1-5)', 'Humor (1-5)', 'Observação do dia']];
    Object.keys(S.chk).sort().forEach(function (d) { var c = S.chk[d]; chk.push([D(d), c.sono == null ? null : c.sono, c.ene == null ? null : c.ene, c.hum == null ? null : c.hum, c.obs || null]); });
    add('CHECKIN', chk, [12, 10, 14, 12, 40]);
    var rot = [['Atividade', 'Categoria', 'Início', 'Fim', 'Prioridade', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom', 'Vigência de', 'Vigência até', 'Registrar?']];
    S.rot.forEach(function (r) { rot.push([r.nome, r.cat, T(r.ini), T(r.fim), r.pri || null].concat(r.dias).concat([D(r.de), D(r.ate), r.fixo ? 'Não' : 'Sim'])); });
    add('ROTINA', rot, [38, 14, 8, 8, 11, 5, 5, 5, 5, 5, 5, 5, 13, 13, 11]);
    var ms = M.metas(), met = [['Meta', 'Categoria', 'Tipo', 'Alvo', 'Início', 'Prazo', 'Realizado', '% da meta', 'Situação']];
    ms.forEach(function (m) { met.push([m.nome, m.cat, m.tipo, m.alvo, D(m.ini), D(m.fim), Math.round(m.real * 100) / 100, m.pct == null ? null : { t: 'n', v: m.pct, z: '0%' }, m.sit]); });
    add('METAS', met, [44, 14, 9, 8, 12, 12, 10, 10, 14]);
    var rev = [['Semana (segunda)', 'Nota da semana (1-10)', 'O que funcionou', 'O que ajustar', 'Foco da próxima semana']];
    Object.keys(S.rev).sort().forEach(function (d) { var r = S.rev[d]; rev.push([D(d), r.nota == null ? null : r.nota, r.ok || null, r.ajustar || null, r.foco || null]); });
    add('REVISÃO', rev, [16, 20, 40, 40, 40]);
    var fo = [['Data', 'Motivo']]; Object.keys(S.folgas).sort().forEach(function (d) { fo.push([D(d), S.folgas[d]]); }); add('FOLGAS', fo, [12, 30]);
    var base = [['Data', 'Dia da semana', 'Semana (segunda)', 'Mês', 'Planejadas', 'Registradas', 'Execução', 'Registro completo', 'Min. planejados', 'Min. realizados', 'XP do dia', 'Dia bom', 'Sequência', 'Sono (h)', 'Energia', 'Humor', 'Folga']];
    M.days.forEach(function (d) {
      base.push([D(d.iso), OPX.DIAS_NOME[d.wd], D(OPX.toISO(d.sem)), D(OPX.toISO(d.mes)), d.F, d.G, d.exec == null ? null : { t: 'n', v: d.exec, z: '0%' }, d.cons == null ? null : { t: 'n', v: d.cons, z: '0%' },
        d.minplan, d.minreal, d.xp, d.bom, d.seq, d.sono, d.ene, d.hum, d.folga ? 'Sim' : null]);
    });
    add('BASE', base, [12, 14, 16, 11, 11, 12, 10, 16, 14, 14, 10, 9, 10, 9, 9, 9, 7]);
    return wb;
  }

  function loadXLSX() { return Promise.resolve(MiniXLSX); }     // leitor/gravador próprio (minixlsx.js): sem internet
  async function saveFile(filename, data) {
    var ok = false, dl = null; try { dl = window.claude && window.claude.use ? await window.claude.use('downloads') : null; } catch (e) { dl = null; }
    if (dl) {
      try { await dl.save({ filename: filename, data: data }); Toast('Arquivo enviado para salvar'); ok = true; }
      catch (e) { if (!e || e.code !== 'declined') Toast('Não foi possível salvar o arquivo.'); }
    } else {
      try {
        var json = /\.json$/i.test(filename);
        var blob = data instanceof Blob ? data : new Blob([data], { type: json ? 'application/json' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = filename; a.rel = 'noopener'; a.style.display = 'none';
        document.body.appendChild(a); a.click();
        setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 5000);
        Toast('Arquivo baixado. Procure em Downloads.'); ok = true;
      } catch (e) { Toast('Não foi possível baixar o arquivo. Use “Copiar backup”.'); }
    }
    if (ok) lsSet('opx:lastbk', Store.todayISO());
    return ok;
  }
  return { parseWorkbook: parseWorkbook, parseJSON: parseJSON, merge: merge, buildWorkbook: buildWorkbook, loadXLSX: loadXLSX, saveFile: saveFile, toISO: toISO, toHM: toHM };
})();
if (typeof module !== 'undefined' && module.exports) module.exports = IO;
