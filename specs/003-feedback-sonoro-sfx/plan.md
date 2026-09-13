# Implementation Plan: Feedback Sonoro (SFX)

**Branch**: `003-feedback-sonoro-sfx` | **Date**: 2026-09-13 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/003-feedback-sonoro-sfx/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command; its definition describes the execution workflow.

## Summary

Reproduzir quatro efeitos sonoros já existentes em `client/public/assets/audio/` (`hit.mp3`,
`miss.mp3`, `fly.mp3`, `steal.mp3`) em resposta aos eventos de partida já emitidos pelo
`MatchStateManager` (`roach:eliminated`, `food:stolen`) e ao resultado do hit-test de clique já
computado em `GameScene` (acerto/erro). Abordagem técnica: nenhuma nova camada de domínio é criada
— o áudio é tratado como efeito colateral de renderização/feedback, exatamente como os `tweens`
visuais já existentes em `GameScene` (Princípios I e II), usando o `Phaser.Sound.SoundManager`
nativo (já incluso no Phaser 4.2.1, sem nova dependência). `walk.mp3` permanece no diretório de
assets mas não é carregado nem acionado por esta feature (FR-011).

## Technical Context

**Language/Version**: TypeScript (via `tsconfig.json` do workspace `client/`), executado com Bun

**Primary Dependencies**: `Phaser.Sound.SoundManager`, nativo do Phaser 4.2.1 já instalado —
nenhuma dependência nova

**Storage**: N/A — nenhum estado de áudio é persistido entre partidas (Princípio VII); o estado
"loop de voo tocando ou não" vive apenas em memória, derivado de `snapshot.activeRoaches.length`

**Testing**: `bun test` permanece cobrindo apenas a camada de domínio (`entities/`, `systems/`),
que não é alterada por esta feature — nenhuma função pura nova é introduzida. A ativação dos sons
é validada manualmente via `bun run dev` (com áudio do dispositivo ativo), seguindo o mesmo padrão
já usado para validar renderização Phaser em `001-roach-fridge-clicker` e
`002-hud-progresso-risco` (sem harness de teste automatizado para `Scene`s)

**Target Platform**: Navegador (Chrome, Firefox, Edge atuais), resoluções desktop; build estático
servido via Vercel

**Project Type**: Web — cliente único (jogo client-side), sem projeto de backend separado

**Performance Goals**: 60 FPS estável e responsividade de clique inalterada (Princípio V; FR-008,
SC-002 da spec) — chamadas de `sound.play()` são disparo-e-esquece (fire-and-forget), nunca
bloqueiam o hit-test nem a atualização de posição das baratas

**Constraints**: áudio só pode iniciar após um gesto de interação do jogador, respeitando as
políticas de autoplay dos navegadores-alvo (FR-010); os 5 arquivos de áudio já existem em
`client/public/assets/audio/` (nenhum asset novo precisa ser produzido); `walk.mp3` não pode ganhar
nenhum gatilho de reprodução nesta feature (FR-011)

**Scale/Scope**: até ~9 acionamentos de som discreto por partida no pior caso realista (uma vez
por comida, entre acerto/erro/roubo — teto informal de `TOTAL_FOOD_ITEMS`, `gameConfig.ts`), mais
1 loop ambiente ligado/desligado a cada transição "há barata ativa? sim/não"

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Princípio | Avaliação | Status |
|---|---|---|
| I. Separação entre lógica de jogo e renderização | Nenhuma regra de jogo é alterada; o áudio é disparado a partir de eventos de domínio já existentes (`roach:eliminated`, `food:stolen`) e do resultado do hit-test já computado em `GameScene`, como efeito colateral de apresentação — mesmo padrão dos `tweens` visuais já existentes (`playRoachEliminated`, `playFoodStolen`) | PASS |
| II. Cliente como única camada, tratado como não confiável | Nenhum novo estado duplicado: o loop ambiente liga/desliga a partir de `snapshot.activeRoaches.length`, já exposto por `MatchSnapshot`, nunca de um contador paralelo mantido pela `Scene` | PASS |
| III. Web-first, mobile depois | Nenhum novo handler de input é criado; o som de erro é acionado dentro do `handlePointerDown` já existente (Pointer Events), no branch em que nenhuma barata é atingida | PASS |
| IV. Simplicidade deliberada no MVP | Nenhuma nova pasta/sistema (`AudioSystem`) é criada para um mapeamento evento→som de poucas linhas; a lógica entra diretamente em `BootScene`/`GameScene`, seguindo o precedente de `002-hud-progresso-risco`. `walk.mp3` é deliberadamente deixado sem gatilho (FR-011) para não antecipar a mecânica de locomoção "andando", ainda não especificada | PASS |
| V. Responsividade do clique é não-negociável | `sound.play()` é assíncrono/fire-and-forget e roda depois do hit-test já resolvido; nenhum carregamento de áudio ocorre durante a partida (preload acontece em `BootScene`, antes de qualquer clique possível) | PASS |
| VI. Assets versionados e organizados desde o início | Os 5 arquivos já residem em `client/public/assets/audio/`, conforme a convenção; `walk.mp3` permanece na pasta mesmo sem uso nesta feature, satisfazendo a organização exigida sem exigir uso imediato | PASS |
| VII. Stack fixada para o MVP | Nenhuma dependência nova — `Phaser.Sound.SoundManager` já vem com `phaser@^4.2.1`, dependência já fixada | PASS |

Nenhuma violação identificada. Tabela de Complexity Tracking abaixo permanece vazia.

## Project Structure

### Documentation (this feature)

```text
specs/003-feedback-sonoro-sfx/
├── plan.md                      # This file (/speckit-plan command output)
├── research.md                  # Phase 0 output (/speckit-plan command)
├── data-model.md                # Phase 1 output (/speckit-plan command)
├── quickstart.md                # Phase 1 output (/speckit-plan command)
├── contracts/
│   └── audio-triggers.md        # Phase 1 output (/speckit-plan command)
└── tasks.md                     # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
client/                          # único workspace do repositório (reaproveitado, não recriado)
├── public/
│   └── assets/
│       └── audio/                # já populado (hit.mp3, miss.mp3, fly.mp3, steal.mp3, walk.mp3)
├── src/
│   ├── scenes/
│   │   ├── BootScene.ts          # + preload() carregando hit/miss/fly/steal (NÃO walk.mp3, FR-011)
│   │   └── GameScene.ts          # + reprodução de hit/steal nos listeners existentes; + som de
│   │                              #   erro no branch "sem hit" de handlePointerDown; + start/stop
│   │                              #   do loop de voo a partir de snapshot.activeRoaches.length
│   └── systems/                  # inalterado — nenhum evento novo é necessário
│       └── MatchStateManager.ts
```

**Structure Decision**: nenhuma pasta ou classe nova é criada (ex.: `audio/`, `AudioSystem.ts`). A
feature estende `BootScene` (preload) e `GameScene` (disparo dos sons), reaproveitando os eventos e
o snapshot já expostos pela camada de domínio, no mesmo espírito de `002-hud-progresso-risco`
(Principle IV) — o volume de código necessário (poucos métodos curtos + um `preload()`) não
justifica uma nova camada arquitetural.

## Complexity Tracking

*Nenhuma violação de constitution identificada — tabela intencionalmente vazia.*
