# Feature Specification: Navegação completa da pausa e do fim de jogo

**Feature Branch**: `feat/navegacao-pausa-fim` (criada a partir de `feat/design-system`; a 017 sobe primeiro)

**Created**: 2026-09-28

**Status**: Draft

**Input**: User description: "Completar o fluxo de navegação entre telas do design system 'Grotesco Surreal', juntando dois itens P1 da seção 8 do backlog.md numa spec só: (1) REINICIAR e ENCERRAR PARTIDA no painel de pausa, abaixo de CONTINUAR, como na Tela 03; (2) botões DE NOVO! e MENU lado a lado no fim de jogo, como na Tela 04, com MENU voltando ao menu inicial sem recarregar a página."

**Referências**: fluxo entre telas em `docs/borges-design-system/design-system/README.md` (§ Fluxo
entre telas); composições em `docs/borges-design-system/design-system/components/TelaPausa/preview.html`
e `TelaFimDeJogo/preview.html`. Base visual e componentes entregues por
`specs/017-design-system-grotesco`.

## Clarifications

### Session 2026-09-28

- Q: Uma partida encerrada pelo jogador (ENCERRAR PARTIDA) conta para o ranking Top 5? → A: Sim,
  igual a uma derrota normal: pede o nome e grava a pontuação no Top 5.
- Q: REINICIAR e ENCERRAR PARTIDA devem pedir confirmação antes de agir? → A: Sim, os dois pedem
  confirmação num diálogo do design system (componente Diálogo).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Recomeçar ou desistir a partir da pausa (Priority: P1)

Como jogador, quando pauso a partida, quero poder continuar, recomeçar do zero ou encerrar a
partida ali mesmo, para não precisar esperar perder todas as comidas quando a partida já não vale a
pena.

**Why this priority**: hoje a pausa só tem CONTINUAR. Para recomeçar, o jogador precisa perder a
partida inteira ou recarregar a página. É a lacuna de fluxo mais sentida e completa a Tela 03 do
design system.

**Independent Test**: iniciar uma partida, pausar e testar os três caminhos separadamente:
CONTINUAR (a partida segue de onde parou), REINICIAR + confirmação (uma partida nova começa na
hora, com 9 comidas, 0 pontos e tempo 0:00), ENCERRAR PARTIDA + confirmação (vai para a tela de
fim de jogo com a pontuação da partida interrompida) e o cancelamento de cada diálogo (volta à
pausa sem perder nada).

**Acceptance Scenarios**:

1. **Given** uma partida pausada, **When** o painel de pausa aparece, **Then** ele mostra, em
   pilha e nesta ordem, CONTINUAR (primário), REINICIAR (secundário) e ENCERRAR PARTIDA
   (terciário), todos do mesmo tamanho e com a mesma largura mínima de pilha, alternando as formas
   de bolha entre vizinhos.
2. **Given** uma partida pausada com pontos, comidas roubadas e tempo decorrido, **When** o jogador
   escolhe REINICIAR e confirma no diálogo "REINICIAR PARTIDA?", **Then** a pausa fecha e uma
   partida nova começa imediatamente, com todas as comidas de volta, pontuação zerada, tempo em
   0:00, nenhuma barata da partida anterior e a dificuldade de início de partida.
3. **Given** uma partida pausada, **When** o jogador escolhe ENCERRAR PARTIDA e confirma no diálogo
   "ENCERRAR PARTIDA?", **Then** a pausa fecha e a tela de fim de jogo aparece com a pontuação e o
   tempo da partida no momento da pausa, seguindo o mesmo fluxo de uma derrota normal.
4. **Given** uma partida pausada, **When** o jogador escolhe CONTINUAR ou aperta P, **Then** o
   comportamento é o de hoje (a partida segue de onde parou, sem perder tempo nem pontos).
5. **Given** o som ambiente de voo estava tocando antes da pausa, **When** o jogador reinicia ou
   encerra a partida, **Then** nenhum som da partida anterior volta a tocar nem fica "preso"
   pausado: a partida nova começa em silêncio até a primeira barata, e a tela de fim de jogo não
   tem o som de voo.
6. **Given** o diálogo de confirmação aberto (de REINICIAR ou de ENCERRAR PARTIDA), **When** o
   jogador escolhe CONTINUAR no diálogo, **Then** o diálogo fecha e o painel de pausa volta a
   aparecer, com a partida ainda pausada e intacta.

---

### User Story 2 - Voltar ao menu inicial depois de perder (Priority: P2)

Como jogador, na tela de fim de jogo quero escolher entre jogar de novo e voltar ao menu inicial,
para poder parar de jogar sem recarregar a página e rever a tela de abertura.

**Why this priority**: DE NOVO! já existe. O que falta é o caminho de volta ao menu, que fecha o
fluxo do design system (Tela 04 → Tela 01). É útil, mas menos urgente que a pausa.

**Independent Test**: perder (ou encerrar) uma partida, confirmar o nome, escolher MENU e ver a
tela inicial com o botão JOGAR funcionando. Depois, a partir do menu, jogar uma partida nova
completa sem recarregar a página.

**Acceptance Scenarios**:

1. **Given** a etapa de resultado do fim de jogo, **When** ela aparece, **Then** DE NOVO!
   (primário) e MENU (secundário) ficam lado a lado, com formas de bolha diferentes, abaixo do
   cartão do Top 5.
2. **Given** a etapa de resultado, **When** o jogador escolhe MENU, **Then** a tela inicial
   aparece (logo e JOGAR) sem recarregar a página, e nada da partida ou do fim de jogo fica
   visível.
3. **Given** o jogador voltou ao menu, **When** ele escolhe JOGAR, **Then** uma partida nova
   começa normalmente, igual à primeira partida da sessão.
4. **Given** a etapa de resultado, **When** o jogador escolhe DE NOVO!, **Then** o comportamento é o
   de hoje (partida nova imediatamente).
5. **Given** a etapa de entrada de nome, **When** ela está aberta, **Then** DE NOVO! e MENU ainda
   não aparecem: eles surgem só depois da confirmação do nome, como hoje.

---

### Edge Cases

- **Várias voltas pelo fluxo**: repetir pausa → REINICIAR, pausa → ENCERRAR → MENU → JOGAR e fim
  de jogo → DE NOVO! várias vezes seguidas não pode acumular elementos de tela, botões invisíveis
  de acessibilidade, sons ou ouvintes de evento de partidas anteriores.
- **Foco do teclado ao trocar de tela na pausa**: se o jogador abriu um diálogo pelo teclado (Tab +
  Enter), o foco vai para o botão CONTINUAR do diálogo (a ação segura), nunca para o de confirmar.
  Ao cancelar pelo teclado, o foco volta ao botão da pausa que abriu o diálogo. Com mouse ou toque,
  nenhum foco é movido (sem anel de foco inesperado).
- **Diálogo aberto e tecla P**: com o diálogo de confirmação aberto, P não faz nada. Fechar o
  diálogo (CONTINUAR) devolve o painel de pausa, e só então P volta a retomar a partida.
- **Tecla P depois de sair da pausa**: depois de REINICIAR ou ENCERRAR, apertar P na partida nova
  pausa normalmente, e na tela de fim de jogo não faz nada.
- **Clique duplo rápido**: dois cliques seguidos em REINICIAR, ENCERRAR PARTIDA, DE NOVO! ou MENU
  não podem iniciar duas partidas nem abrir duas telas de fim de jogo.
- **Encerrar com zero pontos**: encerrar uma partida logo no começo leva ao fim de jogo com 0
  pontos, seguindo o mesmo fluxo do ranking de uma derrota com 0 pontos.
- **Tempo da partida encerrada**: o tempo registrado para a partida encerrada é o do momento da
  pausa. O intervalo em que o jogo ficou pausado não conta.
- **Base retrato (480×960)**: a pilha de três botões e o par DE NOVO! + MENU cabem na largura sem
  cortar texto. Se o par não couber lado a lado, os dois ficam empilhados.
- **Botão Pausar da partida nova**: depois de REINICIAR, o botão Pausar da partida nova aparece no
  estado normal, não no estado ativo.

## Requirements *(mandatory)*

### Functional Requirements

**Pausa**

- **FR-001**: O painel de pausa MUST mostrar três ações em pilha, nesta ordem: CONTINUAR (primário,
  bolha A), REINICIAR (secundário, bolha B) e ENCERRAR PARTIDA (terciário, bolha A), todas no
  tamanho M e com a largura mínima de pilha do design system.
- **FR-002**: CONTINUAR e a tecla P MUST manter exatamente o comportamento atual.
- **FR-003**: REINICIAR MUST descartar a partida em andamento e iniciar uma partida nova
  imediatamente, no mesmo estado de uma partida iniciada pelo menu: todas as comidas presentes,
  pontuação zero, combo zerado, tempo 0:00, nenhuma barata e a dificuldade inicial.
- **FR-004**: A partida descartada por REINICIAR MUST NOT entrar no ranking Top 5 nem pedir nome.
- **FR-005**: ENCERRAR PARTIDA MUST terminar a partida em andamento e levar à tela de fim de jogo,
  com a pontuação e o tempo que a partida tinha no momento da pausa (sem contar o tempo pausado).
- **FR-006**: Uma partida encerrada por ENCERRAR PARTIDA MUST seguir o mesmo fluxo de uma derrota
  normal na tela de fim de jogo: pedir o nome e registrar a pontuação no ranking Top 5, que mostra
  a posição alcançada, se houver (inclusive com 0 pontos, como numa derrota normal).
- **FR-007**: REINICIAR e ENCERRAR PARTIDA MUST pedir confirmação antes de agir, com o
  componente Diálogo do design system: painel creme de até 400px por cima do painel de pausa (que
  some enquanto o diálogo está aberto), título em display, uma linha de texto e dois botões P, com
  a ação que cancela à esquerda como terciário bolha B e a ação destrutiva à direita como primário
  bolha A. Textos:
  - REINICIAR → título "REINICIAR PARTIDA?", texto "Você perde esta partida e começa outra do
    zero.", botões CONTINUAR e REINICIAR.
  - ENCERRAR PARTIDA → título "ENCERRAR PARTIDA?", texto "Você vai direto para a tela de fim de
    jogo.", botões CONTINUAR e ENCERRAR.
- **FR-007a**: CONTINUAR no diálogo MUST fechar o diálogo e mostrar de novo o painel de pausa, com
  a partida ainda pausada. Ele não retoma o jogo. Só a ação destrutiva do diálogo executa FR-003 ou
  FR-005.
- **FR-007b**: Com o diálogo aberto, a tecla P MUST NOT retomar a partida (evita retomar o jogo com
  uma confirmação na tela). O acesso por teclado vem do foco (Tab) nos dois botões do diálogo.

**Fim de jogo**

- **FR-008**: A etapa de resultado do fim de jogo MUST mostrar DE NOVO! (primário, bolha A) e MENU
  (secundário, bolha B), tamanho M, lado a lado e centralizados abaixo do cartão do Top 5. Na base
  retrato, se não couberem lado a lado, MUST ficar empilhados, com DE NOVO! em cima.
- **FR-009**: DE NOVO! MUST manter o comportamento atual (partida nova imediatamente).
- **FR-010**: MENU MUST levar à tela inicial (logo + JOGAR) sem recarregar a página. A partir dela,
  JOGAR MUST iniciar uma partida nova normalmente.
- **FR-011**: DE NOVO! e MENU MUST aparecer só na etapa de resultado, depois da confirmação do
  nome, nunca durante a entrada de nome.

**Transversais**

- **FR-012**: Ao reiniciar, encerrar ou voltar ao menu, nenhum som da partida anterior MUST
  continuar tocando ou ficar pausado para ser retomado depois (em especial o som ambiente de voo).
  A preferência de som (mudo/ligado) MUST continuar valendo.
- **FR-013**: Nenhum elemento visual, controle, botão de acessibilidade ou ouvinte de evento de uma
  tela, diálogo ou partida anterior MUST permanecer ativo depois de uma transição (pausa → partida nova,
  pausa → fim de jogo, fim de jogo → menu, fim de jogo → partida nova).
- **FR-014**: Cada ação de navegação MUST ter efeito uma única vez, mesmo com cliques repetidos
  rápidos no mesmo botão ou acionamento duplo por clique e teclado.
- **FR-015**: Todos os botões novos MUST seguir o componente Botão do design system já em uso
  (formas, cores, sombras, hover, pressionado, foco de teclado e rótulo acessível), funcionar por
  Pointer Events e deixar a pata do cursor visível por cima.
- **FR-015a**: Quando o diálogo é aberto ou fechado a partir do teclado, o foco MUST ir para o botão
  CONTINUAR do diálogo (ao abrir) ou para o botão da pausa que o abriu (ao cancelar). Com mouse ou
  toque, o foco não é movido.
- **FR-016**: Os botões novos MUST caber sem cortes nas bases paisagem (960×600) e retrato
  (480×960), e nenhum deles MUST ficar sobre a faixa de clique das prateleiras enquanto uma
  partida está ativa (a pausa e o fim de jogo cobrem o jogo com a sobreposição, sem partida
  correndo).
- **FR-017**: As regras de jogo MUST NOT mudar, com uma exceção: passa a existir a forma de
  terminar voluntariamente uma partida em andamento (FR-005). As demais regras (spawn, roubo,
  eliminação, pontuação, dificuldade, pausa, ranking) continuam idênticas.

### Key Entities *(include if feature involves data)*

- **Partida**: ganha um segundo jeito de terminar, "encerrada pelo jogador", além de "perdida"
  (todas as comidas roubadas). Nos dois casos, a pontuação e o tempo ficam congelados no instante
  do término.
- **Ranking Top 5**: sem mudança de formato. Recebe partidas encerradas pelo jogador exatamente
  como recebe derrotas (FR-006).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A partir da pausa, o jogador chega a uma partida nova em 2 cliques (REINICIAR +
  confirmar) e à tela de fim de jogo em 2 cliques (ENCERRAR PARTIDA + confirmar), sem recarregar a
  página. Cancelar qualquer um dos diálogos devolve a pausa sem alterar pontos, comidas ou tempo.
- **SC-002**: A partir do fim de jogo, o jogador volta ao menu inicial em 1 clique (MENU), e dali a
  uma partida nova em mais 1 clique (JOGAR).
- **SC-003**: Depois de 10 ciclos seguidos passando por todos os caminhos (pausa → REINICIAR →
  cancelar → REINICIAR → confirmar; pausa → ENCERRAR → confirmar → nome → MENU → JOGAR; fim de
  jogo → DE NOVO!), a partida continua a 60 FPS e
  não há nenhum elemento, som ou botão de acessibilidade duplicado.
- **SC-004**: Em 100% das partidas iniciadas por REINICIAR, DE NOVO! ou MENU → JOGAR, o estado
  inicial (9 comidas, 0 pontos, 0:00, sem baratas) é idêntico ao da primeira partida da sessão.
- **SC-005**: A pontuação mostrada no fim de jogo após ENCERRAR PARTIDA é igual à que estava no HUD
  no instante da pausa, e o tempo registrado para a partida é o do instante da pausa (a tela de fim
  de jogo não exibe o tempo; ele é verificado pelo registro da partida).
- **SC-006**: O painel de pausa e o fim de jogo seguem as composições das Telas 03 e 04 do design
  system nos elementos cobertos por esta spec, sem cortes nas duas bases.

## Assumptions

- A tela de fim de jogo continua com o título "FIM DE JOGO!" também quando a partida foi encerrada
  pelo jogador. Não há texto diferente para desistência.
- O diálogo de confirmação segue o componente Diálogo do design system (título, texto e os botões
  CONTINUAR/ENCERRAR da referência). O texto e os botões do diálogo de REINICIAR foram escritos no
  mesmo padrão, já que a referência só tem o de ENCERRAR.
- MENU leva à tela inicial atual, que tem só o logo e JOGAR. O botão OPÇÕES do menu do pré-design
  e a tela de Opções continuam fora de escopo (backlog §8).
- A tecla P continua sendo só "pausar/continuar". Não há atalhos de teclado novos para REINICIAR,
  ENCERRAR ou MENU; o acesso por teclado vem do foco (Tab) nos botões, já oferecido pelo kit de UI.
- O botão de som continua disponível em todas as telas, na mesma posição.
