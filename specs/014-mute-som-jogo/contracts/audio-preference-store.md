# Contrato: `AudioPreferenceStore` e `AudioControlScene`

Este projeto não expõe API externa — o "contrato" aqui é a interface interna entre
`systems/AudioPreferenceStore.ts` (persistência, sem `import Phaser`) e a nova
`scenes/AudioControlScene.ts` (Scene Phaser, única chamadora), além do papel dessa Scene dentro do
boot do jogo (`client/index.ts`).

## `getMuted(): boolean`

- **Entrada**: nenhuma.
- **Saída**: `true` se a última preferência salva for "mudo"; `false` em qualquer outro caso —
  incluindo quando nenhuma preferência foi salva ainda (padrão, FR-007/Clarifications Q1), quando
  `localStorage` está indisponível, ou quando o valor salvo está corrompido/em formato inesperado.
- **Garantias**:
  - Nunca lança exceção, independentemente do estado de `localStorage`.
  - Não tem efeito colateral — não escreve nada.
  - `false` (som ativo) é sempre o valor de fallback seguro, nunca `true`.

## `setMuted(muted: boolean): void`

- **Entrada**: `muted`, o novo estado a persistir.
- **Saída**: nenhuma.
- **Garantias**:
  - Tenta persistir em `localStorage`; se a escrita falhar (indisponível, quota excedida, modo
    privado), a chamada não lança exceção e simplesmente não persiste — o estado em memória da
    Scene já foi atualizado por quem chamou (Clarifications Q2: degradação graciosa).
  - Nunca lança exceção, independentemente do estado de `localStorage`.

## `AudioControlScene`

- **Ciclo de vida**: registrada como a **última** entrada do array `scene: [...]` em
  `client/index.ts` (depois de `PauseOverlayScene`) — a posição no array define a ordem de
  renderização/prioridade de input do Phaser, garantindo que `AudioControlScene` sempre renderiza e
  recebe cliques por cima de todas as outras Scenes, incluindo a overlay semitransparente de
  `PauseOverlayScene`. Como nenhuma Scene além da primeira do array (`BootScene`) é auto-iniciada
  pelo Phaser, `BootScene.create()` DEVE chamar `this.scene.launch("AudioControlScene")`
  explicitamente (mesmo padrão do `this.scene.start("StartScene")` já existente no fim do método).
  Nunca é parada (`scene.stop`) durante o ciclo de vida do `Phaser.Game`.
- **`create()`**:
  - Lê o estado inicial via `AudioPreferenceStore.getMuted()`.
  - Aplica esse estado ao `this.sound.mute` do `SoundManager` global (compartilhado por todas as
    Scenes).
  - Desenha o controle visível (FR-001/FR-006), com aparência que reflete o estado atual
    (ativo/mudo).
  - Registra um handler de clique/toque (Pointer Events, Princípio III) no controle.
- **Ao acionar o controle**:
  1. Inverte o estado local (`muted = !muted`).
  2. Aplica imediatamente a `this.sound.mute` (silencia/restaura todo áudio, incluindo loops em
     andamento — FR-002/FR-003/FR-004).
  3. Atualiza a aparência visual do controle (FR-006).
  4. Chama `AudioPreferenceStore.setMuted(muted)` para persistir (FR-007).
- **Garantias**:
  - Não lê nem escreve nenhum estado de `MatchStateManager`/`Match`/domínio de partida — a
    preferência de áudio é ortogonal ao domínio da partida (FR-009, `research.md` §4).
  - Não intercepta nem atrasa eventos de ponteiro destinados às demais Scenes (hit-testing das
    baratas permanece com resposta imperceptível — FR-008, Princípio V): o controle ocupa apenas a
    própria área de hitbox do botão.
  - A hitbox do botão NÃO DEVE sobrepor a faixa vertical de nenhuma prateleira
    (`SHELF_Y_POSITIONS` ± `ROACH_VISUAL_RADIUS + HITBOX_PADDING_PX`) nem as zonas de borda usadas
    como pontos de spawn de barata — evita criar uma "zona morta" onde um clique destinado a uma
    barata em trânsito seria capturado pelo botão em vez do hit-testing da partida (Princípio V).

## Chamadores

- **`client/index.ts`** DEVE incluir `AudioControlScene` como a **última** entrada do array
  `scene: [...]` (depois de `PauseOverlayScene`), garantindo prioridade de renderização/input acima
  de todas as outras Scenes.
- **`scenes/BootScene.ts`** DEVE chamar `this.scene.launch("AudioControlScene")` em `create()`
  (antes ou junto do `this.scene.start("StartScene")` já existente) — é a única forma de a Scene
  efetivamente iniciar, já que apenas constar no array `scene: [...]` não a ativa (nenhuma Scene
  além da primeira do array é auto-iniciada pelo Phaser neste projeto).
- **`scenes/StartScene.ts`, `GameScene.ts`, `GameOverScene.ts`, `PauseOverlayScene.ts`** NÃO DEVEM
  criar seu próprio botão de mute nem ler/escrever `AudioPreferenceStore` diretamente — o controle e
  o estado de áudio são responsabilidade exclusiva de `AudioControlScene`. Essas Scenes continuam
  dependendo apenas do `this.sound.mute` global do Phaser (já silenciado/restaurado por
  `AudioControlScene`) para os pontos de disparo de SFX já existentes (`sfx-hit`, `sfx-miss`,
  `sfx-steal`, `sfx-fly`), sem nenhuma alteração nesses pontos.
- Nenhum outro arquivo DEVE importar `systems/AudioPreferenceStore.ts` além de
  `scenes/AudioControlScene.ts`.
