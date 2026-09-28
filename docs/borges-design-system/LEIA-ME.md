# Design system Grotesco Surreal · Borges e as Baratas

## O que tem aqui

```
client/                      ← copie por cima da pasta client/ do projeto (só adiciona arquivos novos)
  public/assets/fonts/       Luckiest Guy + Baloo 2 (500–800), .woff2
  public/assets/ui/icones/   17 ícones SVG (apêndice A)
  public/assets/ui/personagem/  personagem provisório: pose de jogo + 3 expressões
  src/config/theme.ts        cores, fontes, tamanhos, traço, sombras e tempos de movimento para o Phaser
  src/styles/tokens.css      as mesmas variáveis em CSS (+ @font-face das fontes)
  src/styles/grotesco.css    classes prontas: botões, HUD, painéis, diálogo, balão, cartão de resultado…
design-system/               referência: tokens.json, README (guia completo), componentes React e prévias
```

Nenhum arquivo existente do projeto é sobrescrito. Os sprites da pata e das baratas já estão em `client/public/assets/sprites/`.

## Ligar no jogo (3 passos)

**1. CSS e fontes.** No `client/index.ts`, antes de criar o jogo:

```ts
import "./src/styles/tokens.css";
import "./src/styles/grotesco.css";
```

No `BootScene`, espere as fontes novas antes de desenhar texto (canvas não redesenha quando a fonte chega depois):

```ts
await Promise.race([
  Promise.all([document.fonts.load('28px "Luckiest Guy"'), document.fonts.load('800 16px "Baloo 2"')]),
  new Promise((r) => setTimeout(r, 1000)),
]);
```

**2. Constantes no Phaser.** Troque as cores e números soltos das scenes pelo `theme.ts`:

```ts
import { COR, hex, FONTE, TEXTO, MOVIMENTO } from "../config/theme";

this.add.text(x, y, "PONTOS 1.250", {
  fontFamily: FONTE.display, fontSize: `${TEXTO.hud.size}px`, color: hex(COR.vermelho),
});
```

`MOVIMENTO` já traz os tempos da pata, da barata andando/voando, da agitação e da queda — os mesmos valores que hoje estão em `CursorScene.ts` e `GameScene.ts`.

**3. Menus e HUD em HTML por cima do canvas** (onde as bolhas, a sombra dura e os títulos com contorno ficam perfeitos). Ligue o container de DOM do Phaser em `client/index.ts`:

```ts
new Phaser.Game({ /* …config atual… */, dom: { createContainer: true } });
```

E use as classes do `grotesco.css` numa scene, por exemplo a pausa:

```ts
const painel = this.add.dom(GAME_WIDTH / 2, GAME_HEIGHT / 2).createFromHTML(`
  <section class="gs-painel" style="width:380px">
    <h2 class="gs-painel__titulo">PAUSADO</h2>
    <button class="gs-botao gs-botao--primario gs-botao--m gs-bolha-a gs-botao--pilha" data-acao="continuar">CONTINUAR</button>
    <button class="gs-botao gs-botao--secundario gs-botao--m gs-bolha-b gs-botao--pilha" data-acao="reiniciar">REINICIAR</button>
    <button class="gs-botao gs-botao--terciario gs-botao--m gs-bolha-a gs-botao--pilha" data-acao="encerrar">ENCERRAR PARTIDA</button>
  </section>`);
painel.addListener("click");
painel.on("click", (e: MouseEvent) => {
  const acao = (e.target as HTMLElement).dataset.acao;
  if (acao === "continuar") this.resumeMatch();
});
```

Fundo escuro atrás do painel: um `<div class="gs-sobreposicao">` de tela cheia, ou `this.add.rectangle(…, COR.traco, ALFA.sobreposicao)`.

O HTML de cada peça (HUD, cartão de resultado, opções, diálogo) está nas prévias em `design-system/components/<Nome>/preview.html` e nas telas `Tela*/preview.html` — copie a marcação de lá.

## Classes principais (grotesco.css)

| Peça | Classes |
|---|---|
| Botão | `gs-botao` + `gs-botao--primario / --secundario / --terciario` + `gs-botao--g / --m / --p` + `gs-bolha-a / gs-bolha-b` (vizinhos alternam) + `gs-botao--pilha` (280px) |
| Botão de ícone | `gs-botao-icone` (+ `gs-is-ativo`), com um SVG de `assets/ui/icones` dentro |
| HUD | `gs-pilula gs-hud-texto gs-hud-pontos`, `gs-pilula gs-hud-vidas`, `gs-pilula gs-hud-texto gs-hud-tempo` |
| Energia | `gs-energia` › `gs-energia__rotulo` + `gs-energia__trilho` › `gs-energia__preenchimento` (width em %) |
| Painel / diálogo | `gs-painel` (+ `gs-painel--dialogo`), `gs-painel__titulo`, `gs-painel__texto`, `gs-painel__acoes`, `gs-linha-ajuste` |
| Balão de dica | `gs-balao` › `gs-balao__prefixo` |
| Títulos | `gs-titulo-contorno` (logo, FIM DE JOGO!), `gs-pontuacao` (+50!, `gs-pontuacao--animar`) |
| Resultado | `gs-painel gs-resultado` e as partes `gs-resultado__*` |

Hover, pressionado e desabilitado já funcionam sozinhos (`:hover`, `:active`, `disabled`).

## Se um dia usar React

`design-system/components/bundle.js` expõe `window.GrotescoSurreal` (Botao, HudPontos, Painel, Barata, PataCursor…), com os tipos em `index.d.ts`. Ele espera React 18 carregado antes. Os componentes Barata e PataCursor apontam para os sprites hospedados no artefato; no seu projeto, antes de renderizar:

```js
window.GrotescoSurreal.sprites = {
  pata: "/assets/sprites/paw.png",
  andando: "/assets/sprites/roach-walk.png",
  voando: "/assets/sprites/roach-fly.png",
};
```

## Atenção

- O pré-design usa a tela de 960 × 540; o jogo hoje usa 960 × 600 (e 480 × 960 no celular). Os tamanhos continuam válidos, só a composição das telas precisa ser ajustada.
- As telas do pré-design mostram céu e chão; o jogo se passa na geladeira. As cores de cenário (`ceu`, `limao`, `mato`) são sugestão.
- O guia completo (regras de composição, contraste, movimento, texto da interface) está em `design-system/README.md`.
