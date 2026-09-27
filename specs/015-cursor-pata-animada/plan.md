# Implementation Plan: Cursor Animado da Pata do Gato

**Branch**: `015-cursor-pata-animada` | **Date**: 2026-09-26 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/015-cursor-pata-animada/spec.md`

## Summary

Substituir o cursor padrão do sistema por uma pata de gato animada em toda a janela do jogo
(menus e partida), com uma animação idle contínua enquanto o ponteiro se move e uma animação de
"golpe" disparada a cada clique dentro do campo de jogo ativo (acertando barata ou não) — cliques
em botões de menu não disparam o golpe. Abordagem técnica: nova `CursorScene` sempre ativa
(mesmo padrão de Scene overlay já usado por `AudioControlScene`/`PauseOverlayScene`), posicionada
por último no array de Scenes para renderizar por cima de tudo; oculta o cursor nativo via CSS
condicionado a uma classe (`#game.cursor-paw-ready canvas { cursor: none !important; }`, robusto
contra o `useHandCursor` dos botões existentes, e ligado só quando o asset carrega com sucesso —
FR-008) e desenha a pata seguindo `pointermove` em `update()`; `GameScene` emite um evento no
`this.game.events` (EventEmitter global do Phaser) ao processar um clique que chega ao seu
`handlePointerDown` — que já exclui cliques em botões internos via `stopPropagation()` — para que
`CursorScene` saiba disparar o golpe sem acoplar lógica de cursor à `GameScene` além de um `emit()`.

## Technical Context

**Language/Version**: TypeScript (stack fixa do projeto, Constitution Princípio VII)

**Primary Dependencies**: Phaser 4 (`Scene`, `Input.Pointer`, `AnimationManager`, e o
`this.game.events` global já disponível em qualquer `Phaser.Game`, sem dependência nova)

**Storage**: N/A — nenhuma preferência precisa persistir (diferente de `AudioPreferenceStore`, o
cursor não tem estado configurável pelo jogador)

**Testing**: `bun test` não se aplica (feature 100% em `scenes/`, sem lógica pura extraível para
`systems/`/`entities/` — mesmo caso de `PauseOverlayScene`/`AudioControlScene`); validação manual
via `quickstart.md`

**Target Platform**: Navegador desktop (Chrome, Firefox, Edge atuais), resoluções desktop; sem
efeito em touch (cursor de sistema não existe nesses dispositivos — ver spec, Assumptions)

**Project Type**: Single project client-side (`client/` é o único workspace do repositório)

**Performance Goals**: 60 FPS estáveis, resposta ao clique sem atraso perceptível (Constitution
Princípio V) — a pata é puramente visual e não pode atrasar `pickTopmostHit`/`handlePointerDown`

**Constraints**: A pata tem tamanho fixo de 56px de altura (escalado por `UI_SCALE`), desacoplado do
tamanho de qualquer botão — revisado após feedback de playtest (FR-001/SC-005, research.md §4);
golpe restrito ao campo de jogo ativo, nunca a botões de menu (FR-004, clarifications)

**Scale/Scope**: Duas animações (idle contínua + golpe no clique) sobre um único sprite de
cursor, sem nova entidade de domínio nem novo estado de partida

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Princípio | Avaliação |
|---|---|
| I. Separação lógica/renderização | PASS — cursor é 100% apresentação; `CursorScene` não introduz regra de jogo nem lê/escreve estado do `Match`. O único acoplamento com `GameScene` é um `emit()` de evento após o hit-test já ter ocorrido, nunca antes ou durante. |
| II. Cliente como única camada, não confiável | PASS — não introduz estado persistido nem lógica de validação; nada muda na fronteira cliente/servidor (inexistente no MVP). |
| III. Web-first, mobile depois | PASS — segue `pointermove`/`pointerdown` já em uso via Phaser (Pointer Events por baixo); em touch a feature simplesmente não tem cursor de sistema para substituir (documentado nas Assumptions da spec). |
| IV. Simplicidade deliberada | PASS — uma única Scene nova, reaproveitando o padrão de Scene overlay já estabelecido (`AudioControlScene`); nenhuma configuração nova exposta ao jogador (sem toggle, sem persistência). |
| V. Responsividade do clique não-negociável | PASS — FR-005/FR-010 da spec exigem explicitamente que a animação nunca atrase o hit-testing existente; `CursorScene` reage a um evento emitido *depois* de `pickTopmostHit` já ter rodado, nunca no caminho crítico do clique. |
| VI. Assets versionados e organizados | PASS — arte final (imagem estática + frames de idle/golpe, se produzidos depois) vai para `client/public/assets/sprites/`, seguindo o padrão de `paw.png`; referências ficam fora do build, em `docs/references/` (FR-009). |
| VII. Stack fixada | PASS — TypeScript + Phaser + Bun, sem novas dependências. |

Nenhuma violação — sem necessidade de preencher Complexity Tracking.

## Project Structure

### Documentation (this feature)

```text
specs/015-cursor-pata-animada/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/           # Phase 1 output (/speckit-plan command)
│   └── cursor-scene.md
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
client/
├── index.html                            # alterado: regra CSS condicional
│                                          # `#game.cursor-paw-ready canvas { cursor: none !important; }`
├── index.ts                              # alterado: registra CursorScene como última Scene do array
├── src/
│   ├── config/
│   │   └── gameConfig.ts                 # nova(s) constante(s): tamanho máx. da pata relativo ao
│   │                                      # botão de referência (FR-001/SC-005), chave do evento
│   │                                      # de golpe compartilhado via this.game.events
│   └── scenes/
│       ├── GameScene.ts                  # alterado: handlePointerDown emite o evento de golpe
│       │                                  # via this.game.events após o hit-test já ter ocorrido
│       ├── AudioControlScene.ts          # padrão de referência para Scene overlay (não alterado)
│       ├── PauseOverlayScene.ts          # não alterado
│       ├── StartScene.ts                 # não alterado
│       ├── GameOverScene.ts              # não alterado
│       └── CursorScene.ts                # NOVO: Scene sempre ativa, registrada por último no
│                                          # array (acima de todas, incluindo AudioControlScene) —
│                                          # rastreia pointermove (idle) e escuta o evento de golpe
└── public/assets/sprites/
    └── paw.png                           # recortada + fundo transparente (a referência original,
                                           # paw.jpg, era JPEG sem canal alfa); pode ser
                                           # substituída/expandida por frames de idle/golpe
                                           # dedicados no futuro, produzidos a partir de
                                           # docs/references/
```

**Structure Decision**: Projeto único client-side (`client/`, único workspace do repositório).
Segue a separação já estabelecida entre `entities/`/`systems/` (domínio, sem `import Phaser`) e
`scenes/` (únicas consumidoras do Phaser). Como esta feature é puramente apresentacional e não tem
nenhuma lógica pura a testar isoladamente, ela não adiciona nada a `entities/`/`systems/` — apenas
uma nova Scene, no mesmo padrão já usado por `AudioControlScene`/`PauseOverlayScene`.

## Complexity Tracking

> Sem violações de Constitution Check — seção não aplicável a esta feature.
