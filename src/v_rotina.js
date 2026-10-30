/* ===== OP% · tela ROTINA (planejar, organizar e administrar atividades) ===== */
var INI = ['S', 'T', 'Q', 'Q', 'S', 'S', 'D'];
var pills = function (d) { return '<span class="pills">' + d.map(function (v, i) { return '<i class="' + (v ? 'on' : '') + '">' + INI[i] + '</i>'; }).join('') + '</span>'; };
function rowSit(r, ref) { return (r.de && OPX.toN(r.de) > ref) ? 'futura' : (r.ate && OPX.toN(r.ate) < ref) ? 'encerrada' : 'vigor'; }
function regCount(S, nome) { return Object.keys(S.reg).reduce(function (n, d) { return n + (S.reg[d][nome] ? 1 : 0); }, 0); }

function rotItem(cfg, r, M, extra) {
  var sit = rowSit(r, M.ref);
  return '<button type="button" class="item' + (sit === 'encerrada' ? ' off' : '') + '" data-a="rotedit" data-id="' + r.id + '"><span><span class="n">' + esc(r.nome) + '</span>' +
    '<span class="sub"><span class="cat" style="display:inline-flex;gap:6px;align-items:center">' + catDot(cfg, r.cat) + esc(r.cat) + '</span><span class="mono">' + r.ini + '–' + r.fim + '</span><span>' + F.min(OPX.durMin(r.ini, r.fim)) + '</span>' +
    (r.fixo ? '<span class="chip">Fixo</span>' : (r.pri ? '<span class="chip' + (r.pri === 'Alta' ? ' acc' : '') + '">' + esc(r.pri) + '</span>' : '')) +
    (sit === 'futura' ? '<span class="chip warn">Começa em ' + F.dm(r.de) + '</span>' : sit === 'encerrada' ? '<span class="chip">Encerrada em ' + F.dm(r.ate) + '</span>' : '') + (extra || '') + '</span></span>' + pills(r.dias) + '</button>';
}

VIEWS.rotina = function (M) {
  var S = Store.get(), cfg = S.cfg, v = App.rotView, html = '', fab = '';
  var wd = App.rotWd == null ? OPX.wdOf(M.ref) : App.rotWd;
  html += '<div class="seg full" style="margin-bottom:14px" role="tablist">' + [['dia', 'Por dia'], ['lista', 'Atividades'], ['cats', 'Categorias']].map(function (t) {
    return '<button type="button" data-a="rotv" data-v="' + t[0] + '" aria-selected="' + (v === t[0]) + '">' + t[1] + '</button>';
  }).join('') + '</div>';

  var vig = M.rot.filter(function (r) { return rowSit(r, M.ref) === 'vigor'; });
  var reg = 0, fix = 0; vig.forEach(function (r) { var h = r.dur * r.dias.reduce(function (a, b) { return a + b; }, 0) / 60; if (r.fixo) fix += h; else reg += h; });

  if (v === 'dia') {
    var n = OPX.mondayOf(M.ref) + wd, items = M.planned(n).slice().sort(function (a, b) { return a.ordKey - b.ordKey || a.idx - b.idx; });
    html += '<div class="seg full" style="margin-bottom:12px">' + OPX.DIAS_ABREV.map(function (d, i) { return '<button type="button" data-a="rotwd" data-w="' + i + '" aria-pressed="' + (i === wd) + '">' + d + '</button>'; }).join('') + '</div>';
    var cf = M.conflitos(n).filter(function (c) { return c.wd === wd; });
    if (cf.length) html += '<div class="banner" style="margin-bottom:12px">' + ic('warn') + '<span>Horários se sobrepõem: ' + cf.map(function (c) { return esc(c.a) + ' e ' + esc(c.b); }).join('; ') + '.</span></div>';
    html += items.length ? '<div class="card flat">' + items.map(function (r) { return rotItem(cfg, r, M); }).join('') + '</div>' :
      '<div class="card empty"><h3>Nada neste dia</h3><p>Toque em “Atividade” para planejar ' + OPX.DIAS_NOME[wd].toLowerCase() + '.</p></div>';
    html += '<div class="row wrap" style="margin-top:12px"><span class="chip acc">' + F.dec(reg, 1) + ' h/semana a registrar</span><span class="chip">' + F.dec(fix, 1) + ' h/semana de compromissos fixos</span></div>';
    fab = '<button class="fab" type="button" data-a="rotedit" data-id="" data-wd="' + wd + '">' + ic('plus') + 'Atividade</button>';
  } else if (v === 'lista') {
    var fl = App.rotFiltro, list = M.rot.filter(function (r) { return fl === 'todas' || rowSit(r, M.ref) === fl; });
    html += '<div class="seg" style="margin-bottom:12px">' + [['vigor', 'Em vigor'], ['futura', 'Futuras'], ['encerrada', 'Encerradas'], ['todas', 'Todas']].map(function (t) { return '<button type="button" data-a="rotf" data-f="' + t[0] + '" aria-pressed="' + (fl === t[0]) + '">' + t[1] + '</button>'; }).join('') + '</div>';
    html += list.length ? '<div class="card flat">' + list.map(function (r) { return rotItem(cfg, r, M); }).join('') + '</div>' : '<div class="card empty"><h3>Nenhuma atividade aqui</h3><p>' + (S.rot.length ? 'Troque o filtro para ver as outras.' : 'Cadastre a primeira atividade da sua rotina.') + '</p></div>';
    fab = '<button class="fab" type="button" data-a="rotedit" data-id="">' + ic('plus') + 'Atividade</button>';
  } else {
    html += '<p class="muted" style="margin-bottom:12px">Categorias agrupam atividades nos gráficos. Defina uma meta de horas por semana para acompanhar o ritmo.</p>';
    html += '<div class="card flat">' + cfg.cats.map(function (c) {
      var uso = new Set(S.rot.filter(function (r) { return r.cat === c.nome; }).map(function (r) { return r.nome; })).size;
      return '<button type="button" class="item" data-a="catedit" data-n="' + esc(c.nome) + '"><span><span class="n" style="display:inline-flex;gap:8px;align-items:center">' + catDot(cfg, c.nome) + esc(c.nome) + '</span><span class="sub">' + uso + ' atividade' + (uso === 1 ? '' : 's') + '</span></span><span class="chip ' + (c.meta ? 'acc' : '') + '">' + (c.meta ? F.dec(+c.meta, 1) + ' h/sem' : 'sem meta') + '</span></button>';
    }).join('') + '</div>';
    fab = '<button class="fab" type="button" data-a="catedit" data-n="">' + ic('plus') + 'Categoria</button>';
  }
  return { title: 'Rotina', sub: 'o que deveria acontecer, e quando', html: html, fab: fab };
};
ACT.rotv = function (el) { App.rotView = el.getAttribute('data-v'); render(false); };
ACT.rotwd = function (el) { App.rotWd = +el.getAttribute('data-w'); render(true); };
ACT.rotf = function (el) { App.rotFiltro = el.getAttribute('data-f'); render(true); };

/* ---------- editor de atividade ---------- */
function nextCor(S) {
  var used = {}; S.cfg.cats.forEach(function (c) { used[c.cor] = 1; });
  for (var i = 1; i <= 8; i++) if (!used[i]) return i; return 0;
}
ACT.rotedit = function (el) {
  var id = el.getAttribute('data-id'), pre = null, wd = el.getAttribute('data-wd');
  if (!id && wd != null && wd !== '') { var d = [0, 0, 0, 0, 0, 0, 0]; d[+wd] = 1; pre = { dias: d }; }
  rotEditor(id, pre);
};
function rotEditor(id, pre) {
  var S = Store.get(), cfg = S.cfg, today = Store.todayISO(), r = id ? S.rot.filter(function (x) { return x.id === id; })[0] : null;
  if (id && !r) return;
  var f = r ? JSON.parse(JSON.stringify(r)) : Object.assign({ nome: '', cat: cfg.cats.length ? cfg.cats[0].nome : '', ini: '08:00', fim: '09:00', pri: 'Média', dias: [1, 1, 1, 1, 1, 0, 0], fixo: false, de: today, ate: '' }, pre || {});
  var st = { fixo: !!f.fixo, dias: f.dias.slice(), pri: f.pri || '', modo: 'desde' };
  var nreg = r ? regCount(S, r.nome) : 0, hasHist = !!r && (nreg > 0 || OPX.toN(r.de) < OPX.toN(today));
  var catOpts = cfg.cats.map(function (c) { return '<option' + (c.nome === f.cat ? ' selected' : '') + '>' + esc(c.nome) + '</option>'; }).join('') + '<option value="__nova">＋ Nova categoria…</option>';
  var body = '<div class="form">' +
    '<label class="f">Nome<input type="text" id="r-nome" maxlength="70" value="' + esc(f.nome) + '" placeholder="Ex.: Estudar SQL"></label>' +
    '<div class="seg full" id="r-tipo"><button type="button" data-t="0" aria-pressed="' + !st.fixo + '">Atividade (registro diário)</button><button type="button" data-t="1" aria-pressed="' + st.fixo + '">Compromisso fixo</button></div>' +
    '<p class="hint" id="r-tipo-h" style="margin-top:-6px"></p>' +
    '<div class="f2"><label class="f">Categoria<select id="r-cat">' + catOpts + '</select></label><label class="f" id="r-catn-w" hidden>Nome da categoria<input type="text" id="r-catn" maxlength="30"></label></div>' +
    '<div class="f2"><label class="f">Início<input type="time" id="r-ini" value="' + f.ini + '"></label><label class="f">Fim<input type="time" id="r-fim" value="' + f.fim + '"></label></div>' +
    '<p class="hint" id="r-dur" style="margin-top:-6px"></p>' +
    '<div id="r-pri-w"><div class="chk-l" style="margin-bottom:8px">Prioridade <span class="hint">define o XP base</span></div><div class="seg full" id="r-pri">' + ['Alta', 'Média', 'Baixa', ''].map(function (p) { return '<button type="button" data-p="' + p + '" aria-pressed="' + (st.pri === p) + '">' + (p || 'Nenhuma') + '</button>'; }).join('') + '</div></div>' +
    '<div><div class="chk-l" style="margin-bottom:8px">Dias da semana</div><div class="daypick" id="r-dias">' + OPX.DIAS_ABREV.map(function (d, i) { return '<button type="button" data-d="' + i + '" aria-pressed="' + !!st.dias[i] + '">' + d + '</button>'; }).join('') + '</div></div>' +
    (r ? '<label class="f">Encerra em <span class="hint">deixe vazio para continuar valendo</span><input type="date" id="r-ate" value="' + (f.ate || '') + '"></label><p class="hint" style="margin-top:-6px">Em vigor desde ' + F.dmy(f.de) + (nreg ? ' · ' + nreg + ' registro' + (nreg > 1 ? 's' : '') : '') + '</p>'
      : '<div class="f2"><label class="f">Vale a partir de<input type="date" id="r-de" value="' + f.de + '"></label><label class="f">Até <span class="hint">opcional</span><input type="date" id="r-ate" value=""></label></div>') +
    (hasHist ? '<div class="banner info" id="r-modo-w" style="display:grid"><b>Como aplicar mudanças de horário, dias, prioridade ou categoria?</b><div class="seg full" id="r-modo" style="background:transparent;border-color:var(--accent)"><button type="button" data-m="desde" aria-pressed="true">A partir de uma data</button><button type="button" data-m="tudo" aria-pressed="false">Corrigir tudo</button></div><label class="f" id="r-from-w" style="color:inherit">Valer a partir de<input type="date" id="r-from" value="' + today + '"></label><span class="hint" id="r-modo-h" style="color:inherit">O histórico anterior continua com o horário antigo. É o jeito certo de mudar uma rotina.</span></div>' : '') + '</div>';
  var foot = (r ? '<button class="btn danger" type="button" data-k="del">Excluir</button><button class="btn" type="button" data-k="dup">Duplicar</button>' : '') + '<button class="btn" type="button" data-k="x">Cancelar</button><button class="btn primary" type="button" data-k="ok">Salvar</button>';
  var s = Sheet.open({ title: r ? 'Editar atividade' : 'Nova atividade', body: body, foot: foot });
  var $s = function (q) { return $(q, s); };
  function refresh() {
    $s('#r-tipo-h').textContent = st.fixo ? 'Aparece no plano do dia (como trabalho, faculdade, viagem), mas não pede registro nem entra na execução.' : 'Entra na execução do dia e pede um status (feito, parcial…).';
    $s('#r-pri-w').hidden = st.fixo;
    var m = OPX.durMin($s('#r-ini').value || '00:00', $s('#r-fim').value || '00:00');
    $s('#r-dur').textContent = m ? 'Duração: ' + F.min(m) + ($s('#r-fim').value < $s('#r-ini').value ? ' (passa da meia-noite)' : '') : 'Início e fim iguais: duração zero.';
    $$('#r-tipo button', s).forEach(function (b) { b.setAttribute('aria-pressed', String((b.getAttribute('data-t') === '1') === st.fixo)); });
    $$('#r-pri button', s).forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-p') === st.pri)); });
    $$('#r-dias button', s).forEach(function (b) { b.setAttribute('aria-pressed', String(!!st.dias[+b.getAttribute('data-d')])); });
    if (hasHist) {
      $$('#r-modo button', s).forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-m') === st.modo)); });
      $s('#r-from-w').hidden = st.modo !== 'desde';
      $s('#r-modo-h').textContent = st.modo === 'desde' ? 'O histórico anterior continua com o horário antigo. É o jeito certo de mudar uma rotina.' : 'Altera também os dias passados. Use só para corrigir um erro de cadastro.';
    }
  }
  $s('#r-tipo').onclick = function (e) { var b = e.target.closest('button'); if (b) { st.fixo = b.getAttribute('data-t') === '1'; refresh(); } };
  $s('#r-pri').onclick = function (e) { var b = e.target.closest('button'); if (b) { st.pri = b.getAttribute('data-p'); refresh(); } };
  $s('#r-dias').onclick = function (e) { var b = e.target.closest('button'); if (b) { var i = +b.getAttribute('data-d'); st.dias[i] = st.dias[i] ? 0 : 1; refresh(); } };
  if (hasHist) $s('#r-modo').onclick = function (e) { var b = e.target.closest('button'); if (b) { st.modo = b.getAttribute('data-m'); refresh(); } };
  $s('#r-ini').oninput = $s('#r-fim').oninput = refresh;
  $s('#r-cat').onchange = function () { $s('#r-catn-w').hidden = this.value !== '__nova'; if (this.value === '__nova') $s('#r-catn').focus(); };
  $s('[data-k="x"]').onclick = function () { Sheet.close(); };
  if (r) {
    $s('[data-k="dup"]').onclick = function () { Sheet.close(); rotEditor('', { nome: r.nome + ' (cópia)', cat: r.cat, ini: r.ini, fim: r.fim, pri: r.pri, dias: r.dias.slice(), fixo: r.fixo }); };
    $s('[data-k="del"]').onclick = function () { Sheet.close(); delRot(r); };
  }
  $s('[data-k="ok"]').onclick = function () {
    var nome = $s('#r-nome').value.trim(), cat = $s('#r-cat').value, catNova = false;
    if (cat === '__nova') { cat = $s('#r-catn').value.trim(); catNova = true; if (!cat) return Toast('Escreva o nome da nova categoria.'); }
    var ini = $s('#r-ini').value, fim = $s('#r-fim').value, ate = $s('#r-ate') ? $s('#r-ate').value : '';
    if (!nome) return Toast('Dê um nome à atividade.');
    if (!ini || !fim) return Toast('Informe o horário de início e de fim.');
    if (OPX.durMin(ini, fim) === 0) return Toast('Início e fim não podem ser iguais.');
    if (!st.dias.some(function (v) { return v; })) return Toast('Escolha ao menos um dia da semana.');
    var de = r ? r.de : ($s('#r-de').value || today);
    if (ate && OPX.toN(ate) < OPX.toN(de)) return Toast('“Encerra em” não pode ser antes do início.');
    var clash = S.rot.some(function (x) {
      if (r && (x.id === r.id)) return false; if (x.nome !== nome) return false;
      var a1 = OPX.toN(de), b1 = ate ? OPX.toN(ate) : 1e9, a2 = OPX.toN(x.de), b2 = x.ate ? OPX.toN(x.ate) : 1e9; return a1 <= b2 && a2 <= b1;
    });
    if (clash && !(r && r.nome === nome)) return Toast('Já existe uma atividade com esse nome em vigor. Para mudar um horário, edite a existente.');
    var data = { nome: nome, cat: cat, ini: ini, fim: fim, pri: st.fixo ? '' : st.pri, dias: st.dias.slice(), fixo: st.fixo, de: de, ate: ate };
    var from = hasHist && $s('#r-from') ? $s('#r-from').value : today;
    saveRot(id, data, catNova, hasHist ? st.modo : 'tudo', from);
    Sheet.close(); Toast(r ? 'Atividade atualizada' : 'Atividade criada');
  };
  refresh();
}
function saveRot(id, f, catNova, modo, from) {
  var ids = ['cfg'];
  Store.mutate(function (S) {
    if (catNova && !S.cfg.cats.some(function (c) { return c.nome === f.cat; })) S.cfg.cats.push({ nome: f.cat, meta: null, cor: nextCor(S) });
    if (!id) { S.rot.push({ id: OPD.newId(), nome: f.nome, cat: f.cat, ini: f.ini, fim: f.fim, pri: f.pri, dias: f.dias, de: f.de, ate: f.ate, fixo: f.fixo }); return; }
    var r = S.rot.filter(function (x) { return x.id === id; })[0];
    if (r.nome !== f.nome) {
      var old = r.nome; S.rot.forEach(function (x) { if (x.nome === old) x.nome = f.nome; });
      Object.keys(S.reg).forEach(function (d) { var day = S.reg[d]; if (day[old] && !day[f.nome]) { day[f.nome] = day[old]; delete day[old]; ids.push(Store.dateShard(d)); } });
    }
    var chg = r.cat !== f.cat || r.ini !== f.ini || r.fim !== f.fim || r.pri !== f.pri || r.fixo !== f.fixo || r.dias.join() !== f.dias.join();
    if (chg && modo === 'desde' && OPX.toN(from) > OPX.toN(r.de) && !(r.ate && OPX.toN(from) > OPX.toN(r.ate))) {
      var oldAte = r.ate; r.ate = OPX.toISO(OPX.toN(from) - 1);
      S.rot.push({ id: OPD.newId(), nome: f.nome, cat: f.cat, ini: f.ini, fim: f.fim, pri: f.pri, dias: f.dias, de: from, ate: f.ate || oldAte || '', fixo: f.fixo });
    } else { r.cat = f.cat; r.ini = f.ini; r.fim = f.fim; r.pri = f.pri; r.dias = f.dias; r.fixo = f.fixo; r.ate = f.ate; }
  }, ids);
}
function delRot(r) {
  var S = Store.get(), n = regCount(S, r.nome), today = Store.todayISO();
  if (n > 0) {
    Sheet.confirm({ title: 'Não dá para excluir', text: '“' + esc(r.nome) + '” tem ' + n + ' registro' + (n > 1 ? 's' : '') + ' no histórico. Encerre a atividade para ela sair do plano e manter o histórico.', ok: 'Encerrar atividade', no: 'Voltar' }).then(function (ok) {
      if (!ok) return;
      var fim = OPX.toISO(Math.max(OPX.toN(r.de), OPX.toN(today) - 1));
      Store.mutate(function (S2) { S2.rot.filter(function (x) { return x.id === r.id; })[0].ate = fim; }, ['cfg']); Toast('Atividade encerrada em ' + F.dmy(fim));
    });
    return;
  }
  Sheet.confirm({ title: 'Excluir atividade?', text: '“' + esc(r.nome) + '” será removida da rotina.', ok: 'Excluir', danger: true }).then(function (ok) {
    if (!ok) return; Store.checkpoint(); Store.mutate(function (S2) { S2.rot = S2.rot.filter(function (x) { return x.id !== r.id; }); }, ['cfg']);
    Toast('Atividade excluída', { label: 'Desfazer', fn: function () { Store.undo(); } });
  });
}

/* ---------- categorias ---------- */
ACT.catedit = function (el) {
  var S = Store.get(), nome = el.getAttribute('data-n'), c = nome ? S.cfg.cats.filter(function (x) { return x.nome === nome; })[0] : null;
  var st = { cor: c ? c.cor : nextCor(S) };
  var sw = function () { return [1, 2, 3, 4, 5, 6, 7, 8, 0].map(function (k) { return '<button type="button" class="icon-btn" data-c="' + k + '" aria-label="Cor ' + k + '" aria-pressed="' + (st.cor === k) + '" style="width:40px;height:40px"><span class="dot" style="width:18px;height:18px;background:var(--c' + k + ')"></span></button>'; }).join(''); };
  var s = Sheet.open({
    title: c ? 'Editar categoria' : 'Nova categoria',
    body: '<div class="form"><label class="f">Nome<input type="text" id="c-nome" maxlength="30" value="' + esc(c ? c.nome : '') + '"></label>' +
      '<label class="f">Meta de horas por semana <span class="hint">vazio = sem meta</span><input type="number" id="c-meta" min="0" step="0.5" inputmode="decimal" value="' + (c && c.meta != null ? c.meta : '') + '"></label>' +
      '<div><div class="chk-l" style="margin-bottom:8px">Cor</div><div class="row wrap" id="c-cores">' + sw() + '</div></div></div>',
    foot: (c ? '<button class="btn danger" type="button" data-k="del">Excluir</button>' : '') + '<button class="btn" type="button" data-k="x">Cancelar</button><button class="btn primary" type="button" data-k="ok">Salvar</button>'
  });
  $('#c-cores', s).onclick = function (e) { var b = e.target.closest('button'); if (b) { st.cor = +b.getAttribute('data-c'); $('#c-cores', s).innerHTML = sw(); } };
  $('[data-k="x"]', s).onclick = function () { Sheet.close(); };
  if (c) $('[data-k="del"]', s).onclick = function () {
    var uso = S.rot.filter(function (r) { return r.cat === c.nome; }).length, mt = S.metas.filter(function (m) { return m.cat === c.nome; }).length;
    if (uso || mt) return Toast('Há ' + (uso ? uso + ' atividade(s)' : mt + ' meta(s)') + ' nesta categoria. Mude-as antes de excluir.');
    Sheet.close(); Store.checkpoint(); Store.mutate(function (S2) { S2.cfg.cats = S2.cfg.cats.filter(function (x) { return x.nome !== c.nome; }); }, ['cfg']);
    Toast('Categoria excluída', { label: 'Desfazer', fn: function () { Store.undo(); } });
  };
  $('[data-k="ok"]', s).onclick = function () {
    var nn = $('#c-nome', s).value.trim(), mv = $('#c-meta', s).value, meta = mv === '' ? null : Math.max(0, +mv);
    if (!nn) return Toast('Dê um nome à categoria.');
    if (S.cfg.cats.some(function (x) { return x.nome === nn && (!c || x.nome !== c.nome); })) return Toast('Já existe uma categoria com esse nome.');
    Store.mutate(function (S2) {
      if (c) { var t = S2.cfg.cats.filter(function (x) { return x.nome === c.nome; })[0]; if (nn !== c.nome) { S2.rot.forEach(function (r) { if (r.cat === c.nome) r.cat = nn; }); S2.metas.forEach(function (m) { if (m.cat === c.nome) m.cat = nn; }); } t.nome = nn; t.meta = meta || null; t.cor = st.cor; }
      else S2.cfg.cats.push({ nome: nn, meta: meta || null, cor: st.cor });
    }, ['cfg']);
    Sheet.close();
  };
};
