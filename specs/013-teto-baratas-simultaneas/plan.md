# Implementation Plan: Teto de Baratas Simultâneas Progressivo

**Branch**: `013-teto-baratas-simultaneas` | **Date**: 2026-09-20 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/013-teto-baratas-simultaneas/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command; its definition describes the execution workflow.

## Summary

Substituir o limite implícito de baratas ativas simultâneas (hoje: uma por comida presente, FR-021
da spec 001) por um teto explícito e progressivo, calculado por uma nova função pura
`currentRoachCap(survivalMs)` em `gameConfig.ts` que reaproveita o helper de interpolação linear já
existente `rampedValue` (`specs/011-dificuldade-progressiva`), subindo de `ROACH_CAP_BASE = 1`
(início de partida, mais calmo) até `ROACH_CAP_MAX = 2` (fim da rampa) ao longo de
`DIFFICULTY_RAMP_DURATION_MS` (reaproveitada, não uma nova constante). **Valores revisados após
verificação empírica** (research.md §3): rodar o `MatchStateManager` real sem nenhuma eliminação
mostrou que a concorrência natural de baratas hoje nunca passa de 2 simultâneas em nenhum ponto da
rampa — um teto de `3`–`9` (proposta inicial) não teria nenhum efeito observável; `1`→`2` é o único
intervalo capaz de vincular algo de verdade. `MatchStateManager.tick()` passa a exigir `activeRoaches.length < currentRoachCap(survivalMs)`
como condição **adicional** — nunca substituta — à checagem já existente de comidas disponíveis
(`presentFoodItemsWithoutActiveRoach(...).length > 0`). **Insight central do design**: como essa
checagem de comidas disponíveis já garante, por construção, que o número de baratas ativas nunca
excede o número de comidas presentes, a nova condição do teto nunca pode enfraquecer essa garantia
(FR-006) — ela só pode *apertar* o limite, nunca afrouxá-lo. Da mesma forma que em `specs/011`, como
`survivalMs` já vem de `elapsedMs(match, now)` (resetado a cada `start()`/`restart()`, corrigido para
pausa desde `specs/009`), os requisitos "reinicia a cada partida" (FR-010) e "não avança durante a
pausa" (FR-009) são satisfeitos inteiramente por construção, sem nenhum código novo dedicado a eles.
Por decisão explícita do dono do produto (`## Clarifications`), o teto não tem nenhum indicador de
UI/HUD (FR-012) — a mudança fica inteiramente em `config/` + `systems/`, sem tocar nenhuma `scene`.

## Technical Context

**Language/Version**: TypeScript (via `tsconfig.json` do workspace `client/`), executado com Bun

**Primary Dependencies**: Nenhuma dependência nova — reaproveita `rampedValue`/`DIFFICULTY_RAMP_DURATION_MS`
(já existentes em `config/gameConfig.ts`, specs/011), `elapsedMs` (`entities/Match.ts`, specs/007) e
`presentFoodItemsWithoutActiveRoach` (`entities/Match.ts`, specs/001)

**Storage**: N/A — nenhum estado novo. O teto vigente é sempre recalculado a partir de
`match.startedAt`/`match.endedAt`, que já existem; nada é persistido nem cacheado entre chamadas

**Testing**: `bun test` cobre a nova função pura `currentRoachCap` em
`client/src/config/gameConfig.ts` (valor em `survivalMs=0`, no piso/fim de rampa, monotonicidade não-
decrescente — mesmo padrão de `gameConfig.difficultyCurve.test.ts`, specs/011) e a orquestração em
`MatchStateManager.tick()` (número máximo de baratas simultâneas crescendo com o tempo, nunca
excedendo comidas presentes, resetando no restart, congelado durante pausa). A orquestração exige um
novo helper de simulação (diferente do `simulateSurvivalCollectingSpawns` de specs/011, que elimina
cada barata imediatamente e por isso nunca produz mais de 1 ativa por vez) — ver research.md §4.
`matchStateManager.spawn.test.ts` (spec 001/FR-021) continua passando sem alteração, pois sua
asserção já era um limite superior (`<= TOTAL_FOOD_ITEMS`), nunca uma igualdade

**Target Platform**: Navegador (Chrome, Firefox, Edge atuais), resoluções desktop; build estático
servido via Vercel

**Project Type**: Web — cliente único (jogo client-side), sem projeto de backend separado

**Performance Goals**: 60 FPS estável e responsividade de clique inalteradas (Princípio V); a nova
função é aritmética O(1) chamada no máximo uma vez por `tick()` (mesmo ritmo de hoje) — custo
adicional imperceptível frente ao orçamento de 60 FPS; nenhuma mudança em hit-testing ou renderização

**Constraints**: nenhuma mudança em `client/src/entities/` (Princípio I) — `presentFoodItemsWithoutActiveRoach`
e `Roach` permanecem intocados; nenhuma mudança em nenhuma `scene` (Princípio IV/FR-012 — decisão
explícita de não expor UI/HUD para o teto); o teto nunca pode enfraquecer a garantia já existente de
FR-006/FR-021 (nunca mais baratas ativas que comidas presentes) — aplicado como condição adicional,
nunca substituta

**Scale/Scope**: edições em `client/src/config/gameConfig.ts` (2 constantes novas +
`currentRoachCap`) e em `client/src/systems/MatchStateManager.ts` (1 condição nova em `tick()`);
nenhum arquivo novo em `entities/`/`scenes/`; nenhum teste existente precisa ser reescrito ou
removido (diferente de specs/011, que teve que remover `matchStateManager.constants.test.ts`); 2
arquivos de teste novos em `client/tests/unit/`

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Princípio | Avaliação | Status |
|---|---|---|
| I. Separação entre lógica de jogo e renderização | Toda a mudança fica em `config/`+`systems/`, camadas puras sem `import Phaser`; `entities/` permanece completamente intocado | PASS |
| II. Cliente como única camada, tratado como não confiável | Nenhum estado novo — o teto vigente é 100% derivado de `match.startedAt`/`match.endedAt`, já existentes; nenhuma cópia paralela de estado | PASS |
| III. Web-first, mobile depois | Nenhuma mudança de input | PASS |
| IV. Simplicidade deliberada no MVP | Reaproveita a curva linear e a duração de rampa já validadas por `specs/011` em vez de introduzir uma segunda forma de curva ou uma segunda constante de duração; nenhuma UI nova (decisão explícita do dono do produto) — a mudança fica no menor escopo possível para o requisito pedido | PASS |
| V. Responsividade do clique é não-negociável | Uma comparação numérica O(1) a mais por `tick()` — mesmo ritmo de hoje; nenhuma mudança em hit-testing (`CollisionSystem`) ou em `positionAt`/render por frame | PASS |
| VI. Assets versionados e organizados desde o início | Nenhum asset novo | PASS |
| VII. Stack fixada para o MVP | Nenhuma dependência nova | PASS |

Nenhuma violação identificada. Tabela de Complexity Tracking abaixo permanece vazia.

**Re-check pós-Phase 1**: `research.md`/`data-model.md`/`contracts/roach-cap.md` confirmam que
nenhum campo novo é adicionado a `Match`/`Roach`/`MatchSnapshot`, que `entities/`/`scenes/`
permanecem intocados, e que o teto é aplicado exclusivamente como uma condição `&&` adicional em
`tick()` — nunca substituindo a checagem de comidas disponíveis já existente. Todas as avaliações da
tabela acima continuam válidas sem alteração.

## Project Structure

### Documentation (this feature)

```text
specs/013-teto-baratas-simultaneas/
├── plan.md                    # This file (/speckit-plan command output)
├── research.md                # Phase 0 output (/speckit-plan command)
├── data-model.md               # Phase 1 output (/speckit-plan command)
├── quickstart.md               # Phase 1 output (/speckit-plan command)
├── contracts/
│   └── roach-cap.md            # Phase 1 output (/speckit-plan command)
├── checklists/
│   └── requirements.md         # Phase -1 output (/speckit-specify + /speckit-clarify)
└── tasks.md                    # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
client/                          # único workspace do repositório (reaproveitado, não recriado)
├── src/
│   ├── config/
│   │   └── gameConfig.ts         # + ROACH_CAP_BASE=1, ROACH_CAP_MAX=2 (research.md §3)
│   │                              # + currentRoachCap(survivalMs) (função pura, reaproveita rampedValue)
│   ├── entities/                  # inalterado — presentFoodItemsWithoutActiveRoach (specs/001) e
│   │   ├── Match.ts               # elapsedMs (specs/007) reaproveitados sem nenhuma mudança
│   │   └── Roach.ts
│   └── systems/
│       └── MatchStateManager.ts  # tick() calcula roachCap = currentRoachCap(survivalMs) e adiciona
│                                  # activeRoaches.length < roachCap como condição extra de spawn
└── tests/unit/
    ├── gameConfig.difficultyCurve.test.ts   # ESTENDIDO — + describe para currentRoachCap
    │                                          # (survivalMs=0, no fim da rampa, monotonicidade)
    └── matchStateManager.roachCap.test.ts   # NOVO — orquestração em tick(): teto cresce com o
                                               # tempo, nunca excede comidas presentes, reseta no
                                               # restart, congela durante pausa (novo helper de
                                               # simulação, ver research.md §4)
```

**Structure Decision**: nenhuma pasta nova é criada. A mudança fica inteiramente em
`config/gameConfig.ts` (dados + função pura, mesmo lugar das curvas de dificuldade que complementa) e
`systems/MatchStateManager.ts` (o único ponto de chamada). `entities/`/`scenes/` permanecem
intocados — a feature reaproveita deliberadamente `rampedValue`/`DIFFICULTY_RAMP_DURATION_MS`/
`elapsedMs`/`presentFoodItemsWithoutActiveRoach` já entregues por specs anteriores, em vez de
reconstruir qualquer parte disso, consistente com o Princípio IV.

## Complexity Tracking

*Nenhuma violação de constitution identificada — tabela intencionalmente vazia.*
