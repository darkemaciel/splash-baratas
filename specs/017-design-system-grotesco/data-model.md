# Data Model: Design System "Grotesco Surreal" em todo o jogo

**Feature**: `specs/017-design-system-grotesco` | **Date**: 2026-09-27

Esta feature não cria estado de jogo nem dado persistido. As entidades de domínio (`FoodItem`,
`Shelf`, `Roach`, `Match`) e os stores (`HighScoreStore`, `AudioPreferenceStore`) não mudam
(FR-026). O que se modela aqui são os **tokens** e os **estados visuais** dos componentes de
interface.

## Tokens (`client/src/config/theme.ts`)

Fonte única de valores visuais, sem `import phaser`, importável por scenes, pelo kit de UI e por
`gameConfig.ts`.

| Grupo | Conteúdo | Origem |
|---|---|---|
| `COR` | 17 cores (número `0xRRGGBB`) + `hex()` para `Text` | já existe |
| `ALFA` | `sobreposicao` 0.55, `sombraChao` 0.18 | já existe |
| `FONTE` | `display` (Luckiest Guy), `texto` (Baloo 2) | já existe |
| `TEXTO` | tamanho/peso por papel (titulo_g, botao_g/m/p, hud, rotulo, corpo, legenda…) | já existe |
| `ESPACO`, `TRACO`, `SOMBRA` | base 4, traços 3/3.5/2, deslocamentos de sombra dura | já existe |
| `MOVIMENTO` | pata, barata andando/voando, agitação, eliminada, hover/pressionado de botão | já existe |
| `NOME_DO_JOGO` | "Borges e as Baratas" | já existe |
| **`RAIO`** *(novo)* | `bolhaA`, `bolhaB`, `bolhaPressionada`, `bolhaPressionadaB`, `cartao`, `painel` como strings no formato CSS de `border-radius` | copiado de `tokens.css` |
| **`TAMANHO`** *(novo)* | `botaoIcone` 52, `iconeBotao` 26, `pilhaBotaoMin` 280, `painelPausa` 380, `cartaoResultado` 400, `toqueMinimo` 44, `energiaAltura` 28 | copiado de `tokens.css` |

Regra: nenhuma scene usa literal de cor, fonte, tamanho de texto, traço, sombra ou opacidade de
sobreposição (FR-004/FR-006). Posições de layout específicas do jogo (ex.: largura da barra de
risco 160) ficam como constantes nomeadas no módulo de layout do HUD.

## Estado visual de botão

Vale para `Botao` e `BotaoIcone` (ver `contracts/ui-kit.md`).

```text
            pointerover                pointerdown
  normal ─────────────────▶ hover ─────────────────▶ pressionado
    ▲  ◀──────────────────   │  ◀──── pointerup ───────┘  (dispara ação se ainda dentro)
    │       pointerout       │
    │                        └─ pointerout durante pressionado ─▶ normal (sem ação)
    │
    ├─ focus (proxy DOM) ─▶ + anel de foco (combina com qualquer estado acima)
    └─ setAtivo(true)     ─▶ ativo (só BotaoIcone: fundo creme, sombra pressionada, sem hover)
```

| Estado | Deslocamento | Ângulo | Escala Y | Sombra | Fundo (primário / secundário / terciário / ícone) |
|---|---|---|---|---|---|
| normal | 0 | base (ex.: −2° no JOGAR) | 1 | p/m/g conforme tamanho | vermelho / limão / branco / branco |
| hover | −3, −3 | giro da variante (−3 / +3 / −2 / −8°) | 1 | hover (7) — ícone: painel (6) | magenta_escuro / limao_claro / creme / creme |
| pressionado | +3, +3 (ícone +2) | base | 0.92 (ícone 1) | pressionado (1) | vermelho_escuro / limao_escuro / papel / papel |
| ativo (ícone) | 0 | 0 | 1 | pressionado (1) | creme |

- Movimento reduzido: o ângulo de hover fica igual ao base e as transições duram 0ms.
- Desabilitado não é usado por nenhum botão existente e não é implementado (Princípio IV).

## Nível de risco → barra

Entrada: `snapshot.riskLevel` e `foodRemainingCount / foodTotalCount`, já calculados pelo domínio.

| `riskLevel` | Preenchimento |
|---|---|
| `safe` | `COR.limao` |
| `elevated` | `COR.laranja` |
| `critical` | `COR.vermelho` |

A largura preenchida é proporcional a `foodRemainingCount / foodTotalCount`. Ela é redesenhada só
quando `food:stolen` acontece, como hoje.

## Textos da interface (FR-024)

| Onde | Antes | Depois |
|---|---|---|
| `<title>` e logo | Baratas na Geladeira | Borges e as Baratas / BORGES E AS BARATAS |
| Início | Iniciar | JOGAR |
| Pausa | Pausado / Continuar | PAUSADO / CONTINUAR |
| HUD pontos | SCORE: 1250 | PONTOS 1.250 |
| HUD tempo | 00:45 | 0:45 |
| HUD comidas | 9 / 9 | (coração) 9 / 9 |
| Som | 🔊 Som / 🔇 Mudo | ícone Som (rótulo "Som ligado" / "Som desligado") |
| Fim — título | — | FIM DE JOGO! |
| Fim — nome | NOVA PONTUAÇÃO! / Pontuação: N / Digite seu nome e pressione ENTER | NOVA PONTUAÇÃO! / PONTOS 1.250 / Digite seu nome e aperte Enter |
| Fim — posição | Novo recorde! / Top 5 — 2º lugar! | NOVO RECORDE! / 2º LUGAR NO TOP 5! |
| Fim — ranking | TOP 5 SCORES / `1. NOME — 1250` / `2. ---` | TOP 5 / linha "1. NOME" + valor 1.250 / "2. ---" |
| Fim — botão | Reiniciar | DE NOVO! |
