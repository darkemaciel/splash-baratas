export interface Point {
  x: number;
  y: number;
}

// specs/006-responsividade-mobile: orientação detectada uma única vez no carregamento do módulo
// (nunca recomputada em runtime — uma partida em andamento não troca de layout ao rotacionar,
// apenas re-letterboxa, conforme já decidido nas clarifications da spec). `typeof window` guarda
// o caminho de teste (bun test roda sem DOM) e mantém o padrão landscape nesse caso.
const isPortraitViewport =
  typeof window !== "undefined" && window.innerHeight > window.innerWidth;

// Canvas / layout — single source of truth shared by domain (pure math) and scenes (rendering).
// Duas resoluções-base: landscape (desktop, padrão) e portrait (celular em pé, sem exigir
// rotação — specs/006-responsividade-mobile). Ambas mantêm a mesma grade lógica de prateleiras/
// comidas; só a proporção do "mundo" muda, para que o letterboxing do Phaser (Scale.FIT) sobre
// cada uma aproveite a maior parte da tela em qualquer orientação.
export const GAME_WIDTH = isPortraitViewport ? 480 : 960;
export const GAME_HEIGHT = isPortraitViewport ? 960 : 600;

// specs/006-responsividade-mobile (FR-003, FR-007): fator para escalar tamanhos de fonte/padding
// fixos em px (StartScene, GameOverScene) proporcionalmente à largura-base landscape original
// (960) — sem isso, textos longos (título, mensagem de derrota) tunados para 960px de largura
// ficam cortados na base portrait (480px). Em landscape UI_SCALE é sempre 1 (nenhuma mudança).
export const UI_SCALE = GAME_WIDTH / 960;

// FR-002 / research.md §2: 3 prateleiras x 3 comidas = 9 comidas por partida.
export const SHELF_COUNT = 3;
export const FOOD_ITEMS_PER_SHELF = 3;
export const TOTAL_FOOD_ITEMS = SHELF_COUNT * FOOD_ITEMS_PER_SHELF;

// FR-003 / FR-005 / research.md §3: cadência e tempo de reação no início de qualquer partida
// (`survivalMs=0`). specs/011-dificuldade-progressiva substitui deliberadamente a garantia
// original de FR-016 da spec 001 ("constantes fixas e únicas durante toda a partida") — a partir
// dela, esses valores só valem no início; ver currentSpawnIntervalMs/currentTravelDurationMs.
export const SPAWN_INTERVAL_BASE_MS = 2500;
export const TRAVEL_DURATION_BASE_MS = 3000;

// specs/011-dificuldade-progressiva (FR-004, data-model.md, research.md §2): pisos mínimos —
// cadência/tempo de reação nunca ficam mais agressivos que isso, mesmo em partidas muito longas.
// TRAVEL_DURATION_FLOOR_MS permanece acima do maior limiar de REACTION_BONUS_TIERS (1500ms) para
// que nenhuma faixa de bônus se torne inalcançável na dificuldade máxima.
export const SPAWN_INTERVAL_FLOOR_MS = 1200;
export const TRAVEL_DURATION_FLOOR_MS = 2000;

// specs/011-dificuldade-progressiva (research.md §2): tempo de sobrevivência em que a dificuldade
// atinge o piso. Ajustado de 180_000 (3min) para 90_000 (1min30s) — feedback de playtest: a rampa
// original estava lenta demais; dobrar a velocidade de progressão significa alcançar o piso na
// metade do tempo. Ajuste de tuning simples (research.md §2 já previa isso), não muda a spec.
export const DIFFICULTY_RAMP_DURATION_MS = 90_000;

// FR-018 / research.md §4: hit-test circular = raio visual do sprite + padding fixo.
export const HITBOX_PADDING_PX = 6;
export const ROACH_VISUAL_RADIUS = 20;

// specs/012-high-score-local (data-model.md): chave namespaced usada por systems/HighScoreStore.ts
// para ler/escrever o ranking em localStorage — evita colisão com chaves que uma feature futura
// possa adicionar ao mesmo domínio.
export const HIGH_SCORE_STORAGE_KEY = "baratas-na-geladeira:high-score";

// specs/012-high-score-local (spec.md § Clarifications, data-model.md): tamanho fixo do ranking
// local (Top 5) — decisão revisada após validação manual de uma primeira versão com recorde único.
export const HIGH_SCORE_RANKING_MAX_ENTRIES = 5;

// Posições verticais das 3 prateleiras e horizontais dos 3 slots de comida por prateleira — grid
// 3x3 (research.md §2), expressas como frações da resolução-base landscape original (960x600) e
// aplicadas a GAME_WIDTH/GAME_HEIGHT — assim o grid mantém as mesmas proporções relativas em
// qualquer orientação (specs/006-responsividade-mobile).
const SHELF_Y_FRACTIONS = [160 / 600, 320 / 600, 480 / 600] as const;
const FOOD_SLOT_X_FRACTIONS = [280 / 960, 480 / 960, 680 / 960] as const;

export const SHELF_Y_POSITIONS: readonly number[] = SHELF_Y_FRACTIONS.map((f) => f * GAME_HEIGHT);
export const FOOD_SLOT_X_POSITIONS: readonly number[] = FOOD_SLOT_X_FRACTIONS.map(
  (f) => f * GAME_WIDTH,
);

// specs/010-variacao-pontos-spawn (FR-001, data-model.md, research.md §1-2): 4 regiões de borda,
// cada uma com 3 pontos candidatos fixos e pré-definidos (12 no total, contra os 4 pontos fixos do
// MVP original) — 25%/50%/75% ao longo do eixo variável da borda, como frações de GAME_WIDTH/
// GAME_HEIGHT (mesmo padrão de SHELF_Y_FRACTIONS/FOOD_SLOT_X_FRACTIONS, para sobreviver à troca
// landscape/portrait). O candidato de 50% de cada região coincide com o ponto único original.
export type SpawnRegion = "top" | "bottom" | "left" | "right";

export const SPAWN_POINTS_BY_REGION: Readonly<Record<SpawnRegion, readonly Point[]>> = {
  top: [
    { x: GAME_WIDTH * 0.25, y: -40 },
    { x: GAME_WIDTH * 0.5, y: -40 },
    { x: GAME_WIDTH * 0.75, y: -40 },
  ],
  bottom: [
    { x: GAME_WIDTH * 0.25, y: GAME_HEIGHT + 40 },
    { x: GAME_WIDTH * 0.5, y: GAME_HEIGHT + 40 },
    { x: GAME_WIDTH * 0.75, y: GAME_HEIGHT + 40 },
  ],
  left: [
    { x: -40, y: GAME_HEIGHT * 0.25 },
    { x: -40, y: GAME_HEIGHT * 0.5 },
    { x: -40, y: GAME_HEIGHT * 0.75 },
  ],
  right: [
    { x: GAME_WIDTH + 40, y: GAME_HEIGHT * 0.25 },
    { x: GAME_WIDTH + 40, y: GAME_HEIGHT * 0.5 },
    { x: GAME_WIDTH + 40, y: GAME_HEIGHT * 0.75 },
  ],
};

// As 4 âncoras dos pontos fixos originais, usadas apenas para decidir a região coerente com um
// alvo (research.md §3) — mesma varredura de distância euclidiana ao quadrado usada pelo MVP
// original, mudando apenas o que é retornado (a região, não mais um Point).
const SPAWN_REGION_ANCHORS: Readonly<Record<SpawnRegion, Point>> = {
  top: { x: GAME_WIDTH / 2, y: -40 },
  bottom: { x: GAME_WIDTH / 2, y: GAME_HEIGHT + 40 },
  left: { x: -40, y: GAME_HEIGHT / 2 },
  right: { x: GAME_WIDTH + 40, y: GAME_HEIGHT / 2 },
};

export function foodItemPosition(shelfIndex: number, slotIndex: number): Point {
  const y = SHELF_Y_POSITIONS[shelfIndex];
  const x = FOOD_SLOT_X_POSITIONS[slotIndex];
  if (y === undefined || x === undefined) {
    throw new Error(`Posição inválida: shelfIndex=${shelfIndex}, slotIndex=${slotIndex}`);
  }
  return { x, y };
}

// specs/004-sistema-pontuacao (data-model.md § "Constantes de balanceamento"): pontuação base,
// bônus de velocidade de reação em faixas fixas, e bônus/janela de combo.
export interface ReactionBonusTier {
  maxMs: number;
  bonus: number;
}

export const SCORE_BASE_POINTS = 100;
export const REACTION_BONUS_TIERS: readonly ReactionBonusTier[] = [
  { maxMs: 500, bonus: 50 },
  { maxMs: 1000, bonus: 25 },
  { maxMs: 1500, bonus: 10 },
];
export const COMBO_BONUS_STEP_POINTS = 25;
// 3000ms (não 2000ms): com SPAWN_INTERVAL_BASE_MS=2500 e TRAVEL_DURATION_BASE_MS=3000, o intervalo
// mínimo entre "última eliminação de uma leva de baratas" e "primeira eliminação da próxima leva" é
// de ~2000ms (2 * SPAWN_INTERVAL_BASE_MS - TRAVEL_DURATION_BASE_MS) — com a janela igual a esse
// mínimo, um combo de 3+ só seria alcançável com precisão de milissegundo. 3000ms dá folga real ao
// jogador. specs/011-dificuldade-progressiva (research.md §2): na dificuldade máxima esse intervalo
// mínimo cai para ~400ms (2*SPAWN_INTERVAL_FLOOR_MS-TRAVEL_DURATION_FLOOR_MS), ainda folgado frente
// a COMBO_WINDOW_MS — nenhum ajuste necessário aqui.
export const COMBO_WINDOW_MS = 3000;

// specs/010-variacao-pontos-spawn (FR-003, contracts/spawn-point-selection.md): decide a região de
// borda coerente com um alvo, pura e determinística — mesma entrada sempre produz a mesma região.
export function nearestSpawnRegion(target: Point): SpawnRegion {
  let nearest: SpawnRegion = "top";
  let nearestDistSq = Infinity;
  for (const region of Object.keys(SPAWN_REGION_ANCHORS) as SpawnRegion[]) {
    const anchor = SPAWN_REGION_ANCHORS[region];
    const dx = anchor.x - target.x;
    const dy = anchor.y - target.y;
    const distSq = dx * dx + dy * dy;
    if (distSq < nearestDistSq) {
      nearestDistSq = distSq;
      nearest = region;
    }
  }
  return nearest;
}

// specs/010-variacao-pontos-spawn (contracts/spawn-point-selection.md): os 3 candidatos da região
// coerente com o alvo — nunca mistura candidatos de mais de uma região.
export function spawnPointCandidates(target: Point): readonly Point[] {
  return SPAWN_POINTS_BY_REGION[nearestSpawnRegion(target)];
}

// specs/010-variacao-pontos-spawn (FR-004, FR-005, contracts/spawn-point-selection.md): sorteia um
// candidato, excluindo `avoid` só quando ele pertence a `candidates` e há mais de 1 opção — nunca
// lança exceção para `candidates` com um único elemento (retorna esse elemento sempre).
export function pickSpawnPoint(candidates: readonly Point[], avoid?: Point): Point {
  const pool =
    avoid && candidates.length > 1
      ? candidates.filter((point) => point.x !== avoid.x || point.y !== avoid.y)
      : candidates;
  const source = pool.length > 0 ? pool : candidates;
  return source[Math.floor(Math.random() * source.length)]!;
}

// specs/011-dificuldade-progressiva (research.md §1): interpolação linear de `base` para `piso`,
// atingindo o piso exatamente em `DIFFICULTY_RAMP_DURATION_MS` e nunca o ultrapassando depois.
function rampedValue(survivalMs: number, base: number, floor: number): number {
  const t = Math.min(1, Math.max(0, survivalMs / DIFFICULTY_RAMP_DURATION_MS));
  return base + (floor - base) * t;
}

// specs/011-dificuldade-progressiva (FR-001, FR-003, contracts/difficulty-curve.md): intervalo de
// spawn atual, decrescendo de SPAWN_INTERVAL_BASE_MS para SPAWN_INTERVAL_FLOOR_MS.
export function currentSpawnIntervalMs(survivalMs: number): number {
  return rampedValue(survivalMs, SPAWN_INTERVAL_BASE_MS, SPAWN_INTERVAL_FLOOR_MS);
}

// specs/011-dificuldade-progressiva (FR-002, FR-003, contracts/difficulty-curve.md): tempo de
// viagem atual, decrescendo de TRAVEL_DURATION_BASE_MS para TRAVEL_DURATION_FLOOR_MS.
export function currentTravelDurationMs(survivalMs: number): number {
  return rampedValue(survivalMs, TRAVEL_DURATION_BASE_MS, TRAVEL_DURATION_FLOOR_MS);
}
