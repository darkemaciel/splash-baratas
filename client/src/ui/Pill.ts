import Phaser from "phaser";
import { COR, ESPACO, SOMBRA, TEXTO } from "../config/theme";
import { displayText, drawShape } from "./draw";
import { pillPoints } from "./shape";

/**
 * specs/017-design-system-grotesco (FR-013, contracts/ui-kit.md): pílula do HUD (gs-pilula) —
 * fundo branco ou creme, contorno de 3px, sombra dura pequena, número em Luckiest Guy. NÃO é
 * interativa: nunca captura clique (FR-019), então uma barata que passe por trás continua clicável.
 */

export interface PillOptions {
  text: string;
  textColor: number;
  fill: "branco" | "creme";
  iconKey?: string;
  /** 0 = `x` é a borda esquerda; 0.5 = centro; 1 = borda direita. */
  origin: 0 | 0.5 | 1;
  /** Largura mínima (ex.: campo de nome, para não "crescer" a cada letra digitada). */
  minWidth?: number;
}

export interface Pill {
  root: Phaser.GameObjects.Container;
  readonly width: number;
  readonly height: number;
  setText(text: string): Pill;
  /** Reposiciona a âncora horizontal (respeitando `origin`). */
  setAnchorX(x: number): Pill;
  setDepth(depth: number): Pill;
}

const PAD_Y = 6;
const PAD_X = 18;
const PAD_X_ICON_SIDE = 12;
const ICON_GAP = ESPACO.e8;
const ICON_SCALE = 0.5;

export function createPill(scene: Phaser.Scene, x: number, y: number, options: PillOptions): Pill {
  const background = scene.add.graphics();
  const label = displayText(scene, 0, 0, options.text, TEXTO.hud.size, options.textColor);
  const icon = options.iconKey ? scene.add.image(0, 0, options.iconKey).setScale(ICON_SCALE) : undefined;
  const children: Phaser.GameObjects.GameObject[] = [background, label];
  if (icon) {
    children.push(icon);
  }
  const root = scene.add.container(x, y, children);
  const fill = options.fill === "creme" ? COR.creme : COR.branco;

  let anchorX = x;
  let width = 0;
  let height = 0;

  const layout = (): void => {
    const iconWidth = icon ? icon.displayWidth + ICON_GAP : 0;
    const leftPad = icon ? PAD_X_ICON_SIDE : PAD_X;
    const nextWidth = Math.max(options.minWidth ?? 0, Math.ceil(leftPad + iconWidth + (label.width - 4) + PAD_X));
    const nextHeight = Math.ceil(Math.max(label.height - 8, icon?.displayHeight ?? 0) + PAD_Y * 2);

    // Redesenha o fundo só quando o tamanho muda (research: sem trabalho de desenho por frame).
    if (nextWidth !== width || nextHeight !== height) {
      width = nextWidth;
      height = nextHeight;
      background.clear();
      drawShape(background, pillPoints(width, height), width, height, { fill, shadowOffset: SOMBRA.p });
    }

    const left = -width / 2 + leftPad;
    if (icon) {
      icon.setPosition(left + icon.displayWidth / 2, 0);
    }
    label.setPosition(left + iconWidth + (label.width - 4) / 2, 0);
    root.x = anchorX - options.origin * width + width / 2;
  };

  layout();

  const pill: Pill = {
    root,
    get width() {
      return width;
    },
    get height() {
      return height;
    },
    setText(text) {
      const upper = text.toUpperCase();
      if (label.text !== upper) {
        label.setText(upper);
        layout();
      }
      return pill;
    },
    setAnchorX(value) {
      anchorX = value;
      layout();
      return pill;
    },
    setDepth(depth) {
      root.setDepth(depth);
      return pill;
    },
  };
  return pill;
}
