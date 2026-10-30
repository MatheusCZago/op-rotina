# OP% — Sistema de Desenvolvimento Pessoal

Planejar a rotina, registrar o que aconteceu em dois toques e acompanhar execução, metas, XP e sequência de dias bons.

O projeto nasceu como uma planilha de Excel e hoje tem um app para celular com as mesmas regras de cálculo. A ideia é que Excel, app, Python, SQL e Power BI trabalhem sobre **os mesmos dados**.

> **Status:** versão de testes. O app funciona no navegador e pode ser instalado no celular; Python, SQL e Power BI são as próximas etapas.

## Como usar o app

1. Abra o endereço do app (GitHub Pages) no celular. *(O link aparece aqui quando o Pages for ativado.)*
2. Escolha **Começar do zero** (ou **Ver com uma rotina de exemplo**) e cadastre suas atividades na aba **Rotina**.
3. Instale: no Chrome (Android), toque em ⋮ → **Instalar app**; no iPhone (Safari), Compartilhar → **Adicionar à Tela de Início**. Depois de instalado, abre em tela cheia e funciona sem internet.

**Seus dados ficam só no aparelho** (armazenamento do navegador). Se você limpar os dados do navegador ou trocar de celular, eles somem. Por isso, em **Ajustes → Dados e backup**, baixe o backup (`.json`) de vez em quando; o app avisa se passar de 14 dias. O mesmo backup serve para levar os dados a outro aparelho. A planilha `.xlsx` exportada tem as abas do Excel do OP% e uma aba `BASE` (um dia por linha) para Power BI e Python.

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
| `app/` | O app pronto para publicar (gerado por `build.py`; não edite à mão) |
| `src/` | Código-fonte do app (JavaScript e CSS) |
| `pwa/` | Ícones, manifest e service worker (instalação e uso offline) |
| `tests/` | Testes das regras de cálculo e da importação, com dados fictícios |
| `excel/` | Como o app exporta para o Excel |
| `python/` | Scripts que leem a exportação e recalculam as métricas |
| `sql/` | Consultas SQL sobre a base de registros |
| `docs/` | Guia de funcionalidades e decisões do projeto |

## Desenvolvimento

```
python build.py              # gera app/ a partir de src/ e pwa/
node tests/engine.test.js    # regras de cálculo contra a planilha de referência
node tests/io.test.js        # importação do Excel
```

Para testar localmente, sirva a pasta `app/` por HTTP (o service worker não funciona em `file://`): `python -m http.server --directory app`.

## Roteiro

- [x] App web instalável, com uso offline, backup e importação (JSON e Excel)
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
