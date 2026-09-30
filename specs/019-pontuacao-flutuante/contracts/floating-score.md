# Contract: Pontuação flutuante

## Domínio

```ts
// MatchStateManager
export interface MatchEventPayloads {
  "roach:eliminated": { roachId: string; points: number };   // points: NOVO
  // ...demais sem mudança
}
tryEliminateRoach(roachId: string, clientTimestamp: number): boolean; // sem mudança de assinatura
```

Testes (`client/tests/unit/matchStateManager.eliminatedPoints.test.ts`):
1. Uma eliminação emite `roach:eliminated` com `points` igual ao aumento de `getSnapshot().score`.
2. Duas eliminações dentro da janela de combo: o `points` da segunda é maior que o da primeira pelo
   bônus de combo, e a soma dos `points` é igual ao `score` final.
3. Eliminação tardia (depois do prazo) não emite o evento.
4. `points` inclui o bônus de reação (eliminação rápida > eliminação lenta, mesma partida isolada).

## Kit de UI

```ts
// client/src/ui/OutlinedTitle.ts (acréscimo retrocompatível)
createOutlinedTitle(scene, x, y, text, { size, angle, wrapWidth?, outline?: "titulo" | "pontuacao" });
// "titulo" (padrão): strokeThickness 8, sombra 7   — sem mudança de comportamento
// "pontuacao":       strokeThickness 6, sombra 5

// client/src/ui/FloatingScore.ts (novo)
export interface PawGeometry { halfWidth: number; halfHeight: number } // caixa envolvente da pata no tapa (escala + giro)
createFloatingScore(scene, px, py, points, paw: PawGeometry): void;
```

`createFloatingScore`:
- cria o texto (`outline: "pontuacao"`, `TEXTO.pontuacao_flutuante.size`,
  `angle: MOVIMENTO.pontuacao.inclinacaoDeg`), `setDepth(FLOATING_SCORE_DEPTH)`;
- **não** chama `setInteractive` (FR-006);
- posiciona conforme research §2/§3 (acima da pata; lateral no topo; sempre inteiro na tela;
  nunca embaixo da pata);
- anima conforme research §5 e se destrói ao fim.

A regra de posição fica numa função pura e testável, `floatingScorePosition(input): { x, y }`, em
`client/src/ui/floatingScoreLayout.ts` (sem `import phaser`):

```ts
floatingScorePosition({
  px, py, textWidth, textHeight, paw, riseReserved, screenWidth, screenHeight, gap, margin,
}): { x: number; y: number };
// textWidth/textHeight e paw já chegam como caixas envolventes giradas (rotatedBounds).
rotatedBounds(width, height, angleDeg): { width, height }; // w·|cos|+h·|sin|, w·|sin|+h·|cos|
```

Testes (`client/tests/unit/ui.floatingScoreLayout.test.ts`):
1. Meio da tela: `x = px`; a base do número fica `gap` acima do topo da pata.
2. Perto da borda esquerda ou direita: `x` limitado para o texto caber inteiro.
3. Perto do topo (sem espaço acima + subida): o número vai para o lado direito da pata, sem
   sobrepor o retângulo da pata; perto do canto superior direito, vai para o lado esquerdo.
4. Em nenhum caso o retângulo do número intersecta o retângulo da pata (propriedade verificada
   numa grade de pontos da tela, nas bases 960×600 e 480×960).
5. `riseReserved = 0` (movimento reduzido) permite nascer mais perto do topo antes de ir para o lado.
6. `rotatedBounds(100, 50, 0)` = 100×50; `rotatedBounds(100, 50, 90)` ≈ 50×100; `rotatedBounds(w, h,
   −25)` é igual a `rotatedBounds(w, h, 25)`.

## Cena `GameScene`

- `handlePointerDown`: antes de `tryEliminateRoach`, guarda `this.lastHitPoint = { x: pointer.x,
  y: pointer.y }`.
- Handler de `roach:eliminated` (`playRoachEliminated`): além do que já faz (som, queda), chama
  `createFloatingScore(this, lastHitPoint.x, lastHitPoint.y, points, this.pawGeometry)`.
- `pawGeometry` é calculada uma vez no `create()`: `ph = CURSOR_PAW_HEIGHT_PX ·
  MOVIMENTO.pata.golpeEscala`, `pw = ph · (largura/altura da textura cursor-paw)` (fallback 1), e
  depois `rotatedBounds(pw, ph, MOVIMENTO.pata.golpeAnguloDeg)` dividido por 2.
