import Phaser from "phaser";
import { GAME_HEIGHT, GAME_WIDTH, UI_SCALE } from "../config/gameConfig";
import { matchStateManager } from "../systems/MatchStateManager";

/**
 * FR-001: tela inicial — nenhuma comida/prateleira/barata de partida é exibida aqui (US3).
 */
export class StartScene extends Phaser.Scene {
  constructor() {
    super("StartScene");
  }

  create(): void {
    this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, "fridgeBg");
    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 80, "Baratas na Geladeira", {
        // specs/006-responsividade-mobile (FR-007): tamanho fixo em px cortava o título na base
        // portrait (480px de largura) — escala junto com UI_SCALE em vez de um valor fixo único.
        fontSize: `${Math.round(40 * UI_SCALE)}px`,
        color: "#1b1b1b",
      })
      .setOrigin(0.5);

    const button = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 20, "Iniciar", {
        fontSize: `${Math.round(28 * UI_SCALE)}px`,
        color: "#ffffff",
        backgroundColor: "#2a9d8f",
        padding: { x: Math.round(24 * UI_SCALE), y: Math.round(12 * UI_SCALE) },
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    const unsubscribe = matchStateManager.on("match:started", () => {
      unsubscribe();
      this.scene.start("GameScene");
    });

    button.on("pointerdown", () => {
      matchStateManager.start(this.time.now);
    });
  }
}
