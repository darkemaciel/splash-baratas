import Phaser from "phaser";
import { GAME_HEIGHT, GAME_WIDTH } from "../config/gameConfig";
import { ESPACO, MOVIMENTO, TEXTO } from "../config/theme";
import { floatingScorePosition, rotatedBounds } from "./floatingScoreLayout";
import { formatThousands } from "./format";
import { prefersReducedMotion } from "./motion";
import { createOutlinedTitle } from "./OutlinedTitle";

/**
 * specs/019-pontuacao-flutuante (FR-001 a FR-012, contracts/floating-score.md): "+N!" do componente
 * PontuacaoFlutuante. Nasce acima da pata do gato no ponto do clique que eliminou a barata, fica
 * preso a esse ponto, sobe 48px e some em 720ms (ease-out). Puramente visual: nunca é interativo.
 * Tween e timer pertencem à cena, então pausam com ela e somem no shutdown (reiniciar, encerrar,
 * perder) sem código extra.
 */

/** Acima do HUD e das baratas só para aparecer inteiro; a pata (CursorScene) fica por cima de tudo. */
export const FLOATING_SCORE_DEPTH = 30;

/** Meia-caixa envolvente da pata durante o tapa (escala + giro), ver research §2. */
export interface PawGeometry {
  halfWidth: number;
  halfHeight: number;
}

export function createFloatingScore(
  scene: Phaser.Scene,
  px: number,
  py: number,
  points: number,
  paw: PawGeometry,
): void {
  const text = createOutlinedTitle(scene, px, py, `+${formatThousands(points)}!`, {
    size: TEXTO.pontuacao_flutuante.size,
    angle: MOVIMENTO.pontuacao.inclinacaoDeg,
    outline: "pontuacao",
  }).setDepth(FLOATING_SCORE_DEPTH);

  const bounds = rotatedBounds(text.width, text.height, MOVIMENTO.pontuacao.inclinacaoDeg);
  const riseReserved = prefersReducedMotion ? 0 : MOVIMENTO.pontuacao.subidaPx;
  const { x, y } = floatingScorePosition({
    px,
    py,
    textWidth: bounds.width,
    textHeight: bounds.height,
    paw,
    riseReserved,
    screenWidth: GAME_WIDTH,
    screenHeight: GAME_HEIGHT,
    gap: ESPACO.e8,
    margin: ESPACO.e4,
  });
  text.setPosition(x, y);

  // FR-005: com movimento reduzido, o número fica parado e some ao fim do mesmo tempo.
  if (prefersReducedMotion) {
    scene.time.delayedCall(MOVIMENTO.pontuacao.ms, () => text.destroy());
    return;
  }
  scene.tweens.add({
    targets: text,
    y: y - MOVIMENTO.pontuacao.subidaPx,
    alpha: 0,
    duration: MOVIMENTO.pontuacao.ms,
    ease: "Quad.easeOut",
    onComplete: () => text.destroy(),
  });
}
