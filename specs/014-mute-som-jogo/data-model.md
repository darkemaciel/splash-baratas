# Data Model: Mute e Desmute do Som do Jogo

## Entidade: Preferência de Áudio

Estado binário global, persistido localmente, que determina se qualquer som do jogo deve ser
reproduzido audivelmente.

| Campo | Tipo | Descrição |
|---|---|---|
| `muted` | `boolean` | `true` = áudio silenciado; `false` = áudio ativo. |

**Regras**:
- Existe exatamente um valor de `muted` por navegador/dispositivo — não há escopo por partida, por
  Scene, nem por categoria de som (FR-002, FR-005, Assumptions).
- Valor padrão quando não há nada persistido ainda: `false` (som ativo) — ver Clarifications
  Session 2026-09-20, Q1.
- Alterações de `muted` não têm efeito em nenhum outro estado de domínio (pontuação, dificuldade,
  spawn, condição de derrota) — FR-009.

**Persistência**:
- Chave dedicada em `localStorage` (nova constante em `gameConfig.ts`, ao lado de
  `HIGH_SCORE_STORAGE_KEY`).
- Leitura/escrita protegidas por verificação de disponibilidade + `try/catch`, nunca lançando
  exceção (mesmo padrão de `HighScoreStore.ts`) — se a escrita falhar, o toggle continua
  funcionando apenas na sessão atual (Clarifications Q2).

**Transições de estado**:

```
[sem preferência salva] --(boot)--> muted = false (padrão)
muted = false --(jogador aciona o controle)--> muted = true
muted = true  --(jogador aciona o controle)--> muted = false
```

Não há outras transições: o estado só muda por ação explícita do jogador no controle de mute.

## Sem novas entidades de domínio

Esta feature não introduz nem altera entidades do domínio de partida (`Match`, `Roach`, `FoodItem`,
`Shelf`) — a Preferência de Áudio é um estado de sistema/apresentação, isolado dessas entidades
(ver `research.md` §4).
