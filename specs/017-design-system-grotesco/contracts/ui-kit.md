# Contract: Kit de UI "Grotesco Surreal" no canvas (`client/src/ui/`)

Contrato interno entre as scenes e o kit de componentes. Só os componentes usados nesta feature
existem (Princípio IV). Alternar, Nível, Seletor, Balão, Selo, Energia genérica, PontuaçãoFlutuante
e Personagem ficam para as specs do backlog §8.

## Módulos puros (sem `import phaser`, testados com `bun test`)

### `ui/shape.ts`

```ts
type Point = { x: number; y: number };
/** raios no formato CSS border-radius: "40% 60% 55% 45% / 55% 45% 60% 40%" ou "28px 36px 30px 40px / …" */
export function bubblePoints(width: number, height: number, radii: string, segmentsPerCorner?: number): Point[];
export function pillPoints(width: number, height: number, segmentsPerCorner?: number): Point[];
```

Garantias:
- Todos os pontos ficam dentro de `[0, width] × [0, height]`, e o polígono é fechado implicitamente.
- `%` horizontal é relativo a `width`, e `%` vertical é relativo a `height`. Sem `/`, o raio vertical
  é igual ao horizontal.
- Se a soma dos raios de um lado passa do comprimento do lado, todos os raios são escalados pelo
  mesmo fator, como no CSS.
- `pillPoints(w, h)` equivale a `bubblePoints(w, h, "${h/2}px")`.

### `ui/format.ts`

```ts
export function formatThousands(n: number): string; // 1250 → "1.250"; 0 → "0"; 12345 → "12.345"
export function formatClock(ms: number): string;    // 45_000 → "0:45"; 723_000 → "12:03"; <0 → "0:00"
```

## Componentes (Phaser, `ui/*.ts`)

Todos recebem `scene: Phaser.Scene` e devolvem um `Phaser.GameObjects.Container` (ou um wrapper
que o expõe em `.root`), posicionado pelo **centro**. Cores, fontes, traços e sombras vêm só de
`config/theme.ts`.

| Função | Parâmetros principais | Observações |
|---|---|---|
| `createButton(scene, x, y, opts)` | `label`, `variant: "primario"\|"secundario"\|"terciario"`, `size: "g"\|"m"\|"p"`, `bolha: "a"\|"b"`, `pilha?: boolean`, `baseAngle?: number`, `a11yLabel?`, `onActivate` | Estados conforme `data-model.md`. `onActivate` dispara no `pointerup` dentro do botão ou em Enter/Espaço no proxy. Com `pilha`, a largura mínima é 280. |
| `createIconButton(scene, x, y, opts)` | `iconKey`, `a11yLabel`, `onActivate`, `trigger?: "down"\|"up"` (padrão `"up"`) | Círculo de 52 e ícone de 26. `setAtivo(bool)` e `setA11yLabel(str)`. `trigger: "down"` repassa o `event` do Phaser para quem chamou poder usar `stopPropagation` (Pausar). |
| `createPill(scene, x, y, opts)` | `text`, `textColor`, `fill` (branco \| creme), `iconKey?`, `origin` (0 esquerda, 0.5 centro, 1 direita) | **Não interativo.** `setText(str)` redesenha o fundo só se a largura mudar. |
| `createRiskBar(scene, x, y, opts)` | `width`, `origin` | `update(ratio: number, level: RiskLevel)`. Não interativo. |
| `createPanel(scene, x, y, opts)` | `width`, `height`, `dialog?: boolean` | Fundo creme, `raio-painel`, sombra de 6. Os filhos são adicionados pelo chamador. |
| `createPanelTitle(scene, x, y, text, size?)` | `size` padrão `TEXTO.titulo` | Título de painel (`gs-painel__titulo`): display, caixa alta, `COR.traco`, −2°. Sem contorno. |
| `createOutlinedTitle(scene, x, y, text, opts)` | `size` (`titulo_g` \| `titulo` \| `titulo_p`), `angle` | Texto branco, contorno de 8 e sombra dura de 7 (§5 da research). |
| `createResultCard(scene, x, y, opts)` | `rows: Array<{ label: string; value?: string; highlight?: boolean }>`, `width`, `title?: string` | Cartão creme, `raio-cartao`, divisórias tracejadas de 2px entre as linhas, rótulo em Baloo 2 800 · 17, valor em display 30 (em vermelho se `highlight`). `title` opcional aparece acima das linhas, em display `titulo_p`, `COR.traco`. Linha sem `value` mostra só o rótulo. |

### Ciclo de vida

- Todo componente se registra para destruição no `SHUTDOWN` da cena dona, incluindo o proxy
  acessível. Reiniciar a partida várias vezes não acumula objetos nem proxies (Edge Case "Reinício
  sem recarregar").
- Os proxies acessíveis ficam em `#ui-a11y` (em `index.html`), com classe `sr-only`: posição
  absoluta, 1×1px, `clip`, fora do fluxo. **Nunca** recebem ponteiro e nunca ficam por cima do
  canvas.

### Garantias de interação (FR-019, FR-020, FR-021)

- Só `createButton` e `createIconButton` chamam `setInteractive`. A área de clique é exatamente o
  retângulo do botão em estado normal, sem crescer no hover.
- Nenhum componente muda o `cursor` do canvas (`useHandCursor: false`). A pata continua desenhada
  por `CursorScene`, que é a última scene e fica acima de tudo.
- O botão não emite `cursor:strike`. O golpe da pata continua só no campo de jogo (spec 015).
- **Profundidade**: todos os componentes do HUD usam `setDepth(UI_DEPTH_HUD)`, menor que a
  profundidade das baratas (`ROACH_DEPTH`), para que uma barata passando pela faixa do HUD
  continue visível por cima das pílulas (o clique já vale porque as pílulas não são interativas).
- **Proxies e digitação**: `a11y.ts` expõe `setProxiesEnabled(bool)`. Com `false`, todos os
  proxies perdem o foco (`blur`) e ficam `tabIndex = -1`, para que Enter/Espaço digitados em
  outra interação (ex.: nome no fim de jogo) não acionem um botão por engano.
