import Phaser from "phaser";

/**
 * specs/017-design-system-grotesco (FR-008, FR-022, research §7): cada botão desenhado no canvas
 * ganha um <button> DOM visualmente oculto (classe .sr-only, dentro de #ui-a11y em index.html) que
 * dá rótulo acessível e foco/ativação por teclado. O proxy nunca fica por cima do canvas, então não
 * interfere na pata (CursorScene) nem no hit-test das baratas.
 */

export interface A11yProxy {
  setLabel(label: string): void;
  /** `null` remove o atributo aria-pressed (botão sem estado de alternância). */
  setPressed(pressed: boolean | null): void;
  destroy(): void;
}

interface A11yProxyOptions {
  label: string;
  onActivate: () => void;
  onFocusChange?: (focused: boolean) => void;
}

const liveProxies = new Set<HTMLButtonElement>();
let proxiesEnabled = true;

const NOOP_PROXY: A11yProxy = {
  setLabel: () => {},
  setPressed: () => {},
  destroy: () => {},
};

export function createA11yProxy(scene: Phaser.Scene, options: A11yProxyOptions): A11yProxy {
  const root = typeof document !== "undefined" ? document.getElementById("ui-a11y") : null;
  if (!root) {
    return NOOP_PROXY;
  }

  const button = document.createElement("button");
  button.type = "button";
  button.className = "sr-only";
  button.setAttribute("aria-label", options.label);
  button.tabIndex = proxiesEnabled ? 0 : -1;

  // Enter/Espaço num <button> focado disparam "click" nativamente.
  const handleClick = (): void => options.onActivate();
  const handleFocus = (): void => options.onFocusChange?.(true);
  const handleBlur = (): void => options.onFocusChange?.(false);
  button.addEventListener("click", handleClick);
  button.addEventListener("focus", handleFocus);
  button.addEventListener("blur", handleBlur);

  root.appendChild(button);
  liveProxies.add(button);

  let destroyed = false;
  const destroy = (): void => {
    if (destroyed) {
      return;
    }
    destroyed = true;
    button.removeEventListener("click", handleClick);
    button.removeEventListener("focus", handleFocus);
    button.removeEventListener("blur", handleBlur);
    liveProxies.delete(button);
    button.remove();
  };
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, destroy);
  scene.events.once(Phaser.Scenes.Events.DESTROY, destroy);

  return {
    setLabel: (label) => button.setAttribute("aria-label", label),
    setPressed: (pressed) => {
      if (pressed === null) {
        button.removeAttribute("aria-pressed");
      } else {
        button.setAttribute("aria-pressed", String(pressed));
      }
    },
    destroy,
  };
}

/**
 * contracts/ui-kit.md § Proxies e digitação: desliga temporariamente todos os proxies (sem foco e
 * fora da ordem do Tab) — usado enquanto o jogador digita o nome no fim de jogo, para que
 * Enter/Espaço nunca acionem um botão focado (ex.: o de som, que existe em todas as telas).
 */
export function setProxiesEnabled(enabled: boolean): void {
  proxiesEnabled = enabled;
  for (const button of liveProxies) {
    if (!enabled) {
      button.blur();
    }
    button.tabIndex = enabled ? 0 : -1;
  }
}
