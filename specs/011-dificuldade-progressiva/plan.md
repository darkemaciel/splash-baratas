# Implementation Plan: Dificuldade Progressiva

**Branch**: `011-dificuldade-progressiva` | **Date**: 2026-09-17 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/011-dificuldade-progressiva/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command; its definition describes the execution workflow.

## Summary

Substituir as constantes fixas `SPAWN_INTERVAL_MS`/`TRAVEL_DURATION_MS` por um par de funções
puras (`currentSpawnIntervalMs`/`currentTravelDurationMs`) que interpolam linearmente de um valor
base para um piso mínimo ao longo de `DIFFICULTY_RAMP_DURATION_MS` de tempo de sobrevivência,
substituindo deliberadamente a garantia de `FR-016` da spec 001 (Princípio IV já prevê essa
migração). `MatchStateManager.tick()` passa a calcular o tempo de sobrevivência atual via
`elapsedMs(this.match, now)` — já existente desde `specs/007-tempo-de-sobrevivencia` — e usá-lo
para escolher tanto o intervalo de spawn quanto o tempo de viagem da próxima barata. **Insight
central do design**: como `elapsedMs` já usa `match.startedAt`/`match.endedAt` (resetados a cada
`start()`/`restart()`) e como o único `now` que alimenta `tick()` já é `logicalNow()` — corrigido
para pausa por `specs/009-pausar-partida` — os requisitos de "reinicia a cada partida" (FR-005) e
"não avança durante a pausa" (FR-006) são satisfeitos inteiramente por construção, sem nenhum
código novo dedicado a eles. Da mesma forma, `Roach.travelDurationMs` já é fixado no momento da
criação e nunca recalculado (`entities/Roach.ts` imutável), então FR-007 (barata em voo não é
afetada retroativamente) também já é garantido pelo desenho atual.

## Technical Context

**Language/Version**: TypeScript (via `tsconfig.json` do workspace `client/`), executado com Bun

**Primary Dependencies**: Nenhuma dependência nova — reaproveita `elapsedMs` (já existente em
`entities/Match.ts`, specs/007) e aritmética simples (interpolação linear)

**Storage**: N/A — nenhum estado novo. O "nível de dificuldade" é sempre recalculado a partir de
`match.startedAt`/`match.endedAt`, que já existem; nada é persistido nem cacheado entre chamadas

**Testing**: `bun test` cobre as novas funções puras em `client/src/config/gameConfig.ts`
(interpolação, piso, valor em `survivalMs=0`) e a orquestração em
`client/src/systems/MatchStateManager.ts` (cadência e tempo de viagem variando com o tempo
decorrido), seguindo o mesmo padrão de `specs/007-tempo-de-sobrevivencia`/`specs/010-variacao-pontos-spawn`.
Um teste existente, `matchStateManager.constants.test.ts` (que afirma que `SPAWN_INTERVAL_MS`/
`TRAVEL_DURATION_MS` "não mudam entre o primeiro e o último spawn"), precisa ser reescrito — ele
testa exatamente a garantia (`FR-016` da spec 001) que esta feature substitui deliberadamente

**Target Platform**: Navegador (Chrome, Firefox, Edge atuais), resoluções desktop; build estático
servido via Vercel

**Project Type**: Web — cliente único (jogo client-side), sem projeto de backend separado

**Performance Goals**: 60 FPS estável e responsividade de clique inalteradas (Princípio V); as duas
novas funções são aritmética O(1) chamada no máximo uma vez por `tick()` (o mesmo ritmo de hoje) —
custo adicional imperceptível frente ao orçamento de 60 FPS

**Constraints**: nenhuma mudança em `client/src/entities/Roach.ts` (Princípio I) — `travelDurationMs`
continua um campo fixo por barata, definido uma única vez em `createRoach`; nenhuma mudança em
`entities/Match.ts` além de reaproveitar `elapsedMs` já existente; os limiares de
`REACTION_BONUS_TIERS`/`COMBO_WINDOW_MS` (specs/004) permanecem intocados (FR-009) — validado em
research.md que o piso mínimo de tempo de viagem escolhido continua compatível com a faixa de bônus
mais exigente

**Scale/Scope**: edições em `client/src/config/gameConfig.ts` (renomeia `SPAWN_INTERVAL_MS`/
`TRAVEL_DURATION_MS` para `SPAWN_INTERVAL_BASE_MS`/`TRAVEL_DURATION_BASE_MS`, adiciona os pisos e as
2 funções de curva) e em `client/src/systems/MatchStateManager.ts` (usa `elapsedMs` + as novas
funções em `tick()`); nenhum arquivo novo em `entities/`/`scenes/`; 1 teste existente reescrito
(`matchStateManager.constants.test.ts`) e 3 testes existentes com o import do nome antigo da
constante renomeados mecanicamente (`matchStateManager.spawn.test.ts`,
`matchStateManager.spawnVariety.test.ts`, `matchStateManager.spawnCoherence.test.ts` — usam a
constante só como passo fixo para avançar `tick()` em seus próprios loops, comportamento inalterado);
alguns testes novos em `client/tests/unit/`

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Princípio | Avaliação | Status |
|---|---|---|
| I. Separação entre lógica de jogo e renderização | Toda a mudança fica em `config/`+`systems/`, camadas puras sem `import Phaser`; `entities/Roach.ts` permanece intocado — `travelDurationMs` continua um campo imutável por barata | PASS |
| II. Cliente como única camada, tratado como não confiável | Nenhum estado novo — o "nível de dificuldade" é 100% derivado de `match.startedAt`/`match.endedAt`, já existentes; nenhuma cópia paralela de estado | PASS |
| III. Web-first, mobile depois | Nenhuma mudança de input | PASS |
| IV. Simplicidade deliberada no MVP | Esta é exatamente a migração que o próprio Princípio IV prevê ("Quando essas features forem priorizadas, entram como spec nova") — nenhuma antecipação foi feita no MVP original, a mudança chega inteira nesta spec dedicada; usa interpolação linear simples em vez de um sistema de curvas configurável | PASS |
| V. Responsividade do clique é não-negociável | Duas funções de aritmética O(1), chamadas no máximo 1x por `tick()` — mesmo ritmo de hoje; nenhuma mudança em hit-testing (`CollisionSystem`) ou em `positionAt`/render por frame | PASS |
| VI. Assets versionados e organizados desde o início | Nenhum asset novo | PASS |
| VII. Stack fixada para o MVP | Nenhuma dependência nova | PASS |

Nenhuma violação identificada. Tabela de Complexity Tracking abaixo permanece vazia.

**Re-check pós-Phase 1**: `research.md`/`data-model.md`/`contracts/difficulty-curve.md` confirmam
que nenhum campo novo é adicionado a `Match`/`Roach`/`MatchSnapshot`, que `entities/` permanece
intocado exceto pelo reaproveitamento de `elapsedMs` já existente, e que os pisos escolhidos
(`SPAWN_INTERVAL_FLOOR_MS`/`TRAVEL_DURATION_FLOOR_MS`) continuam compatíveis com
`REACTION_BONUS_TIERS`/`COMBO_WINDOW_MS` sem exigir nenhuma mudança neles — todas as avaliações da
tabela acima continuam válidas sem alteração.

## Project Structure

### Documentation (this feature)

```text
specs/011-dificuldade-progressiva/
├── plan.md                        # This file (/speckit-plan command output)
├── research.md                    # Phase 0 output (/speckit-plan command)
├── data-model.md                  # Phase 1 output (/speckit-plan command)
├── quickstart.md                  # Phase 1 output (/speckit-plan command)
├── contracts/
│   └── difficulty-curve.md        # Phase 1 output (/speckit-plan command)
└── tasks.md                       # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
client/                          # único workspace do repositório (reaproveitado, não recriado)
├── src/
│   ├── config/
│   │   └── gameConfig.ts         # SPAWN_INTERVAL_MS/TRAVEL_DURATION_MS → *_BASE_MS + *_FLOOR_MS;
│   │                              # + currentSpawnIntervalMs/currentTravelDurationMs (funções puras)
│   ├── entities/                  # inalterado — elapsedMs (specs/007) e Roach (imutável) reaproveitados
│   │   ├── Match.ts
│   │   └── Roach.ts
│   └── systems/
│       └── MatchStateManager.ts  # tick() calcula elapsedMs(this.match, now) uma vez e passa para
│                                  # as duas novas funções, substituindo a leitura direta das
│                                  # constantes fixas
└── tests/unit/
    ├── gameConfig.difficultyCurve.test.ts        # NOVO — cobre as 2 funções de curva, incluindo o
    │                                              # valor em survivalMs=0 e o piso (substitui a
    │                                              # cobertura relevante do arquivo removido abaixo)
    ├── matchStateManager.difficulty.test.ts      # NOVO — cobre a orquestração em tick()
    └── matchStateManager.constants.test.ts       # REMOVIDO — a garantia que ele testava (FR-016 da
                                                    # spec 001, "constantes não mudam") é exatamente
                                                    # o que esta feature substitui; sua cobertura
                                                    # ainda válida migra para o arquivo NOVO acima
```

**Structure Decision**: nenhuma pasta nova é criada. A mudança fica inteiramente em
`config/gameConfig.ts` (dados + funções puras, mesmo lugar das constantes que substitui) e
`systems/MatchStateManager.ts` (o único ponto de chamada). `entities/`/`scenes/` permanecem
intocados — a feature reaproveita deliberadamente `elapsedMs`/`logicalNow()`/a imutabilidade de
`Roach.travelDurationMs` já entregues por specs anteriores, em vez de reconstruir qualquer parte
disso, consistente com o Princípio IV.

## Complexity Tracking

*Nenhuma violação de constitution identificada — tabela intencionalmente vazia.*
