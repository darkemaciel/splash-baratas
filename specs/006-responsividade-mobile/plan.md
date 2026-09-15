# Implementation Plan: Responsividade mobile e compatibilidade de tela

**Branch**: `006-responsividade-mobile` | **Date**: 2026-09-15 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/006-responsividade-mobile/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command; its definition describes the execution workflow.

## Summary

Fazer o canvas do Phaser (hoje tamanho fixo 960×600, centralizado via CSS sem lógica de escala)
escalar corretamente para qualquer viewport — de 320px até resoluções desktop grandes/ultrawide,
sem esticar nem cortar prateleiras, comidas ou HUD, e reagindo a resize/rotação/zoom sem interromper
a partida. Abordagem técnica (`research.md`): usar o `Scale Manager` nativo do Phaser (`mode: FIT`,
`autoCenter: CENTER_BOTH`, `min: { width: 320, height: <dinâmico> }`, sem `max`), configurado uma
única vez em `index.ts`, mais um ajuste de CSS em `index.html` para o elemento pai ocupar 100% do
viewport (com `overflow-x: auto` para o caso abaixo de 320px).

**Revisão pós-teste manual (2026-09-15)**: a versão inicial deste plano assumia uma única
proporção-base fixa (960:600) sempre, com o letterbox do Scale Manager absorvendo toda a diferença
de proporção. Testar manualmente em emulação de celular (390×844, retrato) mostrou que essa
abordagem deixava o campo de jogo como uma faixa horizontal fina (~28% da altura da tela), já que
960:600 é uma proporção bem "landscape" — sem distorcer nem cortar nada (FR-001/FR-002 continuavam
tecnicamente satisfeitos), mas desperdiçando a maior parte da tela "alongada" do celular, o que vai
contra o espírito do pedido original ("compatível com celulares sem precisar girar a tela"). Isso
levou a uma segunda decisão (`spec.md`, Clarifications; `research.md`, Decisão 1b): `gameConfig.ts`
passa a escolher, uma única vez no carregamento, entre a proporção-base landscape (960×600,
inalterada) e uma proporção-base portrait dedicada (480×960), a partir de
`window.innerWidth`/`innerHeight`. Como consequência, esta feature deixa de ser só configuração de
`index.ts`/`index.html`: também toca `gameConfig.ts` (`GAME_WIDTH`/`GAME_HEIGHT`/
`SHELF_Y_POSITIONS`/`FOOD_SLOT_X_POSITIONS` dinâmicos, mais `UI_SCALE`) e `StartScene.ts`/
`GameOverScene.ts` (tamanhos de fonte fixos em px que cortavam texto na base portrait mais estreita
passam a escalar por `UI_SCALE`). `GameScene.ts`, `BootScene.ts`, `MatchStateManager`,
`CollisionSystem` e todas as entidades continuam **inalterados** por esta feature — eles já liam
`GAME_WIDTH`/`GAME_HEIGHT`/`SHELF_Y_POSITIONS` como valores de runtime, então passaram a refletir a
base ativa sem nenhuma mudança de código (ver `research.md`, Decisão 1b).

## Technical Context

**Language/Version**: TypeScript (via `tsconfig.json` do workspace `client/`), executado com Bun

**Primary Dependencies**: Phaser 4.2.1 (`Scale Manager` nativo, `Phaser.Scale.FIT` +
`Phaser.Scale.CENTER_BOTH`) — nenhuma dependência nova (`research.md`, Decisão 1)

**Storage**: N/A — sem persistência; nenhuma mudança de estado, só de apresentação/configuração

**Testing**: nenhum teste `bun test` novo (nenhuma função de domínio é criada/alterada —
`research.md`, Decisão 6); a suíte existente continua cobrindo o domínio sem modificação. Validação
desta feature é manual via `bun run dev` + DevTools (redimensionar janela, emulação de dispositivo,
três navegadores-alvo), seguindo `quickstart.md`

**Target Platform**: Navegador (Chrome, Firefox, Edge atuais), viewports de 320px até desktop
grande/ultrawide; build estático servido via Vercel

**Project Type**: Web — cliente único (jogo client-side), sem projeto de backend separado

**Performance Goals**: 60 FPS estável e responsividade de clique inalterada em qualquer escala
(Princípio V; FR-005, FR-008, SC-005) — a escala é recalculada só nos eventos nativos `resize`/
`orientationchange` do Scale Manager, nunca por frame; nenhum código novo roda dentro de
`GameScene.update()`

**Constraints**: nenhuma posição de domínio (`gameConfig.ts`) pode mudar de significado ou unidade
dentro de uma partida em andamento (`GAME_WIDTH`/`GAME_HEIGHT` são resolvidos uma única vez no
carregamento — landscape 960:600 ou portrait 480:960 — e permanecem fixos durante toda a partida,
ver Revisão acima); a sincronia entre posição lógica e área clicável da barata deve se manter em
qualquer escala e durante um resize em andamento (FR-005); abaixo de 320px de viewport o canvas
trava no tamanho mínimo em vez de continuar encolhendo (FR-006)

**Scale/Scope**: 1 bloco de configuração novo (`scale` no `Phaser.Game`, `index.ts`) + ajuste de CSS
em `index.html` + escolha de proporção-base em `gameConfig.ts` + escala de fonte (`UI_SCALE`) em
`StartScene.ts`/`GameOverScene.ts`; `GameScene.ts`/`BootScene.ts`/entidades/`systems/` não são
modificados por esta feature (ver Revisão acima)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Princípio | Avaliação | Status |
|---|---|---|
| I. Separação entre lógica de jogo e renderização | Nenhuma função de domínio é tocada; `entities/`, `MatchStateManager`, `CollisionSystem` permanecem exatamente como estão. `gameConfig.ts` ganha a escolha de proporção-base (landscape/portrait) e constantes derivadas por fração — ainda dados de apresentação puros (posições/tamanhos), lidos por domínio e Scenes exatamente como antes, sem nenhuma regra de jogo nova | PASS |
| II. Cliente como única camada, tratado como não confiável | Nenhum estado novo é introduzido; nenhuma regra de partida muda | PASS |
| III. Web-first, mobile depois | Continua usando exclusivamente Pointer Events (`this.input.on("pointerdown", ...)`, já existente) — nenhum handler de mouse/touch específico é adicionado; a escala responsiva é um pré-requisito de UI para uma futura feature de input touch real, não uma antecipação dela (FR-009 exclui explicitamente otimização de toque) | PASS |
| IV. Simplicidade deliberada no MVP | Usa o `Scale Manager` nativo do Phaser em vez de reimplementar lógica de resize/centralização em JS/CSS customizado; nenhuma abstração nova de "sistema de layout responsivo" é criada — a solução inteira é configuração (`research.md`, Decisão 1) | PASS |
| V. Responsividade do clique é não-negociável | `Phaser.Input.Pointer` já resolve coordenadas no espaço lógico do jogo via o Scale Manager (`research.md`, Decisão 2) — nenhuma mudança em `CollisionSystem`/`handlePointerDown`; hit-testing continua direto, sem física | PASS |
| VI. Assets versionados e organizados desde o início | Nenhum asset novo é adicionado por esta feature | PASS |
| VII. Stack fixada para o MVP | Nenhuma dependência nova — `Scale Manager` é parte do Phaser já instalado; nenhum framework de teste com DOM é adicionado (`research.md`, Decisão 6) | PASS |

Nenhuma violação identificada. Tabela de Complexity Tracking abaixo permanece vazia.

## Project Structure

### Documentation (this feature)

```text
specs/006-responsividade-mobile/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md         # Phase 1 output (/speckit-plan command)
├── quickstart.md         # Phase 1 output (/speckit-plan command)
└── tasks.md              # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

Sem pasta `contracts/` nesta feature: nenhuma função de domínio nem campo de `MatchSnapshot` é
adicionado ou alterado (ver `data-model.md`) — os contratos já documentados em
`specs/001-roach-fridge-clicker/contracts/domain-api.md` e nas specs seguintes permanecem válidos e
inalterados. A única "interface" nova desta feature é a configuração `scale` do `Phaser.Game`, já
descrita em `data-model.md` — não há interface de domínio nova a contratar.

### Source Code (repository root)

```text
client/                          # único workspace do repositório (reaproveitado, não recriado)
├── index.html                   # html/body/#game passam a ocupar 100% do viewport; overflow-x: auto (caso <320px); fundo #0d0d0d mantido como cor de letterbox
├── index.ts                     # + bloco `scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH, min: { width: 320, height: <dinâmico, proporcional a GAME_HEIGHT/GAME_WIDTH> } }` no Phaser.Game
├── src/
│   ├── config/gameConfig.ts     # GAME_WIDTH/GAME_HEIGHT escolhidos uma vez por orientação (landscape 960×600 / portrait 480×960); SHELF_Y_POSITIONS/FOOD_SLOT_X_POSITIONS derivados por fração; + UI_SCALE
│   ├── scenes/StartScene.ts     # tamanhos de fonte/padding fixos em px passam a escalar por UI_SCALE (evita corte de texto na base portrait)
│   ├── scenes/GameOverScene.ts  # idem StartScene.ts
│   ├── scenes/GameScene.ts      # inalterada — já lia GAME_WIDTH/HEIGHT/SHELF_Y_POSITIONS em runtime
│   ├── scenes/BootScene.ts      # inalterada
│   ├── entities/                # inalteradas
│   └── systems/                 # inalteradas — MatchStateManager, CollisionSystem
└── tests/                        # nenhum arquivo novo (research.md, Decisão 6) — suíte existente inalterada
```

**Structure Decision**: nenhuma pasta nova é criada. A feature toca configuração/apresentação em
5 arquivos (`index.ts`, `index.html`, `gameConfig.ts`, `StartScene.ts`, `GameOverScene.ts`) — mais
do que o plano original previa (ver Revisão em Summary), mas ainda sem nenhuma "camada de
responsividade" nova: a escolha de proporção-base é uma leitura de `window` feita uma vez, no mesmo
módulo que já centralizava as constantes de layout (Princípio IV).

## Complexity Tracking

*Nenhuma violação de constitution identificada — tabela intencionalmente vazia.*
