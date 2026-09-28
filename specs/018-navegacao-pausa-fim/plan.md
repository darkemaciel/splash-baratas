# Implementation Plan: Navegação completa da pausa e do fim de jogo

**Branch**: `feat/navegacao-pausa-fim` (a partir de `feat/design-system`) | **Date**: 2026-09-28 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/018-navegacao-pausa-fim/spec.md`

## Summary

Completar o fluxo de telas do design system: a pausa ganha REINICIAR e ENCERRAR PARTIDA, cada um
com um diálogo de confirmação, e o fim de jogo ganha MENU ao lado de DE NOVO!. Abordagem técnica:
- **Domínio**: um único método novo, `MatchStateManager.forfeit(now)`. Ele termina a partida em
  andamento pelo mesmo caminho de uma derrota (`status "lost"`, `endedAt`, evento `match:lost`),
  então o fim de jogo, o nome e o ranking funcionam sem mudança (FR-006).
- **Relógio**: a overlay de pausa recebe o relógio lógico da partida no instante da pausa, para
  que o tempo pausado não conte.
- **REINICIAR**: usa o `restart()` que já existe.
- **MENU**: é só uma troca de cena.
- **Kit de UI**: ganha `createDialog` e `Button.setPosition`.

## Technical Context

**Language/Version**: TypeScript (stack fixa, Princípio VII)

**Primary Dependencies**: Phaser 4.2.1 (`ScenePlugin.launch` com dados, `ScenePlugin.start`,
`SoundManager.stopAll`) e o kit `client/src/ui/` da spec 017. Nenhuma dependência nova.

**Storage**: N/A (o ranking `localStorage` continua com o mesmo formato; a partida encerrada entra
por `recordScore` como hoje).

**Testing**: `bun test` com o novo `matchStateManager.forfeit.test.ts` e a suíte existente sem
alteração; validação manual pelo `quickstart.md`.

**Target Platform**: Chrome, Firefox e Edge atuais; bases 960×600 e 480×960.

**Project Type**: jogo web client-side (single project `client/`)

**Performance Goals**: 60 FPS mantidos (SC-003). As trocas de estado só acontecem por clique, e
nada é adicionado ao `update()` da partida.

**Constraints**: nenhuma mudança de hit-test; os botões novos só existem com a partida pausada ou
encerrada (sobreposição por cima); a pata acima de tudo; nenhum proxy, som ou ouvinte residual.

**Scale/Scope**: 1 método de domínio + 1 arquivo de teste; 1 componente novo (`Dialog`) e 1
método no `Button`; 3 cenas tocadas (`GameScene`, só uma linha em `triggerPause`;
`PauseOverlayScene`; `GameOverScene`).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Princípio | Avaliação | Status |
|---|---|---|
| I. Separação lógica/render | "Encerrar partida" é regra e vive no domínio (`forfeit`), testado sem Phaser. As cenas só chamam a API. | ✅ |
| II. Lógica isolada | Nenhuma regra em handler de UI. A overlay só orquestra `restart`/`forfeit` e trocas de cena. | ✅ |
| III. Pointer Events | Os botões vêm do kit (Pointer Events). O teclado (Tab, Enter, P) é aditivo. | ✅ |
| IV. Simplicidade deliberada | Sem status novo em `Match` (research §1). O diálogo é o único componente novo, e é usado agora. | ✅ |
| V. Responsividade do clique | Nenhuma mudança no hit-test nem no `update()`. Os botões novos só aparecem com a partida parada. | ✅ |
| VI. Assets | Nenhum asset novo. | ✅ |
| VII. Stack | Nenhuma dependência nova. | ✅ |
| VIII. Mudanças críticas | Nenhuma operação destrutiva. | ✅ |

**Re-check pós-design**: sem violações. Complexity Tracking vazio.

## Project Structure

### Documentation (this feature)

```text
specs/018-navegacao-pausa-fim/
├── plan.md
├── research.md          # forfeit no domínio, relógio lógico, restart, sons, diálogo, clique duplo, MENU
├── data-model.md        # ciclo de vida da Match + estados da overlay e do fim de jogo
├── quickstart.md
├── contracts/
│   └── navigation.md    # forfeit + testes, ações da overlay, Dialog, Button.setPosition, fim de jogo
├── checklists/requirements.md
└── tasks.md             # /speckit-tasks
```

### Source Code

```text
client/
├── src/
│   ├── config/theme.ts                 # + TAMANHO.dialogo = 400
│   ├── systems/MatchStateManager.ts    # + forfeit(now)
│   ├── ui/
│   │   ├── a11y.ts                     # + focus() no proxy, isProxyFocused()
│   │   ├── Button.ts                   # + setPosition(x, y), focus()
│   │   └── Dialog.ts                   # NOVO — createDialog
│   └── scenes/
│       ├── GameScene.ts                # triggerPause passa { pausedAtLogicalMs }
│       ├── PauseOverlayScene.ts        # pilha de 3 botões + máquina de estados com diálogos
│       └── GameOverScene.ts            # DE NOVO! + MENU, leaving
└── tests/unit/
    └── matchStateManager.forfeit.test.ts   # NOVO
```

**Structure Decision**: mesmo projeto único `client/`. O domínio ganha só `forfeit`, e o resto é
apresentação nas cenas e no kit.

## Ordem sugerida

1. `forfeit` + testes (TDD), `TAMANHO.dialogo`, `Button.setPosition`, `createDialog`.
2. US1: `triggerPause` com dados, então `PauseOverlayScene` (pilha, diálogos, REINICIAR,
   ENCERRAR, `leaving`, P só no painel).
3. US2: `GameOverScene` (DE NOVO! + MENU, layout lado a lado ou empilhado, `leaving`).
4. Validação pelo `quickstart.md`; atualizar backlog (§8, dois itens P1 entregues) e `CLAUDE.md`,
   se necessário.

## Complexity Tracking

Nenhuma violação.
