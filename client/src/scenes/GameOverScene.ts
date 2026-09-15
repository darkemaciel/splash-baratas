import Phaser from "phaser";
import { GAME_HEIGHT, GAME_WIDTH, UI_SCALE } from "../config/gameConfig";
import { matchStateManager } from "../systems/MatchStateManager";

/**
 * FR-011/FR-012: tela final de derrota com opção de reiniciar sem recarregar a página.
 */
export class GameOverScene extends Phaser.Scene {
  constructor() {
    super("GameOverScene");
  }

  create(): void {
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x1b1b1b, 0.85);

    // specs/006-responsividade-mobile (FR-007): tamanhos fixos em px cortavam a mensagem na base
    // portrait (480px de largura) — escala junto com UI_SCALE em vez de valores fixos únicos.
    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 60, "Todas as comidas foram roubadas!\nVocê perdeu.", {
        fontSize: `${Math.round(32 * UI_SCALE)}px`,
        color: "#ffffff",
        align: "center",
      })
      .setOrigin(0.5);

    // specs/004-sistema-pontuacao (FR-010): pontuação final preservada, entre a mensagem de
    // derrota e o botão "Reiniciar".
    const { score } = matchStateManager.getSnapshot();
    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2, `Pontuação final: ${score}`, {
        fontSize: `${Math.round(24 * UI_SCALE)}px`,
        color: "#ffffff",
      })
      .setOrigin(0.5);

    const button = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 60, "Reiniciar", {
        fontSize: `${Math.round(28 * UI_SCALE)}px`,
        color: "#ffffff",
        backgroundColor: "#e76f51",
        padding: { x: Math.round(24 * UI_SCALE), y: Math.round(12 * UI_SCALE) },
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    const unsubscribe = matchStateManager.on("match:started", () => {
      unsubscribe();
      this.scene.start("GameScene");
    });

    button.on("pointerdown", () => {
      matchStateManager.restart(this.time.now);
    });
  }
}
