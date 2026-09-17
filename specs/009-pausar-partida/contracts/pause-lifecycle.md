# Contract: Ciclo de Vida da Pausa (Scene Manager)

Esta feature não altera o contrato de domínio↔renderização existente
(`specs/001-roach-fridge-clicker/contracts/domain-api.md` e extensões seguintes) — nenhum evento
novo é adicionado a `MatchStateManager`, nenhum método novo é exposto por ele. Este documento
registra o contrato **novo** desta feature: quem chama o quê, em que ordem, no Scene Manager e
Sound Manager do Phaser, para que features futuras que toquem pausa/retomada sigam o mesmo padrão.

## Gatilhos e transições

| Ação do jogador | Quem dispara | Chamadas (nesta ordem) |
|---|---|---|
| Pausar | Botão de pausa em `GameScene` (HUD) ou tecla "P" (FR-014) | 1. (só no botão) `event.stopPropagation()` (impede `handlePointerDown`)<br>2. `this.sound.pauseAll()`<br>3. `this.scene.pause()` (pausa a própria `GameScene`)<br>4. `this.scene.launch("PauseOverlayScene")` |
| Retomar | Botão "Continuar" em `PauseOverlayScene` ou tecla "P" (FR-014) | 1. `this.sound.resumeAll()`<br>2. `this.scene.resume("GameScene")`<br>3. `this.scene.stop()` (encerra a própria `PauseOverlayScene`) |
| Restart defensivo | Início de `GameScene.create()` | `this.scene.stop("PauseOverlayScene")` (no-op seguro se não estiver rodando); `pausedAccumMs = 0`; `pauseStartedAtWallClock = null` |

A ordem de `pauseAll`/`scene.pause` (e o inverso no resume) não é estritamente obrigatória — ambas
as chamadas de Scene Manager só têm efeito no próximo update do Scene Manager, não imediatamente —
mas mantê-la consistente evita qualquer janela em que o som continue tocando um frame a mais que o
jogo pausado.

**Correção de relógio (independente dos gatilhos acima, sempre ativa)**: `GameScene` escuta os
eventos nativos `PAUSE`/`RESUME` da própria Scene (`this.events.on(Phaser.Scenes.Events.PAUSE/RESUME, ...)`,
disparados pelo Scene Manager sempre que ela pausa/retoma, não importa qual gatilho — botão ou
tecla) para acumular `pausedAccumMs` via `performance.now()`. Ver research.md §1a para o porquê:
`this.time.now` sozinho salta pelo intervalo pausado ao retomar em vez de descontá-lo.

## Garantia de não-interferência no domínio (Princípio I/II)

| Caminho de código | Sabe que existe pausa? |
|---|---|
| `entities/Roach.ts` (`progress`, `positionAt`, `hasReachedTarget`) | Não — nunca muda |
| `entities/Match.ts` (`elapsedMs`, `allFoodStolen`, ...) | Não — nunca muda |
| `systems/MatchStateManager.ts` (`tick`, `tryEliminateRoach`, ...) | Não — nunca muda; apenas deixa de ser chamado enquanto `GameScene` está pausada, e passa a receber `GameScene.logicalNow()` em vez de `this.time.now` cru (correção de apresentação, não de domínio — research.md §1a) |
| `systems/CollisionSystem.ts` (`pickTopmostHit`) | Não — nunca muda; apenas deixa de ser invocado (Input Plugin da `GameScene` pausada não dispara `handlePointerDown`) |

Qualquer alteração futura que passe a informar `MatchStateManager` sobre pausa (ex.: um parâmetro
`isPaused` em `tick()`) quebraria esta garantia e deve ser rejeitada em revisão — o domínio **deve**
continuar cego à existência de pausa, por definição desta feature (mesmo critério de "garantia de
não-interferência" já usado em `specs/008-juice-animacao-barata/contracts/roach-juice-effect.md`
para o hit-testing).

## Garantia de congelamento visual completo (FR-013, clarificação de 2026-09-17)

| Elemento visual | Por que congela |
|---|---|
| Posição/trajeto de cada barata | `syncRoachSprites()` só roda dentro de `GameScene.update()`, que não executa enquanto pausada; ao retomar, usa `logicalNow()` (não `this.time.now` cru) para não saltar (research.md §1a) |
| Tweens de feedback (queda de eliminação, encolhimento de roubo) | `this.tweens` pertence à `GameScene`; para automaticamente quando a Scene é pausada (nativo do Phaser, baseado em delta por frame — não sofre o salto de `this.time.now`) |
| Squash/stretch/tremor (`specs/008-juice-animacao-barata`) | Mesma razão da posição — calculado dentro de `syncRoachSprites()`, dentro de `update()`, também usando `logicalNow()` |
| Cronômetro de sobrevivência (HUD) | `elapsedMs` usa `logicalNow()`; `updateTimer()` também só roda dentro de `update()` |
| Som ambiente (`sfx-fly`) e qualquer som em andamento | `this.sound.pauseAll()` explícito (Sound Manager é global ao `Game`, não pausa sozinho com a Scene) |

## Extensão futura (fora de escopo desta feature)

- **Atalho de teclado para pausar/retomar**: implementado nesta própria feature (FR-014, tecla "P")
  — ver "Gatilhos e transições" acima.
- **Pausa automática ao perder foco da aba**: fora de escopo (ver Assumptions do `spec.md`); se
  priorizado, deveria reusar a mesma transição de "Pausar" acima, disparada por um listener de
  `document.visibilitychange` em vez de um clique.
