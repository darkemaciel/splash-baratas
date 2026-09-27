# Implementation Plan: Animação de Locomoção da Barata (Andar/Voar)

**Branch**: `016-animacao-locomocao-barata` | **Date**: 2026-09-26 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/016-animacao-locomocao-barata/spec.md`

## Summary

Substituir o sprite estático da barata por uma animação de locomoção contínua e sempre ativa (desde
o spawn, sem depender de `progress`), com dois estilos visuais — "andando" e "voando" — sorteados
uma vez por barata e mantidos até o fim do trajeto. Abordagem técnica: como nenhuma arte final
existe ainda (spritesheets a partir de `docs/references/barata_caminhada.mp4`/`barata_voo.mp4`),
implementar via transformação procedural de rotação sobre o sprite placeholder atual — mesmo padrão
já usado no "juice" (`specs/008-juice-animacao-barata`) e no cursor da pata
(`specs/015-cursor-pata-animada`) — em um canal (`angle`) que hoje não é usado por nenhum efeito
existente, compondo sem conflito com o squash/stretch (`scale`) e o tremor (deslocamento de
posição) já entregues. O estilo por barata vive inteiramente em `GameScene` (um `Map<roachId,
estilo>` client-side), nunca no domínio (`entities/Roach.ts`), preservando a separação do
Princípio I.

> **Revisão 2026-09-27**: a validação no servidor dev mostrou a barata ainda como bolinha — a arte
> por quadros foi produzida a partir dos vídeos de referência e passou a ser a apresentação
> principal (spec FR-008 a FR-010, tasks Phase 6, research §6). A rotação procedural descrita neste
> plano continua existindo, somada à orientação pelo trajeto.

## Technical Context

**Language/Version**: TypeScript (stack fixa do projeto, Constitution Princípio VII)

**Primary Dependencies**: Phaser 4 (`Phaser.GameObjects.Image.setAngle`, já em uso indiretamente via
`setScale`/`setPosition` no mesmo `syncRoachSprites()`)

**Storage**: N/A — nenhuma preferência persiste; o estilo de cada barata vive só durante a partida
(em memória, num `Map` da `GameScene`), como o estado de posição/squash/tremor já existente

**Testing**: `bun test` não se aplica à animação em si (100% dentro de `GameScene.ts`, sem lógica
pura extraível — mesmo caso de `specs/008-juice-animacao-barata`); validação manual via
`quickstart.md`. `research.md` §2 decide manter o sorteio de estilo dentro de `GameScene` (não
extraído para um módulo puro), justamente para não precisar de um harness de teste dedicado só
para essa escolha

**Target Platform**: Navegador desktop (Chrome, Firefox, Edge atuais), resoluções desktop —
mesmo suporte já existente para o restante da `GameScene`

**Project Type**: Single project client-side (`client/` é o único workspace do repositório)

**Performance Goals**: 60 FPS estáveis, resposta ao clique sem atraso perceptível (Constitution
Princípio V) — a animação de locomoção é puramente visual e não pode atrasar `positionAt`/
`pickTopmostHit`/`handlePointerDown` (FR-005)

**Constraints**: A animação de locomoção usa exclusivamente o canal `angle` do sprite — nunca lê
nem escreve `scale`/posição por conta própria, para não colidir com o squash/stretch e o tremor já
calculados por `computeRoachSquashStretch`/`computeRoachTremorOffset` (`specs/008`); estilo
sorteado uma única vez por barata, nunca re-sorteado (FR-002/FR-003)

**Scale/Scope**: Uma nova dimensão de estado por barata ativa (`estilo: "andando" | "voando"`),
armazenada só na `GameScene`; nenhuma nova entidade de domínio, nenhum novo evento do
`MatchStateManager`

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Princípio | Avaliação |
|---|---|
| I. Separação lógica/renderização | PASS — o estilo de locomoção e o cálculo do ângulo vivem inteiramente em `GameScene.ts` (apresentação); `entities/Roach.ts` e `MatchStateManager` permanecem inalterados, sem nenhum campo novo de domínio. |
| II. Cliente como única camada, não confiável | PASS — nenhuma persistência nova, nenhum acoplamento a backend. |
| III. Web-first, mobile depois | PASS — não introduz nem altera nenhuma interação de input; é puramente visual, renderizado igual em qualquer resolução suportada. |
| IV. Simplicidade deliberada | PASS — reaproveita o padrão procedural já validado em `specs/008`/`specs/015` em vez de introduzir um sistema de animação por frames; a alternativa de fases sequenciais (voar-depois-andar) foi explicitamente rejeitada na clarification da spec por adicionar complexidade sem necessidade. |
| V. Responsividade do clique não-negociável | PASS — FR-005 exige explicitamente que a animação nunca altere `positionAt()`; o hit-testing (`handlePointerDown`/`CollisionSystem`) continua lendo exclusivamente a posição real, nunca `sprite.angle`. |
| VI. Assets versionados e organizados | PASS — (revisão 2026-09-27) spritesheets `roach-walk.png`/`roach-fly.png` versionados em `client/public/assets/sprites/`, seguindo a convenção de `specs/015`; o pipeline que os gera e os quadros master ficam em `docs/references/roach-animations/`, fora do build. |
| VII. Stack fixada | PASS — TypeScript + Phaser + Bun, sem novas dependências. |

Nenhuma violação — sem necessidade de preencher Complexity Tracking.

## Project Structure

### Documentation (this feature)

```text
specs/016-animacao-locomocao-barata/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/           # Phase 1 output (/speckit-plan command)
│   └── roach-locomotion.md
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
client/
└── src/
    └── scenes/
        ├── GameScene.ts   # alterado: novo Map<roachId, "andando"|"voando"> de estilo, sorteado
        │                   # ao criar o sprite (dentro de syncRoachSprites()); novo método privado
        │                   # computeRoachLocomotionAngle(roach, now, estilo) somado via
        │                   # sprite.setAngle(...) — canal isolado, não usado por
        │                   # computeRoachSquashStretch/computeRoachTremorOffset (specs/008);
        │                   # limpeza do Map no mesmo loop que já destrói sprites inativos
        └── BootScene.ts   # alterado (revisão 2026-09-27): carrega os spritesheets
                            # roach-walk/roach-fly e cria as animações em loop; a textura
                            # placeholder "roach" (bolinha) foi removida
client/public/assets/sprites/
├── roach-walk.png         # novo: 27 quadros 128x128 (andar)
└── roach-fly.png          # novo: 16 quadros 128x128 (voar)
docs/references/roach-animations/
├── build_roach_spritesheets.py  # novo: pipeline vídeo → spritesheet (fora do build)
├── frames/                      # novo: quadros master 256x256 para aprimoramento futuro
└── README.md
```

**Structure Decision**: Projeto único client-side (`client/`, único workspace do repositório).
Toda a implementação vive dentro de `GameScene.ts`, já a única consumidora de `entities/Roach.ts`
para renderização (Princípio I) — mesmo padrão de `specs/008-juice-animacao-barata`, que também não
tocou `entities/`/`systems/`.

## Complexity Tracking

> Sem violações de Constitution Check — seção não aplicável a esta feature.
