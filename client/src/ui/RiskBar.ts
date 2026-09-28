import Phaser from "phaser";
import { COR, SOMBRA, TAMANHO, TRACO } from "../config/theme";
import type { RiskLevel } from "../entities/Match";
import { drawShape } from "./draw";
import { pillPoints } from "./shape";

/**
 * specs/017-design-system-grotesco (FR-014, research §12): barra de risco horizontal no estilo do
 * componente BarraEnergia — trilho em pílula branca com contorno e sombra dura, preenchimento em
 * pílula de cor chapada por nível. A proporção preenchida continua sendo o sinal principal (a cor
 * nunca é o único sinal). Não interativa.
 */

const RISK_FILL: Record<RiskLevel, number> = {
  safe: COR.limao,
  elevated: COR.laranja,
  critical: COR.vermelho,
};

const INNER_PADDING = 3;

export interface RiskBar {
  root: Phaser.GameObjects.Container;
  width: number;
  height: number;
  update(ratio: number, level: RiskLevel): RiskBar;
  setDepth(depth: number): RiskBar;
}

export function createRiskBar(
  scene: Phaser.Scene,
  x: number,
  y: number,
  options: { width: number; origin: 0 | 0.5 | 1 },
): RiskBar {
  const width = options.width;
  const height = TAMANHO.energiaAltura;
  const track = scene.add.graphics();
  const fill = scene.add.graphics();
  const root = scene.add.container(x - options.origin * width + width / 2, y, [track, fill]);

  drawShape(track, pillPoints(width, height), width, height, { fill: COR.branco, shadowOffset: SOMBRA.p });

  const inset = INNER_PADDING + TRACO.ui;
  const innerMaxWidth = width - inset * 2;
  const innerHeight = height - inset * 2;

  const bar: RiskBar = {
    root,
    width,
    height,
    update(ratio, level) {
      fill.clear();
      const clamped = Math.max(0, Math.min(1, ratio));
      const fillWidth = innerMaxWidth * clamped;
      if (fillWidth <= 0) {
        return bar;
      }
      // Largura mínima = altura, para a ponta arredondada nunca "inverter" em proporções pequenas.
      const drawnWidth = Math.max(fillWidth, innerHeight);
      const points = pillPoints(drawnWidth, innerHeight).map(
        (p) => new Phaser.Math.Vector2(p.x - width / 2 + inset, p.y - innerHeight / 2),
      );
      fill.fillStyle(RISK_FILL[level], 1);
      fill.fillPoints(points, true);
      return bar;
    },
    setDepth(depth) {
      root.setDepth(depth);
      return bar;
    },
  };
  return bar;
}
