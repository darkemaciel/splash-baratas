import Phaser from "phaser";
import { COR, MOVIMENTO, RAIO, SOMBRA, TAMANHO, TEXTO, TRACO } from "../config/theme";
import { createA11yProxy } from "./a11y";
import { displayText, drawShape } from "./draw";
import { prefersReducedMotion, uiTweenMs } from "./motion";
import { bubblePoints } from "./shape";

/**
 * specs/017-design-system-grotesco (FR-008, contracts/ui-kit.md, data-model.md § Estado visual de
 * botão): botão de texto do design system desenhado no canvas — bolha assimétrica com contorno de
 * 3px, sombra dura e interação física (hover levanta e gira; pressionado afunda e achata).
 */

export type ButtonVariant = "primario" | "secundario" | "terciario";
export type ButtonSize = "g" | "m" | "p";
type ButtonState = "normal" | "hover" | "pressionado";

export interface ButtonOptions {
  label: string;
  variant: ButtonVariant;
  size: ButtonSize;
  bolha: "a" | "b";
  /** Largura mínima de pilha (280px) — botões empilhados em painéis. */
  pilha?: boolean;
  /** Rotação de repouso (ex.: −2° no JOGAR do menu). */
  baseAngle?: number;
  /** Rótulo acessível; padrão: o `label` em caixa normal. */
  a11yLabel?: string;
  onActivate: () => void;
}

export interface Button {
  root: Phaser.GameObjects.Container;
  width: number;
  height: number;
  setDepth(depth: number): Button;
  /** Move o botão inteiro (desenho, zona de clique e base do hover) — specs/018 (research §7). */
  setPosition(x: number, y: number): Button;
  /** Foca o proxy acessível (specs/018 FR-015a: foco do teclado ao abrir/fechar diálogos). */
  focus(): Button;
  destroy(): void;
}

const CORES: Record<ButtonVariant, { texto: number } & Record<ButtonState, number>> = {
  primario: { normal: COR.vermelho, hover: COR.magenta_escuro, pressionado: COR.vermelho_escuro, texto: COR.branco },
  secundario: { normal: COR.limao, hover: COR.limao_claro, pressionado: COR.limao_escuro, texto: COR.traco },
  terciario: { normal: COR.branco, hover: COR.creme, pressionado: COR.papel, texto: COR.traco },
};

const GIRO_HOVER: Record<ButtonVariant, number> = {
  primario: MOVIMENTO.botaoHover.giroPrimarioDeg,
  secundario: MOVIMENTO.botaoHover.giroSecundarioDeg,
  terciario: MOVIMENTO.botaoHover.giroTerciarioDeg,
};

const TAMANHOS: Record<ButtonSize, { fonte: number; padX: number; padY: number; sombra: number }> = {
  g: { fonte: TEXTO.botao_g.size, padX: 44, padY: 16, sombra: SOMBRA.g },
  m: { fonte: TEXTO.botao_m.size, padX: 28, padY: 12, sombra: SOMBRA.m },
  p: { fonte: TEXTO.botao_p.size, padX: 20, padY: 9, sombra: SOMBRA.p },
};

const FOCUS_GAP = 4;
const TRANSITION_MS = 90;

function capitalize(text: string): string {
  const lower = text.toLowerCase();
  return lower.charAt(0).toUpperCase() + lower.slice(1);
}

export function createButton(scene: Phaser.Scene, x: number, y: number, options: ButtonOptions): Button {
  const { variant, size, bolha, pilha = false, baseAngle = 0 } = options;
  let baseX = x;
  let baseY = y;
  const cores = CORES[variant];
  const dims = TAMANHOS[size];

  const label = displayText(scene, 0, 0, options.label, dims.fonte, cores.texto);
  const width = Math.max(label.width + dims.padX * 2, pilha ? TAMANHO.pilhaBotaoMin : 0);
  const height = Math.max(label.height - 8 + dims.padY * 2, TAMANHO.toqueMinimo);

  const background = scene.add.graphics();
  const focusRing = scene.add.graphics().setVisible(false);
  const root = scene.add.container(x, y, [focusRing, background, label]).setAngle(baseAngle);

  const radiiNormal = bolha === "a" ? RAIO.bolhaA : RAIO.bolhaB;
  const radiiPressed = bolha === "a" ? RAIO.bolhaPressionada : RAIO.bolhaPressionadaB;

  const draw = (state: ButtonState): void => {
    background.clear();
    const radii = state === "pressionado" ? radiiPressed : radiiNormal;
    const shadow = state === "hover" ? SOMBRA.hover : state === "pressionado" ? SOMBRA.pressionado : dims.sombra;
    drawShape(background, bubblePoints(width, height, radii), width, height, { fill: cores[state], shadowOffset: shadow });
  };

  const ringW = width + (FOCUS_GAP + TRACO.ui) * 2;
  const ringH = height + (FOCUS_GAP + TRACO.ui) * 2;
  // Anel de foco do teclado: contorno sólido de 3px, afastado 4px (design system § Cor e contraste).
  focusRing.lineStyle(TRACO.ui, COR.traco, 1);
  focusRing.strokePoints(
    bubblePoints(ringW, ringH, radiiNormal).map((p) => new Phaser.Math.Vector2(p.x - ringW / 2, p.y - ringH / 2)),
    true,
    true,
  );

  let tween: Phaser.Tweens.Tween | undefined;
  const applyState = (state: ButtonState): void => {
    draw(state);
    const offset =
      state === "hover" ? MOVIMENTO.botaoHover.deslocaPx : state === "pressionado" ? MOVIMENTO.botaoPressionado.deslocaPx : 0;
    const angle = state === "hover" && !prefersReducedMotion ? GIRO_HOVER[variant] : baseAngle;
    const scaleY = state === "pressionado" ? MOVIMENTO.botaoPressionado.achatarY : 1;
    tween?.stop();
    const duration = uiTweenMs(TRANSITION_MS);
    if (duration === 0) {
      root.setPosition(baseX + offset, baseY + offset).setAngle(angle).setScale(1, scaleY);
      return;
    }
    tween = scene.tweens.add({
      targets: root,
      x: baseX + offset,
      y: baseY + offset,
      angle,
      scaleY,
      duration,
      ease: "Quad.easeOut",
    });
  };

  // A zona interativa fica fora do container: não se move nem gira com o hover, então a área de
  // clique é sempre o retângulo do estado normal (contracts/ui-kit.md § Garantias de interação).
  const zone = scene.add.zone(x, y, width, height).setInteractive({ useHandCursor: false });
  let pressed = false;
  zone.on("pointerover", () => applyState(pressed ? "pressionado" : "hover"));
  zone.on("pointerout", () => {
    pressed = false;
    applyState("normal");
  });
  zone.on("pointerdown", () => {
    pressed = true;
    applyState("pressionado");
  });
  zone.on("pointerup", () => {
    if (!pressed) {
      return;
    }
    pressed = false;
    applyState("hover");
    options.onActivate();
  });

  const proxy = createA11yProxy(scene, {
    label: options.a11yLabel ?? capitalize(options.label),
    onActivate: () => options.onActivate(),
    onFocusChange: (focused) => focusRing.setVisible(focused),
  });

  draw("normal");

  const button: Button = {
    root,
    width,
    height,
    setDepth(depth) {
      root.setDepth(depth);
      zone.setDepth(depth);
      return button;
    },
    setPosition(nextX, nextY) {
      tween?.stop();
      baseX = nextX;
      baseY = nextY;
      root.setPosition(baseX, baseY).setAngle(baseAngle).setScale(1, 1);
      zone.setPosition(baseX, baseY);
      pressed = false;
      draw("normal");
      return button;
    },
    focus() {
      proxy.focus();
      return button;
    },
    destroy() {
      tween?.stop();
      proxy.destroy();
      zone.destroy();
      root.destroy();
    },
  };
  return button;
}
