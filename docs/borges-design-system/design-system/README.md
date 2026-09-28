Direção visual do jogo **Borges e as Baratas**: humor exagerado com acabamento limpo. A direção se inspira na *linguagem visual* dos desenhos animados do fim dos anos 90 e anos 2000: traço fino, cores chapadas, céu azul e chão verde-limão em diagonal. Todas as medidas partem da tela de referência de 960 × 540 (16:9).

> **Regra de originalidade:** personagens, logotipo e cenários são sempre originais. Não reproduza personagens, logos ou cenas de séries existentes; a referência é só a linguagem visual.

## Direção visual

- Contorne tudo com traço preto fino e contínuo (`cor-traco`), na interface e na arte: `traco-ui` (3px) em botões, pílulas, painéis e cartões; `traco-arte` (3,5px) em personagens, cenário e itens; `traco-detalhe` (2px) em dentes, pelos, brilhos e divisórias tracejadas. Use sempre pontas e junções arredondadas.
- Pinte com cores chapadas, sem degradê nem hachura: céu `cor-ceu`, chão `cor-limao`, morros `cor-mato`, pastéis (`cor-creme`, `cor-rosa`) e acentos quentes (`cor-vermelho`, `cor-magenta`, `cor-laranja`).
- Use formas de bolha, com cantos assimétricos e nada perfeitamente reto: `raio-bolha-a` e `raio-bolha-b` em botões, `raio-cartao` em cartões e no balão, `raio-painel` em painéis, `raio-pilula` no HUD e nos controles.
- Use só sombra dura, sem desfoque, sempre para baixo e à direita: `sombra-p` (HUD, controles, botão P), `sombra-m` (botão M, cartões), `sombra-g` (botão G), `sombra-painel` (painéis), `sombra-hover` e `sombra-pressionado`.
- A interação é física: no hover o elemento levanta e gira; ao ser pressionado, afunda e achata.
- Títulos e botões de destaque podem ter leve rotação, de 2° a 4°.

## Regras de composição

- **Botões vizinhos alternam bolha A e B**, para não parecerem carimbados: JOGAR (A) com OPÇÕES (B), AGARRA! (B) com PULA! (A), DE NOVO! (A) com MENU (B).
- Use um único botão primário por grupo.
- Em pilhas dentro de painéis, os botões têm largura mínima de 280px (`pilha-botao-min`) e texto centralizado.
- No menu inicial, gire levemente os botões (-2° e +2°) e recue o segundo 14px.
- Títulos de painel giram de -2° a -3°. O logo gira -4° e "FIM DE JOGO!" gira -3°.
- O HUD fica a 16px do topo (`espaco-16`) e a 20px das laterais (`hud-lateral`), com 12px entre os itens (`espaco-12`): pontos e vidas à esquerda, tempo e Pausar à direita.
- Painéis têm 22 a 36px de respiro interno e 8 a 16px entre os itens. Atrás de pausa e diálogos, escureça o jogo com `sobreposicao` (55%).
- Espaço em base 4: `espaco-4`, `espaco-8`, `espaco-12`, `espaco-16`, `espaco-24`, `espaco-32`, `espaco-48`.

## Tipografia

- **Display: Luckiest Guy**, peso 400, sempre em caixa alta, em títulos, botões e números do HUD: `titulo-g` (52), `titulo` (44), `titulo-p` (28), `botao-g` (34), `botao-m` (22), `hud` (22), `botao-p` (17).
- **Texto: Baloo 2**, pesos 500 a 800: `rotulo` (800 · 19) nos rótulos de opções, `corpo` (600 · 16) em diálogos e dicas, `legenda` (700 · 12–13) nas legendas.
- **Título com contorno** (logo, "FIM DE JOGO!", "+50!"): texto branco com contorno preto em 8 direções e sombra dura por trás. Use o componente TituloContorno (4px + sombra de 7px a 52px) ou PontuacaoFlutuante (3px + sombra de 5px a 40px). Título branco nunca aparece sem esse contorno.

## Cor e contraste

Siga estes pares (WCAG):

| Texto | Fundo | Contraste | Onde |
|---|---|---|---|
| `cor-branco` | `cor-vermelho` | 5,2:1 | Botão primário |
| `cor-branco` | `cor-magenta-escuro` | 5,4:1 | Hover do primário |
| `cor-branco` | `cor-vermelho-escuro` | 7,4:1 | Primário pressionado |
| `cor-traco` | `cor-limao` | 10,9:1 | Botão secundário |
| `cor-traco` | `cor-limao-claro` | 12,4:1 | Hover do secundário |
| `cor-traco` | `cor-limao-escuro` | 7,2:1 | Secundário pressionado |
| `cor-traco` | `cor-creme` | 14,4:1 | Texto sobre painéis |
| `cor-vermelho` | `cor-branco` | 5,2:1 | Pontos no HUD, prefixo "DICA:" |
| `cor-vermelho` | `cor-creme` | 4,3:1 | Só texto de 24px ou mais (pontos no fim de jogo) |
| `cor-legenda` | `cor-branco` | 9,5:1 | Legendas |

- Não ponha texto branco direto sobre `cor-ceu`, `cor-limao`, `cor-creme` ou `cor-rosa`.
- Não ponha texto branco sobre `cor-magenta` (3,6:1): use `cor-magenta-escuro`.
- `cor-laranja` e `cor-mato` são só da arte, nunca com texto.
- O estado desabilitado usa fundo `cor-papel`, texto e borda tracejada de 3px em `cor-cinza-quente`, sem sombra.
- O foco do teclado aparece como um contorno sólido de 3px em `cor-traco`, afastado 4px.

## Movimento

- **Hover de botão:** `translate(-3px, -3px)`, rotação (primário -3°, secundário +3°, terciário -2°, ícone -8°) e `sombra-hover` (ícone: `sombra-painel`).
- **Pressionado:** `translate(3px, 3px) scaleY(0.92)`, `sombra-pressionado` e raio de bolha pressionada; no botão de ícone, só `translate(2px, 2px)`.
- **Pulo do personagem:** sobe 80px em 180ms (ease-out), fica no ar 180ms e volta; a sombra no chão encolhe de 92 para 58px de raio.
- **Pontuação flutuante:** "+50!" sobe 48px e desaparece em 720ms (ease-out), inclinado 8°.
- **Pata do gato (cursor):** a pata (`cursor-pata`, 56px de altura) segue o ponteiro, centrada nele. Parada, fica reta; em movimento, inclina até 15° na direção do deslocamento (15% do ângulo, suavizado em 25% por quadro). No clique dá o tapa: gira -25° e cresce 25% em 75ms e volta em mais 75ms (150ms no total, Quad ease-out), reiniciando a cada clique. O clique vale pela posição real do ponteiro, nunca pelo desenho da pata. Componente PataCursor.
- **Barata andando:** sprite de 27 quadros a 15fps, com balanço de ±10° a 2,2Hz desde o primeiro quadro.
- **Barata voando:** sprite de 16 quadros a 20fps, com balanço de ±6° a 6Hz.
- **Barata perto da comida:** quanto mais perto do alvo, mais ela se agita: achata e estica até 18% a 4Hz e treme até 4px (de 6 a 14Hz). O tremor fica abaixo da folga de clique (6px), para nunca atrapalhar a mira.
- **Barata eliminada:** cai 40px e some em 200ms. As baratas giram na direção do trajeto e são espelhadas quando vão para a esquerda, para nunca ficarem de cabeça para baixo (componente Barata, `barata` 64px).
- Todas as animações duram até 720ms, exceto os ciclos contínuos da barata. Com movimento reduzido, os componentes deixam de girar e a pontuação não anima.

## Iconografia

- Grade de 32 × 32, traço de 3px em `cor-traco`, pontas e junções redondas, sem preenchimento (grupo **Icones**, componente Icone).
- No botão de ícone, o ícone tem 26px dentro de um círculo de 52px (`botao-icone`), sempre com rótulo acessível ("Pausar", "Fechar", "Som ligado").
- Conjunto: Pausar, Jogar, Recomeçar, Menu (casa), Opções (engrenagem), Música, Som, Fechar, Estrela, Tempo (relógio) e as setas do seletor.
- Exceções preenchidas: o coração das vidas (`cor-magenta`) e as estrelas do resultado (`cor-limao`).
- Não use emoji.

## Ilustração

- **Sprites do jogo (grupo Sprites):** a pata do gato e as baratas andando e voando vêm do jogo, em PNG com fundo transparente, desenhados em 2x (quadros de 128px) e exibidos pela metade. São arte provisória, com sombreado e sem o traço preto de 3,5px da direção; ao redesenhar, siga as regras de personagem abaixo e mantenha o mesmo número de quadros.

- **Personagem (provisório):** corpo em bolha alongada `cor-creme`, barriga e focinho `cor-rosa`, boca enorme e aberta em `cor-magenta` com dentes em traços de 2px, olhos brancos de tamanhos diferentes com pupilas pequenas e desalinhadas, três fios de cabelo espetados, braços e pernas finos como macarrão (só traço) e pés em "L". Tem sombra elíptica no chão em `sombra-chao`. Expressões: feliz, susto (com gota de suor `cor-ceu`) e tonto (olhos em espiral, estrelinhas). Veja o grupo **Personagem** e o componente Personagem.
- **Cenário:** céu `cor-ceu` chapado com nuvens brancas de contorno 3px; chão `cor-limao` com horizonte em diagonal e linha de 3px, com a inclinação mudando de tela para tela; morro `cor-mato` num canto inferior.
- **Itens:** em `cor-laranja` (doce embrulhado com as pontas em creme), com brilhos de traços curtos. Linhas de velocidade são traços horizontais de 3,5px.

## Texto da interface

- Português do Brasil.
- Títulos e botões em caixa alta, com palavras curtas e diretas.
- Use exclamação nas ações e reações: PULA!, AGARRA!, DE NOVO!, FIM DE JOGO!
- Escreva números com ponto de milhar (1.250) e o tempo no formato m:ss (0:45).
- Rótulos de opções ficam em caixa normal, como "Efeitos sonoros".
- Descreva em texto vidas e estrelas ("2 de 3 vidas", "2 de 3 estrelas").

## Acessibilidade

- A cor nunca é o único sinal: vida cheia e vazia também diferem em claridade, o alternar mostra SIM e NÃO, e o nível mostra quantas bolhas estão preenchidas.
- Alternar e níveis indicam o estado com `aria-pressed`. Botões de ícone sempre têm rótulo acessível.
- A altura mínima de toque é 44px (`toque-minimo`). Os botões de ícone (52px) já atendem; as bolhas do nível (34px) e as setas do seletor (38px) ainda precisam de área clicável maior.

## Fluxo entre telas

| De | Ação | Para |
|---|---|---|
| 01 Menu inicial | JOGAR | 02 Jogo |
| 01 Menu inicial | OPÇÕES | 05 Opções |
| 05 Opções | VOLTAR / SALVAR / Fechar | 01 Menu inicial |
| 02 Jogo | Pausar | 03 Pausa |
| 03 Pausa | CONTINUAR / REINICIAR | 02 Jogo |
| 03 Pausa | ENCERRAR PARTIDA | 04 Fim de jogo |
| 04 Fim de jogo | DE NOVO! | 02 Jogo |
| 04 Fim de jogo | MENU | 01 Menu inicial |

As cinco telas estão no grupo **Telas** como composições de referência.

## Pendências e itens provisórios

- O personagem é provisório.
- PULA! e AGARRA! são mecânicas de exemplo.
- Valores de exemplo: 1.250 pontos, recorde 3.400, tempo 0:45, 2 de 3 vidas, 2 de 3 estrelas, energia 70%.
- As bolhas do nível e as setas do seletor precisam de área de toque de 44px.
- O pré-design cobre só a tela de 960 × 540; faltam outros tamanhos de tela.
