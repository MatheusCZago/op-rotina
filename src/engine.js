/* ===== OP% · motor de cálculo (porta fiel das regras do Excel V1.0) ===== */
(function (root) {
'use strict';
var DAY = 86400000;
var pad = function (n) { return String(n).padStart(2, '0'); };
var toN = function (iso) { var p = String(iso).split('-'); return Math.round(Date.UTC(+p[0], +p[1] - 1, +p[2]) / DAY); };
var toISO = function (n) { var d = new Date(n * DAY); return d.getUTCFullYear() + '-' + pad(d.getUTCMonth() + 1) + '-' + pad(d.getUTCDate()); };
var wdOf = function (n) { return (((n % 7) + 7 + 3) % 7); };           // 0 = segunda
var mondayOf = function (n) { return n - wdOf(n); };
var monthStart = function (n) { var d = new Date(n * DAY); return Math.round(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1) / DAY); };
var addMonths = function (n, k) { var d = new Date(n * DAY); return Math.round(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + k, 1) / DAY); };
var hm = function (s) { var p = String(s || '0:0').split(':'); return (+p[0]) * 60 + (+p[1] || 0); };
var fmtHM = function (m) { m = ((m % 1440) + 1440) % 1440; return pad(Math.floor(m / 60)) + ':' + pad(m % 60); };
var durMin = function (a, b) { return (((hm(b) - hm(a)) % 1440) + 1440) % 1440; };
var r0 = function (v) { return Math.round(+(+v).toPrecision(12)); };
var sum = function (a) { var s = 0; for (var i = 0; i < a.length; i++) s += a[i]; return s; };
var avg = function (a) { return a.length ? sum(a) / a.length : null; };
var num = function (v) { return typeof v === 'number' && isFinite(v); };
var EPS = 1e-9;

var PERIODOS = [
  { id: 'semana', nome: 'Semana atual' }, { id: '7', nome: 'Últimos 7 dias' }, { id: '30', nome: 'Últimos 30 dias' },
  { id: '90', nome: 'Últimos 90 dias' }, { id: 'mes', nome: 'Mês atual' }, { id: 'tudo', nome: 'Tudo' }
];
var DIAS_ABREV = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
var DIAS_NOME = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];

function build(S, refISO) {
  var cfg = S.cfg, ref = toN(refISO), ini = toN(cfg.inicio);
  var stMap = {}; cfg.status.forEach(function (s) { stMap[s.nome] = s; });
  var priXp = {}; cfg.pri.forEach(function (p) { priXp[p.nome] = p.xp; });
  var notas = cfg.notas.slice().sort(function (a, b) { return a.min - b.min; });
  var niveis = cfg.niveis.slice().sort(function (a, b) { return a.xp - b.xp; });
  var multNota = function (n) { if (n == null || n === '') return 1; var m = null; for (var i = 0; i < notas.length; i++) if (notas[i].min <= n) m = notas[i].mult; return m == null ? 1 : m; };

  // ---- ROTINA ----------------------------------------------------------------
  var rot = [], byName = {};
  S.rot.forEach(function (r, i) {
    if (!r.nome) return;
    var o = Object.assign({}, r, {
      idx: i, dur: durMin(r.ini, r.fim), xp: r.pri ? (priXp[r.pri] || 0) : 0,
      deN: r.de ? toN(r.de) : -Infinity, ateN: r.ate ? toN(r.ate) : Infinity,
      ordKey: ((hm(r.ini) - hm(cfg.inicioDia)) % 1440 + 1440) % 1440
    });
    rot.push(o); (byName[o.nome] || (byName[o.nome] = [])).push(o);
  });
  var vigente = function (rows, n) { var f = null; rows.forEach(function (r) { if (r.deN <= n && n <= r.ateN) f = r; }); return f; };
  var planned = function (n) {                                   // linhas da ROTINA vigentes no dia (inclui fixos)
    var wd = wdOf(n);
    return rot.filter(function (r) { return r.deN <= n && n <= r.ateN && r.dias[wd] === 1; });
  };

  // ---- REGISTROS achatados -----------------------------------------------------
  var regs = [], byDate = {};
  Object.keys(S.reg).forEach(function (iso) {
    var n = toN(iso); if (n < ini) return;
    var day = S.reg[iso];
    Object.keys(day).forEach(function (nome) {
      var e = day[nome], rows = byName[nome], row = null, refOk = false, alerta = 'OK';
      if (!rows) alerta = 'Atividade não existe na ROTINA';
      else if (rows.some(function (r) { return r.fixo; })) alerta = 'Atividade fixa — não precisa registrar';
      else { refOk = true; row = vigente(rows, n); if (!row) { row = rows[0]; alerta = 'Atividade fora da vigência nesta data'; } }
      if (alerta === 'OK') {
        if (n > ref) alerta = 'Data futura';
        else if (e.n != null && (e.n < 1 || e.n > 10)) alerta = 'Nota fora de 1-10';
        else if (e.m != null && e.m < 0) alerta = 'Minutos negativos';
      }
      var st = stMap[e.s], cred = (refOk && st && st.conta) ? st.credito : null;
      var plan = refOk ? row.dur : 0;
      var o = {
        iso: iso, n: n, nome: nome, s: e.s, m: e.m == null ? null : e.m, nota: e.n == null ? null : e.n, obs: e.o || '',
        refOk: refOk, row: row, cat: refOk ? row.cat : '?', plan: plan, cred: cred, alerta: alerta,
        min: cred != null ? (e.m != null ? e.m : plan * cred) : null,
        xp: cred != null ? r0(row.xp * cred * multNota(e.n)) : null,
        sem: mondayOf(n), mes: monthStart(n)
      };
      regs.push(o); (byDate[n] || (byDate[n] = [])).push(o);
    });
  });

  // ---- CHECK-IN ------------------------------------------------------------------
  var chkBy = {};
  Object.keys(S.chk).forEach(function (iso) { chkBy[toN(iso)] = S.chk[iso]; });

  // ---- BASE (um dia por linha) ---------------------------------------------------
  function dayStats(n) {
    var folga = !!(S.folgas && S.folgas[toISO(n)]);
    var F = folga ? 0 : planned(n).filter(function (r) { return !r.fixo; }).length;
    var rs = byDate[n] || [], valid = rs.filter(function (r) { return r.refOk; });
    var G = valid.length, withC = valid.filter(function (r) { return r.cred != null; }), H = withC.length;
    var I = sum(withC.map(function (r) { return r.cred; }));
    var den = Math.max(F - (G - H), H);
    var exec = (G === 0 || den <= 0) ? null : Math.min(1, I / den);
    var cons = F === 0 ? null : Math.min(1, G / F);
    var bom = exec == null ? null : (exec >= cfg.metaDia - EPS ? 1 : 0);
    var bonus = bom === 1 ? cfg.bonus : 0, xpat = sum(withC.map(function (r) { return r.xp; }));
    var nts = rs.filter(function (r) { return r.nota != null; }).map(function (r) { return r.nota; });
    var c = chkBy[n] || {};
    return {
      n: n, iso: toISO(n), wd: wdOf(n), sem: mondayOf(n), mes: monthStart(n), folga: folga, F: F, G: G, H: H, pts: I, exec: exec, cons: cons,
      minplan: sum(withC.map(function (r) { return r.plan; })), minreal: sum(withC.map(function (r) { return r.min; })),
      xpat: xpat, bom: bom, bonus: bonus, xp: xpat + bonus, nota: avg(nts), seq: null,
      sono: num(c.sono) ? c.sono : null, ene: num(c.ene) ? c.ene : null, hum: num(c.hum) ? c.hum : null
    };
  }
  var days = [], dayMap = {}, seq = 0;
  for (var n = ini; n <= ref; n++) {
    var d = dayStats(n);
    if (d.bom === 1) seq += 1; else if (n === ref) { /* hoje aberto não quebra */ } else if (d.bom === 0 || (d.F > 0 && d.G === 0)) seq = 0;
    d.seq = seq; days.push(d); dayMap[n] = d;
  }

  // ---- período -------------------------------------------------------------------
  function periodStart(id) {
    switch (id) {
      case 'semana': return mondayOf(ref);
      case '7': return ref - 6;
      case '30': return ref - 29;
      case '90': return ref - 89;
      case 'mes': return monthStart(ref);
      default: return ini;
    }
  }
  var nivelDe = function (xp) { var lv = 1; niveis.forEach(function (x, i) { if (xp >= x.xp) lv = i + 1; }); return lv; };

  function kpis(deN) {
    var D = days.filter(function (d) { return d.n >= deN; });
    var R = regs.filter(function (r) { return r.n >= deN && r.n <= ref; });
    var k = {};
    k.de = deN; k.ate = ref; k.perDias = Math.max(0, ref - Math.max(deN, ini) + 1);
    k.dias = D.filter(function (d) { return d.G > 0; }).length;
    k.exec = avg(D.filter(function (d) { return d.exec != null; }).map(function (d) { return d.exec; }));
    k.cons = avg(D.filter(function (d) { return d.cons != null; }).map(function (d) { return d.cons; }));
    k.hplan = sum(D.map(function (d) { return d.minplan; })) / 60;
    k.hreal = sum(D.map(function (d) { return d.minreal; })) / 60;
    k.adh = k.hplan === 0 ? null : k.hreal / k.hplan;
    k.nota = avg(R.filter(function (r) { return r.nota != null; }).map(function (r) { return r.nota; }));
    k.bons = sum(D.map(function (d) { return d.bom === 1 ? 1 : 0; }));
    k.seq = days.length ? days[days.length - 1].seq : 0;
    k.seqmax = days.reduce(function (m, d) { return Math.max(m, d.seq || 0); }, 0);
    k.xp = sum(D.map(function (d) { return d.xp; }));
    k.xptot = sum(days.map(function (d) { return d.xp; }));
    k.nivel = nivelDe(k.xptot);
    k.titulo = niveis[k.nivel - 1].nome;
    k.maxNivel = k.nivel >= niveis.length;
    k.xpprox = k.maxNivel ? 0 : niveis[k.nivel].xp - k.xptot;
    k.prog = k.maxNivel ? 1 : (k.xptot - niveis[k.nivel - 1].xp) / (niveis[k.nivel].xp - niveis[k.nivel - 1].xp);
    var col = function (key, filt) { return avg(D.filter(function (d) { return d[key] != null && (!filt || filt(d)); }).map(function (d) { return d[key]; })); };
    k.sono = col('sono'); k.ene = col('ene'); k.hum = col('hum');
    k.execSonoOk = avg(D.filter(function (d) { return d.exec != null && d.sono != null && d.sono >= cfg.metaSono; }).map(function (d) { return d.exec; }));
    k.execSonoBaixo = avg(D.filter(function (d) { return d.exec != null && d.sono != null && d.sono < cfg.metaSono; }).map(function (d) { return d.exec; }));
    k.alertas = regs.filter(function (r) { return r.alerta !== 'OK'; }).length;
    return k;
  }

  function porCategoria(deN) {
    var R = regs.filter(function (r) { return r.n >= deN && r.n <= ref; });
    var perDias = Math.max(0, ref - Math.max(deN, ini) + 1);
    return cfg.cats.map(function (c) {
      var X = R.filter(function (r) { return r.cat === c.nome && r.cred != null; });
      var hplan = sum(X.map(function (r) { return r.plan; })) / 60, hreal = sum(X.map(function (r) { return r.min; })) / 60;
      var hsem = perDias ? hreal / (perDias / 7) : null;
      var meta = (c.meta == null || c.meta === '') ? null : +c.meta;
      return {
        nome: c.nome, meta: meta, registros: X.length, exec: avg(X.map(function (r) { return r.cred; })),
        hplan: hplan, hreal: hreal, adh: hplan > 0 ? hreal / hplan : null,
        nota: avg(X.filter(function (r) { return r.nota != null; }).map(function (r) { return r.nota; })),
        xp: sum(X.map(function (r) { return r.xp; })), hsem: hsem,
        pct: (meta != null && meta > 0 && hsem != null) ? hsem / meta : null
      };
    });
  }

  function porAtividade(deN) {
    var seen = {}, out = [];
    rot.forEach(function (r) {
      if (seen[r.nome]) return; seen[r.nome] = 1;
      var all = regs.filter(function (x) { return x.nome === r.nome; });
      var X = all.filter(function (x) { return x.n >= deN && x.n <= ref && x.cred != null; });
      var ult = all.length ? all.reduce(function (m, x) { return Math.max(m, x.n); }, -Infinity) : null;
      out.push({
        nome: r.nome, cat: r.cat, fixo: !!r.fixo, registros: X.length, concluidos: X.filter(function (x) { return x.cred >= 1; }).length,
        exec: avg(X.map(function (x) { return x.cred; })),
        nota: avg(X.filter(function (x) { return x.nota != null; }).map(function (x) { return x.nota; })),
        hreal: sum(X.map(function (x) { return x.min; })) / 60, xp: sum(X.map(function (x) { return x.xp; })),
        ultima: ult, diasSem: ult == null ? null : ref - ult, idx: out.length
      });
    });
    return out;
  }
  function atencao(acts) {
    return acts.filter(function (a) { return !a.fixo && a.registros >= cfg.minRank && a.exec != null; })
      .sort(function (a, b) { return a.exec - b.exec || a.idx - b.idx; }).slice(0, 3);
  }

  function porDiaSemana(deN) {
    var D = days.filter(function (d) { return d.n >= deN; });
    return [0, 1, 2, 3, 4, 5, 6].map(function (w) {
      var X = D.filter(function (d) { return d.wd === w; });
      return {
        wd: w, nome: DIAS_NOME[w], abrev: DIAS_ABREV[w], dias: X.filter(function (d) { return d.G > 0; }).length,
        exec: avg(X.filter(function (d) { return d.exec != null; }).map(function (d) { return d.exec; })),
        xp: avg(X.filter(function (d) { return d.G > 0; }).map(function (d) { return d.xp; }))
      };
    });
  }

  function serieDias(k) {
    var out = [];
    for (var i = 0; i < k; i++) {
      var n = ref - (k - 1) + i, d = dayMap[n];
      out.push({ n: n, iso: toISO(n), exec: d ? d.exec : null, cons: d ? d.cons : null, xp: d ? d.xp : 0, bom: d ? d.bom : null, F: d ? d.F : 0, G: d ? d.G : 0, antes: n < ini });
    }
    return out;
  }
  function weekAgg(w) {
    var D = days.filter(function (d) { return d.sem === w; });
    var R = regs.filter(function (r) { return r.sem === w && r.n <= ref; });
    return {
      sem: w, iso: toISO(w), exec: avg(D.filter(function (d) { return d.exec != null; }).map(function (d) { return d.exec; })),
      cons: avg(D.filter(function (d) { return d.cons != null; }).map(function (d) { return d.cons; })),
      horas: sum(D.map(function (d) { return d.minreal; })) / 60, hplan: sum(D.map(function (d) { return d.minplan; })) / 60,
      xp: sum(D.map(function (d) { return d.xp; })),
      nota: avg(R.filter(function (r) { return r.nota != null; }).map(function (r) { return r.nota; })),
      bons: sum(D.map(function (d) { return d.bom === 1 ? 1 : 0; })),
      sono: avg(D.filter(function (d) { return d.sono != null; }).map(function (d) { return d.sono; })),
      dias: D.filter(function (d) { return d.G > 0; }).length
    };
  }
  function serieSemanas(k) {
    var out = [], base = mondayOf(ref);
    for (var i = 0; i < k; i++) out.push(weekAgg(base - 7 * (k - 1 - i)));
    return out;
  }
  function serieMeses(k) {
    var out = [];
    for (var i = 0; i < k; i++) {
      var m = addMonths(ref, -(k - 1) + i);
      var D = days.filter(function (d) { return d.mes === m; });
      var R = regs.filter(function (r) { return r.mes === m && r.n <= ref; });
      out.push({
        mes: m, iso: toISO(m), exec: avg(D.filter(function (d) { return d.exec != null; }).map(function (d) { return d.exec; })),
        horas: sum(D.map(function (d) { return d.minreal; })) / 60, xp: sum(D.map(function (d) { return d.xp; })),
        nota: avg(R.filter(function (r) { return r.nota != null; }).map(function (r) { return r.nota; })),
        dias: D.filter(function (d) { return d.G > 0; }).length
      });
    }
    return out;
  }

  // ---- METAS ----------------------------------------------------------------------
  function metas() {
    return S.metas.map(function (m) {
      var a = toN(m.ini), b = toN(m.fim);
      var X = regs.filter(function (r) { return r.n >= a && r.n <= b && r.n <= ref && (m.cat === 'Todas' || r.cat === m.cat); });
      var real = m.tipo === 'Horas' ? sum(X.filter(function (r) { return r.min != null; }).map(function (r) { return r.min; })) / 60
        : X.filter(function (r) { return r.cred != null && r.cred >= 1; }).length;
      var pct = m.alvo > 0 ? real / m.alvo : null;
      var tempo = Math.max(0, Math.min(1, (ref - a + 1) / (b - a + 1)));
      var sit = pct == null ? '' : pct >= 1 ? 'Concluída' : ref > b ? 'Prazo vencido' : (ref - a < 7 ? 'Em início' : pct >= tempo ? 'No ritmo' : pct >= tempo * 0.7 ? 'Atenção' : 'Atrasada');
      return Object.assign({}, m, { real: real, pct: pct, tempo: tempo, sit: sit, restam: Math.max(0, b - ref) });
    });
  }

  // ---- insights (mesmas 7 frases do Dashboard do Excel) ------------------------------
  var f1 = function (v) { return (Math.round(v * 10) / 10).toString().replace('.', ','); };
  var pc = function (v) { return Math.round(v * 100) + '%'; };
  function insights(k, wdS, cats, aten) {
    var out = [];
    out.push(k.dias === 0 || k.exec == null ? 'Ainda sem registros no período. Registre o dia na tela Hoje para ativar os insights.'
      : 'Execução média de ' + pc(k.exec) + ' em ' + k.dias + ' dia(s) registrado(s); ' + k.bons + ' dia(s) bom(ns) (meta de ' + pc(cfg.metaDia) + ').');
    var w = wdS.filter(function (x) { return x.exec != null; });
    if (w.length < 2) out.push('Registre mais dias para comparar o desempenho entre os dias da semana.');
    else {
      var mx = w.reduce(function (a, b) { return b.exec > a.exec ? b : a; }), mn = w.reduce(function (a, b) { return b.exec < a.exec ? b : a; });
      out.push('Melhor dia: ' + mx.nome + ' (' + pc(mx.exec) + '). Mais frágil: ' + mn.nome + ' (' + pc(mn.exec) + ').');
    }
    out.push(aten.length ? 'Precisa de atenção: ' + aten[0].nome + ' (' + pc(aten[0].exec) + ' de conclusão).'
      : 'O ranking de atenção aparece quando uma atividade tem ' + cfg.minRank + ' ou mais registros no período.');
    out.push(k.execSonoOk != null && k.execSonoBaixo != null
      ? 'Com sono ≥ ' + f1(cfg.metaSono) + ' h a execução é de ' + pc(k.execSonoOk) + '; com menos, ' + pc(k.execSonoBaixo) + '.'
      : 'Preencha o check-in (sono) para descobrir como a noite de sono afeta a sua execução.');
    var cp = cats.filter(function (c) { return c.pct != null; });
    out.push(k.dias === 0 ? 'Registre alguns dias para comparar cada categoria com a meta semanal.'
      : !cp.length ? 'Defina metas semanais por categoria na aba Rotina.'
        : (function () { var m = cp.reduce(function (a, b) { return b.pct < a.pct ? b : a; }); return 'Categoria mais distante da meta semanal: ' + m.nome + ' (' + pc(m.pct) + ' da meta).'; })());
    out.push('Sequência atual: ' + k.seq + ' dia(s) bom(ns) — recorde: ' + k.seqmax + '.');
    out.push(k.maxNivel ? 'Nível máximo alcançado!' : 'Faltam ' + Math.round(k.xpprox).toLocaleString('pt-BR') + ' XP para o nível ' + (k.nivel + 1) + ' (' + niveis[k.nivel].nome + ').');
    return out;
  }

  // ---- visão de um dia (tela Hoje) ------------------------------------------------------
  function dia(iso) {
    var n = toN(iso), items = planned(n).slice().sort(function (a, b) { return a.ordKey - b.ordKey || a.idx - b.idx; });
    var dayReg = S.reg[iso] || {}, seen = {};
    var list = items.map(function (r) {
      var e = dayReg[r.nome], rr = (byDate[n] || []).filter(function (x) { return x.nome === r.nome; })[0];
      seen[r.nome] = 1;
      return { row: r, fixo: !!r.fixo, entry: e || null, reg: rr || null, status: r.fixo ? 'Fixo' : (e ? e.s : 'Pendente') };
    });
    var extras = Object.keys(dayReg).filter(function (nm) { return !seen[nm]; }).map(function (nm) {
      var rr = (byDate[n] || []).filter(function (x) { return x.nome === nm; })[0];
      return { nome: nm, entry: dayReg[nm], reg: rr || null, row: rr ? rr.row : null };
    });
    var st = (n >= ini && n <= ref) ? dayMap[n] : dayStats(n);
    var folga = !!(S.folgas && S.folgas[iso]);
    var exigidas = folga ? [] : list.filter(function (x) { return !x.fixo; });
    var feitas = exigidas.filter(function (x) { return x.entry; });
    return { iso: iso, n: n, wd: wdOf(n), list: list, extras: extras, st: st, planejadas: exigidas.length, registradas: feitas.length,
      folga: folga ? S.folgas[iso] : null,
      pendentes: exigidas.length - feitas.length, futuro: n > ref, antes: n < ini, hoje: n === ref, chk: S.chk[iso] || null };
  }

  function revisaoDe(wISO) { return weekAgg(toN(wISO)); }

  // conflitos de horário entre atividades registráveis (mesmo dia da semana, vigentes numa data)
  function conflitos(n) {
    var out = [];
    for (var w = 0; w < 7; w++) {
      var base = mondayOf(n) + w;
      var it = planned(base).filter(function (r) { return !r.fixo; }).map(function (r) { var a = hm(r.ini); return { r: r, a: a, b: a + r.dur }; });
      for (var i = 0; i < it.length; i++) for (var j = i + 1; j < it.length; j++) {
        var x = it[i], y = it[j];
        var ov = function (p, q, sh) { return p.a < q.b + sh && q.a + sh < p.b; };
        if (ov(x, y, 0) || ov(x, y, 1440) || ov(x, y, -1440)) out.push({ wd: w, a: x.r.nome, b: y.r.nome });
      }
    }
    return out;
  }

  var M = {
    cfg: cfg, ref: ref, refISO: refISO, ini: ini, rot: rot, regs: regs, days: days, dayMap: dayMap, niveis: niveis, multNota: multNota,
    planned: planned, periodStart: periodStart, kpis: kpis, porCategoria: porCategoria, porAtividade: porAtividade, atencao: atencao,
    porDiaSemana: porDiaSemana, serieDias: serieDias, serieSemanas: serieSemanas, serieMeses: serieMeses, weekAgg: weekAgg,
    metas: metas, insights: insights, dia: dia, dayStats: dayStats, revisaoDe: revisaoDe, conflitos: conflitos, vigente: vigente, byName: byName
  };
  return M;
}

var api = { build: build, toN: toN, toISO: toISO, wdOf: wdOf, mondayOf: mondayOf, monthStart: monthStart, hm: hm, fmtHM: fmtHM, durMin: durMin,
  PERIODOS: PERIODOS, DIAS_ABREV: DIAS_ABREV, DIAS_NOME: DIAS_NOME, r0: r0, avg: avg, sum: sum, pad: pad };
if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.OPX = api;
})(typeof window !== 'undefined' ? window : globalThis);
