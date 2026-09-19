import Phaser from "phaser";
import { GAME_HEIGHT, GAME_WIDTH, HIGH_SCORE_RANKING_MAX_ENTRIES, UI_SCALE } from "../config/gameConfig";
import { recordScore, type RankingEntry } from "../systems/HighScoreStore";
import { matchStateManager } from "../systems/MatchStateManager";

const NAME_MAX_LENGTH = 10;
const NAME_ALLOWED_CHAR = /^[a-zA-Z0-9 ]$/;

/**
 * FR-011/FR-012: tela final de derrota com opção de reiniciar sem recarregar a página.
 */
export class GameOverScene extends Phaser.Scene {
  private typedName = "";
  private nameDisplay!: Phaser.GameObjects.Text;
  private cursorVisible = true;
  private cursorTimer?: Phaser.Time.TimerEvent;

  constructor() {
    super("GameOverScene");
  }

  create(): void {
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x1b1b1b, 0.85);

    // specs/004-sistema-pontuacao (FR-010): pontuação final — único texto central pedido pelo dono
    // do produto (a mensagem de derrota e o tempo de sobrevivência foram removidos desta tela).
    const { score } = matchStateManager.getSnapshot();
    this.typedName = "";
    this.showNameEntry(score);
  }

  /**
   * specs/012-high-score-local (revisão): captura o nome do jogador dentro do próprio jogo — um
   * painel no estilo "insira suas iniciais" de arcade/fliper antigo, digitado via teclado direto no
   * canvas, em vez do `window.prompt()` nativo do navegador usado antes (destoava visualmente do
   * resto do jogo).
   */
  private showNameEntry(score: number): void {
    const panelWidth = Math.round(440 * UI_SCALE);
    const panelHeight = Math.round(200 * UI_SCALE);
    const panelX = GAME_WIDTH / 2;
    const panelY = GAME_HEIGHT / 2;

    const panel = this.add
      .rectangle(panelX, panelY, panelWidth, panelHeight, 0x0d0d0d, 0.95)
      .setStrokeStyle(3, 0xffd166);

    const title = this.add
      .text(panelX, panelY - panelHeight / 2 + 28, "NOVA PONTUAÇÃO!", {
        fontFamily: "monospace",
        fontSize: `${Math.round(18 * UI_SCALE)}px`,
        color: "#ffd166",
        fontStyle: "bold",
      })
      .setOrigin(0.5);

    const scoreLine = this.add
      .text(panelX, panelY - panelHeight / 2 + 58, `Pontuação: ${score}`, {
        fontFamily: "monospace",
        fontSize: `${Math.round(16 * UI_SCALE)}px`,
        color: "#ffffff",
      })
      .setOrigin(0.5);

    const instruction = this.add
      .text(panelX, panelY + panelHeight / 2 - 22, "Digite seu nome e pressione ENTER", {
        fontFamily: "monospace",
        fontSize: `${Math.round(13 * UI_SCALE)}px`,
        color: "#a0a0a0",
      })
      .setOrigin(0.5);

    this.nameDisplay = this.add
      .text(panelX, panelY + 8, this.renderNameLine(), {
        fontFamily: "monospace",
        fontSize: `${Math.round(24 * UI_SCALE)}px`,
        color: "#ffffff",
        backgroundColor: "#1b1b1b",
        padding: { x: 16, y: 8 },
      })
      .setOrigin(0.5);

    const elements: Phaser.GameObjects.GameObject[] = [
      panel,
      title,
      scoreLine,
      instruction,
      this.nameDisplay,
    ];

    this.cursorTimer = this.time.addEvent({
      delay: 500,
      loop: true,
      callback: () => {
        this.cursorVisible = !this.cursorVisible;
        this.nameDisplay.setText(this.renderNameLine());
      },
    });

    const handleKeydown = (event: KeyboardEvent): void => {
      if (event.key === "Enter") {
        const finalName = this.typedName.trim().length > 0 ? this.typedName.trim() : "Jogador";
        cleanup();
        this.showResults(score, finalName);
        return;
      }
      if (event.key === "Backspace") {
        this.typedName = this.typedName.slice(0, -1);
        this.nameDisplay.setText(this.renderNameLine());
        return;
      }
      if (NAME_ALLOWED_CHAR.test(event.key) && this.typedName.length < NAME_MAX_LENGTH) {
        this.typedName += event.key;
        this.nameDisplay.setText(this.renderNameLine());
      }
    };

    const cleanup = (): void => {
      this.input.keyboard?.off("keydown", handleKeydown);
      this.cursorTimer?.remove();
      elements.forEach((element) => element.destroy());
    };

    this.input.keyboard?.on("keydown", handleKeydown);
  }

  private renderNameLine(): string {
    return `${this.typedName}${this.cursorVisible ? "_" : " "}`;
  }

  private showResults(score: number, name: string): void {
    const { position, ranking } = recordScore(name, score);

    let cursorY = GAME_HEIGHT / 2 - Math.round(150 * UI_SCALE);

    const scoreText = this.add
      .text(GAME_WIDTH / 2, cursorY, `${score}`, {
        fontSize: `${Math.round(56 * UI_SCALE)}px`,
        color: "#ffffff",
        fontStyle: "bold",
      })
      .setOrigin(0.5, 0);
    cursorY += scoreText.height + Math.round(16 * UI_SCALE);

    if (position !== null) {
      const rankingText = position === 1 ? "Novo recorde!" : `Top 5 — ${position}º lugar!`;
      const rankingMessage = this.add
        .text(GAME_WIDTH / 2, cursorY, rankingText, {
          fontSize: `${Math.round(20 * UI_SCALE)}px`,
          color: "#ffd166",
          fontStyle: "bold",
        })
        .setOrigin(0.5, 0);
      cursorY += rankingMessage.height + Math.round(24 * UI_SCALE);
    } else {
      cursorY += Math.round(24 * UI_SCALE);
    }

    cursorY = this.renderRankingCard(ranking, cursorY) + Math.round(30 * UI_SCALE);

    const button = this.add
      .text(GAME_WIDTH / 2, cursorY, "Reiniciar", {
        fontSize: `${Math.round(28 * UI_SCALE)}px`,
        color: "#ffffff",
        backgroundColor: "#e76f51",
        padding: { x: Math.round(24 * UI_SCALE), y: Math.round(12 * UI_SCALE) },
      })
      .setOrigin(0.5, 0)
      .setInteractive({ useHandCursor: true });

    const unsubscribe = matchStateManager.on("match:started", () => {
      unsubscribe();
      this.scene.start("GameScene");
    });

    button.on("pointerdown", () => {
      matchStateManager.restart(this.time.now);
    });
  }

  /**
   * specs/012-high-score-local (revisão): card de ranking no estilo das telas de "high scores" de
   * fliper/arcade — fundo escuro, borda dourada, fonte monoespaçada, sempre com
   * `HIGH_SCORE_RANKING_MAX_ENTRIES` linhas (slots vazios exibem "---"). Centralizado na tela como
   * um bloco (não mais colado à direita) — as linhas dentro do bloco são alinhadas à esquerda entre
   * si (um único `Text` multi-linha com `align: "left"`) em vez de cada uma centralizada
   * individualmente, o que ficava com uma aparência desalinhada por causa dos nomes/pontuações de
   * tamanhos diferentes. Recebe o topo disponível (`topY`) e devolve o Y logo abaixo do card, para
   * o chamador posicionar o próximo elemento.
   */
  private renderRankingCard(ranking: readonly RankingEntry[], topY: number): number {
    const paddingX = Math.round(20 * UI_SCALE);
    const paddingY = Math.round(14 * UI_SCALE);
    const titleGap = Math.round(10 * UI_SCALE);

    const lines: string[] = [];
    for (let i = 0; i < HIGH_SCORE_RANKING_MAX_ENTRIES; i++) {
      const entry = ranking[i];
      lines.push(entry ? `${i + 1}. ${entry.name.toUpperCase()} — ${entry.score}` : `${i + 1}. ---`);
    }

    const title = this.add
      .text(GAME_WIDTH / 2, topY + paddingY, "TOP 5 SCORES", {
        fontFamily: "monospace",
        fontSize: `${Math.round(15 * UI_SCALE)}px`,
        color: "#ffd166",
        fontStyle: "bold",
      })
      .setOrigin(0.5, 0);

    const body = this.add
      .text(GAME_WIDTH / 2, topY + paddingY + title.height + titleGap, lines.join("\n"), {
        fontFamily: "monospace",
        fontSize: `${Math.round(13 * UI_SCALE)}px`,
        color: "#ffffff",
        align: "left",
        lineSpacing: Math.round(8 * UI_SCALE),
      })
      .setOrigin(0.5, 0);

    const cardWidth = Math.max(title.width, body.width) + paddingX * 2;
    const cardHeight = paddingY * 2 + title.height + titleGap + body.height;
    const cardCenterY = topY + cardHeight / 2;

    this.add
      .rectangle(GAME_WIDTH / 2, cardCenterY, cardWidth, cardHeight, 0x0d0d0d, 0.9)
      .setStrokeStyle(3, 0xffd166)
      .setDepth(-1);

    return topY + cardHeight;
  }
}
