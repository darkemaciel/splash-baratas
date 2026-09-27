# Contrato: `CursorScene` e o evento `cursor:strike`

Este projeto não expõe API externa — o "contrato" aqui é a interface interna entre a nova
`scenes/CursorScene.ts` (Scene Phaser, dona exclusiva do sprite/animações da pata) e
`scenes/GameScene.ts` (única emissora do evento de golpe), além do papel de `CursorScene` dentro do
boot do jogo (`client/index.ts`).

## Evento `cursor:strike` (via `this.game.events`)

- **Emissor**: `GameScene.handlePointerDown`, como última ação, depois de todo o hit-test e
  efeitos de acerto/erro/roubo já terem sido processados (FR-005/FR-010 — o evento nunca participa
  do caminho crítico do clique).
- **Payload**: nenhum (o evento é só um sinal "um clique de jogo aconteceu agora"; `CursorScene` não
  precisa saber se acertou ou não — FR-007, a animação é idêntica em ambos os casos).
- **Quando NÃO é emitido**: cliques em botões dentro de `GameScene` (ex.: o botão de pausa) que já
  chamam `event.stopPropagation()` antes de chegar a `handlePointerDown` — isso já exclui esses
  cliques hoje, sem lógica adicional (`research.md` §3). Cliques em `StartScene`, `PauseOverlayScene`,
  `GameOverScene` e `AudioControlScene` também nunca emitem esse evento, pois pertencem a Scenes
  diferentes de `GameScene`.
- **Garantias**:
  - Um único `emit()` por clique que efetivamente chega a `handlePointerDown` — nunca duplicado,
    nunca perdido.

## `CursorScene`

- **Ciclo de vida**: registrada como a **última** entrada do array `scene: [...]` em
  `client/index.ts` (depois de `AudioControlScene`) — garante que a pata renderiza e recebe
  `pointermove` por cima de todas as outras Scenes. Como nenhuma Scene além da primeira do array
  (`BootScene`) é auto-iniciada pelo Phaser neste projeto, `BootScene.create()` DEVE chamar
  `this.scene.launch("CursorScene")` explicitamente, no mesmo ponto onde já lança
  `AudioControlScene`. Nunca é parada (`scene.stop`) durante o ciclo de vida do `Phaser.Game`.
- **`create()`**:
  - **Guard de degradação graciosa (FR-008)**: se `this.textures.exists("cursor-paw")` for falso
    (o asset falhou ao carregar em `BootScene`), `create()` retorna imediatamente — nenhum sprite,
    listener ou animação é configurado. Como a classe CSS `cursor-paw-ready` (ver "Chamadores")
    também nunca foi aplicada nesse caso, o cursor nativo do sistema permanece visível e a
    interação de clique continua funcionando normalmente (`GameScene` não depende de
    `CursorScene`).
  - Cria o sprite da pata, inicialmente na última posição conhecida do ponteiro (ou centro da tela
    se ainda não houver nenhuma).
  - Assina `this.input.on('pointermove', ...)` para atualizar a posição-alvo do sprite.
  - Assina `this.game.events.on('cursor:strike', ...)` para disparar a animação de golpe.
  - Estado inicial `"idle"` (pata parada — reage a movimento em `update()`, não é um tween
    contínuo, revisado em 2026-09-26).
- **`update()`**:
  - Reposiciona o sprite na última posição conhecida do ponteiro (sem atraso perceptível — FR-002).
  - Se a animação de golpe em andamento já terminou, volta para idle.
- **Ao receber `cursor:strike`**:
  - Reinicia a animação de golpe a partir do zero, mesmo que uma já esteja em andamento (FR-006) —
    nunca enfileira.
- **Garantias**:
  - Não lê nem escreve nenhum estado de `MatchStateManager`/`Match`/domínio de partida — a
    animação da pata é ortogonal ao domínio da partida (Constitution Princípio I).
  - Nunca atrasa ou altera o resultado do hit-testing de `GameScene`/`CollisionSystem` — reage
    somente depois dele já ter concluído (FR-005/FR-010, Princípio V).
  - O sprite da pata mede um tamanho fixo e visível (`CURSOR_PAW_HEIGHT_PX` — 56px na base
    landscape, escalado por `UI_SCALE`), desacoplado do tamanho de qualquer botão (FR-001/SC-005,
    revisado após feedback de playtest — research.md §4).

## Chamadores

- **`client/index.ts`** DEVE incluir `CursorScene` como a **última** entrada do array
  `scene: [...]` (depois de `AudioControlScene`).
- **`scenes/BootScene.ts`** DEVE chamar `this.scene.launch("CursorScene")` em `create()`, junto do
  `this.scene.launch("AudioControlScene")` já existente.
- **`scenes/GameScene.ts`** DEVE emitir `this.game.events.emit('cursor:strike')` ao final de
  `handlePointerDown`, e não em nenhum outro ponto.
- **`index.html`** DEVE conter a regra `#game.cursor-paw-ready canvas { cursor: none !important; }`
  — condicionada à classe `cursor-paw-ready`, nunca `#game canvas { ... }` incondicional; sem essa
  regra, o cursor nativo reaparece ao passar sobre qualquer botão com `useHandCursor: true`
  (`research.md` §1).
- **`scenes/BootScene.ts`** DEVE adicionar a classe `cursor-paw-ready` ao elemento `#game` somente
  quando `cursor-paw` termina de carregar com sucesso (`this.load.once("filecomplete-image-
  cursor-paw", ...)`) — nunca incondicionalmente. Uma falha de carregamento simplesmente não
  adiciona a classe, sem precisar de um handler de `loaderror` dedicado (research.md §1, FR-008).
- Nenhuma outra Scene DEVE desenhar seu próprio cursor customizado nem escutar `cursor:strike` — a
  pata é responsabilidade exclusiva de `CursorScene`.
