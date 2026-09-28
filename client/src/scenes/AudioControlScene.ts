import Phaser from "phaser";
import { GAME_HEIGHT, GAME_WIDTH } from "../config/gameConfig";
import { ESPACO, TAMANHO } from "../config/theme";
import { getMuted, setMuted } from "../systems/AudioPreferenceStore";
import { createIconButton, type IconButton } from "../ui/IconButton";
import { ICONE } from "./BootScene";

// specs/017-design-system-grotesco (contracts/screens.md § Controle de som): botão de ícone no canto
// inferior direito, a 20px da lateral e 16px da base — mesma região de antes, fora da faixa de
// clique da prateleira inferior e das zonas de nascimento das baratas.
const AUDIO_BUTTON_CENTER_X = GAME_WIDTH - ESPACO.hudLateral - TAMANHO.botaoIcone / 2;
const AUDIO_BUTTON_CENTER_Y = GAME_HEIGHT - ESPACO.e16 - TAMANHO.botaoIcone / 2;

/**
 * contracts/screens.md § Clique não vaza para a partida (FR-019): o botão vive noutra Scene, então a
 * GameScene usa esta função para ignorar um pointerdown que caia sobre ele — sem sfx-miss, sem
 * quebrar o combo e sem golpe da pata, seja qual for a propagação de input entre Scenes do Phaser.
 */
export function isOverAudioButton(x: number, y: number): boolean {
  return Math.hypot(x - AUDIO_BUTTON_CENTER_X, y - AUDIO_BUTTON_CENTER_Y) <= TAMANHO.botaoIcone / 2;
}

/**
 * specs/014-mute-som-jogo: Scene paralela sempre ativa (registrada por último em client/index.ts,
 * lançada explicitamente por BootScene.create()) para que o controle de mute renderize e receba
 * cliques por cima de todas as outras Scenes, incluindo a overlay de PauseOverlayScene.
 */
export class AudioControlScene extends Phaser.Scene {
  private muted = false;
  private button!: IconButton;

  constructor() {
    super("AudioControlScene");
  }

  create(): void {
    this.muted = getMuted();
    this.sound.mute = this.muted;

    this.button = createIconButton(this, AUDIO_BUTTON_CENTER_X, AUDIO_BUTTON_CENTER_Y, {
      iconKey: ICONE.som,
      a11yLabel: this.a11yLabel(),
      trigger: "down",
      onActivate: (event) => {
        event?.stopPropagation();
        this.toggleMuted();
      },
    });
    this.applyVisualState();
  }

  private toggleMuted(): void {
    this.muted = !this.muted;
    // this.sound.mute apenas silencia o output do SoundManager global — não pausa nem para as
    // instâncias em reprodução (research.md §1). Por isso, reativar (muted = false) restaura
    // automaticamente até o loop sfx-fly já em andamento, sem precisar recriá-lo.
    this.sound.mute = this.muted;
    setMuted(this.muted);
    this.applyVisualState();
  }

  /**
   * FR-016: o estado "sem som" tem dois sinais além da cor — o botão afundado (estado ativo) e a
   * barra diagonal sobre o ícone — e o rótulo acessível acompanha o estado.
   */
  private applyVisualState(): void {
    this.button.setAtivo(this.muted).setSlash(this.muted).setA11yLabel(this.a11yLabel());
  }

  private a11yLabel(): string {
    return this.muted ? "Som desligado" : "Som ligado";
  }
}
