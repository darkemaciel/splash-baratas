import Phaser from "phaser";
import { GAME_HEIGHT, GAME_WIDTH } from "../config/gameConfig";
import { getMuted, setMuted } from "../systems/AudioPreferenceStore";

const AUDIO_BUTTON_MARGIN = 12;
const AUDIO_BUTTON_FONT_SIZE_PX = 14;

const AUDIO_BUTTON_LABEL_ON = "🔊 Som";
const AUDIO_BUTTON_LABEL_MUTED = "🔇 Mudo";

/**
 * specs/014-mute-som-jogo: Scene paralela sempre ativa (registrada por último em client/index.ts,
 * lançada explicitamente por BootScene.create()) para que o controle de mute renderize e receba
 * cliques por cima de todas as outras Scenes, incluindo a overlay de PauseOverlayScene.
 *
 * Posição (canto inferior direito) escolhida deliberadamente fora da faixa vertical de qualquer
 * prateleira (SHELF_Y_POSITIONS ± ROACH_VISUAL_RADIUS + HITBOX_PADDING_PX) e das zonas de spawn de
 * borda, para não criar uma "zona morta" de clique sobre uma barata em trânsito (Princípio V,
 * contracts/audio-preference-store.md § "Garantias").
 */
export class AudioControlScene extends Phaser.Scene {
  private muted = false;
  private button!: Phaser.GameObjects.Text;

  constructor() {
    super("AudioControlScene");
  }

  create(): void {
    this.muted = getMuted();
    this.sound.mute = this.muted;

    this.button = this.add
      .text(GAME_WIDTH - AUDIO_BUTTON_MARGIN, GAME_HEIGHT - AUDIO_BUTTON_MARGIN, this.label(), {
        fontSize: `${AUDIO_BUTTON_FONT_SIZE_PX}px`,
        color: "#ffffff",
        backgroundColor: "#333333",
        padding: { x: 10, y: 6 },
      })
      .setOrigin(1, 1)
      .setInteractive({ useHandCursor: true });

    this.button.on("pointerdown", () => this.toggleMuted());
  }

  private toggleMuted(): void {
    this.muted = !this.muted;
    // this.sound.mute apenas silencia o output do SoundManager global — não pausa nem para as
    // instâncias em reprodução (research.md §1). Por isso, reativar (muted = false) restaura
    // automaticamente até o loop sfx-fly já em andamento, sem precisar recriá-lo.
    this.sound.mute = this.muted;
    setMuted(this.muted);
    this.button.setText(this.label());
  }

  private label(): string {
    return this.muted ? AUDIO_BUTTON_LABEL_MUTED : AUDIO_BUTTON_LABEL_ON;
  }
}
