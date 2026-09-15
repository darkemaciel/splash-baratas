# Implementation Plan: Reposicionamento e Restilização do HUD

**Branch**: `005-hud-vida-vertical` | **Date**: 2026-09-14 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/005-hud-vida-vertical/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command; its definition describes the execution workflow.

## Summary

Mover o contador de comidas restantes ("pontos de vida") e a barra de risco (hoje horizontais e
centralizados no topo, specs/002) para um agrupamento no canto superior direito da tela, com a
barra reorientada na vertical, preenchimento contínuo da base para o topo (referência visual: Mega
Man X, sem segmentação em blocos — decidido na clarificação). A pontuação (specs/004) permanece
centralizada horizontalmente no topo, mas passa a usar 28px (era 16px) na fonte "Fredoka", a mesma
família aplicada ao contador de vida para consistência visual entre os dois textos do HUD.
Abordagem técnica: nenhuma função de domínio nova nem campo novo em `MatchSnapshot` — a feature é
inteiramente uma reescrita de `GameScene.updateHud()`/`redrawHudBar()`/`updateScore()` (mudando
apenas posição, orientação de desenho e estilo de texto) mais algumas constantes locais novas em
`GameScene.ts` (posição/tamanho/família de fonte), substituindo as constantes da barra horizontal
atual, no mesmo padrão em que `HUD_BAR_WIDTH`/`HUD_BAR_HEIGHT`/`HUD_BAR_Y` já vivem hoje. A fonte "Fredoka" é adicionada como novo asset
versionado (`client/public/assets/fonts/Fredoka-Bold.woff2`), declarada via `@font-face` em
`index.html` e pré-carregada em `BootScene` antes de qualquer `Scene` de gameplay existir, com
fallback CSS para o caso de falha de carregamento.

## Technical Context

**Language/Version**: TypeScript (via `tsconfig.json` do workspace `client/`), executado com Bun

**Primary Dependencies**: Phaser 4.2.1 (render/scene graph) — nenhuma dependência nova; carregamento
de fonte via Font Loading API nativa do navegador (`document.fonts.load`), sem biblioteca de
terceiros

**Storage**: N/A — sem persistência; nenhuma mudança de estado, só de apresentação

**Testing**: nenhum teste `bun test` novo (nenhuma função de domínio é criada/alterada —
`research.md §5`); a suíte existente (`match.hud.test.ts`, `match.score.test.ts`,
`matchStateManager.score.test.ts`) continua cobrindo os valores derivados lidos pelo HUD sem
modificação. Validação desta feature é manual via `bun run dev`, seguindo `quickstart.md`

**Target Platform**: Navegador (Chrome, Firefox, Edge atuais), resoluções desktop; build estático
servido via Vercel

**Project Type**: Web — cliente único (jogo client-side), sem projeto de backend separado

**Performance Goals**: 60 FPS estável e responsividade de clique inalterada (Princípio V; SC-002 da
spec) — o redesenho da barra continua disparado por evento (`food:stolen`), nunca por frame; o
carregamento da fonte é um gate assíncrono único em `BootScene`, antes da primeira `Scene` de
gameplay, sem custo recorrente durante a partida

**Constraints**: nenhuma regra de domínio pode mudar (FR-011); a fonte cartunesca precisa ter
fallback funcional caso não carregue a tempo (edge case do spec.md); o agrupamento canto superior
direito e a pontuação centralizada não podem sobrepor prateleiras/comidas/baratas nem entre si
(FR-009)

**Scale/Scope**: 2 elementos de HUD reposicionados/restilizados (agrupamento vida+barra, texto de
pontuação) em uma única `Scene` (`GameScene`); 1 novo asset de fonte

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Princípio | Avaliação | Status |
|---|---|---|
| I. Separação entre lógica de jogo e renderização | Nenhuma função de domínio nova; `GameScene` continua lendo apenas `MatchSnapshot` (`foodRemainingCount`, `foodTotalCount`, `riskLevel`, `score`) já existente, sem recalcular nada — mudança é 100% de desenho/posicionamento dentro da camada de renderização | PASS |
| II. Cliente como única camada, tratado como não confiável | Nenhum estado novo é introduzido; `MatchStateManager`/`Match` permanecem exatamente como estão | PASS |
| III. Web-first, mobile depois | Nenhum novo handler de input; feature é puramente visual, sem tocar em `pointerdown`/hit-testing | PASS |
| IV. Simplicidade deliberada no MVP | Barra vertical reaproveita a técnica de preenchimento contínuo já existente (decidido explicitamente contra a alternativa de blocos segmentados na clarificação, por ser mais simples); nenhuma abstração nova de "sistema de HUD" é criada | PASS |
| V. Responsividade do clique é não-negociável | Redesenho da barra continua por evento, não por frame; carregamento de fonte acontece uma única vez em `BootScene`, antes da partida começar, sem custo por frame durante o gameplay | PASS |
| VI. Assets versionados e organizados desde o início | Fonte "Fredoka" adicionada em `client/public/assets/fonts/` (pasta já reservada para esse fim, hoje só com `.gitkeep`), seguindo a convenção existente | PASS |
| VII. Stack fixada para o MVP | Nenhuma dependência nova — Font Loading API é nativa do navegador, sem pacote adicional | PASS |

Nenhuma violação identificada. Tabela de Complexity Tracking abaixo permanece vazia.

## Project Structure

### Documentation (this feature)

```text
specs/005-hud-vida-vertical/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

Sem pasta `contracts/` nesta feature: nenhuma função de domínio nem campo de `MatchSnapshot` é
adicionado ou alterado (ver `data-model.md`) — os contratos já documentados em
`specs/001-roach-fridge-clicker/contracts/domain-api.md`,
`specs/002-hud-progresso-risco/contracts/`, e `specs/004-sistema-pontuacao/contracts/` permanecem
válidos e inalterados. Criar um contrato novo aqui duplicaria documentação já existente sem
nenhuma interface nova a descrever.

### Source Code (repository root)

```text
client/                          # único workspace do repositório (reaproveitado, não recriado)
├── index.html                   # + @font-face "Fredoka" (dentro do <style> existente)
├── public/
│   └── assets/
│       └── fonts/
│           └── Fredoka-Bold.woff2   # novo asset versionado (Princípio VI)
├── src/
│   ├── scenes/
│   │   ├── BootScene.ts         # + document.fonts.load("Fredoka") antes de iniciar StartScene
│   │   └── GameScene.ts         # + HUD_MARGIN_RIGHT, HUD_BAR_THICKNESS, HUD_BAR_LENGTH, HUD_BAR_TOP_Y, HUD_LIFE_COUNTER_Y, SCORE_FONT_SIZE_PX, HUD_FONT_FAMILY (constantes locais, substituindo HUD_BAR_WIDTH/HUD_BAR_HEIGHT/HUD_BAR_Y/SCORE_TEXT_Y); updateHud()/redrawHudBar() reposicionados+reorientados (vertical, canto superior direito); updateScore() com fonte/tamanho novos
└── tests/                       # nenhum arquivo novo (research.md §5) — suíte existente inalterada
```

**Structure Decision**: nenhuma pasta de domínio nova é criada. A feature toca apenas
`GameScene.ts` (constantes de apresentação e desenho do HUD) e `BootScene.ts` (carregamento do
novo asset de fonte), mais o novo asset em `public/assets/fonts/` e sua declaração em
`index.html`. Não há justificativa para uma "camada de HUD" separada — o volume de mudança
continua pequeno o bastante para caber nas convenções já estabelecidas pelas specs 002 e 004
(Princípio IV).

## Complexity Tracking

*Nenhuma violação de constitution identificada — tabela intencionalmente vazia.*
