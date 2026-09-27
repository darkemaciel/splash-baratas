# Feature Specification: Cursor Animado da Pata do Gato

**Feature Branch**: `015-cursor-pata-animada`

**Created**: 2026-09-26

**Status**: Draft

**Input**: User description: "Cursor customizado com a pata do gato: substituir o cursor padrão por uma imagem de pata de gato (referência em client/public/assets/sprites/paw.jpg), com uma animação idle para deixá-la mais viva/animada enquanto o jogador move o cursor, e uma animação de \"golpe\" (a pata batendo) disparada no clique — tanto ao acertar uma barata quanto ao clicar em qualquer lugar da tela. Referências visuais adicionais em docs/references/. Baseado no item de backlog \"Cursor customizado + animação de locomoção da barata (andando/voando)\" (seção 3, P1) do backlog.md, mas esta spec cobre apenas a parte do cursor/pata — a animação de locomoção da barata (andando/voando) fica para uma spec futura separada."

## Clarifications

### Session 2026-09-26

- Q: A animação de golpe deve disparar em qualquer clique dentro da janela do jogo (inclusive em
  botões de menu de início/pausa/fim), ou só em cliques dentro da área de jogo ativa
  (comida/barata/espaço vazio durante a partida)? → A: Só durante a partida ativa — cliques em
  botões de menu não acionam o golpe.
- Q: Qual deve ser o tamanho máximo da pata do cursor, em relação aos elementos clicáveis da tela,
  para garantir que ela nunca cubra um botão de menu? → B: Tamanho relativo ao menor botão
  clicável da tela (no máximo ~50% da altura do menor botão de menu).
- Q (revisado em 2026-09-26, feedback de playtest): a regra acima gerou uma pata de ~13px de
  altura — pequena demais para reconhecer a forma de uma pata com garras. → A: Tamanho fixo e
  visível (56px de altura na base landscape, escalado por `UI_SCALE`), desacoplado do tamanho de
  qualquer botão. Cobrir visualmente um botão pequeno ao passar por cima dele não compromete o
  clique, já que o hit-test usa a posição real do ponteiro, nunca o sprite da pata (FR-010).
- Q (revisado em 2026-09-26, feedback de playtest): a animação idle original balançava a pata
  continuamente mesmo com o ponteiro parado; o usuário pediu o oposto — pata parada quando o
  ponteiro não se move, com uma leve inclinação na direção real do movimento (incluindo cima/baixo)
  enquanto ele se move. → A: substituída por uma inclinação reativa ao movimento (sem animação
  automática): ângulo-alvo calculado a partir da direção do deslocamento do ponteiro a cada frame,
  suavizado, com a pata retornando a 0° assim que o ponteiro para.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Cursor com a pata do gato substitui o ponteiro padrão (Priority: P1)

Como jogador, eu quero ver uma pata de gato animada no lugar do cursor padrão do sistema
operacional enquanto jogo, para que a experiência visual seja mais temática e divertida desde o
primeiro contato com o jogo.

**Why this priority**: é a base de toda a feature — sem o cursor customizado substituindo o
padrão, não há onde tocar a animação idle nem a animação de golpe. Entrega valor visual imediato
por si só, mesmo sem a animação de clique.

**Independent Test**: abrir o jogo, mover o ponteiro sobre a área do jogo e confirmar que o
cursor padrão do sistema desaparece, dando lugar à imagem da pata, que acompanha o movimento do
mouse sem atraso perceptível; ao mover o ponteiro em qualquer direção (incluindo para cima/baixo),
a pata inclina levemente para essa direção, e volta a ficar parada e reta assim que o ponteiro
para.

**Acceptance Scenarios**:

1. **Given** o jogo carregado e o cursor padrão do sistema ativo, **When** o jogador move o mouse
   para dentro da área do jogo, **Then** o cursor padrão é ocultado e a imagem da pata do gato
   passa a seguir a posição do ponteiro em tempo real.
2. **Given** a pata visível seguindo o ponteiro, **When** o jogador move o mouse em qualquer
   direção (incluindo para cima ou para baixo), **Then** a pata inclina levemente para a direção do
   movimento.
3. **Given** a pata inclinada por um movimento anterior, **When** o jogador mantém o mouse parado,
   **Then** a pata volta a ficar reta (0°), sem nenhuma animação automática enquanto parada.
4. **Given** a pata visível, **When** o ponteiro sai da janela do jogo, **Then** o cursor padrão do
   sistema volta a aparecer fora da janela.

---

### User Story 2 - Animação de golpe ao clicar (Priority: P2)

Como jogador, eu quero que a pata "bata" visualmente sempre que eu clicar, seja acertando uma
barata ou clicando em um espaço vazio da tela, para sentir mais impacto e satisfação a cada
clique.

**Why this priority**: constrói em cima da User Story 1 (depende do cursor customizado já estar
ativo) e adiciona feedback de impacto ao clique em si, mas o jogo já funciona plenamente com
apenas a pata parada/idle da User Story 1 — por isso vem em segundo lugar.

**Independent Test**: com o cursor da pata ativo, clicar em uma barata na tela e, em outro
momento, clicar em um espaço vazio (sem nenhuma barata sob o cursor); confirmar que a animação de
golpe da pata é disparada em ambos os casos, imediatamente no momento do clique.

**Acceptance Scenarios**:

1. **Given** a pata visível sobre uma barata em tela, **When** o jogador clica, **Then** a pata
   toca a animação de golpe e a barata é eliminada normalmente (feedback visual/sonoro de acerto já
   existente continua disparando no mesmo instante do clique).
2. **Given** a pata visível sobre um espaço vazio (sem barata sob o cursor), **When** o jogador
   clica, **Then** a pata toca a mesma animação de golpe, sem nenhum outro efeito de jogo.
3. **Given** uma animação de golpe em andamento, **When** o jogador clica novamente antes dela
   terminar, **Then** a animação reinicia imediatamente a partir do novo clique, sem fila de espera
   nem atraso na resposta visual.

---

### Edge Cases

- O que acontece se o asset da pata (imagem ou animação) falhar ao carregar? O cursor deve
  degradar graciosamente para o cursor padrão do sistema, sem quebrar cliques ou travar o jogo.
- O que acontece com cliques muito rápidos e sucessivos ("spam" de clique)? A animação de golpe
  deve reiniciar a cada clique, nunca acumular atraso ou fila (ver User Story 2, cenário 3).
- O que acontece durante a pausa da partida (`specs/009-pausar-partida`)? A pata continua
  respondendo a movimento e clique normalmente (os controles de pausa continuam clicáveis), mas
  nenhum efeito de acerto/erro de barata é disparado enquanto a partida estiver congelada —
  comportamento já garantido pelo `MatchStateManager` hoje.
- O que acontece em dispositivos sem ponteiro visível (touch)? Não há cursor de sistema para
  substituir nesse caso; a feature não tem efeito observável em touch (ver Assumptions — mobile
  já é fora do escopo funcional do MVP).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema DEVE ocultar o cursor padrão do sistema operacional e exibir a imagem da
  pata do gato em seu lugar em toda a janela do jogo (telas de início, partida, pausa e fim
  incluídas), com tamanho fixo e visível (56px de altura na base landscape, escalado por
  `UI_SCALE`) — cobrir visualmente um botão pequeno ao passar por cima dele não impede o clique,
  já que o hit-test usa a posição real do ponteiro, nunca o sprite da pata (FR-010).
- **FR-002**: O sistema DEVE manter a posição visual da pata sincronizada com a posição real do
  ponteiro em tempo real, sem atraso perceptível (Princípio V — responsividade do clique não é
  negociável).
- **FR-003**: O sistema DEVE manter a pata parada (sem nenhuma animação automática) quando o
  ponteiro não estiver em movimento, e inclinar levemente a pata na direção real do movimento do
  ponteiro (qualquer direção, incluindo para cima/para baixo) enquanto ele estiver se movendo,
  voltando a 0° assim que o movimento parar. Não se aplica durante a animação de golpe (FR-004).
- **FR-004**: O sistema DEVE tocar uma animação de "golpe" (a pata batendo) toda vez que o
  jogador clicar dentro do campo de jogo ativo durante a partida (sobre uma barata ou sobre um
  espaço vazio do campo), independentemente de o clique acertar uma barata ou não. Cliques em
  botões de menu (telas de início, pausa ou fim) NÃO DEVEM acionar essa animação.
- **FR-005**: A animação de golpe e a animação idle são puramente visuais e NÃO DEVEM atrasar,
  bloquear ou alterar o instante em que a detecção de acerto (hit-testing) e os efeitos de
  acerto/erro/roubo já existentes (`specs/003-feedback-sonoro-sfx`, FR-020 da spec do MVP) são
  disparados.
- **FR-006**: Se o jogador clicar novamente enquanto a animação de golpe anterior ainda estiver em
  andamento, o sistema DEVE reiniciar a animação imediatamente a partir do clique mais recente, sem
  enfileirar cliques nem atrasar a resposta visual.
- **FR-007**: A animação de golpe DEVE ser visualmente idêntica tanto ao acertar uma barata quanto
  ao clicar em um espaço vazio — o feedback de acerto/erro/roubo já existente (cor e som,
  `specs/003-feedback-sonoro-sfx`) continua sendo o responsável por diferenciar os dois casos; a
  pata só representa o impacto físico do clique.
- **FR-008**: Caso o asset visual da pata (imagem estática ou frames de animação) falhe ao
  carregar, o sistema DEVE reverter ao cursor padrão do sistema operacional em vez de quebrar a
  interação de clique, seguindo o mesmo padrão de degradação graciosa já usado em
  `specs/014-mute-som-jogo`.
- **FR-009**: A arte da pata (imagem estática, mesmo que ainda sem frames de animação dedicados —
  ver Assumptions) DEVE seguir a convenção de organização de assets do Princípio VI da
  constitution, residindo em `client/public/assets/sprites/`; as imagens de referência usadas para
  produzir essa arte permanecem em `docs/references/` e não são carregadas pelo jogo.
- **FR-010**: O cursor customizado NÃO DEVE alterar a hitbox real de colisão da barata
  (`CollisionSystem`, `specs/001-roach-fridge-clicker`) — é puramente uma camada visual sobreposta
  à posição real do ponteiro.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Ao mover o mouse sobre a área do jogo, a pata acompanha o ponteiro sem atraso
  perceptível (percepção de resposta imediata, no mesmo padrão do cursor nativo do sistema).
- **SC-002**: 100% dos cliques do jogador dentro do campo de jogo ativo durante a partida —
  acertando barata ou não — disparam a animação de golpe da pata, sem exceção. Cliques em botões
  de menu não disparam essa animação.
- **SC-003**: O tempo entre o clique físico do jogador e o efeito de eliminação da barata (ou
  ausência de efeito, em caso de clique vazio) permanece igual ao medido antes desta feature —
  a introdução do cursor animado não adiciona nenhum atraso perceptível à responsividade do clique.
- **SC-004**: Em uma sessão de playtest informal com pelo menos 3 jogadores, a maioria (≥2 de 3)
  relata espontaneamente perceber o novo cursor como mais "vivo"/divertido em comparação ao cursor
  padrão anterior.
- **SC-005**: A pata mede 56px de altura (escalada por `UI_SCALE`) em todas as telas do jogo — um
  tamanho reconhecível como pata de gato, verificável visualmente em cada resolução suportada.

## Assumptions

- O cursor customizado se aplica apenas a dispositivos com ponteiro visível (mouse/trackpad);
  dispositivos touch não exibem cursor de sistema, então esta feature não tem efeito observável
  neles — consistente com o MVP ser desktop-only (ver `CLAUDE.md`, `prd.md`).
- A arte final dedicada da pata (frames de animação desenhados especificamente para o golpe) ainda
  não existe. Esta spec descreve o comportamento esperado (parada quando o ponteiro não se move,
  inclinada na direção do movimento quando ele se move, golpe idêntico em acerto/erro), não a
  técnica de animação: a implementação inicial pode animar a imagem estática já
  existente (`client/public/assets/sprites/paw.png`) via transformações (rotação/escala) em vez de
  esperar por frames dedicados — mesmo padrão já usado no "juice" da barata
  (`specs/008-juice-animacao-barata`). Frames dedicados, se produzidos a partir das referências em
  `docs/references/`, podem substituir essa animação depois sem exigir mudança nesta spec.
- A animação de locomoção da barata (andando/voando), também mencionada no item de backlog
  original ("Cursor customizado + animação de locomoção da barata", seção 3 do `backlog.md`), fica
  fora do escopo desta spec e será tratada em uma spec futura separada.
- Esta feature é puramente de apresentação/render (Princípio I) — nenhuma regra de jogo, estado de
  partida ou lógica de colisão é alterada por ela.
