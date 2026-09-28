import Phaser from "phaser";
import { COR, RAIO, SOMBRA, TEXTO, TRACO } from "../config/theme";
import { bodyText, displayText, drawShape } from "./draw";
import { bubblePoints } from "./shape";

/**
 * specs/017-design-system-grotesco (FR-011, contracts/ui-kit.md): cartão de resultado do design
 * system (gs-resultado) — cartão creme de raio-cartao, linhas "rótulo … valor" separadas por
 * divisórias tracejadas de 2px. Rótulo em Baloo 2 800 · 17; valor em display 30 (vermelho quando
 * `highlight`). Linha sem `value` mostra só o rótulo (slot vazio do ranking).
 */

export interface ResultRow {
  label: string;
  value?: string;
  highlight?: boolean;
}

export interface ResultCard {
  root: Phaser.GameObjects.Container;
  width: number;
  height: number;
}

const PAD_X = 28;
const PAD_Y = 20;
const TITLE_GAP = 12;
const DASH = 6;
const DASH_GAP = 5;

export function createResultCard(
  scene: Phaser.Scene,
  x: number,
  y: number,
  options: { width: number; rows: readonly ResultRow[]; title?: string; rowPaddingY?: number },
): ResultCard {
  const { width, rows } = options;
  const rowPaddingY = options.rowPaddingY ?? 6;
  const background = scene.add.graphics();
  const dividers = scene.add.graphics();
  const content: Phaser.GameObjects.GameObject[] = [];

  // Monta de cima para baixo com y relativo ao topo do cartão; recentraliza no final.
  let cursorY = PAD_Y;
  const titleText = options.title ? displayText(scene, 0, 0, options.title, TEXTO.titulo_p.size, COR.traco) : undefined;
  if (titleText) {
    titleText.setY(cursorY + (titleText.height - 8) / 2);
    content.push(titleText);
    cursorY += titleText.height - 8 + TITLE_GAP;
  }

  const rowTops: number[] = [];
  for (const row of rows) {
    const label = bodyText(
      scene,
      0,
      0,
      row.label,
      TEXTO.rotulo_resultado.size,
      TEXTO.rotulo_resultado.weight,
      COR.traco,
    ).setOrigin(0, 0.5);
    const value = row.value
      ? displayText(scene, 0, 0, row.value, TEXTO.valor_resultado.size, row.highlight ? COR.vermelho : COR.traco).setOrigin(
          1,
          0.5,
        )
      : undefined;
    const rowHeight = Math.max(label.height - 8, (value?.height ?? 0) - 8) + rowPaddingY * 2;
    const centerY = cursorY + rowHeight / 2;
    label.setPosition(-width / 2 + PAD_X, centerY);
    value?.setPosition(width / 2 - PAD_X, centerY);
    content.push(label);
    if (value) {
      content.push(value);
    }
    rowTops.push(cursorY);
    cursorY += rowHeight;
  }

  const height = Math.ceil(cursorY + PAD_Y);
  drawShape(background, bubblePoints(width, height, RAIO.cartao), width, height, {
    fill: COR.creme,
    shadowOffset: SOMBRA.m,
  });

  // Divisórias tracejadas entre linhas consecutivas (gs-resultado__linha + gs-resultado__linha).
  dividers.lineStyle(TRACO.detalhe, COR.traco, 1);
  for (const top of rowTops.slice(1)) {
    for (let dx = -width / 2 + PAD_X; dx < width / 2 - PAD_X; dx += DASH + DASH_GAP) {
      const end = Math.min(dx + DASH, width / 2 - PAD_X);
      dividers.lineBetween(dx, top - height / 2, end, top - height / 2);
    }
  }

  for (const item of content) {
    const obj = item as Phaser.GameObjects.Text;
    obj.setY(obj.y - height / 2);
  }

  const root = scene.add.container(x, y, [background, dividers, ...content]);
  return { root, width, height };
}
