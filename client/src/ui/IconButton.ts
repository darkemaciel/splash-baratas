import Phaser from "phaser";
import { COR, SOMBRA, TAMANHO, TRACO } from "../config/theme";
import { createA11yProxy } from "./a11y";
import { prefersReducedMotion, uiTweenMs } from "./motion";

/**
 * specs/017-design-system-grotesco (FR-015, FR-016, FR-022, contracts/ui-kit.md): botão de ícone
 * do design system — círculo branco de 52px, ícone de 26px (SVG carregado em 2x no BootScene e
 * exibido pela metade), sempre com rótulo acessível.
 */

type IconButtonState = "normal" | "hover" | "pressionado";

export interface IconButtonOptions {
  iconKey: string;
  a11yLabel: string;
  /**
   * "up" (padrão): ação no pointerup dentro do botão. "down": ação no pointerdown, recebendo o
   * EventData do Phaser para `stopPropagation()` (Pausar e Som — o clique não pode vazar para a
   * partida, FR-019).
   */
  trigger?: "up" | "down";
  onActivate: (event?: Phaser.Types.Input.EventData) => void;
}

export interface IconButton {
  root: Phaser.GameObjects.Container;
  size: number;
  setAtivo(ativo: boolean): IconButton;
  setSlash(visible: boolean): IconButton;
  setA11yLabel(label: string): IconButton;
  /** Volta ao estado de repouso (normal, ou ativo) sem transição. */
  resetVisualState(): IconButton;
  setDepth(depth: number): IconButton;
}

const HOVER_OFFSET = -3;
const PRESSED_OFFSET = 2;
const HOVER_ANGLE = -8;
const ICON_SCALE = 0.5;
const TRANSITION_MS = 90;
const FOCUS_GAP = 4;

export function createIconButton(
  scene: Phaser.Scene,
  x: number,
  y: number,
  options: IconButtonOptions,
): IconButton {
  const size = TAMANHO.botaoIcone;
  const radius = size / 2;
  const trigger = options.trigger ?? "up";

  const background = scene.add.graphics();
  const icon = scene.add.image(0, 0, options.iconKey).setScale(ICON_SCALE);
  const slash = scene.add.graphics().setVisible(false);
  const focusRing = scene.add.graphics().setVisible(false);
  const root = scene.add.container(x, y, [focusRing, background, icon, slash]);

  const iconHalf = TAMANHO.iconeBotao / 2;
  slash.lineStyle(TRACO.ui, COR.traco, 1);
  slash.lineBetween(-iconHalf, iconHalf, iconHalf, -iconHalf);

  focusRing.lineStyle(TRACO.ui, COR.traco, 1);
  focusRing.strokeCircle(0, 0, radius + FOCUS_GAP + TRACO.ui);

  let ativo = false;
  let state: IconButtonState = "normal";

  const draw = (): void => {
    background.clear();
    let fill: number = COR.branco;
    let shadow: number = SOMBRA.p;
    if (ativo) {
      fill = COR.creme;
      shadow = SOMBRA.pressionado;
    } else if (state === "hover") {
      fill = COR.creme;
      shadow = SOMBRA.painel;
    } else if (state === "pressionado") {
      fill = COR.papel;
      shadow = SOMBRA.pressionado;
    }
    background.fillStyle(COR.traco, 1);
    background.fillCircle(shadow, shadow, radius);
    background.fillStyle(fill, 1);
    background.fillCircle(0, 0, radius);
    background.lineStyle(TRACO.ui, COR.traco, 1);
    background.strokeCircle(0, 0, radius - TRACO.ui / 2);
  };

  let tween: Phaser.Tweens.Tween | undefined;
  const applyState = (next: IconButtonState, instant = false): void => {
    state = next;
    draw();
    let offset = 0;
    let angle = 0;
    if (!ativo && state === "hover") {
      offset = HOVER_OFFSET;
      angle = prefersReducedMotion ? 0 : HOVER_ANGLE;
    } else if (!ativo && state === "pressionado") {
      offset = PRESSED_OFFSET;
    }
    tween?.stop();
    const duration = instant ? 0 : uiTweenMs(TRANSITION_MS);
    if (duration === 0) {
      root.setPosition(x + offset, y + offset).setAngle(angle);
      return;
    }
    tween = scene.tweens.add({ targets: root, x: x + offset, y: y + offset, angle, duration, ease: "Quad.easeOut" });
  };

  // Zona fixa fora do container — a área de clique não se move com o hover (FR-019).
  const zone = scene.add.zone(x, y, size, size).setInteractive({
    hitArea: new Phaser.Geom.Circle(radius, radius, radius),
    hitAreaCallback: Phaser.Geom.Circle.Contains,
    useHandCursor: false,
  });
  let pressed = false;
  zone.on("pointerover", () => applyState(pressed ? "pressionado" : "hover"));
  zone.on("pointerout", () => {
    pressed = false;
    applyState("normal");
  });
  zone.on(
    "pointerdown",
    (_pointer: Phaser.Input.Pointer, _x: number, _y: number, event: Phaser.Types.Input.EventData) => {
      pressed = true;
      applyState("pressionado");
      if (trigger === "down") {
        options.onActivate(event);
      }
    },
  );
  zone.on("pointerup", () => {
    const wasPressed = pressed;
    pressed = false;
    applyState("hover");
    if (wasPressed && trigger === "up") {
      options.onActivate();
    }
  });

  const proxy = createA11yProxy(scene, {
    label: options.a11yLabel,
    onActivate: () => options.onActivate(),
    onFocusChange: (focused) => focusRing.setVisible(focused),
  });

  draw();

  const button: IconButton = {
    root,
    size,
    setAtivo(value) {
      ativo = value;
      proxy.setPressed(value);
      applyState(state, true);
      return button;
    },
    setSlash(visible) {
      slash.setVisible(visible);
      return button;
    },
    setA11yLabel(label) {
      proxy.setLabel(label);
      return button;
    },
    resetVisualState() {
      pressed = false;
      applyState("normal", true);
      return button;
    },
    setDepth(depth) {
      root.setDepth(depth);
      zone.setDepth(depth);
      return button;
    },
  };
  return button;
}
