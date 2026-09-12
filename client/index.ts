import Phaser from "phaser";
import { GAME_HEIGHT, GAME_WIDTH } from "./src/config/gameConfig";
import { BootScene } from "./src/scenes/BootScene";
import { StartScene } from "./src/scenes/StartScene";
import { GameScene } from "./src/scenes/GameScene";
import { GameOverScene } from "./src/scenes/GameOverScene";

new Phaser.Game({
  type: Phaser.AUTO,
  parent: "game",
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  backgroundColor: "#0d0d0d",
  scene: [BootScene, StartScene, GameScene, GameOverScene],
});
