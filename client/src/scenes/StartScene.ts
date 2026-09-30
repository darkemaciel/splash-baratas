import Phaser from "phaser";
import { GAME_HEIGHT, GAME_WIDTH, SHELF_Y_POSITIONS } from "../config/gameConfig";
import { ESPACO, NOME_DO_JOGO, TEXTO } from "../config/theme";
import { matchStateManager } from "../systems/MatchStateManager";
import { createButton } from "../ui/Button";
import { createOutlinedTitle } from "../ui/OutlinedTitle";

// specs/017-design-system-grotesco (contracts/screens.md § Tela inicial): logo com contorno girado
// −4° e botão primário G "JOGAR" girado −2°, sobre o interior da geladeira. Cada um fica no vão
// entre duas prateleiras (logo entre a 1ª e a 2ª, botão entre a 2ª e a 3ª), nunca em cima delas.
const SHELF_IMAGE_OFFSET_Y = 40;
const LOGO_ANGLE = -4;
const PLAY_ANGLE = -2;

/**
 * FR-001: tela inicial — nenhuma comida/barata de partida é exibida aqui (US3 da spec 001). As
 * prateleiras são só cenário.
 */
export class StartScene extends Phaser.Scene {
  constructor() {
    super("StartScene");
  }

  create(): void {
    this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, "fridgeBg");
    const shelfLines = SHELF_Y_POSITIONS.map((y) => y + SHELF_IMAGE_OFFSET_Y);
    for (const lineY of shelfLines) {
      this.add.image(GAME_WIDTH / 2, lineY, "shelf");
    }
    const [shelf1 = 0, shelf2 = 0, shelf3 = 0] = shelfLines;

    createOutlinedTitle(this, GAME_WIDTH / 2, (shelf1 + shelf2) / 2, NOME_DO_JOGO, {
      size: TEXTO.titulo_g.size,
      angle: LOGO_ANGLE,
      wrapWidth: GAME_WIDTH - 2 * ESPACO.hudLateral,
    });

    const unsubscribe = matchStateManager.on("match:started", () => {
      unsubscribe();
      this.scene.start("GameScene");
    });
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, unsubscribe);

    createButton(this, GAME_WIDTH / 2, (shelf2 + shelf3) / 2, {
      label: "JOGAR",
      variant: "primario",
      size: "g",
      bolha: "a",
      baseAngle: PLAY_ANGLE,
      onActivate: () => matchStateManager.start(this.time.now),
    });
  }
}
