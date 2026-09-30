import Phaser from "phaser";
import { GAME_WIDTH } from "../config/gameConfig";
import { COR, ESPACO, TAMANHO, TEXTO } from "../config/theme";
import { createButton, type Button } from "./Button";
import { bodyText } from "./draw";
import { createPanel, createPanelTitle } from "./Panel";

/**
 * specs/018-navegacao-pausa-fim (FR-007, contracts/navigation.md § Kit de UI): diálogo de confirmação
 * do design system (componente Diálogo) — painel creme de até 400px com título, uma linha de texto
 * e dois botões P: a ação que cancela à esquerda (terciário, bolha B) e a destrutiva à direita
 * (primário, bolha A).
 */

export interface DialogOptions {
  titulo: string;
  texto: string;
  cancelar: string;
  confirmar: string;
  onCancelar: () => void;
  onConfirmar: () => void;
  /** FR-015a: foca o botão de cancelar ao abrir (só quando a abertura veio do teclado). */
  focusCancel?: boolean;
}

export interface Dialog {
  destroy(): void;
}

const PAD_TOP = 26;
const PAD_BOTTOM = 30;
const PAD_X = 32;
const CONTENT_DEPTH = 1;

function capitalize(text: string): string {
  const lower = text.toLowerCase();
  return lower.charAt(0).toUpperCase() + lower.slice(1);
}

export function createDialog(scene: Phaser.Scene, x: number, y: number, options: DialogOptions): Dialog {
  const width = Math.min(TAMANHO.dialogo, GAME_WIDTH - 2 * ESPACO.hudLateral);
  const innerWidth = width - 2 * PAD_X;

  const title = createPanelTitle(scene, x, 0, options.titulo, TEXTO.titulo_p.size).setDepth(CONTENT_DEPTH);
  const text = bodyText(scene, x, 0, options.texto, TEXTO.corpo.size, TEXTO.corpo.weight, COR.traco)
    .setWordWrapWidth(innerWidth)
    .setAlign("center")
    .setDepth(CONTENT_DEPTH);

  const cancelButton = createButton(scene, x, 0, {
    label: options.cancelar,
    variant: "terciario",
    size: "p",
    bolha: "b",
    a11yLabel: capitalize(options.cancelar),
    onActivate: () => options.onCancelar(),
  }).setDepth(CONTENT_DEPTH);
  const confirmButton = createButton(scene, x, 0, {
    label: options.confirmar,
    variant: "primario",
    size: "p",
    bolha: "a",
    a11yLabel: capitalize(options.confirmar),
    onActivate: () => options.onConfirmar(),
  }).setDepth(CONTENT_DEPTH);

  // Botões lado a lado se couberem na largura interna; senão, empilhados com o de confirmar embaixo.
  const sideBySide = cancelButton.width + ESPACO.e12 + confirmButton.width <= innerWidth;
  const buttonsHeight = sideBySide
    ? Math.max(cancelButton.height, confirmButton.height)
    : cancelButton.height + ESPACO.e12 + confirmButton.height;

  const titleHeight = title.height - 8;
  const textHeight = text.height - 8;
  const height = PAD_TOP + titleHeight + ESPACO.e16 + textHeight + ESPACO.e16 + buttonsHeight + PAD_BOTTOM;
  const top = y - height / 2;

  const panel = createPanel(scene, x, y, { width, height });

  let cursorY = top + PAD_TOP;
  title.setY(cursorY + titleHeight / 2);
  cursorY += titleHeight + ESPACO.e16;
  text.setY(cursorY + textHeight / 2);
  cursorY += textHeight + ESPACO.e16;

  if (sideBySide) {
    const rowWidth = cancelButton.width + ESPACO.e12 + confirmButton.width;
    const rowCenterY = cursorY + buttonsHeight / 2;
    cancelButton.setPosition(x - rowWidth / 2 + cancelButton.width / 2, rowCenterY);
    confirmButton.setPosition(x + rowWidth / 2 - confirmButton.width / 2, rowCenterY);
  } else {
    cancelButton.setPosition(x, cursorY + cancelButton.height / 2);
    confirmButton.setPosition(x, cursorY + cancelButton.height + ESPACO.e12 + confirmButton.height / 2);
  }

  if (options.focusCancel) {
    cancelButton.focus();
  }

  const buttons: Button[] = [cancelButton, confirmButton];
  return {
    destroy() {
      for (const button of buttons) {
        button.destroy();
      }
      title.destroy();
      text.destroy();
      panel.destroy();
    },
  };
}
