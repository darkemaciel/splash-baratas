# Implementation Plan: Design System "Grotesco Surreal" em todo o jogo

**Branch**: `feat/design-system` | **Date**: 2026-09-27 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/017-design-system-grotesco/spec.md`

## Summary

Reestilizar todas as telas e controles existentes (início, HUD, pausa, fim de jogo, som, cenário
da geladeira) com o design system "Grotesco Surreal" e renomear o jogo para "Borges e as Baratas",
sem mudar regras de jogo. Abordagem técnica: **tudo continua desenhado no canvas do Phaser**. Um
kit enxuto de componentes em `client/src/ui/` (botão em bolha, botão de ícone, pílula, barra de
risco, painel, título com contorno, cartão de resultado) reproduz as regras de `grotesco.css` com
`Graphics` + `Text`, lendo todos os valores de `config/theme.ts`. A camada de DOM do `LEIA-ME.md`
foi rejeitada porque cobriria a pata do cursor (desenhada no canvas) e criaria um segundo caminho
de input (research §1). O rótulo acessível e o foco por teclado vêm de botões DOM visualmente
ocultos, que espelham os botões do canvas sem cobri-lo (research §7).

## Technical Context

**Language/Version**: TypeScript (stack fixa, Princípio VII)

**Primary Dependencies**: Phaser 4.2.1 (`Graphics.fillPoints/strokePoints`, `Text` com `stroke` e
`shadow`, `Loader.svg`, `Container`, `Tweens`), Vite (import de `tokens.css`). Nenhuma dependência
nova.

**Storage**: N/A. As preferências já existentes (ranking, mudo) continuam em `localStorage`, sem
mudança.

**Testing**: `bun test` para os módulos puros novos (`ui/shape.ts`, `ui/format.ts`) e a suíte de
domínio existente sem alteração; validação manual de acordo com `quickstart.md`.

**Target Platform**: Chrome, Firefox e Edge atuais, desktop, mais a base retrato já existente (spec
006).

**Project Type**: jogo web client-side (single project `client/`)

**Performance Goals**: 60 FPS estáveis (SC-002). Botões e pílulas são redesenhados só em mudança
de estado ou de texto, nunca a cada frame. O `Graphics` do HUD não é recriado em `update()`.

**Constraints**: hit-test direto intocado (Princípio V); nenhum objeto interativo novo além dos
botões; a pata acima de tudo; bases 960×600 e 480×960; teto de 1s para as fontes.

**Scale/Scope**: 6 scenes tocadas (`BootScene`, `StartScene`, `GameScene`, `PauseOverlayScene`,
`GameOverScene`, `AudioControlScene`), mais `CursorScene` e `gameConfig.ts` só para as constantes
de `MOVIMENTO`. 7 componentes de UI e 2 módulos puros.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Princípio | Avaliação | Status |
|---|---|---|
| I. Separação lógica/render | Nenhuma entidade ou sistema muda. `ui/` só é consumido por scenes. `theme.ts`, `ui/shape.ts` e `ui/format.ts` não importam `phaser`. `formatElapsedTime` de domínio é mantida, e o novo `formatClock` fica na camada de UI. | ✅ |
| II. Cliente não confiável, lógica isolada | Nenhuma regra nova. Os botões só chamam APIs de `matchStateManager`/stores já existentes. | ✅ |
| III. Pointer Events | Os botões usam `pointerover/out/down/up` do Input Plugin. O teclado (proxy DOM, tecla P, nome) é só aditivo. | ✅ |
| IV. Simplicidade deliberada | Só os componentes usados agora. Nenhum componente "pronto para o futuro" (Alternar, Seletor, Energia genérica etc. estão no backlog §8). O estado desabilitado não é implementado. | ✅ |
| V. Responsividade do clique | Só botões são interativos. As pílulas e a barra não chamam `setInteractive`. A área de clique não cresce no hover. Pausar mantém `stopPropagation`. Nada sobre a faixa das prateleiras (`contracts/screens.md`, invariantes). Sem trabalho por frame novo. | ✅ |
| VI. Assets versionados | Fontes em `assets/fonts/`. Ícones e personagem em `assets/ui/icones` e `assets/ui/personagem`, pasta sancionada pela emenda 1.2.0 da constituição. | ✅ |
| VII. Stack fixa | Nenhuma dependência nova. | ✅ |
| VIII. Confirmação de mudanças críticas | A remoção de `Fredoka-Bold.woff2` e de `client/src/styles/grotesco.css` fica condicionada a confirmação explícita do usuário na implementação (research §2). | ✅ |

**Re-check pós-design (Phase 1)**: sem violações novas. Os contratos (`ui-kit.md`, `screens.md`)
tornam as garantias de V verificáveis (invariantes de folga e de interatividade).

## Project Structure

### Documentation (this feature)

```text
specs/017-design-system-grotesco/
├── plan.md              # Este arquivo
├── research.md          # Phase 0 — decisões técnicas (canvas vs DOM, bolhas, fontes, a11y, layout)
├── data-model.md        # Phase 1 — tokens, estados de botão, textos da interface
├── quickstart.md        # Phase 1 — validação automática e manual
├── contracts/
│   ├── ui-kit.md        # API do kit de UI e dos módulos puros
│   └── screens.md       # Composição de cada tela e do HUD, com invariantes de folga
├── checklists/
│   └── requirements.md
└── tasks.md             # Phase 2 — /speckit-tasks
```

### Source Code (repository root)

```text
client/
├── index.html                    # <title>, fundo, remover @font-face Fredoka, <div id="ui-a11y">, .sr-only
├── index.ts                      # import "./src/styles/tokens.css"
├── public/assets/
│   ├── fonts/                    # Luckiest Guy + Baloo 2 (novos); Fredoka-Bold (remoção sob confirmação)
│   └── ui/icones/, ui/personagem/  # novos (personagem não usado nesta feature)
├── src/
│   ├── config/
│   │   ├── theme.ts              # + RAIO, TAMANHO
│   │   └── gameConfig.ts         # CURSOR_* passam a derivar de MOVIMENTO.pata
│   ├── styles/tokens.css         # importado (só @font-face + variáveis)
│   ├── ui/                       # NOVO — kit de componentes no canvas
│   │   ├── shape.ts              # puro: bubblePoints, pillPoints
│   │   ├── format.ts             # puro: formatThousands, formatClock
│   │   ├── a11y.ts               # proxies DOM ocultos (rótulo + teclado + foco)
│   │   ├── motion.ts             # prefersReducedMotion (lido uma vez)
│   │   ├── draw.ts               # helper interno: sombra dura + preenchimento + contorno
│   │   ├── Button.ts             # createButton
│   │   ├── IconButton.ts         # createIconButton
│   │   ├── Pill.ts               # createPill
│   │   ├── RiskBar.ts            # createRiskBar
│   │   ├── Panel.ts              # createPanel, createPanelTitle
│   │   ├── OutlinedTitle.ts      # createOutlinedTitle
│   │   └── ResultCard.ts         # createResultCard
│   └── scenes/                   # Boot, Start, Game, PauseOverlay, GameOver, AudioControl, Cursor
└── tests/unit/
    ├── ui.shape.test.ts          # NOVO
    └── ui.format.test.ts         # NOVO
```

**Structure Decision**: single project `client/`, igual às specs anteriores. A única pasta de
código nova é `client/src/ui/`: componentes de apresentação que dependem do Phaser, consumidos só
por `scenes/` e nunca por `entities/` ou `systems/`. Os módulos puros dentro dela seguem o mesmo
padrão de testabilidade do domínio.

## Ordem de implementação sugerida

1. **Fundamentos**: `tokens.css` no `index.ts`, `index.html` (título, fundo, a11y root),
   `theme.ts` (+RAIO, +TAMANHO), `BootScene.loadFonts()`, carregamento dos SVGs. Testes de
   `shape`/`format` primeiro.
2. **Kit de UI**: shape, depois Button/IconButton (com a11y + motion), depois Pill/RiskBar/Panel/
   OutlinedTitle/ResultCard.
3. **US1 (P1)**: StartScene, PauseOverlayScene, GameOverScene.
4. **US2 (P2)**: HUD da GameScene (layout de `screens.md`, estado ativo do Pausar).
5. **US3 (P3)**: AudioControlScene, texturas do cenário, `MOVIMENTO` como fonte única
   (GameScene, BootScene, CursorScene, gameConfig).
6. **Limpeza sob confirmação**: Fredoka, `grotesco.css`, atualizar `CLAUDE.md` (nome do jogo e
   pasta `ui/`) e o item "Substituir sprites placeholder" no backlog (parcial).

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| Proxies DOM ocultos para acessibilidade | FR-022 e FR-008 pedem rótulo acessível e foco por teclado, e o canvas não tem semântica | Pular a acessibilidade viola a spec. DOM visível cobriria a pata (research §1) |
