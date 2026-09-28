import Phaser from "phaser";
import { COR, FONTE, hex, TRACO } from "../config/theme";
import type { ShapePoint } from "./shape";

/**
 * specs/017-design-system-grotesco (research §4): desenha uma forma do design system — sombra dura
 * (mesmo polígono em cor-traco, deslocado para baixo e à direita, sem desfoque), preenchimento
 * chapado e contorno preto contínuo. Os pontos vêm de ui/shape.ts (origem no canto superior
 * esquerdo) e são recentralizados em (0,0), porque os componentes são posicionados pelo centro.
 */
export function drawShape(
  graphics: Phaser.GameObjects.Graphics,
  points: readonly ShapePoint[],
  width: number,
  height: number,
  options: { fill: number; shadowOffset?: number; strokeWidth?: number },
): void {
  const { fill, shadowOffset = 0, strokeWidth = TRACO.ui } = options;
  const centered = points.map((p) => new Phaser.Math.Vector2(p.x - width / 2, p.y - height / 2));

  if (shadowOffset > 0) {
    const shadow = centered.map((p) => new Phaser.Math.Vector2(p.x + shadowOffset, p.y + shadowOffset));
    graphics.fillStyle(COR.traco, 1);
    graphics.fillPoints(shadow, true);
  }

  graphics.fillStyle(fill, 1);
  graphics.fillPoints(centered, true);

  if (strokeWidth > 0) {
    graphics.lineStyle(strokeWidth, COR.traco, 1);
    graphics.strokePoints(centered, true, true);
  }
}

// Luckiest Guy tem ascendentes altos que o Phaser corta sem um respiro vertical no canvas do Text.
const TEXT_PADDING = { x: 2, y: 4 };

/** Texto display (Luckiest Guy), sempre em caixa alta — títulos, botões e números do HUD. */
export function displayText(
  scene: Phaser.Scene,
  x: number,
  y: number,
  text: string,
  size: number,
  color: number,
): Phaser.GameObjects.Text {
  return scene.add
    .text(x, y, text.toUpperCase(), {
      fontFamily: FONTE.display,
      fontSize: `${size}px`,
      color: hex(color),
      padding: TEXT_PADDING,
    })
    .setOrigin(0.5);
}

/** Texto corrido (Baloo 2, pesos 500–800) — rótulos, instruções e legendas. */
export function bodyText(
  scene: Phaser.Scene,
  x: number,
  y: number,
  text: string,
  size: number,
  weight: number,
  color: number,
): Phaser.GameObjects.Text {
  return scene.add
    .text(x, y, text, {
      fontFamily: FONTE.texto,
      fontSize: `${size}px`,
      fontStyle: String(weight),
      color: hex(color),
      padding: TEXT_PADDING,
    })
    .setOrigin(0.5);
}
