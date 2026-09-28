# Feature Specification: Pontuação flutuante "+N!"

**Feature Branch**: `feat/pontuacao-flutuante` (criada a partir de `feat/navegacao-pausa-fim`; 017 e 018 sobem antes)

**Created**: 2026-09-28

**Status**: Draft

**Input**: User description: "Pontuação flutuante '+N!' do design system 'Grotesco Surreal' (componente PontuacaoFlutuante, item P1 da seção 8 do backlog.md): quando o jogador elimina uma barata, os pontos ganhos naquela eliminação aparecem como um número com contorno ('+N!'), sobem 48px e somem em 720ms (ease-out), inclinados 8°. Ajuste do usuário: o número nasce logo acima da pata do gato (o cursor), para indicar que a barata foi acertada."

**Referências**: `docs/borges-design-system/design-system/components/PontuacaoFlutuante/README.md`
e `docs/borges-design-system/design-system/README.md` (§ Tipografia, título com contorno; §
Movimento). Pontuação existente: `specs/004-sistema-pontuacao`. Base visual: `specs/017`.

## Clarifications

### Session 2026-09-28

- Q: Onde o número nasce? → A: Logo acima da pata do gato (o cursor), no instante do clique que
  eliminou a barata, para indicar que a barata foi acertada. Como o número fica fora da barata e
  fora da pata, não é preciso definir uma ordem de desenho entre número, baratas e HUD.
- Q: Depois de nascer, o "+N!" fica parado no ponto do acerto ou acompanha a pata quando o mouse se
  move? → A: Fica preso ao ponto do acerto e sobe dali, independente do movimento do mouse.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Ver quantos pontos cada barata rendeu (Priority: P1)

Como jogador, quando acerto uma barata quero ver na hora, logo acima da pata que deu o tapa,
quantos pontos aquela barata me deu, para sentir a recompensa do clique rápido e dos combos sem tirar os olhos da
geladeira.

**Why this priority**: é a única história da feature. Hoje os pontos só mudam na pílula do HUD, no
canto da tela, e o jogador não percebe o bônus de reação nem o de combo no momento do acerto. O
número flutuante é o retorno mais direto do design system para o clique, que é o núcleo do jogo.

**Independent Test**: jogar uma partida e eliminar baratas: a cada acerto aparece "+N!" logo acima
da pata, sobe e some em menos de um segundo, e a soma dos números mostrados é igual ao aumento da
pílula PONTOS do HUD. Eliminar duas baratas em sequência rápida e confirmar que cada uma tem o
próprio número, que o segundo é maior quando há bônus de combo, e que clicar em outra barata
enquanto um número ainda sobe funciona normalmente.

**Acceptance Scenarios**:

1. **Given** uma partida em andamento, **When** o jogador elimina uma barata, **Then** aparece
   "+N!" (N = pontos daquela eliminação: base + bônus de reação + bônus de combo) logo acima da pata
   do gato, sem encostar nela, em texto branco com contorno preto e sombra dura, inclinado 8°.
2. **Given** um "+N!" recém-criado, **When** o tempo passa, **Then** o número sobe 48px e
   desaparece completamente em 720ms, com desaceleração no fim (ease-out), e deixa de existir
   depois disso.
3. **Given** um "+N!" ainda subindo, **When** o jogador clica numa barata que passa atrás ou perto
   dele, **Then** a eliminação acontece normalmente: o número nunca bloqueia nem atrasa o clique.
4. **Given** duas ou mais eliminações rápidas (combo), **When** cada uma acontece, **Then** cada uma
   tem o próprio número, com os pontos dela, sem substituir nem somar os anteriores.
5. **Given** uma pontuação de uma única eliminação maior que 999 (se algum dia ocorrer), **When**
   ela aparece, **Then** usa ponto de milhar (ex.: "+1.250!").
6. **Given** a preferência do sistema "reduzir movimento" ativa, **When** uma barata é eliminada,
   **Then** o "+N!" aparece parado, sem subir, e some ao fim dos mesmos 720ms.
7. **Given** um "+N!" subindo, **When** o jogador pausa, **Then** o número congela junto com o resto
   da partida e continua de onde parou ao retomar.

---

### Edge Cases

- **Perto das bordas**: um acerto com a pata perto de uma borda (em especial no topo, onde não
  cabe o número acima dela) gera um número inteiramente visível: ele é deslocado para dentro da
  tela, sem cortar texto, nas bases 960×600 e 480×960. No topo, quando não cabe acima da pata
  (contando a subida de 48px), o número aparece **ao lado** da pata, à direita, ou à esquerda perto
  da borda direita, na altura dela. Nunca fica embaixo nem por cima da pata.
- **Mouse em movimento**: se o jogador move a pata logo depois do acerto, o número continua subindo
  no ponto onde nasceu. A pata pode passar por cima dele, e ela continua visível por cima.
- **Número sobre outra barata**: como nasce acima da pata, o número pode passar por um instante na
  frente de outra barata. Isso não afeta a mira, porque o número não recebe cliques (FR-006) e o
  acerto usa a posição real do ponteiro.
- **Pata indisponível**: se a imagem da pata não carregou e o cursor é o nativo do sistema, o número
  nasce acima do ponto do clique, com a mesma distância que teria da pata.
- **Muitas eliminações seguidas**: vários números ao mesmo tempo, por exemplo em combos rápidos,
  não derrubam a taxa de quadros nem se acumulam depois de sumir.
- **Troca de tela no meio da animação**: reiniciar, encerrar a partida, perder, pausar e ir ao fim
  de jogo não deixam nenhum número pendurado na tela seguinte nem na partida nova.
- **Clique que não elimina**: um clique perdido, ou numa barata que já roubou a comida, não mostra
  número nenhum.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: A cada barata eliminada, o jogo MUST mostrar "+N!", em que N são exatamente os pontos
  somados à partida por aquela eliminação.
- **FR-002**: O número MUST nascer logo acima da pata do gato, no ponto do clique que eliminou a
  barata: centrado horizontalmente no ponteiro e com a base do número acima do topo da pata, com um
  pequeno respiro, sem encostar nela, considerando a inclinação do número e o tamanho e o giro da
  pata durante o tapa. Ele é ajustado só o necessário para caber inteiro na tela
  (FR-008). Depois de nascer, o número MUST ficar preso a esse ponto (sobe a partir dele) e MUST NOT
  acompanhar a pata quando o mouse se move.
- **FR-003**: O visual MUST seguir o componente PontuacaoFlutuante do design system: fonte display
  (Luckiest Guy) no tamanho de pontuação flutuante (40), branco, contorno preto de 3px em volta,
  sombra dura preta de 5px para baixo e à direita, sem desfoque, inclinado 8° no sentido horário
  (como o `rotate(8deg)` da referência).
- **FR-004**: O número MUST subir 48px e desaparecer (opacidade até zero) em 720ms, com ease-out, e
  então deixar de existir.
- **FR-005**: Com a preferência "reduzir movimento" do sistema ativa, o número MUST aparecer parado
  (sem subir e sem girar durante a vida dele; a inclinação estática de 8° é mantida) e sumir ao fim
  de 720ms.
- **FR-006**: O número MUST ser puramente visual: MUST NOT receber nem bloquear cliques, MUST NOT
  alterar a área de acerto de nenhuma barata e MUST NOT atrasar o processamento do clique.
- **FR-007**: O número MUST ficar sempre visível acima do cenário e do HUD. Não há regra de ordem
  entre número e baratas: como nasce acima da pata (FR-002), ele não cobre a barata acertada nem a
  pata, e a pata continua sendo o elemento desenhado por cima de tudo.
- **FR-008**: O número MUST ficar inteiramente dentro da área visível do jogo, sendo deslocado para
  dentro quando nasceria perto de uma borda ou fora dela, nas duas bases de layout.
- **FR-009**: Cada eliminação MUST ter o próprio número, independente dos outros, com a animação
  completa. Não há limite de números simultâneos além do ritmo natural de eliminações.
- **FR-010**: Pontos acima de 999 MUST usar ponto de milhar ("+1.250!").
- **FR-011**: Pausar a partida MUST congelar os números em andamento, e retomar MUST continuar a
  animação de onde parou.
- **FR-012**: Ao sair da partida (reiniciar, encerrar, perder, ir ao fim de jogo ou ao menu), nenhum
  número MUST permanecer na tela seguinte ou numa partida nova.
- **FR-013**: As regras de pontuação MUST NOT mudar. A única mudança no domínio permitida é tornar
  conhecidos, para a apresentação, os pontos de cada eliminação, que já são calculados hoje.
- **FR-014**: Um clique que não elimina barata (clique perdido ou barata que já alcançou a comida)
  MUST NOT mostrar número.

### Key Entities *(include if feature involves data)*

- **Eliminação de barata** (evento de domínio que já existe): passa a informar também os pontos
  obtidos, além de qual barata foi eliminada. Nenhum estado novo é guardado.
- **Pontuação flutuante** (apresentação): número temporário com valor, posição de nascimento (acima da
  pata, no ponto do clique) e ciclo de vida de 720ms. Não é persistido.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Em 20 eliminações seguidas, 100% mostram um "+N!", e a soma dos N mostrados é igual ao
  aumento da pontuação no HUD.
- **SC-002**: Cada número some da tela em até 720ms (com margem de um quadro) após aparecer.
- **SC-003**: Com números subindo, a taxa de acerto nas baratas e a resposta ao clique são as
  mesmas de uma partida sem números: nenhum clique válido é perdido por causa deles.
- **SC-004**: O jogo mantém 60 FPS numa sequência de 10 eliminações em até 5 segundos.
- **SC-005**: Nas duas bases, nenhum número aparece cortado nem embaixo da pata, inclusive em
  acertos junto às quatro bordas.
- **SC-006**: Depois de reiniciar, encerrar ou perder no meio de animações, 0 números aparecem na
  tela seguinte.

## Assumptions

- O número mostra só os pontos da eliminação ("+N!"). O multiplicador de combo e o selo de combo
  continuam fora de escopo (backlog §8, "Selo de combo").
- O ponto de nascimento vem da posição do ponteiro no clique que eliminou a barata, que é o
  mesmo ponto em que a pata está desenhada. A distância acima da pata usa a altura da pata definida
  pelo design system (56px, proporcional na base retrato).
- Nenhum som novo. O som de acerto que já existe continua igual.
- A variante menor do título com contorno (3px de contorno e 5px de sombra) passa a existir no kit
  visual, como o design system já prevê.
- Pontos acima de 999 numa única eliminação não acontecem com as regras atuais (base 100 + bônus).
  FR-010 cobre a hipótese para não depender disso.
