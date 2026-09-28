# Implementation Plan: Pontuação flutuante "+N!"

**Branch**: `feat/pontuacao-flutuante` (a partir de `feat/navegacao-pausa-fim`) | **Date**: 2026-09-28 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/019-pontuacao-flutuante/spec.md`

## Summary

A cada barata eliminada, mostrar "+N!" com os pontos daquela eliminação, logo acima da pata do
gato, subindo 48px e sumindo em 720ms, no estilo do componente PontuacaoFlutuante. Abordagem
técnica:
- **Domínio**: o evento `roach:eliminated` passa a levar `points`, o valor que
  `applyEliminationScore` já calcula. Nenhuma regra muda.
- **Posição**: a `GameScene` guarda o ponto do clique antes de eliminar e, no handler do evento,
  cria o número. A regra de posição (acima da pata, ao lado dela no topo, sempre inteiro na tela e
  nunca embaixo da pata) fica numa função pura testada.
- **Visual**: variante "pontuacao" do título com contorno, com 3px de contorno e 5px de sombra.
- **Animação**: um tween da cena, que pausa com a partida e some no `shutdown`.

## Technical Context

**Language/Version**: TypeScript (stack fixa, Princípio VII)

**Primary Dependencies**: Phaser 4.2.1 (`Text` com `stroke`/`setShadow`, `Tweens`,
`Time.delayedCall`) e o kit `client/src/ui/` (specs 017/018). Nenhuma dependência nova.

**Storage**: N/A

**Testing**: `bun test` com dois arquivos novos (pontos no evento; função de posição) e a suíte
existente sem alteração.

**Target Platform**: Chrome, Firefox e Edge atuais; bases 960×600 e 480×960.

**Project Type**: jogo web client-side (single project `client/`)

**Performance Goals**: 60 FPS com 10 eliminações em 5s (SC-004). Cada eliminação cria um `Text`
(no máximo ~3 simultâneos) e nada roda por frame.

**Constraints**: o número não é interativo; é criado depois do hit-test e da atualização de estado;
nunca fica embaixo da pata; fica sempre inteiro na tela.

**Scale/Scope**: 1 campo no payload de um evento; 1 função pura + 1 componente; 1 opção nova em
`createOutlinedTitle`; `GameScene` com mudanças localizadas.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Princípio | Avaliação | Status |
|---|---|---|
| I. Separação lógica/render | Pontos calculados no domínio e publicados no evento. A posição do número é uma função pura em `ui/`, sem Phaser, testável. | ✅ |
| II. Lógica isolada | A cena só apresenta. Nenhuma regra de pontuação vai para a cena. | ✅ |
| III. Pointer Events | Usa a posição do `pointerdown` que já existe. | ✅ |
| IV. Simplicidade | Sem pool, sem selo de combo, sem multiplicador. Só o necessário. | ✅ |
| V. Responsividade do clique | Número não interativo; criado depois do hit-test; hitbox intocada; volume baixo de objetos. | ✅ |
| VI. Assets | Nenhum asset novo (usa as fontes da 017). | ✅ |
| VII. Stack | Nenhuma dependência nova. | ✅ |
| VIII. Mudanças críticas | Nenhuma. | ✅ |

**Re-check pós-design**: sem violações.

## Project Structure

### Documentation (this feature)

```text
specs/019-pontuacao-flutuante/
├── plan.md
├── research.md          # evento com points, posição acima da pata, bordas/topo, visual, ciclo de vida, desempenho
├── data-model.md        # payload do evento + ciclo de vida do número
├── quickstart.md
├── contracts/floating-score.md
├── checklists/requirements.md
└── tasks.md             # /speckit-tasks
```

### Source Code

```text
client/
├── src/
│   ├── systems/MatchStateManager.ts     # payload "roach:eliminated" + points
│   ├── ui/
│   │   ├── OutlinedTitle.ts             # + outline: "pontuacao"
│   │   ├── floatingScoreLayout.ts       # NOVO — floatingScorePosition (puro)
│   │   └── FloatingScore.ts             # NOVO — createFloatingScore
│   └── scenes/GameScene.ts              # lastHitPoint, pawGeometry, createFloatingScore no handler
└── tests/unit/
    ├── matchStateManager.eliminatedPoints.test.ts   # NOVO
    └── ui.floatingScoreLayout.test.ts               # NOVO
```

**Structure Decision**: mesmo projeto `client/`. O domínio só ganha um campo de evento, e o resto é
apresentação no kit e na `GameScene`.

## Ordem sugerida

1. Testes e implementação do `points` no evento; testes e implementação de
   `floatingScorePosition`.
2. `outline: "pontuacao"` no título; `createFloatingScore`.
3. `GameScene`: `lastHitPoint`, `pawGeometry` e a criação no handler.
4. Validação pelo `quickstart.md`; backlog §8 (item entregue).

## Complexity Tracking

Nenhuma violação.
