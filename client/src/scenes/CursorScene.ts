import Phaser from "phaser";
import {
  CURSOR_PAW_HEIGHT_PX,
  CURSOR_STRIKE_DURATION_MS,
  GAME_HEIGHT,
  GAME_WIDTH,
} from "../config/gameConfig";
import { MOVIMENTO } from "../config/theme";

type CursorAnimationState = "idle" | "strike";

// specs/015-cursor-pata-animada (revisado a pedido do usuário, 2026-09-26): a pata não tem mais um
// balanço automático contínuo — ela fica parada e só inclina levemente na direção real do
// movimento do ponteiro, voltando a 0° assim que ele para.
// specs/017-design-system-grotesco (FR-007): valores de MOVIMENTO.pata (fonte única), iguais aos de antes.
const LEAN_MAX_DEG = MOVIMENTO.pata.inclinacaoMaxDeg;
const LEAN_FACTOR = MOVIMENTO.pata.fatorInclinacao;
const LEAN_SMOOTHING = MOVIMENTO.pata.suavizacao; // fração da distância até o ângulo-alvo percorrida por frame
const MOVEMENT_DEADZONE_PX = 0.5;
// orientação de repouso da arte (garras para cima) em graus "matemáticos" (0° = direita, sentido
// anti-horário) — usada para que mover na direção que a pata já "encara" (para cima) não incline
// nada, e mover para os lados/para baixo incline proporcionalmente à distância angular disso.
const NEUTRAL_FACING_DEG = -90;

/** Normaliza um ângulo em graus para o intervalo (-180, 180]. */
function normalizeAngleDeg(angle: number): number {
  let a = angle % 360;
  if (a > 180) a -= 360;
  if (a <= -180) a += 360;
  return a;
}

/**
 * specs/015-cursor-pata-animada: Scene paralela sempre ativa (registrada por último em
 * client/index.ts, lançada explicitamente por BootScene.create()) para que o cursor customizado
 * (pata do gato) renderize e receba pointermove/cursor:strike por cima de todas as outras Scenes.
 */
export class CursorScene extends Phaser.Scene {
  private paw?: Phaser.GameObjects.Image;
  private pointerX = GAME_WIDTH / 2;
  private pointerY = GAME_HEIGHT / 2;
  private lastFrameX = this.pointerX;
  private lastFrameY = this.pointerY;
  private strikeTween?: Phaser.Tweens.Tween;
  private animationState: CursorAnimationState = "idle";
  private strikeStartedAt = 0;
  private baseScale = 1;

  constructor() {
    super("CursorScene");
  }

  create(): void {
    // FR-008: se o asset falhou ao carregar (BootScene), não cria nada — o cursor nativo do
    // sistema permanece visível (a classe CSS cursor-paw-ready também nunca foi aplicada).
    if (!this.textures.exists("cursor-paw")) {
      return;
    }

    this.paw = this.add.image(this.pointerX, this.pointerY, "cursor-paw").setOrigin(0.5);
    const { height } = this.textures.get("cursor-paw").getSourceImage();
    this.baseScale = CURSOR_PAW_HEIGHT_PX / height;
    this.paw.setScale(this.baseScale);

    this.input.on("pointermove", (pointer: Phaser.Input.Pointer) => {
      this.pointerX = pointer.x;
      this.pointerY = pointer.y;
    });

    // specs/015-cursor-pata-animada (contracts/cursor-scene.md, research.md §3): this.game.events
    // é o EventEmitter global do Phaser, compartilhado por todas as Scenes — GameScene emite este
    // evento só depois do hit-test já ter concluído (FR-005).
    this.game.events.on("cursor:strike", () => this.onStrike());
  }

  override update(): void {
    if (!this.paw) {
      return;
    }
    this.paw.setPosition(this.pointerX, this.pointerY);

    if (
      this.animationState === "strike" &&
      this.time.now - this.strikeStartedAt >= CURSOR_STRIKE_DURATION_MS
    ) {
      this.animationState = "idle";
    }

    if (this.animationState !== "strike") {
      this.updateDirectionalLean();
    }

    this.lastFrameX = this.pointerX;
    this.lastFrameY = this.pointerY;
  }

  /** FR-003: parada quando o ponteiro não se move; leve inclinação na direção real do movimento. */
  private updateDirectionalLean(): void {
    const dx = this.pointerX - this.lastFrameX;
    const dy = this.pointerY - this.lastFrameY;
    let targetAngle = 0;
    if (Math.hypot(dx, dy) > MOVEMENT_DEADZONE_PX) {
      const directionDeg = (Math.atan2(dy, dx) * 180) / Math.PI;
      const deltaFromNeutral = normalizeAngleDeg(directionDeg - NEUTRAL_FACING_DEG);
      targetAngle = Math.max(-LEAN_MAX_DEG, Math.min(LEAN_MAX_DEG, deltaFromNeutral * LEAN_FACTOR));
    }
    this.paw!.angle += (targetAngle - this.paw!.angle) * LEAN_SMOOTHING;
  }

  /** FR-004/FR-006/FR-007: idêntica em acerto ou erro; reinicia imediatamente em cliques rápidos. */
  private onStrike(): void {
    if (!this.paw) {
      return;
    }
    this.animationState = "strike";
    this.strikeStartedAt = this.time.now;

    this.strikeTween?.stop();
    // reinicia a partir de um estado neutro conhecido (ângulo 0, escala base) — se um golpe
    // anterior ainda estava a meio de um yoyo, a escala/ângulo em `this.paw` podem estar em
    // qualquer ponto intermediário; ler `this.baseScale` (não `this.paw.scale`) evita crescimento
    // composto a cada reinício (FR-006).
    this.paw.setAngle(0).setScale(this.baseScale);
    this.strikeTween = this.tweens.add({
      targets: this.paw,
      angle: MOVIMENTO.pata.golpeAnguloDeg,
      scale: this.baseScale * MOVIMENTO.pata.golpeEscala,
      duration: CURSOR_STRIKE_DURATION_MS / 2,
      yoyo: true,
      ease: "Quad.easeOut",
    });
  }
}
