# Implementation Plan: Juice na Animação da Barata

**Branch**: `008-juice-animacao-barata` | **Date**: 2026-09-16 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/008-juice-animacao-barata/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command; its definition describes the execution workflow.

## Summary

Aplicar um efeito visual contínuo de squash/stretch + tremor (shake) ao sprite de cada barata
ativa, com intensidade proporcional ao seu próprio `progress(roach, now)` (0 no spawn, 1 ao
alcançar o alvo) — sutil no início, mais pronunciado perto do alvo. Abordagem técnica: nenhuma nova
camada de domínio é criada; o efeito é puro cálculo de apresentação dentro de
`GameScene.syncRoachSprites` (dois métodos privados novos, sem export, seguindo o precedente já
estabelecido por `003-feedback-sonoro-sfx`/HUD de manter lógica de apresentação pequena inline na
`Scene` em vez de criar um novo arquivo/sistema). O sprite recebe um deslocamento de posição
(tremor) somado por cima da posição lógica real e uma escala nos eixos X/Y (squash/stretch)
oscilante — nenhum dos dois é lido de volta pelo hit-testing, que continua recalculando a posição
verdadeira via `positionAt()` (já o comportamento atual de `handlePointerDown`, inalterado). Cada
barata usa uma fase própria (derivada de `roach.id`) para que múltiplas baratas não tremam em
sincronia perfeita. O efeito é interrompido implicitamente pelo mesmo mecanismo que já hoje remove
o sprite do `Map` (`roachSprites`) assim que a barata deixa de estar ativa — nenhuma mudança
adicional é necessária em `playRoachEliminated`/`playFoodStolen`.

## Technical Context

**Language/Version**: TypeScript (via `tsconfig.json` do workspace `client/`), executado com Bun

**Primary Dependencies**: Phaser 4.2.1 (`Phaser.GameObjects.Image.setPosition`/`setScale`) —
nenhuma dependência nova

**Storage**: N/A — o efeito é recalculado a cada frame a partir de `progress(roach, now)` e do
timestamp corrente; nada é persistido nem guardado como estado adicional por barata

**Testing**: `bun test` permanece cobrindo apenas a camada de domínio (`entities/`, `systems/`),
que não é alterada por esta feature — nenhuma função pura nova é adicionada lá. A curva de
intensidade e o efeito visual são validados manualmente via `bun run dev`, seguindo o mesmo padrão
já usado para validar renderização Phaser sem harness de teste automatizado (specs 001–007)

**Target Platform**: Navegador (Chrome, Firefox, Edge atuais), resoluções desktop; build estático
servido via Vercel

**Project Type**: Web — cliente único (jogo client-side), sem projeto de backend separado

**Performance Goals**: 60 FPS estável e responsividade de clique inalterada (Princípio V; FR-006,
SC-003 da spec). O cálculo por barata ativa é O(1) (duas chamadas trigonométricas para tremor, uma
para squash/stretch), no mesmo laço que já executa `positionAt()` para cada uma das no máximo
`TOTAL_FOOD_ITEMS` (9) baratas simultâneas — custo adicional desprezível face ao já pago hoje

**Constraints**: o efeito NÃO PODE alterar a posição usada por `CollisionSystem.pickTopmostHit`
nem por `handlePointerDown` (FR-004, Princípio V) — ambos continuam usando `positionAt()`
diretamente, nunca `sprite.x`/`sprite.y`; nenhuma mudança em `client/src/entities/` ou
`client/src/systems/` (Assumptions da spec, Princípio I); o efeito deve zerar sua contribuição
exatamente em `progress === 0` (spawn) para satisfazer o Edge Case "quase imperceptível no spawn"

**Scale/Scope**: 2 métodos privados novos + ~6 constantes de amplitude/frequência em
`GameScene.ts`; nenhum arquivo novo, nenhuma pasta nova; aplica-se a no máximo `TOTAL_FOOD_ITEMS`
(9) sprites de barata simultâneos, o mesmo teto já existente hoje

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Princípio | Avaliação | Status |
|---|---|---|
| I. Separação entre lógica de jogo e renderização | Nenhuma regra de jogo é tocada; o efeito consome apenas `progress(roach, now)`, já uma função pura existente em `entities/Roach.ts`, e escreve exclusivamente em propriedades visuais do sprite Phaser (`setPosition`/`setScale`) dentro de `GameScene` | PASS |
| II. Cliente como única camada, tratado como não confiável | Nenhum estado novo é introduzido fora do já existente `roachSprites: Map`; a fase de tremor por barata é derivada deterministicamente de `roach.id` a cada chamada, não é um campo mutável armazenado em lugar novo | PASS |
| III. Web-first, mobile depois | Nenhum novo handler de input é criado ou alterado; `handlePointerDown` continua idêntico, recalculando a posição real via `positionAt()` | PASS |
| IV. Simplicidade deliberada no MVP | Sem nova pasta/sistema/arquivo — dois métodos privados inline em `GameScene.ts`, seguindo o precedente de `003-feedback-sonoro-sfx` (áudio) e do HUD (`002`/`005`) de manter lógica de apresentação pequena diretamente na Scene | PASS |
| V. Responsividade do clique é não-negociável | O hit-testing (`CollisionSystem.pickTopmostHit`, `handlePointerDown`) continua usando exclusivamente `positionAt()` — o efeito visual nunca é lido de volta para decidir acerto/erro (FR-004); custo de CPU adicional é O(1) por barata ativa, mesma ordem de grandeza do cálculo de posição já existente | PASS |
| VI. Assets versionados e organizados desde o início | Nenhum asset novo — reaproveita o sprite `roach` já carregado em `BootScene` | PASS |
| VII. Stack fixada para o MVP | Nenhuma dependência nova — usa apenas APIs já presentes em `phaser@^4.2.1` (`setPosition`, `setScale`) | PASS |

Nenhuma violação identificada. Tabela de Complexity Tracking abaixo permanece vazia.

## Project Structure

### Documentation (this feature)

```text
specs/008-juice-animacao-barata/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/
│   └── roach-juice-effect.md # Phase 1 output (/speckit-plan command)
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
client/                          # único workspace do repositório (reaproveitado, não recriado)
├── src/
│   ├── entities/
│   │   └── Roach.ts              # inalterado — progress()/positionAt() já existentes são reaproveitados como entrada do efeito
│   ├── systems/                  # inalterado — nenhum evento ou hit-test novo é necessário
│   │   └── CollisionSystem.ts
│   └── scenes/
│       └── GameScene.ts          # + constantes de amplitude/frequência do efeito; + computeRoachTremor()/computeRoachSquashStretch() (privados); syncRoachSprites() passa a aplicar setPosition()+setScale() com o efeito somado à posição real
```

**Structure Decision**: nenhuma pasta ou arquivo novo é criado. A feature estende exclusivamente
`GameScene.ts`, no mesmo método (`syncRoachSprites`) que já lê `positionAt()` por frame para
posicionar cada sprite — o volume de lógica (duas fórmulas trigonométricas parametrizadas por
`progress`) não justifica um novo arquivo/sistema, seguindo o mesmo precedente e critério já usados
em `003-feedback-sonoro-sfx` (Princípio IV).

## Complexity Tracking

*Nenhuma violação de constitution identificada — tabela intencionalmente vazia.*
