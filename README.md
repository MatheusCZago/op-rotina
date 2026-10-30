# OP% — Sistema de Desenvolvimento Pessoal

Planejar a rotina, registrar o que aconteceu em dois toques e acompanhar execução, metas, XP e sequência de dias bons.

O projeto nasceu como uma planilha de Excel e hoje tem um app para celular com as mesmas regras de cálculo. A ideia é que Excel, app, Python, SQL e Power BI trabalhem sobre **os mesmos dados**.

> **Status:** em construção. Este repositório está sendo preparado; o código entra nas próximas etapas.

## O que o OP% faz

- **Hoje:** plano do dia com status (Feito, Parcial, Não fiz, Dispensar), minutos, nota e check-in de sono, energia e humor.
- **Semana:** visão dos sete dias, metas por categoria e revisão semanal.
- **Painel:** indicadores e gráficos de tendência.
- **Metas:** progresso e ritmo esperado até o prazo.
- **Rotina:** atividades com horários, dias da semana e vigência (mudar a rotina sem apagar o histórico).
- **Folgas e viagens:** dias que não contam na execução nem quebram a sequência.

## Regras de cálculo (resumo)

- Crédito por atividade: Concluído = 1, Parcial = 0,5, Não feito = 0, Dispensado = fora da conta.
- Execução do dia = pontos de crédito ÷ (planejadas − dispensadas), no máximo 100%.
- Dia bom: execução ≥ meta diária (padrão 80%).
- XP = base da prioridade × crédito × multiplicador da nota, mais bônus de dia bom.
- Sequência: dias bons seguidos; o dia de hoje ainda aberto não quebra a sequência.

## Estrutura

| Pasta | Conteúdo |
|---|---|
| `app/` | O aplicativo (HTML único, funciona no celular) |
| `excel/` | Planilha `OP_Sistema` e a versão DEMO com dados fictícios |
| `python/` | Scripts que leem a exportação e recalculam as métricas |
| `sql/` | Consultas SQL sobre a base de registros |
| `docs/` | Guia de funcionalidades e decisões do projeto |

## Roteiro

- [ ] App publicado (GitHub Pages) para testes
- [ ] Script Python que valida os números do app contra a exportação
- [ ] Banco SQLite e consultas em SQL
- [ ] Dashboard no Power BI (com 3 a 4 semanas de dados reais)

## Privacidade

Este repositório é público. **Não coloque aqui backups, exportações ou planilhas com dados pessoais.** O `.gitignore` bloqueia os nomes mais comuns, mas confira antes de cada envio.

## Feedback

Encontrou um erro ou tem uma sugestão? Abra uma [issue](../../issues/new/choose).

## Licença

[MIT](LICENSE)
