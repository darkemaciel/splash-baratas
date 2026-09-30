import Phaser from "phaser";
import { COR, RAIO, SOMBRA, TEXTO } from "../config/theme";
import { displayText, drawShape } from "./draw";
import { bubblePoints } from "./shape";

/**
 * specs/017-design-system-grotesco (FR-010, FR-011, contracts/ui-kit.md): painel/diálogo creme do
 * design system (gs-painel) — cantos assimétricos de raio-painel, contorno de 3px e sombra dura de
 * 6px. Os filhos são posicionados pelo chamador em coordenadas relativas ao centro.
 */
export function createPanel(
  scene: Phaser.Scene,
  x: number,
  y: number,
  options: { width: number; height: number },
): Phaser.GameObjects.Container {
  const background = scene.add.graphics();
  drawShape(background, bubblePoints(options.width, options.height, RAIO.painel), options.width, options.height, {
    fill: COR.creme,
    shadowOffset: SOMBRA.painel,
  });
  return scene.add.container(x, y, [background]);
}

const PANEL_TITLE_ANGLE = -2;

/** Título de painel (gs-painel__titulo): display em caixa alta, cor-traco, girado −2°, sem contorno. */
export function createPanelTitle(
  scene: Phaser.Scene,
  x: number,
  y: number,
  text: string,
  size: number = TEXTO.titulo.size,
): Phaser.GameObjects.Text {
  return displayText(scene, x, y, text, size, COR.traco).setAngle(PANEL_TITLE_ANGLE);
}
