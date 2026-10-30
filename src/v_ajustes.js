/* ===== OP% · AJUSTES (parâmetros, backup, guia) ===== */
function kv(label, hint, input) { return '<div class="kv"><div class="k">' + label + (hint ? '<small>' + hint + '</small>' : '') + '</div>' + input + '</div>'; }
function inp(path, type, val, extra) {
  return '<input type="' + (type === 'pct' ? 'number' : type) + '" data-c="cfg" data-k="' + path + '" data-t="' + type + '" value="' + esc(val) + '" ' + (extra || '') + '>';
}
function acc(title, body, open) { return '<details class="card acc flat"' + (open ? ' open' : '') + '><summary>' + title + ic('chevD', 'sm chev') + '</summary><div class="body">' + body + '</div></details>'; }

function guideHTML() {
  return '<div class="guide">' +
    '<h3>Rotina de todo dia</h3><ul><li><b>Hoje:</b> veja o plano ordenado por horário e toque em Feito, Parcial, Não fiz ou Dispensar.</li><li><b>Nota e tempo</b> são opcionais. Nota 9 ou 10 rende mais XP.</li><li><b>Check-in:</b> sono, energia e humor. É ele que mostra como o sono afeta a execução.</li><li><b>Domingo:</b> faça a revisão da semana na aba Semana.</li></ul>' +
    '<h3>Como o OP% calcula</h3><ul>' +
    '<li><b>Planejadas do dia:</b> atividades da Rotina vigentes naquele dia da semana. Compromissos fixos aparecem no plano, mas não contam.</li>' +
    '<li><b>Crédito:</b> Feito vale 1, Parcial 0,5, Não fiz 0. Dispensado não entra na conta.</li>' +
    '<li><b>Execução do dia:</b> pontos de crédito ÷ (planejadas − dispensadas), no máximo 100%. Planejada sem registro conta como não feita.</li>' +
    '<li><b>Dia bom:</b> execução do dia ≥ meta diária. Gera bônus de XP e soma na sequência.</li>' +
    '<li><b>Sequência:</b> dias bons seguidos. Um dia passado planejado e sem registro quebra a sequência. O dia de hoje nunca quebra, só soma quando vira dia bom. Dias de folga não quebram nem somam.</li>' +
    '<li><b>XP:</b> XP base da prioridade (Alta 30, Média 20, Baixa 10) × crédito × multiplicador da nota (0,75 a 1,25), mais o bônus de dia bom.</li>' +
    '<li><b>Nível:</b> definido pelo XP total acumulado.</li>' +
    '<li><b>Aderência de tempo:</b> horas realizadas ÷ horas planejadas das atividades registradas.</li>' +
    '<li><b>Tempo contabilizado:</b> o “tempo realizado” que você informou; sem ele, o planejado × crédito.</li></ul>' +
    '<h3>Mudar a rotina sem perder o histórico</h3><p>Ao editar o horário ou os dias de uma atividade com histórico, escolha “a partir de uma data”. O app encerra a versão antiga e cria uma nova. Os dias passados continuam calculados com o horário que valia na época.</p>' +
    '<h3>Folgas e viagens</h3><p>No menu ⋯ da tela Hoje, marque os dias em que a rotina não se aplica. Eles não pesam na execução nem quebram a sequência.</p>' +
    '<h3>Backup</h3><p>' + (STANDALONE ? 'Seus dados ficam só neste aparelho, no navegador. Se você limpar os dados do navegador ou trocar de celular, eles somem: salve um backup de vez em quando.' : 'Seus dados ficam na sua conta e neste aparelho. Mesmo assim, salve um backup de vez em quando.') + ' A planilha exportada tem as mesmas colunas do Excel do OP% e uma aba BASE (um dia por linha) pronta para Power BI ou Python.</p></div>';
}

VIEWS.ajustes = null;
function instalarHTML() {
  if (App.instalado || (window.matchMedia && matchMedia('(display-mode: standalone)').matches)) return '<p class="muted">O OP% já está instalado neste aparelho.</p>';
  return (App.installEv ? '<button class="btn primary block" type="button" data-a="instalar">' + ic('download', 'sm') + ' Instalar o OP% neste aparelho</button><p class="hint" style="margin-top:10px">Cria um ícone na tela inicial; abre em tela cheia e funciona sem internet.</p>'
    : '<p class="muted">No <b>Chrome (Android)</b>: toque em ⋮ e depois em <b>Instalar app</b> (ou <b>Adicionar à tela inicial</b>).</p><p class="muted" style="margin-top:8px">No <b>iPhone (Safari)</b>: toque em Compartilhar e depois em <b>Adicionar à Tela de Início</b>.</p><p class="hint" style="margin-top:8px">Depois de instalado, funciona sem internet e abre em tela cheia.</p>');
}
ACT.instalar = async function () {
  var e = App.installEv; if (!e) return;
  try { await e.prompt(); var r = await e.userChoice; if (r && r.outcome === 'accepted') { App.installEv = null; App.instalado = true; } } catch (x) { /* ok */ }
  render(true);
};
function viewAjustes(M) {
  var S = Store.get(), c = S.cfg, ss = Store.syncState(), html = '<div class="stack">';
  var dados = '<p class="muted" style="margin-bottom:12px">' + (ss === 'local' ? 'Seus dados estão salvos só neste navegador. Faça backup com frequência.' : ss === 'erro' ? 'Sem conexão agora. Suas alterações ficam salvas neste aparelho e sobem quando voltar.' : ss === 'cheio' ? 'O armazenamento da conta está cheio. Exporte um backup e apague registros antigos.' : 'Seus dados estão salvos na sua conta e aparecem em qualquer aparelho em que você abrir este app.') + '</p>' +
    '<div class="grid g-auto"><button class="btn" type="button" data-a="bkjson">' + ic('download', 'sm') + ' Backup (.json)</button><button class="btn" type="button" data-a="bkxlsx">' + ic('download', 'sm') + ' Planilha (.xlsx)</button>' +
    '<button class="btn" type="button" data-a="bkcopy">' + ic('copy', 'sm') + ' Copiar backup</button><button class="btn" type="button" data-a="importar">' + ic('upload', 'sm') + ' Importar arquivo</button>' +
    '<button class="btn" type="button" data-a="colar">' + ic('upload', 'sm') + ' Colar backup</button></div>' +
    '<p class="hint" style="margin-top:10px">Importa o OP_Sistema.xlsx (Excel) ou um backup .json. Você escolhe entre mesclar e substituir.</p><hr class="hr"><button class="btn danger sm" type="button" data-a="apagar">Apagar todos os dados</button>';
  var lb = lsGet('opx:lastbk');
  dados = '<p class="hint" style="margin-bottom:10px">Último backup: <b>' + (lb ? F.dmy(lb) : 'nunca') + '</b></p>' + dados;
  html += acc('Dados e backup', dados, true);
  if (STANDALONE) html += acc('Instalar no celular', instalarHTML(), false);
  var pr = kv('Início do sistema', 'dias antes dele são ignorados', inp('inicio', 'date', c.inicio)) +
    kv('Meta de execução diária', 'define o dia bom (%)', inp('metaDia', 'pct', Math.round(c.metaDia * 100), 'min="10" max="100" step="5" inputmode="numeric"')) +
    kv('Bônus de XP por dia bom', '', inp('bonus', 'num', c.bonus, 'min="0" step="5" inputmode="numeric"')) +
    kv('Início do dia', 'atividades antes dessa hora vão para o fim do dia', inp('inicioDia', 'time', c.inicioDia)) +
    kv('Meta de sono (h)', 'compara execução com sono bom e ruim', inp('metaSono', 'num', c.metaSono, 'min="3" max="12" step="0.5" inputmode="decimal"')) +
    kv('Nota-alvo (1 a 10)', 'referência de qualidade', inp('notaAlvo', 'num', c.notaAlvo, 'min="1" max="10" step="0.5" inputmode="decimal"')) +
    kv('Mínimo de registros no ranking', 'para entrar em “precisa de atenção”', inp('minRank', 'num', c.minRank, 'min="1" max="30" step="1" inputmode="numeric"'));
  html += acc('Parâmetros gerais', pr, false);
  var parc = c.status.map(function (s, i) { return s.nome === 'Parcial' ? i : -1; }).filter(function (i) { return i >= 0; })[0];
  var xp = c.pri.map(function (p, i) { return kv('XP base · prioridade ' + esc(p.nome), '', inp('pri.' + i + '.xp', 'num', p.xp, 'min="0" step="5" inputmode="numeric"')); }).join('') +
    (parc != null ? kv('Crédito de “Parcial”', '0 a 1 (0,5 = metade)', inp('status.' + parc + '.credito', 'num', c.status[parc].credito, 'min="0" max="1" step="0.1" inputmode="decimal"')) : '') +
    c.notas.map(function (n, i) { return kv('Multiplicador · nota a partir de ' + n.min + (n.faixa ? ' (' + esc(n.faixa) + ')' : ''), '', inp('notas.' + i + '.mult', 'num', n.mult, 'min="0.5" max="2" step="0.05" inputmode="decimal"')); }).join('') +
    '<div class="eyebrow" style="margin:14px 0 4px">Níveis (XP mínimo)</div>' + c.niveis.map(function (n, i) { return kv('Nível ' + (i + 1) + ' · ' + esc(n.nome), '', inp('niveis.' + i + '.xp', 'num', n.xp, 'min="0" step="100" inputmode="numeric"' + (i === 0 ? ' disabled' : ''))); }).join('');
  html += acc('XP e níveis', xp, false);
  html += acc('Como o OP% funciona', guideHTML(), false);
  html += acc('Sobre', '<p class="muted">OP% · Sistema de Desenvolvimento Pessoal, versão aplicativo 1.0. Usa as mesmas regras do Excel V1.0.</p><p class="hint" style="margin-top:8px">Próximos passos possíveis: lembretes, metas por OKR, comparação entre meses e exportação direta para Power BI.</p>', false);
  return { title: 'Ajustes', sub: 'parâmetros, backup e guia', back: true, html: html + '</div>' };
}
function setPath(o, path, v) { var p = path.split('.'); for (var i = 0; i < p.length - 1; i++) o = o[p[i]]; o[p[p.length - 1]] = v; }
CHG.cfg = function (el) {
  var path = el.getAttribute('data-k'), t = el.getAttribute('data-t'), raw = el.value, v;
  if (t === 'date' || t === 'time') { if (!raw) { render(true); return; } v = raw; }
  else { if (raw === '' || !isFinite(+raw)) { render(true); return; } v = +raw; if (t === 'pct') v = Math.max(0.1, Math.min(1, v / 100)); }
  if (el.min !== '' && t !== 'pct' && t !== 'date' && t !== 'time') v = Math.max(+el.min, v);
  if (el.max !== '' && t !== 'pct' && t !== 'date' && t !== 'time') v = Math.min(+el.max, v);
  Store.mutate(function (S) { setPath(S.cfg, path, v); if (path.indexOf('niveis') === 0) S.cfg.niveis.sort(function (a, b) { return a.xp - b.xp; }); }, ['cfg']);
  if (path === 'inicio') Toast('Registros anteriores a ' + F.dmy(v) + ' passam a ser ignorados.');
};

/* ---- backup e importação ---- */
function backupText() { return JSON.stringify({ app: 'OP%', versao: 1, exportadoEm: new Date().toISOString(), state: Store.get() }); }
ACT.bkjson = function () { IO.saveFile('OP_backup_' + Store.todayISO() + '.json', backupText()).then(function (ok) { if (ok) render(true); }); };
ACT.bkxlsx = async function () {
  try { Toast('Preparando a planilha…'); var X = await IO.loadXLSX(), wb = IO.buildWorkbook(X, Store.get(), App.M), buf = X.write(wb, { bookType: 'xlsx', type: 'array' }); await IO.saveFile('OP_dados_' + Store.todayISO() + '.xlsx', buf); }
  catch (e) { Toast(e && e.message ? e.message : 'Não foi possível gerar a planilha.'); }
};
ACT.bkcopy = function () {
  var txt = backupText();
  var fallback = function () {
    var s = Sheet.open({ title: 'Backup em texto', sub: 'Selecione tudo, copie e guarde em um lugar seguro. Para restaurar, use “Colar backup”.', body: '<textarea id="bk-t" readonly style="min-height:200px;font-family:var(--f-mono);font-size:12px">' + esc(txt) + '</textarea>', foot: '<button class="btn primary" type="button" data-k="x">Fechar</button>' });
    var t = $('#bk-t', s); t.focus(); t.select(); $('[data-k="x"]', s).onclick = function () { Sheet.close(); };
  };
  try { navigator.clipboard.writeText(txt).then(function () { Toast('Backup copiado'); }, fallback); } catch (e) { fallback(); }
};
ACT.colar = function () {
  var s = Sheet.open({ title: 'Colar backup', sub: 'Cole aqui o texto do backup copiado antes.', body: '<textarea id="bk-t" style="min-height:180px;font-family:var(--f-mono);font-size:12px" placeholder="{ &quot;app&quot;: &quot;OP%&quot;, ..."></textarea>', foot: '<button class="btn" type="button" data-k="x">Cancelar</button><button class="btn primary" type="button" data-k="ok">Continuar</button>' });
  $('[data-k="x"]', s).onclick = function () { Sheet.close(); };
  $('[data-k="ok"]', s).onclick = function () { try { var p = IO.parseJSON($('#bk-t', s).value); Sheet.close(); importDialog(p, 'texto colado'); } catch (e) { Toast('Não reconheci este texto como um backup do OP%.'); } };
};
ACT.importar = function () {
  var inp = document.createElement('input'); inp.type = 'file'; inp.accept = '.xlsx,.xlsm,.json,application/json';
  inp.onchange = function () { if (inp.files[0]) readFile(inp.files[0]); }; inp.click();
};
async function readFile(f) {
  try {
    var p;
    if (/\.json$/i.test(f.name)) p = IO.parseJSON(await f.text());
    else { Toast('Lendo a planilha…'); var X = await IO.loadXLSX(); p = await IO.parseWorkbook(X, await f.arrayBuffer()); }
    importDialog(p, f.name);
  } catch (e) { Toast(e && e.message ? e.message : 'Não consegui ler este arquivo.'); }
}
function importDialog(p, nome) {
  var has = Store.has(), i = p.info, mode = has ? 'mesclar' : 'substituir';
  var s = Sheet.open({
    title: 'Importar dados', sub: 'Arquivo: ' + esc(nome),
    body: '<div class="card flat"><div class="item"><span class="n">Registros de atividades</span><b>' + i.regs + '</b></div><div class="item"><span class="n">Atividades na rotina</span><b>' + i.rot + '</b></div><div class="item"><span class="n">Check-ins</span><b>' + i.chk + '</b></div><div class="item"><span class="n">Metas · revisões</span><b>' + i.metas + ' · ' + i.rev + '</b></div></div>' +
      (has ? '<div class="seg full" id="im-m" style="margin-top:14px"><button type="button" data-m="mesclar" aria-pressed="true">Mesclar</button><button type="button" data-m="substituir" aria-pressed="false">Substituir tudo</button></div><p class="hint" id="im-h" style="margin-top:8px"></p>' : ''),
    foot: '<button class="btn" type="button" data-k="x">Cancelar</button><button class="btn primary" type="button" data-k="ok">Importar</button>'
  });
  var hint = function () { var h = $('#im-h', s); if (!h) return; h.textContent = mode === 'mesclar' ? 'Soma o que veio do arquivo ao que você já tem. Em caso de conflito no mesmo dia e atividade, vale o arquivo.' : 'Apaga o que existe hoje no app e usa só o conteúdo do arquivo.'; $$('#im-m button', s).forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-m') === mode)); }); };
  if (has) { $('#im-m', s).onclick = function (e) { var b = e.target.closest('button'); if (b) { mode = b.getAttribute('data-m'); hint(); } }; hint(); }
  $('[data-k="x"]', s).onclick = function () { Sheet.close(); };
  $('[data-k="ok"]', s).onclick = async function () {
    Sheet.close();
    if (has && mode === 'mesclar') await Store.replaceAll(IO.merge(Store.get(), p.state)); else if (has) await Store.replaceAll(p.state); else Store.start(p.state);
    App.tab = 'hoje'; App.page = null; App.date = null; render(false); Toast('Dados importados');
  };
}
ACT.apagar = function () {
  Sheet.confirm({ title: 'Apagar todos os dados?', text: 'Isso remove rotina, registros, check-ins, metas e revisões ' + (STANDALONE ? 'deste aparelho' : 'da sua conta e deste aparelho') + '. Faça um backup antes. Não dá para desfazer.', ok: 'Apagar tudo', danger: true }).then(async function (ok) {
    if (!ok) return; await Store.wipe(); App.page = null; App.date = null; App.week = null; render(false);
  });
};
