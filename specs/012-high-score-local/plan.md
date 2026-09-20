# Implementation Plan: High Score Local

**Branch**: `012-high-score-local` | **Date**: 2026-09-19 (revisado) | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/012-high-score-local/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command; its definition describes the execution workflow.

**Revisão pós-implementação (2026-09-19)**: a primeira versão deste plano cobria um recorde único
(`getHighScore`/`recordScore` retornando um `number`). O dono do produto validou essa implementação
e a considerou insuficiente frente ao objetivo original de "servir de base para qualquer modo
competitivo futuro" — a spec foi revisada para um **ranking Top 5** (`## Clarifications`, segunda
entrada). Este plano foi reescrito para refletir o novo formato (lista ordenada em vez de um único
valor); a abordagem geral (módulo próprio, sem tocar `Match`/`MatchStateManager`) permanece a mesma.

## Summary

Adicionar um módulo de persistência (`systems/HighScoreStore.ts`, TypeScript puro, sem
`import Phaser`) que lê/escreve as 5 maiores pontuações finais já alcançadas (o "ranking") em
`localStorage`, com degradação segura quando o armazenamento está indisponível ou corrompido
(`getRanking`/`recordScore`, ver `contracts/high-score-store.md`). A métrica é a pontuação final da
partida (`Match.score`, `specs/004-sistema-pontuacao`), confirmada em `/speckit-clarify`. Duas
scenes passam a chamar esse módulo diretamente — o mesmo padrão já usado por `GameOverScene` para
`elapsedMs`/`formatElapsedTime` (specs/007): `StartScene.create()` chama `getRanking()` para exibir
o Top 5 atual antes da partida (US2); `GameOverScene.create()` chama `recordScore(snapshot.score)`
uma única vez (a scene só é iniciada uma vez por derrota, a partir do handler de `match:lost` em
`GameScene`) e exibe a posição alcançada quando `position` não é `null` (US1). Nenhuma mudança em
`MatchStateManager`, `Match` ou `MatchSnapshot` — o ranking não é estado de partida, é um valor
externo consultado/atualizado apenas nos dois pontos de entrada/saída da UI.

## Technical Context

**Language/Version**: TypeScript (via `tsconfig.json` do workspace `client/`), executado com Bun

**Primary Dependencies**: Nenhuma dependência nova — usa a API Web nativa `localStorage`
(disponível em todo navegador alvo do MVP, constitution Princípio VII); nenhuma lib de persistência

**Storage**: `localStorage` do navegador, sob uma única chave namespaced
(`HIGH_SCORE_STORAGE_KEY`, `client/src/config/gameConfig.ts`) guardando um array JSON de até
`HIGH_SCORE_RANKING_MAX_ENTRIES` (5) números, ordenado da maior para a menor pontuação — não é o
"backend/banco de dados" que a constitution (Princípio VII) mantém fora do MVP, é armazenamento
client-side puro, consistente com Princípio II

**Testing**: `bun test` cobre `HighScoreStore` (ranking vazio sem valor salvo, entrada quando há
espaço livre, entrada que desloca a menor pontuação quando o ranking já está cheio, não-entrada em
empate/valor menor com o ranking cheio, valor corrompido — incluindo o formato de número único da
versão anterior — tratado como ranking vazio, falha de leitura/escrita não propaga exceção) usando
um fake de `localStorage` atribuído a `globalThis.localStorage` antes de cada teste — o mesmo
runtime de testes (Bun) não define `localStorage`/`window` globalmente por padrão, então os testes
precisam prover o fake explicitamente (research.md §2)

**Target Platform**: Navegador (Chrome, Firefox, Edge atuais), resoluções desktop; build estático
servido via Vercel

**Project Type**: Web — cliente único (jogo client-side), sem projeto de backend separado

**Performance Goals**: 60 FPS estável e responsividade de clique inalteradas (Princípio V); leitura/
escrita em `localStorage` acontece no máximo uma vez por transição de scene (início e fim de
partida), nunca dentro do loop de `tick()` — custo irrelevante frente ao orçamento de 60 FPS; o
array de no máximo 5 números serializado em JSON é trivial em tamanho e tempo de parse/stringify

**Constraints**: nenhuma mudança em `entities/Match.ts`, `MatchStateManager` ou `MatchSnapshot`
(Princípios I/II) — o ranking vive inteiramente fora do ciclo de vida de uma `Match`; leitura/
escrita de `localStorage` DEVEM ser envolvidas em `try/catch` e nunca lançar para o chamador
(FR-009); um valor salvo que não seja um array de números finitos e não-negativos (incluindo o
formato de número único salvo por uma execução anterior desta feature, antes da revisão) é tratado
como "ranking vazio" (FR-010), nunca propagado; o tamanho do ranking (5) é uma constante fixa
(`HIGH_SCORE_RANKING_MAX_ENTRIES`), não configurável em runtime (Princípio IV)

**Scale/Scope**: 1 arquivo novo (`client/src/systems/HighScoreStore.ts`, ~45 linhas), 2 constantes
novas em `client/src/config/gameConfig.ts` (`HIGH_SCORE_STORAGE_KEY`,
`HIGH_SCORE_RANKING_MAX_ENTRIES`), edições pontuais em `client/src/scenes/StartScene.ts` e
`client/src/scenes/GameOverScene.ts` (uma chamada + uma lista/texto condicional cada); 1 arquivo de
teste novo (`client/tests/unit/highScoreStore.test.ts`); nenhuma mudança em `entities/`,
`systems/MatchStateManager.ts` ou `systems/CollisionSystem.ts`

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Princípio | Avaliação | Status |
|---|---|---|
| I. Separação entre lógica de jogo e renderização | `HighScoreStore.ts` é TypeScript puro sem `import Phaser`; scenes chamam suas funções diretamente para ler/exibir, sem lógica de decisão (comparação, ordenação, tratamento de valor corrompido) duplicada nos callbacks de UI | PASS |
| II. Cliente como única camada, tratado como não confiável | Continua sem backend; a lógica de comparação/ordenação/persistência fica isolada em `systems/HighScoreStore.ts`, não espalhada em handlers de `pointerdown`/`create()` das scenes | PASS |
| III. Web-first, mobile depois | Nenhuma mudança de input; `localStorage` é suportado igualmente em contextos touch (mobile futuro) | PASS |
| IV. Simplicidade deliberada no MVP | Uma lista de tamanho fixo (5), sem histórico ilimitado, sem metadados por partida, sem sincronização entre dispositivos, sem botão de reset — escopo revisado mas ainda deliberadamente pequeno | PASS |
| V. Responsividade do clique é não-negociável | Leitura/escrita só ocorrem em transições de scene (início/fim de partida), nunca durante o loop de `tick()`/clique — sem impacto em hit-testing ou render por frame | PASS |
| VI. Assets versionados e organizados desde o início | Nenhum asset novo (sprite/som/fonte) | PASS |
| VII. Stack fixada para o MVP | Nenhuma dependência nova; usa `localStorage` (API Web nativa) em vez de backend/banco de dados — consistente com "backend fica fora do MVP" | PASS |

Nenhuma violação identificada. Tabela de Complexity Tracking abaixo permanece vazia.

**Re-check pós-Phase 1**: `data-model.md`/`contracts/high-score-store.md` confirmam que nenhum
campo novo é adicionado a `Match`/`MatchSnapshot`, que `entities/`/`MatchStateManager` permanecem
intocados, e que toda a lógica nova (incluindo a migração silenciosa do formato de número único
para o array) fica contida em `systems/HighScoreStore.ts` + duas chamadas em scenes já existentes —
todas as avaliações da tabela acima continuam válidas sem alteração.

## Project Structure

### Documentation (this feature)

```text
specs/012-high-score-local/
├── plan.md                        # This file (/speckit-plan command output)
├── research.md                    # Phase 0 output (/speckit-plan command)
├── data-model.md                  # Phase 1 output (/speckit-plan command)
├── quickstart.md                  # Phase 1 output (/speckit-plan command)
├── contracts/
│   └── high-score-store.md        # Phase 1 output (/speckit-plan command)
└── tasks.md                       # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
client/                          # único workspace do repositório (reaproveitado, não recriado)
├── src/
│   ├── config/
│   │   └── gameConfig.ts         # + HIGH_SCORE_STORAGE_KEY, HIGH_SCORE_RANKING_MAX_ENTRIES
│   ├── entities/                  # inalterado — Match.score (specs/004) reaproveitado como métrica
│   ├── systems/
│   │   ├── MatchStateManager.ts  # inalterado
│   │   └── HighScoreStore.ts     # NOVO — getRanking()/recordScore(), sem import Phaser
│   └── scenes/
│       ├── StartScene.ts         # + getRanking() em create(), exibe Top 5 ou "sem partidas registradas"
│       └── GameOverScene.ts      # + recordScore(snapshot.score) em create(), exibe posição no ranking condicional
└── tests/unit/
    └── highScoreStore.test.ts    # NOVO — cobre ranking vazio, entrada com espaço livre, entrada que
                                    # desloca a menor pontuação, empate/menor sem alteração, valor
                                    # corrompido (incl. formato antigo de número único), storage indisponível
```

**Structure Decision**: nenhuma pasta nova é criada. A lógica nova fica inteiramente em um arquivo
próprio (`systems/HighScoreStore.ts`), no mesmo diretório de `MatchStateManager`/`CollisionSystem`
mas sem nenhuma dependência entre eles — o ranking é lido/escrito só nas bordas de scene (início e
fim de partida), nunca durante o loop de jogo. `entities/` permanece intocado porque o ranking não é
estado de uma `Match` em andamento, é um valor externo a ela.

## Complexity Tracking

*Nenhuma violação de constitution identificada — tabela intencionalmente vazia.*
