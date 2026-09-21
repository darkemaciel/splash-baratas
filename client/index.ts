import Phaser from "phaser";
import { inject } from "@vercel/analytics";
import { GAME_HEIGHT, GAME_WIDTH } from "./src/config/gameConfig";
import { BootScene } from "./src/scenes/BootScene";
import { StartScene } from "./src/scenes/StartScene";
import { GameScene } from "./src/scenes/GameScene";
import { GameOverScene } from "./src/scenes/GameOverScene";
import { PauseOverlayScene } from "./src/scenes/PauseOverlayScene";
import { AudioControlScene } from "./src/scenes/AudioControlScene";

inject();

new Phaser.Game({
  type: Phaser.AUTO,
  parent: "game",
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  backgroundColor: "#0d0d0d",
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    // specs/006-responsividade-mobile (FR-006): piso de 320px de largura, com a altura mínima
    // derivada da proporção de GAME_WIDTH/GAME_HEIGHT ativa (landscape ou portrait) em vez de um
    // valor fixo — do contrário o piso de altura ficaria errado na base portrait.
    min: { width: 320, height: Math.round((320 * GAME_HEIGHT) / GAME_WIDTH) },
  },
  // specs/014-mute-som-jogo (research.md §3): AudioControlScene DEVE ser a última entrada — a
  // posição no array define a ordem de renderização/prioridade de input do Phaser, garantindo que
  // o controle de mute fique sempre por cima de todas as outras Scenes, incluindo a overlay de
  // PauseOverlayScene.
  scene: [BootScene, StartScene, GameScene, GameOverScene, PauseOverlayScene, AudioControlScene],
});
