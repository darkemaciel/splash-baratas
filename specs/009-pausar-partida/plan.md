# Implementation Plan: Pausar Partida

**Branch**: `009-pausar-partida` | **Date**: 2026-09-17 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/009-pausar-partida/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command; its definition describes the execution workflow.

## Summary

Permitir pausar/retomar a partida através de um botão no HUD de `GameScene` (mais um atalho de
teclado opcional, tecla "P", FR-014), congelando completamente o jogo (trajeto/spawn/roubo de
baratas, cronômetro, tweens de feedback e o efeito de squash/stretch/tremor de
`specs/008-juice-animacao-barata`) e bloqueando cliques, sem tocar em nenhuma linha de
`entities/`/`systems/`. Abordagem técnica: `this.scene.pause()` na própria `GameScene` congela
`this.tweens` e o Input Plugin da Scene automaticamente (ambos baseados em delta acumulado por
frame) + `this.scene.launch("PauseOverlayScene")` para uma Scene nova, pequena, rodando em paralelo
só para exibir o indicador "Pausado" e o botão "Continuar" (cujo próprio Input Plugin continua
ativo). **Correção após teste manual** (research.md §1a): `this.time.now` (Clock do Phaser) por si
só NÃO congela corretamente — ele para de avançar durante a pausa, mas salta direto para o tempo
real ao retomar, sem descontar o intervalo pausado. `GameScene` compensa isso acumulando o tempo
real pausado (`pausedAccumMs`, via `performance.now()` nos eventos `PAUSE`/`RESUME` da própria
Scene) e expõe `logicalNow()` = `this.time.now - pausedAccumMs`, usado em todo ponto que hoje
alimenta `MatchStateManager.tick()`/`positionAt()`/`elapsedMs()` — o domínio em si continua sem
nenhuma noção de pausa, apenas recebe um `now` já corrigido.

## Technical Context

**Language/Version**: TypeScript (via `tsconfig.json` do workspace `client/`), executado com Bun

**Primary Dependencies**: Phaser 4.2.1 — Scene Manager (`this.scene.pause()/resume()/launch()/stop()`,
documentado como o padrão nativo do próprio Phaser para menus de pausa: "Use this if you wish to
open a modal Scene by calling `pause` on the current Scene, then `run`/`launch` on the modal Scene")
e Sound Manager (`this.sound.pauseAll()/resumeAll()`, global ao `Game`) — nenhuma dependência nova

**Storage**: N/A — o estado de pausa (rodando/pausada) é o próprio Scene Manager do Phaser,
consultável via `this.scene.isPaused(...)` se necessário. O único estado novo é `pausedAccumMs`
(número, em `GameScene`) — não é um novo conceito de domínio, apenas a correção do relógio
(research.md §1a), resetado a cada `create()`/restart

**Testing**: `bun test` permanece cobrindo só a camada de domínio (`entities/`, `systems/`), que não
é alterada por esta feature — nenhuma função pura nova é adicionada lá. O comportamento de
pausar/retomar é validado manualmente via `bun run dev`, seguindo o mesmo padrão já usado para
comportamento de `Scene`/sprites do Phaser em specs anteriores (001/003/007/008)

**Target Platform**: Navegador (Chrome, Firefox, Edge atuais), resoluções desktop; build estático
servido via Vercel

**Project Type**: Web — cliente único (jogo client-side), sem projeto de backend separado

**Performance Goals**: 60 FPS estável e responsividade de clique inalteradas (Princípio V); pausar
na prática *reduz* o trabalho por frame (a Scene pausada não roda `tick()`/`syncRoachSprites()`), e
nenhum polling ou timer adicional é introduzido para sustentar a pausa

**Constraints**: nenhuma mudança em `client/src/entities/` ou `client/src/systems/` (Princípio I) —
`MatchStateManager` continua sem qualquer noção de pausa; o clique no botão de pausar/retomar NÃO
PODE também disparar `GameScene.handlePointerDown` (que trataria o mesmo clique como "clique
perdido", tocaria `sfx-miss` e quebraria o combo) — resolvido chamando `event.stopPropagation()` no
handler `pointerdown` do próprio botão (4º argumento do listener de um GameObject interativo no
Phaser), aproveitando a hierarquia de eventos documentada pelo Phaser
(`GAMEOBJECT_POINTER_DOWN` → `GAMEOBJECT_DOWN` → `POINTER_DOWN`); todo ponto que hoje passa
`this.time.now` para `positionAt`/`tick`/`elapsedMs`/o juice de `specs/008` DEVE passar
`this.logicalNow()` em vez disso (research.md §1a) — `this.time.now` sozinho salta pelo intervalo
pausado ao retomar e não deve ser lido diretamente por nenhum código que alimente o domínio

**Scale/Scope**: 1 arquivo novo pequeno (`PauseOverlayScene.ts`, mesmo porte de `StartScene`/
`GameOverScene`: um retângulo semitransparente + texto "Pausado" + botão "Continuar", + atalho de
teclado "P"); edições em `GameScene.ts` (botão de pausa no HUD + atalho "P", `pauseAll`/`resumeAll`
do som, guarda defensiva de restart, `pausedAccumMs`/`logicalNow()`) e em `index.ts` (registrar a
nova Scene no array `scene: [...]`)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Princípio | Avaliação | Status |
|---|---|---|
| I. Separação entre lógica de jogo e renderização | Nenhuma mudança em `entities/`/`systems/`; `MatchStateManager.tick()` continua a única fonte de regra de jogo e nunca é informado sobre pausa — ela simplesmente para de ser chamada enquanto a `Scene` está pausada | PASS |
| II. Cliente como única camada, tratado como não confiável | Nenhum estado novo é introduzido fora do já existente; o "estado de pausa" é o próprio Scene Manager do Phaser (`GameScene` ativa/pausada), não uma cópia paralela em `Match` ou em outro lugar | PASS |
| III. Web-first, mobile depois | Botão de pausar (`GameScene`) e botão "Continuar" (`PauseOverlayScene`) usam `setInteractive({ useHandCursor: true })` + evento `pointerdown` — mesmo padrão já usado em `StartScene`/`GameOverScene`; nenhuma interação essencial depende de teclado | PASS |
| IV. Simplicidade deliberada no MVP | Usa a primitiva nativa do Phaser para pausa modal (`scene.pause`/`launch`) em vez de reimplementar timestamps/offsets manuais; 1 arquivo novo pequeno, sem sistema/pasta nova | PASS |
| V. Responsividade do clique é não-negociável | Pausar reduz trabalho por frame; clique no botão de pausa explicitamente isolado do hit-test de baratas via `event.stopPropagation()` para não introduzir cliques perdidos espúrios; nenhuma mudança em `positionAt`/`pickTopmostHit` | PASS |
| VI. Assets versionados e organizados desde o início | Nenhum asset novo — reaproveita fontes/cores/padrão visual já usados em `GameOverScene` | PASS |
| VII. Stack fixada para o MVP | Nenhuma dependência nova — usa apenas APIs já presentes em `phaser@^4.2.1` (Scene Manager, Sound Manager) | PASS |

Nenhuma violação identificada. Tabela de Complexity Tracking abaixo permanece vazia.

**Re-check pós-Phase 1**: o design em `research.md`/`data-model.md`/`contracts/pause-lifecycle.md`
não introduziu nenhum campo novo em `Match`/`Roach`/`MatchSnapshot`, nenhum método novo em
`MatchStateManager`, e confirmou que `entities/`/`systems/` permanecem intocados — todas as
avaliações da tabela acima continuam válidas sem alteração.

## Project Structure

### Documentation (this feature)

```text
specs/009-pausar-partida/
├── plan.md                      # This file (/speckit-plan command output)
├── research.md                  # Phase 0 output (/speckit-plan command)
├── data-model.md                # Phase 1 output (/speckit-plan command)
├── quickstart.md                # Phase 1 output (/speckit-plan command)
├── contracts/
│   └── pause-lifecycle.md       # Phase 1 output (/speckit-plan command)
└── tasks.md                     # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
client/                          # único workspace do repositório (reaproveitado, não recriado)
├── index.ts                      # + registrar PauseOverlayScene no array `scene: [...]`
├── src/
│   ├── entities/                 # inalterado — nenhuma regra de domínio sabe da pausa
│   │   └── Roach.ts
│   ├── systems/                  # inalterado
│   │   ├── CollisionSystem.ts
│   │   └── MatchStateManager.ts
│   └── scenes/
│       ├── GameScene.ts          # + botão de pausa no HUD; + this.sound.pauseAll()/resumeAll();
│       │                         #   + guarda defensiva this.scene.stop("PauseOverlayScene") em create()
│       └── PauseOverlayScene.ts  # NOVO — overlay "Pausado" + botão "Continuar", mesmo padrão
│                                 #   visual/interativo de GameOverScene (retângulo semitransparente
│                                 #   + texto + setInteractive/pointerdown)
```

**Structure Decision**: nenhuma pasta nova é criada. Um único arquivo novo (`PauseOverlayScene.ts`),
do mesmo porte e padrão já estabelecido por `StartScene`/`GameOverScene` (uma Scene pequena e
dedicada a uma tela/estado específico) — não uma extensão inline de `GameScene` (como foi o caso do
"juice" em `008`), porque a pausa exige uma segunda Scene rodando em paralelo com Input Plugin
próprio para que o botão "Continuar" continue clicável enquanto `GameScene` está pausada (ver
`research.md` §2). `entities/`/`systems/` permanecem intocados (Princípio I).

## Complexity Tracking

*Nenhuma violação de constitution identificada — tabela intencionalmente vazia.*
