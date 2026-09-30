import Phaser from "phaser";
import {
  CURSOR_PAW_HEIGHT_PX,
  foodItemPosition,
  GAME_HEIGHT,
  GAME_WIDTH,
  HITBOX_PADDING_PX,
  ROACH_VISUAL_RADIUS,
  SHELF_Y_POSITIONS,
  type Point,
} from "../config/gameConfig";
import { COR, ESPACO, MOVIMENTO, TAMANHO } from "../config/theme";
import { elapsedMs, shelfIndexFromId } from "../entities/Match";
import { positionAt, progress, type Roach } from "../entities/Roach";
import type { FoodItem } from "../entities/FoodItem";
import { ICONE, ROACH_FLY_ANIM, ROACH_WALK_ANIM } from "./BootScene";
import { isOverAudioButton } from "./AudioControlScene";
import { pickTopmostHit, type RoachHitTestInput } from "../systems/CollisionSystem";
import { matchStateManager, type MatchSnapshot } from "../systems/MatchStateManager";
import { createFloatingScore, type PawGeometry } from "../ui/FloatingScore";
import { rotatedBounds } from "../ui/floatingScoreLayout";
import { formatClock, formatThousands } from "../ui/format";
import { createIconButton, type IconButton } from "../ui/IconButton";
import { createPill, type Pill } from "../ui/Pill";
import { createRiskBar, type RiskBar } from "../ui/RiskBar";

// specs/017-design-system-grotesco (contracts/screens.md § HUD da partida): pílulas e botão de
// ícone do design system numa faixa do topo — pontos à esquerda, tempo no centro, comidas + barra
// de risco + Pausar à direita (Pausar no canto). Na base retrato, comidas + barra descem para uma
// segunda linha. A faixa termina bem acima da faixa de clique da prateleira superior.
const HUD_RISK_BAR_WIDTH = 160;
// Profundidades (contracts/ui-kit.md § Profundidade): o HUD fica abaixo das baratas, para que uma
// barata passando pela faixa do topo continue visível por cima das pílulas.
const UI_DEPTH_HUD = 10;
const ROACH_DEPTH = 20;

// specs/008-juice-animacao-barata (squash/stretch + tremor escalados por `progress`) e
// specs/016-animacao-locomocao-barata (balanço de amplitude constante desde o spawn): os valores
// vêm de MOVIMENTO (config/theme.ts), fonte única desde specs/017 (FR-007) — mesmos números de
// antes. O tremor máximo (4px) fica abaixo de HITBOX_PADDING_PX (6px), para nunca degradar a mira.
const { agitacao: AGITACAO, barataAndando: ANDANDO, barataVoando: VOANDO } = MOVIMENTO;
// Spritesheets desenhados em 2x (128px, corpo ~80px) — 0.5 deixa o corpo com ~40px, o mesmo
// diâmetro da antiga bolinha (ROACH_VISUAL_RADIUS * 2).
const ROACH_SPRITE_SCALE = 0.5;
// Direção para onde a barata "olha" nos quadros de origem (direita, cabeça ~25° para cima).
const ROACH_SPRITE_FORWARD_DEG = -25;

/**
 * Única scene que lê `MatchStateManager.getSnapshot()`/chama `tick()` a cada frame e traduz o
 * estado de domínio em sprites — nenhuma regra de jogo vive aqui (Princípios I e II).
 */
export class GameScene extends Phaser.Scene {
  private foodSprites = new Map<string, Phaser.GameObjects.Image>();
  private roachSprites = new Map<string, Phaser.GameObjects.Sprite>();
  /** specs/016-animacao-locomocao-barata (data-model.md): sorteado uma vez por barata, nunca re-sorteado. */
  private roachLocomotionStyles = new Map<string, "andando" | "voando">();
  private unsubscribers: Array<() => void> = [];
  /** specs/017: pílulas do HUD, barra de risco e botão de pausa (contracts/screens.md). */
  private scorePill!: Pill;
  private timerPill!: Pill;
  private foodPill!: Pill;
  private riskBar!: RiskBar;
  private pauseButton!: IconButton;
  /**
   * specs/019-pontuacao-flutuante (research §2): ponto do clique que está sendo processado — gravado
   * em handlePointerDown logo antes de tryEliminateRoach; como `emit` é síncrono, o handler de
   * "roach:eliminated" lê este ponto na mesma chamada para posicionar o "+N!" acima da pata.
   */
  private lastHitPoint = { x: 0, y: 0 };
  /** specs/019: meia-caixa da pata durante o tapa (escala + giro), calculada uma vez em create(). */
  private pawGeometry: PawGeometry = { halfWidth: 0, halfHeight: 0 };
  /** specs/007-tempo-de-sobrevivencia (research.md §7): último segundo inteiro renderizado — evita redesenhar o texto a cada frame quando o valor visível não muda. */
  private lastRenderedElapsedSeconds = 0;
  /** specs/003-feedback-sonoro-sfx: estado do loop ambiente de voo (data-model.md § "Som ambiente"). */
  private isFlyLoopActive = false;
  /**
   * specs/009-pausar-partida: soma total de milissegundos já gastos pausado nesta partida —
   * `this.time.now` (Clock do Phaser) congela durante a pausa mas SALTA para o tempo real atual
   * assim que a Scene retoma (não existe desconto automático do intervalo pausado), então todo
   * consumo de tempo pelo domínio usa `logicalNow()` em vez de `this.time.now` diretamente.
   */
  private pausedAccumMs = 0;
  /** Wall clock (`performance.now()`) no instante em que a pausa atual começou; `null` se não pausado. */
  private pauseStartedAtWallClock: number | null = null;

  constructor() {
    super("GameScene");
  }

  create(): void {
    // specs/003-feedback-sonoro-sfx (research.md §4): guarda defensiva — o SoundManager é
    // global ao Game, não por-Scene, então um loop de uma partida anterior sobreviveria ao
    // restart se não for parado explicitamente aqui.
    this.sound.stopByKey("sfx-fly");
    this.isFlyLoopActive = false;

    // specs/009-pausar-partida (research.md §5): guarda defensiva — o Scene Manager é global ao
    // Game, então uma PauseOverlayScene deixada "pendurada" de uma sessão anterior sobreviveria a
    // um restart se não for parada explicitamente aqui. No-op seguro se não estiver rodando.
    this.scene.stop("PauseOverlayScene");
    this.pausedAccumMs = 0;
    this.pauseStartedAtWallClock = null;

    this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, "fridgeBg");
    for (const shelfY of SHELF_Y_POSITIONS) {
      this.add.image(GAME_WIDTH / 2, shelfY + 40, "shelf");
    }

    this.foodSprites.clear();
    this.roachSprites.clear();

    const snapshot = matchStateManager.getSnapshot();
    for (const foodItem of snapshot.foodItems) {
      this.createFoodSprite(foodItem);
    }

    this.layoutHud(snapshot);
    this.pawGeometry = this.computePawGeometry();

    // specs/009-pausar-partida: atalho de teclado, conveniência extra além do botão (Princípio
    // III — o botão já satisfaz a interação essencial via Pointer Events, o teclado é aditivo).
    this.input.keyboard?.on("keydown-P", () => this.triggerPause());

    // specs/009-pausar-partida (research.md corrigido): `this.time.now` congela durante a pausa
    // mas salta para o tempo real ao retomar (Phaser não desconta o intervalo pausado sozinho) —
    // acumular esse salto aqui é o que permite `logicalNow()` compensar em todo o resto do código.
    this.events.on(Phaser.Scenes.Events.PAUSE, () => {
      this.pauseStartedAtWallClock = performance.now();
    });
    this.events.on(Phaser.Scenes.Events.RESUME, () => {
      if (this.pauseStartedAtWallClock !== null) {
        this.pausedAccumMs += performance.now() - this.pauseStartedAtWallClock;
        this.pauseStartedAtWallClock = null;
      }
      // specs/017 (contracts/screens.md § HUD): sai do estado ativo e volta ao repouso — o
      // pointerout se perde enquanto o input da Scene está desligado, então o hover não fica preso.
      // Cobre tanto o botão CONTINUAR quanto a tecla P.
      this.pauseButton.setAtivo(false).resetVisualState();
    });

    this.unsubscribers = [
      matchStateManager.on("roach:eliminated", ({ roachId, points }) => this.playRoachEliminated(roachId, points)),
      matchStateManager.on("roach:eliminated", () => this.updateScore(matchStateManager.getSnapshot())),
      matchStateManager.on("food:stolen", ({ foodItemId }) => this.playFoodStolen(foodItemId)),
      matchStateManager.on("food:stolen", () => this.updateHud(matchStateManager.getSnapshot())),
      matchStateManager.on("match:lost", () => {
        // specs/003 (research.md §4): parar o loop ambiente antes de trocar de scene — o
        // SoundManager é global ao Game e não para sozinho na troca de Scene.
        this.sound.stopByKey("sfx-fly");
        this.isFlyLoopActive = false;
        this.scene.start("GameOverScene");
      }),
    ];

    this.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => this.handlePointerDown(pointer));

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      for (const unsubscribe of this.unsubscribers) {
        unsubscribe();
      }
    });
  }

  override update(_time: number, _delta: number): void {
    matchStateManager.tick(this.logicalNow());
    const snapshot = matchStateManager.getSnapshot();
    this.syncRoachSprites(snapshot);
    this.syncFlyLoop(snapshot);
    this.updateTimer(snapshot);
  }

  /**
   * specs/009-pausar-partida: `this.time.now` (Clock do Phaser) para de avançar enquanto a Scene
   * está pausada, mas ao retomar salta direto para o tempo real atual — sem descontar o intervalo
   * pausado sozinho. `logicalNow()` é o "relógio" corrigido que todo consumidor de domínio
   * (`tick`, `positionAt`, `elapsedMs`, o juice de specs/008) deve usar em vez de `this.time.now`
   * diretamente, para que o tempo pausado nunca seja contabilizado (FR-003 a FR-009, FR-013).
   */
  private logicalNow(): number {
    return this.time.now - this.pausedAccumMs;
  }

  /** specs/009-pausar-partida (contracts/pause-lifecycle.md § "Gatilhos e transições"). */
  private triggerPause(): void {
    // specs/018 (FR-013/FR-014): o proxy de teclado do botão Pausar continua focável com a partida
    // pausada — um Enter nele não pode relançar a overlay sobre a que já está aberta.
    if (this.scene.isPaused()) {
      return;
    }
    // specs/017: o botão aparece no estado ativo enquanto a partida está pausada (FR-015). A Scene
    // pausada continua sendo desenhada, só o update e o input param.
    this.pauseButton.setAtivo(true);
    this.sound.pauseAll();
    this.scene.pause();
    // specs/018-navegacao-pausa-fim (research §2): o relógio lógico no instante da pausa vai junto,
    // para que ENCERRAR PARTIDA congele o tempo exatamente onde o HUD estava.
    this.scene.launch("PauseOverlayScene", { pausedAtLogicalMs: this.logicalNow() });
  }

  /**
   * specs/007-tempo-de-sobrevivencia (research.md §7): recalcula o tempo decorrido a cada frame,
   * mas só redesenha o texto quando o segundo inteiro exibido muda (throttle de redraw, não de
   * cálculo — Princípio V).
   */
  private updateTimer(snapshot: MatchSnapshot): void {
    const elapsed = elapsedMs(snapshot, this.logicalNow());
    const seconds = Math.floor(elapsed / 1000);
    if (seconds !== this.lastRenderedElapsedSeconds) {
      this.timerPill.setText(formatClock(elapsed));
      this.fitTimerPill();
      this.lastRenderedElapsedSeconds = seconds;
    }
  }

  /**
   * specs/003-feedback-sonoro-sfx (FR-005/FR-006/FR-007): liga/desliga o loop ambiente de voo
   * apenas nas transições de borda (0 ↔ >0 baratas ativas), nunca a cada frame.
   */
  private syncFlyLoop(snapshot: MatchSnapshot): void {
    const hasActiveRoaches = snapshot.activeRoaches.length > 0;
    if (hasActiveRoaches && !this.isFlyLoopActive) {
      this.sound.play("sfx-fly", { loop: true });
      this.isFlyLoopActive = true;
    } else if (!hasActiveRoaches && this.isFlyLoopActive) {
      this.sound.stopByKey("sfx-fly");
      this.isFlyLoopActive = false;
    }
  }

  /**
   * specs/017-design-system-grotesco (contracts/screens.md § HUD da partida): cria as pílulas, a
   * barra de risco e o botão Pausar. L = 20 (lateral), T = 16 (topo), G = 12 (entre itens),
   * B = 52 (botão de ícone, altura da linha).
   */
  private layoutHud(snapshot: MatchSnapshot): void {
    const L = ESPACO.hudLateral;
    const T = ESPACO.e16;
    const G = ESPACO.e12;
    const B = TAMANHO.botaoIcone;
    const isLandscape = GAME_WIDTH >= GAME_HEIGHT;
    const row1Y = T + B / 2;
    const row2Y = T + B + G + B / 2;

    this.scorePill = createPill(this, L, row1Y, {
      text: "PONTOS 0",
      textColor: COR.vermelho,
      fill: "branco",
      origin: 0,
    }).setDepth(UI_DEPTH_HUD);

    this.timerPill = createPill(this, GAME_WIDTH / 2, row1Y, {
      text: formatClock(elapsedMs(snapshot, this.logicalNow())),
      textColor: COR.traco,
      fill: "creme",
      iconKey: ICONE.tempo,
      origin: 0.5,
    }).setDepth(UI_DEPTH_HUD);
    this.lastRenderedElapsedSeconds = 0;

    this.pauseButton = createIconButton(this, GAME_WIDTH - L - B / 2, row1Y, {
      iconKey: ICONE.pausar,
      a11yLabel: "Pausar",
      trigger: "down",
      onActivate: (event) => {
        // specs/009-pausar-partida (research.md §3, contracts/pause-lifecycle.md § "Garantia de
        // não-interferência no domínio"): stopPropagation impede que este mesmo clique também
        // dispare handlePointerDown (que trataria como clique perdido, tocaria sfx-miss e quebraria
        // o combo) — enquanto GameScene está pausada, o próprio Scene Manager do Phaser desativa o
        // Input Plugin desta Scene, então nenhum pointerdown chega a handlePointerDown até retomar.
        event?.stopPropagation();
        this.triggerPause();
      },
    }).setDepth(UI_DEPTH_HUD);

    // Comidas + barra: à esquerda de Pausar na paisagem; segunda linha, alinhadas à direita, no retrato.
    const groupRight = isLandscape ? GAME_WIDTH - L - B - G : GAME_WIDTH - L;
    const groupY = isLandscape ? row1Y : row2Y;
    this.riskBar = createRiskBar(this, groupRight, groupY, { width: HUD_RISK_BAR_WIDTH, origin: 1 }).setDepth(
      UI_DEPTH_HUD,
    );
    this.foodPill = createPill(this, groupRight - HUD_RISK_BAR_WIDTH - G, groupY, {
      text: "0 / 0",
      textColor: COR.traco,
      fill: "branco",
      iconKey: ICONE.coracao,
      origin: 1,
    }).setDepth(UI_DEPTH_HUD);

    this.updateHud(snapshot);
    this.updateScore(snapshot);
  }

  /**
   * contracts/screens.md § Invariante de largura: o tempo fica no centro da tela, mas nunca encosta
   * na pílula de pontos (esquerda) nem no próximo item à direita na mesma linha (comidas na
   * paisagem, Pausar no retrato) — desliza o necessário para caber, sem sobrepor.
   */
  private fitTimerPill(): void {
    const G = ESPACO.e12;
    const isLandscape = GAME_WIDTH >= GAME_HEIGHT;
    const half = this.timerPill.width / 2;
    const minX = ESPACO.hudLateral + this.scorePill.width + G + half;
    const rightNeighborLeft = isLandscape
      ? this.foodPill.root.x - this.foodPill.width / 2
      : GAME_WIDTH - ESPACO.hudLateral - TAMANHO.botaoIcone;
    const maxX = rightNeighborLeft - G - half;
    this.timerPill.setAnchorX(Math.min(Math.max(GAME_WIDTH / 2, minX), maxX));
  }

  /**
   * FR-001/FR-003 (HUD) + specs/017 (FR-013/FR-014): comidas restantes "N / total" e barra de risco
   * horizontal — redesenhadas a cada roubo, não a cada frame (Princípio V).
   */
  private updateHud(snapshot: MatchSnapshot): void {
    this.foodPill.setText(`${snapshot.foodRemainingCount} / ${snapshot.foodTotalCount}`);
    const ratio = snapshot.foodTotalCount === 0 ? 0 : snapshot.foodRemainingCount / snapshot.foodTotalCount;
    this.riskBar.update(ratio, snapshot.riskLevel);
  }

  /** specs/004-sistema-pontuacao (FR-009): pontuação atualizada por evento, não por frame. */
  private updateScore(snapshot: MatchSnapshot): void {
    this.scorePill.setText(`PONTOS ${formatThousands(snapshot.score)}`);
    this.fitTimerPill();
  }

  private createFoodSprite(foodItem: FoodItem): void {
    const shelfIndex = shelfIndexFromId(foodItem.shelfId);
    const { x, y } = foodItemPosition(shelfIndex, foodItem.slotIndex);
    const sprite = this.add.image(x, y, "food");
    this.foodSprites.set(foodItem.id, sprite);
  }

  private foodPositionOf(snapshot: MatchSnapshot, foodItemId: string): Point | undefined {
    const foodItem = snapshot.foodItems.find((item) => item.id === foodItemId);
    if (!foodItem) {
      return undefined;
    }
    return foodItemPosition(shelfIndexFromId(foodItem.shelfId), foodItem.slotIndex);
  }

  /**
   * specs/008-juice-animacao-barata (research.md §5): fase determinística derivada de `roach.id`,
   * usada para dessincronizar squash/stretch e tremor entre baratas diferentes — nenhum estado
   * novo é guardado (Princípio II), a fase é recalculada a cada chamada a partir do próprio id.
   */
  private roachPhase(roachId: string): number {
    let sum = 0;
    for (let i = 0; i < roachId.length; i += 1) {
      sum += roachId.codePointAt(i) ?? 0;
    }
    return (sum % 1000) * ((2 * Math.PI) / 1000);
  }

  /**
   * specs/008-juice-animacao-barata (research.md §3): deformação de escala puramente visual —
   * amplitude cresce linearmente com `progress` (zero no spawn), frequência fixa.
   */
  private computeRoachSquashStretch(roach: Roach, now: number): { scaleX: number; scaleY: number } {
    const wobble = Math.sin(
      (now / 1000) * AGITACAO.squashHz * 2 * Math.PI + this.roachPhase(roach.id),
    );
    const delta = AGITACAO.squashMax * progress(roach, now) * wobble;
    return { scaleX: 1 + delta, scaleY: 1 - delta };
  }

  /**
   * specs/008-juice-animacao-barata (research.md §4): deslocamento visual somado por cima da
   * posição real (`positionAt`) — amplitude e frequência crescem com `progress`, nunca lido de
   * volta pelo hit-testing (FR-004, `handlePointerDown`).
   */
  private computeRoachTremorOffset(roach: Roach, now: number): { dx: number; dy: number } {
    const roachProgress = progress(roach, now);
    const frequency =
      AGITACAO.tremorHzMin + roachProgress * (AGITACAO.tremorHzMax - AGITACAO.tremorHzMin);
    const amplitude = AGITACAO.tremorMaxPx * roachProgress;
    const phase = this.roachPhase(roach.id);
    const dx = amplitude * Math.sin((now / 1000) * frequency * 2 * Math.PI + phase);
    const dy = amplitude * Math.cos((now / 1000) * frequency * 1.3 * 2 * Math.PI + phase);
    return { dx, dy };
  }

  /**
   * specs/016-animacao-locomocao-barata (research.md §3/§4, contracts/roach-locomotion.md):
   * rotação procedural com amplitude CONSTANTE (não escalada por `progress`) — a locomoção já
   * está em execução desde o primeiro frame (FR-001), ao contrário do "juice" acima. Canal
   * (`angle`) isolado de `scale`/posição, nunca lido de volta pelo hit-testing (FR-005).
   */
  private computeRoachLocomotionAngle(
    roach: Roach,
    now: number,
    estilo: "andando" | "voando",
  ): number {
    const maxDeg = estilo === "andando" ? ANDANDO.balancoDeg : VOANDO.balancoDeg;
    const frequency =
      estilo === "andando" ? ANDANDO.balancoHz : VOANDO.balancoHz;
    const phase = this.roachPhase(roach.id);
    return maxDeg * Math.sin((now / 1000) * frequency * 2 * Math.PI + phase);
  }

  /**
   * Orienta a barata na direção do trajeto (spawnPoint → alvo, fixo desde o spawn). Espelha no
   * eixo X quando ela segue para a esquerda, para nunca ficar de cabeça para baixo.
   */
  private applyRoachHeading(sprite: Phaser.GameObjects.Sprite, roach: Roach, target: Point): void {
    const headingDeg = Phaser.Math.RadToDeg(
      Math.atan2(target.y - roach.spawnPoint.y, target.x - roach.spawnPoint.x),
    );
    const movingLeft = Math.abs(headingDeg) > 90;
    sprite.setFlipX(movingLeft);
    const forwardDeg = movingLeft ? 180 - ROACH_SPRITE_FORWARD_DEG : ROACH_SPRITE_FORWARD_DEG;
    sprite.setAngle(headingDeg - forwardDeg);
  }

  private syncRoachSprites(snapshot: MatchSnapshot): void {
    const activeIds = new Set(snapshot.activeRoaches.map((roach) => roach.id));

    for (const [id, sprite] of this.roachSprites) {
      if (!activeIds.has(id)) {
        sprite.destroy();
        this.roachSprites.delete(id);
        this.roachLocomotionStyles.delete(id);
      }
    }

    for (const roach of snapshot.activeRoaches) {
      const targetPosition = this.foodPositionOf(snapshot, roach.targetFoodItemId);
      if (!targetPosition) {
        continue;
      }
      const now = this.logicalNow();
      const position = positionAt(roach, now, targetPosition);
      const squash = this.computeRoachSquashStretch(roach, now);
      const tremor = this.computeRoachTremorOffset(roach, now);
      let sprite = this.roachSprites.get(roach.id);
      if (!sprite) {
        // specs/016-animacao-locomocao-barata (contracts/roach-locomotion.md § "Estilo de
        // locomoção: sorteio e estabilidade"): sorteado uma única vez, no momento da criação do
        // sprite — nunca re-sorteado depois.
        const estiloSorteado = Math.random() < 0.5 ? "andando" : "voando";
        const animKey = estiloSorteado === "andando" ? ROACH_WALK_ANIM : ROACH_FLY_ANIM;
        sprite = this.add.sprite(position.x + tremor.dx, position.y + tremor.dy, animKey).setDepth(ROACH_DEPTH);
        // Quadro inicial aleatório para que baratas simultâneas não se movam em sincronia.
        const frameCount = this.anims.get(animKey)?.getTotalFrames() ?? 1;
        sprite.play({ key: animKey, startFrame: Phaser.Math.Between(0, frameCount - 1) });
        this.roachSprites.set(roach.id, sprite);
        this.roachLocomotionStyles.set(roach.id, estiloSorteado);
      } else {
        sprite.setPosition(position.x + tremor.dx, position.y + tremor.dy);
      }
      sprite.setScale(squash.scaleX * ROACH_SPRITE_SCALE, squash.scaleY * ROACH_SPRITE_SCALE);
      const estilo = this.roachLocomotionStyles.get(roach.id) ?? "voando";
      this.applyRoachHeading(sprite, roach, targetPosition);
      sprite.angle += this.computeRoachLocomotionAngle(roach, now, estilo);
    }
  }

  private handlePointerDown(pointer: Phaser.Input.Pointer): void {
    // specs/017 (contracts/screens.md § Clique não vaza para a partida, FR-019): o botão de som vive
    // em outra Scene — um clique nele nunca conta como clique perdido nem dispara o golpe da pata.
    if (isOverAudioButton(pointer.x, pointer.y)) {
      return;
    }
    const now = this.logicalNow();
    const snapshot = matchStateManager.getSnapshot();
    const candidates: RoachHitTestInput[] = [];

    for (const roach of snapshot.activeRoaches) {
      const targetPosition = this.foodPositionOf(snapshot, roach.targetFoodItemId);
      if (!targetPosition) {
        continue;
      }
      // specs/008-juice-animacao-barata (contracts/roach-juice-effect.md § "Garantia de
      // não-interferência no hit-testing"): hit-test usa exclusivamente `positionAt()`, nunca
      // `sprite.x`/`sprite.y`/`sprite.scaleX`/`sprite.scaleY` do sprite renderizado por
      // `syncRoachSprites()` — o squash/stretch/tremor nunca deve ser lido aqui.
      candidates.push({
        roach,
        position: positionAt(roach, now, targetPosition),
        visualRadius: ROACH_VISUAL_RADIUS,
      });
    }

    const hit = pickTopmostHit({ x: pointer.x, y: pointer.y }, candidates, HITBOX_PADDING_PX);
    if (hit) {
      this.lastHitPoint = { x: pointer.x, y: pointer.y };
      matchStateManager.tryEliminateRoach(hit.id, now);
    } else {
      matchStateManager.registerMissedClick(); // specs/004-sistema-pontuacao (FR-008b)
      this.sound.play("sfx-miss");
    }

    // specs/015-cursor-pata-animada (contracts/cursor-scene.md, research.md §3, FR-004/FR-005/
    // FR-007/FR-010): emitido só depois do hit-test já ter concluído, para nunca participar do
    // caminho crítico do clique. Cliques em botões internos (ex.: o de pausa acima) já chamam
    // event.stopPropagation() antes de chegar aqui, então nunca emitem este evento.
    this.game.events.emit("cursor:strike");
  }

  /**
   * specs/019-pontuacao-flutuante (research §2): a pata é desenhada centrada no ponteiro
   * (CursorScene), com a altura do design system; durante o tapa ela cresce e gira. A caixa
   * envolvente nesse instante é a maior área que ela ocupa — o "+N!" nunca encosta nela. Sem a
   * textura (cursor nativo), usa proporção 1.
   */
  private computePawGeometry(): PawGeometry {
    const pawHeight = CURSOR_PAW_HEIGHT_PX * MOVIMENTO.pata.golpeEscala;
    let aspect = 1;
    if (this.textures.exists("cursor-paw")) {
      const source = this.textures.get("cursor-paw").getSourceImage();
      aspect = source.width / source.height;
    }
    const bounds = rotatedBounds(pawHeight * aspect, pawHeight, MOVIMENTO.pata.golpeAnguloDeg);
    return { halfWidth: bounds.width / 2, halfHeight: bounds.height / 2 };
  }

  /**
   * FR-020: feedback visual breve de queda ao eliminar uma barata; specs/003: + som de acerto;
   * specs/019: "+N!" acima da pata, no ponto do clique (mesmo se o sprite já tiver sido removido).
   */
  private playRoachEliminated(roachId: string, points: number): void {
    this.sound.play("sfx-hit");
    createFloatingScore(this, this.lastHitPoint.x, this.lastHitPoint.y, points, this.pawGeometry);
    const sprite = this.roachSprites.get(roachId);
    if (!sprite) {
      return;
    }
    this.roachSprites.delete(roachId);
    this.tweens.add({
      targets: sprite,
      y: sprite.y + MOVIMENTO.barataEliminada.quedaPx,
      alpha: 0,
      duration: MOVIMENTO.barataEliminada.ms,
      onComplete: () => sprite.destroy(),
    });
  }

  /** FR-020: feedback visual breve no espaço da comida ao ser roubada; specs/003: + som de roubo. */
  private playFoodStolen(foodItemId: string): void {
    this.sound.play("sfx-steal");
    const sprite = this.foodSprites.get(foodItemId);
    if (!sprite) {
      return;
    }
    this.foodSprites.delete(foodItemId);
    this.tweens.add({
      targets: sprite,
      scale: 0,
      alpha: 0,
      duration: 200,
      onComplete: () => sprite.destroy(),
    });
  }
}
