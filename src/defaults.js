/* ===== OP% · dados iniciais ===== */
var OPD = (function () {
  var ST = { OK: 'Concluído', PARC: 'Parcial', NO: 'Não feito', DISP: 'Dispensado' };
  function baseCfg(inicio) {
    return {
      inicio: inicio, metaDia: 0.8, bonus: 50, inicioDia: '06:00', metaSono: 7, notaAlvo: 8, minRank: 3,
      cats: [], 
      status: [
        { nome: ST.OK, credito: 1, conta: true }, { nome: ST.PARC, credito: 0.5, conta: true },
        { nome: ST.NO, credito: 0, conta: true }, { nome: ST.DISP, credito: null, conta: false }
      ],
      pri: [{ nome: 'Alta', xp: 30 }, { nome: 'Média', xp: 20 }, { nome: 'Baixa', xp: 10 }],
      notas: [{ min: 1, mult: 0.75, faixa: 'Fraca' }, { min: 5, mult: 0.9, faixa: 'Regular' }, { min: 7, mult: 1, faixa: 'Boa' }, { min: 9, mult: 1.25, faixa: 'Excelente' }],
      niveis: [
        { xp: 0, nome: 'Iniciante' }, { xp: 1000, nome: 'Aprendiz' }, { xp: 3000, nome: 'Constante' }, { xp: 6000, nome: 'Focado' },
        { xp: 10000, nome: 'Disciplinado' }, { xp: 16000, nome: 'Estrategista' }, { xp: 24000, nome: 'Especialista' },
        { xp: 34000, nome: 'Mestre da rotina' }, { xp: 46000, nome: 'Referência' }, { xp: 60000, nome: 'Lenda' }
      ]
    };
  }
  var CATS_MODELO = [
    { nome: 'Excel', meta: 6, cor: 1 }, { nome: 'SQL', meta: 3.5, cor: 2 }, { nome: 'Economia', meta: 2, cor: 3 },
    { nome: 'Carreira', meta: 1, cor: 4 }, { nome: 'Inglês', meta: 2, cor: 5 }, { nome: 'Pessoal', meta: null, cor: 6 },
    { nome: 'Compromisso', meta: null, cor: 0 }
  ];
  var CATS_BASE = [{ nome: 'Estudo', meta: null, cor: 1 }, { nome: 'Saúde', meta: null, cor: 3 }, { nome: 'Pessoal', meta: null, cor: 6 }, { nome: 'Compromisso', meta: null, cor: 0 }];
  var D = function (s) { return s.split('').map(Number); };
  var MODELO = [
    ['Curso de inglês', 'Inglês', '08:00', '09:00', 'Alta', '0101000', 0],
    ['Planejar o dia', 'Pessoal', '09:00', '09:10', 'Baixa', '1111100', 0],
    ['SQL — prática de consultas', 'SQL', '09:15', '10:00', 'Alta', '1111100', 0],
    ['Ônibus para o trabalho', 'Compromisso', '10:30', '11:45', '', '1111100', 1],
    ['Economia — leitura no ônibus', 'Economia', '10:40', '11:20', 'Média', '1010100', 0],
    ['Carreira — vagas e currículo (ônibus)', 'Carreira', '10:40', '11:10', 'Média', '0101000', 0],
    ['Trabalho', 'Compromisso', '11:45', '18:00', '', '1111100', 1],
    ['Viagem (ida)', 'Compromisso', '18:30', '21:30', '', '0000100', 1],
    ['Faculdade', 'Compromisso', '18:45', '22:20', '', '1111000', 1],
    ['Excel — estudo e projeto OP%', 'Excel', '22:40', '23:50', 'Alta', '1111000', 0],
    ['Fechar o dia no OP%', 'Pessoal', '23:50', '00:00', 'Média', '1111111', 0],
    ['Excel — projeto (sábado)', 'Excel', '15:00', '17:00', 'Média', '0000010', 0],
    ['Volta para casa', 'Compromisso', '14:00', '17:00', '', '0000001', 1],
    ['Revisão semanal', 'Pessoal', '20:00', '20:30', 'Alta', '0000001', 0]
  ];
  function newId() { return 'a' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
  function rotinaModelo(inicio) {
    return MODELO.map(function (m) { return { id: newId(), nome: m[0], cat: m[1], ini: m[2], fim: m[3], pri: m[4], dias: D(m[5]), de: inicio, ate: '', fixo: !!m[6] }; });
  }
  function metasModelo(inicio, fim) {
    return [
      { id: newId(), nome: 'Estudar Excel: 55 horas até o fim do ano', cat: 'Excel', tipo: 'Horas', alvo: 55, ini: inicio, fim: fim },
      { id: newId(), nome: 'Praticar SQL: 40 sessões concluídas', cat: 'SQL', tipo: 'Sessões', alvo: 40, ini: inicio, fim: fim },
      { id: newId(), nome: 'Carreira: 12 sessões de currículo e vagas', cat: 'Carreira', tipo: 'Sessões', alvo: 12, ini: inicio, fim: fim },
      { id: newId(), nome: 'Inglês: 18 aulas assistidas', cat: 'Inglês', tipo: 'Sessões', alvo: 18, ini: inicio, fim: fim }
    ];
  }
  function novoEstado(modo, inicio) {
    var cfg = baseCfg(inicio), ano = inicio.slice(0, 4);
    if (modo === 'modelo') {
      cfg.cats = JSON.parse(JSON.stringify(CATS_MODELO));
      return { cfg: cfg, rot: rotinaModelo(inicio), reg: {}, chk: {}, metas: metasModelo(inicio, ano + '-12-31'), rev: {}, folgas: {} };
    }
    cfg.cats = JSON.parse(JSON.stringify(CATS_BASE));
    return { cfg: cfg, rot: [], reg: {}, chk: {}, metas: [], rev: {}, folgas: {} };
  }
  return { ST: ST, baseCfg: baseCfg, novoEstado: novoEstado, newId: newId, rotinaModelo: rotinaModelo };
})();
if (typeof module !== 'undefined' && module.exports) module.exports = OPD;
