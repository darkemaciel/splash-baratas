# Feature Specification: Design System "Grotesco Surreal" em todo o jogo

**Feature Branch**: `feat/design-system`

**Created**: 2026-09-27

**Status**: Draft

**Input**: User description: "Implementar o design system 'Grotesco Surreal' (`docs/borges-design-system`) em todo o jogo, renomeando o jogo para 'Borges e as Baratas'. Escopo: SÓ reestilização das telas e controles que já existem, sem mecânicas novas. As demais peças do design system (tela de Opções, REINICIAR/ENCERRAR na pausa, estrelas, personagem, barra de energia, selo de combo, pontuação flutuante, balão de dica, cenário, PULA!/AGARRA!, DE NOVO! + MENU, redesenho dos sprites, outros tamanhos de tela) entram no `backlog.md` para specs futuras."

**Referências**: guia visual completo em `docs/borges-design-system/design-system/README.md`;
instruções de integração em `docs/borges-design-system/LEIA-ME.md`; composições de referência das
telas em `docs/borges-design-system/design-system/components/Tela*/preview.html`; tokens em
`docs/borges-design-system/design-system/tokens.json`. Os assets do design system (fontes Luckiest
Guy e Baloo 2, ícones, personagem, tokens de cor/tipografia/espaço/sombra/movimento e classes de
estilo) já estão copiados em `client/`, ainda sem commit.

## Clarifications

### Session 2026-09-27

- Q: O design system chama o jogo de "Borges e as Baratas", mas o jogo hoje se chama "Baratas na
  Geladeira". Qual nome usar? → A: "Borges e as Baratas" — trocar o título da tela inicial, o
  título da página e o logo.
- Q: O design system tem peças que o jogo ainda não tem (tela de Opções, REINICIAR/ENCERRAR na
  pausa, estrelas no resultado, personagem, barra de energia etc.). Qual é o escopo? → A: Esta
  spec só reestiliza o que já existe; todas as outras peças do design system entram no
  `backlog.md` para implementação posterior.
- Q: Como o HUD deve mostrar as comidas restantes e o risco? → A: Pílula com o ícone de coração e
  "N / total", mais a barra de risco horizontal em pílula (estilo BarraEnergia) junto dela, com
  cor por nível — substitui a barra vertical atual.
- Q: Qual cor da paleta deve ser o interior da geladeira? → A: Fundo `céu` chapado, prateleiras
  brancas com contorno preto e comidas em `laranja` com contorno preto.
- Q: Em que posição os itens do HUD devem ficar no topo da tela? → A: Pontos à esquerda, tempo no
  centro, comidas/risco + Pausar à direita (Pausar no canto).
- Q: Onde deve ficar o botão de som? → A: Manter no canto inferior direito, como botão de ícone
  redondo.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Menus e telas com a identidade "Grotesco Surreal" (Priority: P1)

Como jogador, quero que a tela inicial, a pausa e a tela de fim de jogo tenham a identidade visual
do jogo (logo "BORGES E AS BARATAS" com contorno, botões em bolha com sombra dura, painéis creme,
tipografia cartunesca), para que o jogo pareça um produto acabado e coerente, e não um protótipo
com textos e retângulos genéricos.

**Why this priority**: as telas de menu são a primeira e a última coisa que o jogador vê. Elas
hoje usam textos genéricos em fundos chapados e concentram a maior diferença visual em relação ao
pré-design. Esta história entrega o maior ganho de percepção de qualidade sem tocar a jogabilidade.

**Independent Test**: abrir o jogo, ver a tela inicial, iniciar uma partida, pausar e retomar,
perder a partida, digitar o nome, ver o ranking e reiniciar. Conferir cada tela contra a
composição de referência correspondente (Tela 01, Tela 03 e Tela 04) nos elementos que existem no
jogo.

**Acceptance Scenarios**:

1. **Given** o jogo acabou de carregar, **When** a tela inicial aparece, **Then** ela mostra o
   logo "BORGES E AS BARATAS" em título com contorno (texto branco, contorno preto e sombra dura,
   girado cerca de -4°) e um único botão primário grande "JOGAR" em forma de bolha, com sombra
   dura.
2. **Given** a tela inicial, **When** o jogador passa o ponteiro sobre "JOGAR", **Then** o botão
   levanta e gira levemente (hover), e ao ser pressionado afunda e achata (pressionado), antes de
   iniciar a partida.
3. **Given** uma partida pausada, **When** a sobreposição de pausa aparece, **Then** o jogo fica
   escurecido a 55% e um painel creme mostra o título "PAUSADO" girado de -2° a -3° e o botão
   primário "CONTINUAR", no estilo das pilhas de botão do design system.
4. **Given** a partida terminou, **When** a tela de fim de jogo aparece, **Then** ela mostra
   "FIM DE JOGO!" em título com contorno girado -3°, e o painel de nome, a pontuação final, a
   mensagem de recorde/posição no Top 5, o cartão do ranking e o botão de reiniciar usam painéis,
   cartões, tipografia e botões do design system.
5. **Given** a tela de fim de jogo pedindo o nome, **When** o jogador digita o nome e confirma,
   **Then** a entrada de nome continua funcionando com as mesmas regras de hoje (até 10
   caracteres, letras/números/espaço, Backspace apaga, Enter confirma, "Jogador" se vazio), agora
   com a aparência do design system.
6. **Given** o ranking Top 5 exibido, **When** o jogador lê os valores, **Then** as pontuações
   aparecem com ponto de milhar (ex.: 1.250) e os slots vazios continuam indicados.

---

### User Story 2 - HUD da partida no estilo do design system (Priority: P2)

Como jogador, durante a partida quero ler pontos, comidas restantes, risco e tempo em pílulas
brancas com contorno e tipografia de HUD do design system, e pausar por um botão de ícone
redondo, para que o HUD combine com as telas e fique legível sem atrapalhar a mira nas baratas.

**Why this priority**: o HUD fica visível o tempo todo, mas já funciona e é legível hoje.
Reestilizá-lo completa a coerência visual, com o cuidado extra de não interferir no clique nas
baratas (Princípio V).

**Independent Test**: iniciar uma partida e jogar até perder. Conferir que pontos, comidas
restantes, barra de risco e tempo usam as pílulas do HUD e que Pausar é um botão de ícone. Clicar
em baratas próximas ao HUD e confirmar que todo clique fora dos controles continua valendo para a
barata.

**Acceptance Scenarios**:

1. **Given** uma partida em andamento, **When** o jogador olha o topo da tela, **Then** vê pílulas
   brancas com contorno de 3px e sombra dura para pontos (em vermelho, com ponto de milhar),
   comidas restantes (com o ícone de coração do design system) e tempo (em pílula creme, com o
   ícone de relógio e formato m:ss).
2. **Given** uma partida em andamento, **When** o jogador olha o botão de pausa, **Then** ele é um
   botão de ícone circular (ícone Pausar do design system), com rótulo acessível "Pausar", e
   pausar pelo botão ou pela tecla P continua funcionando como hoje.
3. **Given** o jogo pausado, **When** a pausa está ativa, **Then** o botão Pausar aparece no
   estado "ativo" do botão de ícone.
4. **Given** comidas sendo roubadas, **When** o nível de risco muda (seguro → elevado → crítico),
   **Then** a barra de risco continua refletindo proporção e nível, agora com trilho em pílula de
   contorno preto e cores da paleta do design system, e o nível não depende só da cor (a
   proporção preenchida continua visível).
5. **Given** uma barata passando perto de qualquer elemento do HUD, **When** o jogador clica na
   barata fora da área de um botão, **Then** a eliminação acontece normalmente: nenhum elemento
   decorativo do HUD bloqueia ou atrasa o clique.

---

### User Story 3 - Controle de som, cenário e cursor coerentes (Priority: P3)

Como jogador, quero que o controle de som, a geladeira (fundo, prateleiras, comidas) e o cursor da
pata sigam a mesma direção visual (cores chapadas, traço preto, sem emoji), para que nenhuma parte
do jogo destoe do resto.

**Why this priority**: são elementos menores ou de apoio. O controle de som hoje usa emoji, o que o
design system proíbe, e as texturas placeholder usam cores fora da paleta. É o acabamento final da
reestilização.

**Independent Test**: alternar o som na tela inicial, durante a partida e na pausa; observar o
cenário da geladeira durante uma partida; mover o ponteiro sobre todos os botões e painéis e
conferir que a pata continua sendo o cursor em qualquer lugar.

**Acceptance Scenarios**:

1. **Given** qualquer tela, **When** o jogador vê o controle de som, **Then** é um botão de ícone
   circular com o ícone Som do design system, sem emoji, com rótulo acessível que descreve o estado
   ("Som ligado" / "Som desligado"), e o estado desligado é distinguível por mais de um sinal além
   da cor.
2. **Given** o controle de som, **When** o jogador o alterna, **Then** o comportamento de hoje é
   mantido (silencia/reativa tudo, inclusive o loop de voo, e lembra a preferência).
3. **Given** uma partida, **When** o jogador olha a geladeira, **Then** fundo, prateleiras e
   comidas usam cores chapadas da paleta do design system e traço preto de contorno, sem degradê,
   e a barata continua bem visível contra o fundo.
4. **Given** a pata como cursor, **When** o ponteiro passa sobre qualquer botão, painel ou pílula
   do HUD, **Then** a pata continua visível como cursor e o cursor nativo do sistema não aparece
   (exceto se a imagem da pata falhar ao carregar, como hoje).

---

### Edge Cases

- **Fontes demoram ou falham ao carregar**: o jogo não pode travar; após um tempo limite curto,
  ele segue com as fontes de reserva, sem textos invisíveis e sem ficar preso no carregamento.
  Textos criados antes de a fonte chegar não devem ficar com a fonte errada durante o jogo.
- **Base retrato (480×960)**: logo, botões, painéis, cartão de ranking e HUD precisam caber sem
  cortes e sem sobreposição. O pré-design é 960×540, então os tamanhos continuam valendo e só a
  composição se adapta.
- **Pontuação ou nome longos**: pontuações com muitos dígitos (ex.: 12.345) e nomes de 10
  caracteres não podem estourar pílulas, cartões ou painéis.
- **Clique perto dos controles**: um clique em um botão do HUD (Pausar, Som) não pode contar como
  clique perdido na partida, e um clique fora de botões nunca pode ser capturado por um elemento
  decorativo.
- **Pausa via teclado com o botão em estado ativo**: retomar pela tecla P deve devolver o botão
  Pausar ao estado normal.
- **Movimento reduzido**: com a preferência do sistema de reduzir movimento, os botões deixam de
  girar no hover, seguindo o design system.
- **Reinício sem recarregar a página**: após várias partidas seguidas, nenhum elemento de
  interface das telas anteriores fica acumulado ou visível na tela seguinte.

## Requirements *(mandatory)*

### Functional Requirements

**Identidade e fundamentos**

- **FR-001**: O jogo MUST se apresentar como "Borges e as Baratas" no título da página do
  navegador e no logo da tela inicial (em caixa alta no logo: "BORGES E AS BARATAS").
- **FR-002**: Todo texto de interface MUST usar só as duas famílias do design system: display
  (Luckiest Guy, sempre em caixa alta) em títulos, botões e números do HUD, e texto (Baloo 2,
  pesos 500–800) em rótulos, instruções e textos corridos. A fonte anterior do HUD e as fontes
  genéricas (monospace, padrão do navegador) MUST deixar de ser usadas.
- **FR-003**: As fontes MUST vir dos arquivos locais do projeto (sem serviço externo) e MUST estar
  prontas antes de a primeira tela com texto aparecer, com um tempo limite de no máximo 1 segundo,
  depois do qual o jogo segue com as fontes de reserva.
- **FR-004**: Todas as cores de interface e de cenário MUST vir da paleta do design system (traço,
  branco, creme, rosa, magenta, magenta escuro, vermelho, vermelho escuro, laranja, céu, limão e
  variações, mato, papel, cinza quente, legenda). Nenhuma cor fora da paleta MUST permanecer nas
  telas, no HUD ou no cenário.
- **FR-005**: As combinações de texto e fundo MUST seguir os pares de contraste do design system.
  Em especial, MUST NOT haver texto branco sobre céu, limão, creme, rosa ou magenta, e laranja e
  mato MUST NOT ser usados como fundo de texto.
- **FR-006**: Tamanhos de texto, espaçamentos, espessuras de traço, deslocamentos de sombra,
  opacidade da sobreposição e tempos de animação de interface MUST vir de uma fonte única de
  constantes do design system, e não de números soltos em cada tela.
- **FR-007**: Os valores de movimento do design system (golpe e inclinação da pata; balanço da
  barata andando e voando; agitação perto da comida; queda da barata eliminada) MUST passar a ser a
  única fonte dessas constantes, **sem mudar o comportamento atual** (os valores já são idênticos
  aos de hoje).

**Componentes e telas**

- **FR-008**: Todo botão de texto MUST seguir o componente Botão do design system: contorno de 3px,
  forma de bolha assimétrica, sombra dura para baixo e à direita, texto em caixa alta, variantes
  primário (vermelho com texto branco), secundário (limão com texto preto) e terciário (branco com
  texto preto), e estados de hover (levanta e gira), pressionado (afunda e achata) e foco de
  teclado visível (contorno sólido de 3px afastado 4px). Deve haver um único botão primário por
  grupo, e botões vizinhos MUST alternar bolha A e B.
- **FR-009**: A tela inicial MUST mostrar o logo com contorno (girado -4°) e o botão primário
  grande "JOGAR" (girado cerca de -2°), sobre o fundo da geladeira. Iniciar a partida continua
  acontecendo ao pressionar o botão.
- **FR-010**: A pausa MUST escurecer o jogo a 55% (opacidade da sobreposição do design system) e
  mostrar um painel creme de até 380px de largura (na base paisagem) com o título "PAUSADO"
  (girado de -2° a -3°) e o botão primário "CONTINUAR" com largura mínima de pilha (280px).
  Retomar pelo botão ou pela tecla P continua funcionando como hoje.
- **FR-011**: A tela de fim de jogo MUST mostrar "FIM DE JOGO!" em título com contorno girado -3°
  e reestilizar, sem mudar o fluxo: (a) o painel de entrada de nome, como painel/diálogo do design
  system com título, pontuação e instrução em texto de corpo e o campo de nome com cursor
  piscando; (b) a pontuação final em destaque; (c) a mensagem "NOVO RECORDE!" ou da posição no
  Top 5, em caixa alta com exclamação; (d) o ranking Top 5, como cartão de resultado do design
  system, com as mesmas 5 linhas (slots vazios indicados); (e) o botão de reiniciar, rotulado
  "DE NOVO!" como botão primário.
- **FR-012**: As regras da entrada de nome (até 10 caracteres; letras, números e espaço; Backspace
  apaga; Enter confirma; "Jogador" quando vazio) e do ranking (Top 5 persistido localmente) MUST
  continuar idênticas.
- **FR-013**: O HUD da partida MUST usar as pílulas do design system (fundo branco, contorno de
  3px, sombra dura pequena, texto display de HUD): pontos em vermelho com o rótulo "PONTOS";
  comidas restantes com o ícone de coração cheio (magenta) e o formato "N / total"; tempo em
  pílula creme com o ícone de relógio.
- **FR-014**: A barra de risco (proporção de comidas restantes e nível seguro/elevado/crítico) MUST
  continuar existindo e funcionando igual, redesenhada como barra **horizontal** no estilo do
  componente BarraEnergia (trilho em pílula branca de contorno preto de 3px, sombra dura pequena,
  preenchimento em cor chapada da paleta, uma cor por nível), posicionada junto da pílula de
  comidas (logo abaixo ou ao lado). A barra vertical atual deixa de existir. A proporção
  preenchida continua sendo o sinal principal, além da cor.
- **FR-015**: O botão de pausa MUST ser um botão de ícone do design system (círculo de 52px, ícone
  Pausar de 26px, rótulo acessível "Pausar"), com estado "ativo" enquanto o jogo está pausado.
- **FR-016**: O controle de som MUST ser um botão de ícone do design system com o ícone Som, sem
  emoji, com rótulo acessível que reflita o estado ("Som ligado" / "Som desligado"). O estado
  desligado MUST ser distinguível por um sinal além da cor (por exemplo, o estado "ativo"/afundado
  do botão ou um traço sobre o ícone). O controle continua disponível em todas as telas, no canto
  inferior direito (mesma posição de hoje, fora das prateleiras e das zonas de nascimento das
  baratas), com o comportamento e a persistência de hoje.
- **FR-017**: O HUD MUST ficar numa faixa do topo, a 16px da borda superior e 20px das laterais,
  com 12px entre itens, nesta ordem: pontos à esquerda, tempo no centro, e comidas/barra de risco
  seguidas de Pausar à direita (Pausar no canto direito). Esta ordem difere deliberadamente da
  composição do pré-design (decisão do dono do produto). Nenhum elemento do HUD ou botão MUST sobrepor
  a faixa vertical das prateleiras (posição da prateleira ± raio visual da barata + folga de
  clique), nem as zonas onde as baratas nascem.
- **FR-018**: Fundo da geladeira, prateleiras e comidas (hoje texturas placeholder geradas pelo
  jogo) MUST ser redesenhados com cores chapadas e contorno preto do design system, sem degradê:
  fundo em `céu`, prateleiras em `branco` com contorno preto e comidas em `laranja` com contorno
  preto (o mesmo fundo vale para a tela inicial). Tudo mantém os mesmos tamanhos visíveis e os mesmos centros, para não alterar a geometria de clique (a textura pode crescer só o necessário para caber o contorno). A barata
  MUST continuar com contraste claro contra o fundo e as prateleiras.

**Interação, desempenho e acessibilidade**

- **FR-019**: A detecção de clique nas baratas MUST continuar por teste geométrico direto, sem
  nenhuma mudança de hitbox, e nenhum elemento de interface novo MUST capturar cliques fora da
  própria área de botão. Um clique em botão do HUD MUST NOT contar como clique perdido na partida.
- **FR-020**: Toda interação com os novos controles MUST funcionar por Pointer Events (mouse e
  toque); o teclado segue apenas como complemento (tecla P, entrada de nome).
- **FR-021**: A pata do gato MUST continuar sendo o cursor em toda a janela, inclusive sobre
  botões, painéis e pílulas. O golpe animado continua acontecendo só em cliques no campo de jogo
  ativo, nunca em botões de menu. A degradação para o cursor nativo quando a imagem da pata falha
  MUST continuar funcionando.
- **FR-022**: Todo botão de ícone MUST ter rótulo acessível, e nenhum emoji MUST aparecer na
  interface.
- **FR-023**: Com a preferência do sistema de reduzir movimento ativa, os botões MUST deixar de
  girar no hover e os títulos não devem animar, seguindo o design system.
- **FR-024**: Textos de interface MUST seguir as regras de texto do design system: português do
  Brasil, títulos e botões em caixa alta com palavras curtas, exclamação em ações e reações,
  números com ponto de milhar e tempo no formato m:ss.
- **FR-025**: Todas as telas e o HUD MUST funcionar nas duas bases de layout existentes
  (paisagem 960×600 e retrato 480×960), sem texto cortado nem elementos sobrepostos, escalando
  tamanhos proporcionalmente na base retrato quando necessário.
- **FR-026**: A camada de domínio (entidades e sistemas) MUST NOT mudar regras: spawn, trajeto,
  roubo, eliminação, pontuação, dificuldade, pausa, ranking e preferência de som continuam
  idênticos, e a suíte de testes existente continua passando sem alteração de comportamento.

**Backlog**

- **FR-027**: Como parte desta feature, o `backlog.md` MUST receber um item separado, com
  risco/pontuação/esforço/prioridade, para cada peça do design system fora do escopo: tela de
  Opções (música, efeitos sonoros, vibração, legendas, idioma); REINICIAR e ENCERRAR PARTIDA na
  pausa; estrelas no cartão de resultado; personagem Borges e expressões (feliz, susto, tonto);
  barra de energia; selo de combo; pontuação flutuante "+50!"; balão de dica; cenário
  céu/chão/morro; botões de ação PULA!/AGARRA!; botões DE NOVO! + MENU no fim de jogo (com volta ao
  menu inicial); redesenho dos sprites com o traço preto de 3,5px; layouts para outros tamanhos de
  tela; área de toque de 44px nas bolhas de nível e nas setas do seletor. *(Registrado na seção 8
  do `backlog.md` na criação desta spec.)*

### Key Entities *(include if feature involves data)*

- **Tokens do design system**: conjunto único de valores visuais (cores, fontes, tamanhos de texto,
  espaçamentos, traços, sombras, opacidades, tempos de movimento, nome do jogo) consumido por todas
  as telas. Não é estado de jogo e não é persistido.
- **Componentes de interface**: Botão (primário/secundário/terciário, tamanhos G/M/P, bolha A/B),
  Botão de ícone, Pílula de HUD (pontos, comidas, tempo), Painel/Diálogo, Título com contorno e
  Cartão de resultado. São peças visuais reutilizadas pelas telas, sem regra de jogo.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% das telas existentes (inicial, partida, pausa, fim de jogo com nome e ranking)
  usam só fontes, cores e componentes do design system. Uma revisão visual lado a lado com as
  composições de referência não encontra nenhuma cor fora da paleta, fonte genérica ou emoji.
- **SC-002**: O jogo mantém 60 FPS estáveis durante uma partida de pelo menos 2 minutos na
  dificuldade máxima, como antes da reestilização.
- **SC-003**: Em 20 cliques seguidos sobre baratas, incluindo baratas passando perto do HUD, a taxa
  de acerto e a resposta ao clique são as mesmas de antes da reestilização (nenhum clique válido
  perdido por causa de um elemento de interface).
- **SC-004**: Todos os pares de texto e fundo usados atingem o contraste listado no design system
  (mínimo 4,5:1 para texto normal; 4,3:1 só para texto de 24px ou mais).
- **SC-005**: Nas duas bases (960×600 e 480×960), nenhum texto aparece cortado e nenhum elemento se
  sobrepõe a outro ou às prateleiras, inclusive com pontuação de 5 dígitos e nome de 10
  caracteres.
- **SC-006**: A primeira tela aparece com as fontes do design system em no máximo 1 segundo após o
  carregamento dos assets no perfil de rede "Fast 4G" do DevTools. Se as fontes falharem, o jogo continua jogável.
- **SC-007**: O fluxo completo (iniciar → pausar → retomar → perder → digitar nome → ver ranking →
  reiniciar) funciona do início ao fim sem recarregar a página, com o mesmo comportamento de antes.
- **SC-008**: O `backlog.md` lista cada peça do design system fora do escopo (FR-027) como item
  próprio e priorizado.

## Assumptions

- Os assets do design system já copiados em `client/` (fontes, ícones, personagem, tokens e
  classes de estilo) são a versão aprovada e serão versionados junto com esta feature. A pasta
  `docs/borges-design-system/` fica como referência.
- O pré-design foi feito para 960×540. Os tamanhos de componente continuam valendo nas bases
  960×600 e 480×960; só a composição das telas se ajusta.
- O jogo continua se passando na geladeira. O interior dela usa `céu` chapado (ver Clarifications),
  sem adotar o cenário céu/chão/morro do pré-design (que vai para o backlog).
- As comidas restantes são representadas por uma pílula com o ícone de coração e o formato
  "N / total", e não por um coração por comida: são 9 comidas, e o componente de vidas do design
  system foi pensado para 3.
- O botão de reiniciar do fim de jogo passa a se chamar "DE NOVO!", como no design system, e
  continua reiniciando a partida diretamente. O botão "MENU" é item de backlog.
- O personagem Borges (SVGs já copiados) não aparece nesta feature; os arquivos ficam no projeto
  para uso futuro.
- Os sprites atuais da pata e das baratas continuam os mesmos; seu redesenho com o traço preto é
  item de backlog.
- A forma técnica de desenhar menus e HUD (no próprio canvas ou em camada de elementos por cima)
  será decidida no plano, desde que cumpra FR-017, FR-019 e FR-021 e mantenha SC-002 e SC-003.
- O item de backlog "Substituir sprites placeholder por arte final" é atendido só em parte (fundo,
  prateleiras e comidas passam a seguir a paleta); a arte final da barata e da pata continua
  pendente.
