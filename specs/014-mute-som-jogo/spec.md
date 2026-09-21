# Feature Specification: Mute e Desmute do Som do Jogo

**Feature Branch**: `014-mute-som-jogo`

**Created**: 2026-09-20

**Status**: Draft

**Input**: User description: "Adicionar um botão/controle de mute e desmute do som do jogo, permitindo ao jogador silenciar e reativar os efeitos sonoros (e música, se houver) a qualquer momento durante a partida."

## Clarifications

### Session 2026-09-20

- Q: Qual deve ser o estado padrão do áudio na primeiríssima vez que o jogador abre o jogo, antes de qualquer preferência salva existir? → A: Som ativo por padrão (jogador precisa mutar explicitamente)
- Q: O que o jogo deve fazer se o navegador bloquear ou não suportar a persistência local da preferência de mute (ex.: modo privado/anônimo, armazenamento desabilitado)? → A: Mute funciona normalmente na sessão atual, mas não persiste entre sessões (degrada graciosamente)

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Silenciar todo o áudio do jogo com um clique (Priority: P1)

Como jogador, eu quero silenciar todos os sons do jogo (efeitos sonoros e som ambiente) com um
único controle, para jogar sem áudio quando estiver em um ambiente que exige silêncio, sem precisar
alterar o volume do sistema operacional ou do navegador.

**Why this priority**: É o valor central do item de backlog — sem essa ação básica, a feature não
entrega nada. Depende diretamente do sistema de SFX já entregue em `specs/003-feedback-sonoro-sfx`.

**Independent Test**: iniciar uma partida com som ativo, acionar o controle de mute, e confirmar que
nenhum som (acerto, erro, roubo, ambiente de voo) é reproduzido enquanto o mute estiver ativo, mesmo
que os eventos de jogo que normalmente disparariam esses sons continuem ocorrendo.

**Acceptance Scenarios**:

1. **Given** uma partida em andamento com áudio ativo, **When** o jogador aciona o controle de mute,
   **Then** todo som em reprodução (incluindo o loop ambiente de voo, se estiver tocando) para
   imediatamente e nenhum novo som é reproduzido enquanto o mute permanecer ativo.
2. **Given** o mute ativo, **When** eventos que normalmente disparam som ocorrem (eliminar barata,
   errar clique, barata rouba comida), **Then** nenhum som é reproduzido, mas o restante do
   comportamento do jogo (visual, pontuação, estado da partida) continua inalterado.

---

### User Story 2 - Reativar o áudio a qualquer momento (Priority: P1)

Como jogador, eu quero reativar o som do jogo a qualquer momento após tê-lo silenciado, para voltar
a ouvir o feedback sonoro sem precisar reiniciar a partida.

**Why this priority**: Completa o par mute/desmute que dá nome à feature; um controle que só
silencia sem permitir reverter não atende ao pedido original.

**Independent Test**: com o mute ativo, acionar novamente o controle e confirmar que os sons voltam
a ser reproduzidos nos eventos de jogo seguintes, incluindo o retorno do som ambiente de voo se
houver baratas ativas em cena no momento da reativação.

**Acceptance Scenarios**:

1. **Given** o mute ativo e ao menos uma barata ativa em cena, **When** o jogador desativa o mute,
   **Then** o som ambiente de voo volta a tocar (se aplicável ao estado atual) e os próximos eventos
   sonoros (acerto, erro, roubo) voltam a produzir áudio normalmente.
2. **Given** o mute ativo, **When** o jogador desativa o mute e em seguida elimina uma barata,
   **Then** o som de acerto toca normalmente, como se o mute nunca tivesse sido ativado.

---

### User Story 3 - Ver o estado atual do áudio e persistir a preferência (Priority: P2)

Como jogador, eu quero identificar visualmente se o som está ativo ou silenciado, e ter essa
preferência lembrada entre partidas, para não precisar reconfigurar o áudio toda vez que jogo.

**Why this priority**: Melhora a usabilidade do controle central (US1/US2), mas o jogo já é
plenamente utilizável sem persistência ou indicação visual explícita — o controle funcionaria de
forma binária mesmo sem esses refinamentos.

**Independent Test**: silenciar o áudio, observar que o controle muda de aparência para refletir o
estado "mudo", recarregar a página/reiniciar o jogo, e confirmar que o áudio permanece silenciado e
o controle exibe o estado correto sem exigir nova ação do jogador.

**Acceptance Scenarios**:

1. **Given** o áudio ativo, **When** o jogador observa o controle de mute, **Then** sua aparência
   indica claramente que o som está ligado (e o inverso quando estiver mudo).
2. **Given** o jogador silenciou o áudio e encerrou/recarregou o jogo, **When** ele inicia uma nova
   sessão, **Then** o jogo carrega com o áudio já silenciado, refletindo a última preferência
   escolhida.

---

### Edge Cases

- O que acontece se o jogador acionar o mute durante o loop do som ambiente de voo? → O loop para
  imediatamente junto com os demais sons (coberto por US1).
- O que acontece se o jogador desativar o mute no meio da partida, com baratas ativas em cena, mas
  antes de qualquer novo evento discreto (acerto/erro/roubo) ocorrer? → O som ambiente de voo deve
  retomar a reprodução assim que o mute é desativado, refletindo o estado atual da cena (coberto por
  US2, Acceptance Scenario 1).
- O que acontece se o jogador acionar o controle de mute repetidamente em rápida sucessão? → O
  estado final reflete a última ação (toggle simples); nenhum som "preso" tocando após o estado
  final ser mudo.
- O que acontece com o controle de mute na tela inicial (antes de iniciar a partida) e na tela de
  fim de jogo? → O controle e a preferência de mute são globais ao jogo, não apenas à partida em
  andamento — permanecem visíveis e funcionais em todas as telas (início, partida, fim de jogo).
- O que acontece se não houver nenhum som tocando no momento em que o mute é ativado (ex.: nenhuma
  barata em cena)? → O estado de mute é aplicado normalmente; nenhum som futuro toca até a
  reativação, mesmo sem nenhum efeito sonoro imediato perceptível no instante do toggle.
- O que acontece na primeiríssima vez que o jogo é aberto, sem nenhuma preferência de áudio salva
  ainda? → O jogo carrega com o áudio ativo por padrão (ver Clarifications), como se o jogador já
  tivesse escolhido "som ligado" — nenhuma ação é necessária para ouvir os sons pela primeira vez.
- O que acontece se o navegador bloquear ou não suportar a persistência local (ex.: modo
  privado/anônimo, armazenamento desabilitado)? → O controle de mute continua funcionando
  normalmente dentro da sessão atual; a preferência simplesmente não sobrevive a um reload ou nova
  sessão, sem impedir o uso do controle nem quebrar o jogo (ver Clarifications).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema DEVE prover um controle visível e acionável (via clique/toque) que alterna
  entre os estados "som ativo" e "som mudo" (mute).
- **FR-002**: Quando o mute estiver ativo, o sistema NÃO DEVE reproduzir nenhum som do jogo — nem
  efeitos discretos (acerto, erro, roubo), nem o som ambiente em loop — independentemente dos
  eventos de jogo que ocorrerem.
- **FR-003**: Ativar o mute DEVE interromper imediatamente qualquer som em reprodução no momento do
  acionamento, incluindo o loop ambiente de voo.
- **FR-004**: Desativar o mute DEVE restaurar a reprodução normal de som para todos os eventos
  subsequentes, incluindo retomar o som ambiente de voo se houver baratas ativas em cena no momento
  da reativação.
- **FR-005**: O controle de mute DEVE estar acessível e funcional em todas as telas do jogo (tela
  inicial, partida em andamento, tela de fim de jogo), refletindo um único estado global de áudio.
- **FR-006**: O controle DEVE exibir visualmente o estado atual do áudio (ativo ou mudo), de forma
  que o jogador identifique o estado sem precisar testar por tentativa e erro.
- **FR-007**: O sistema DEVE persistir a preferência de mute entre sessões, carregando o jogo com o
  último estado escolhido pelo jogador. Na primeiríssima vez que o jogo é aberto, sem nenhuma
  preferência salva, o estado padrão DEVE ser "som ativo". Se a persistência local não estiver
  disponível (ex.: modo privado/anônimo, armazenamento desabilitado), o controle de mute DEVE
  continuar funcionando normalmente durante a sessão atual, apenas sem sobreviver a um reload ou
  nova sessão.
- **FR-008**: Acionar o controle de mute NÃO DEVE introduzir atraso perceptível na resposta ao
  clique/toque do jogo (Princípio V) nem interferir no hit-testing das baratas.
- **FR-009**: O estado de mute NÃO DEVE afetar nenhum outro aspecto do jogo além do áudio — pontuação,
  progressão de dificuldade, spawn de baratas e condição de derrota continuam funcionando de forma
  idêntica com o som ativo ou mudo.

### Key Entities

- **Preferência de áudio**: estado binário global (ativo/mudo) que determina se qualquer som do jogo
  deve ser reproduzido; persiste entre sessões e é compartilhado por todas as telas do jogo.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Um jogador consegue silenciar completamente o jogo em um único clique/toque, a partir
  de qualquer tela.
- **SC-002**: Com o mute ativo, 100% dos eventos que normalmente produzem som ao longo de uma
  partida completa não produzem nenhum áudio.
- **SC-003**: Após desativar o mute, o próximo evento sonoro do jogo é audível sem atraso perceptível
  em relação ao padrão de responsividade já validado para os efeitos sonoros.
- **SC-004**: Um jogador que silencia o jogo e recarrega a página encontra o jogo já silenciado, sem
  precisar repetir a ação.

## Assumptions

- "Música", mencionada na descrição do pedido, ainda não existe como trilha separada no jogo (apenas
  os efeitos sonoros e o som ambiente de voo entregues em `specs/003-feedback-sonoro-sfx`); o
  controle de mute desta feature silencia todo o áudio do jogo como um único grupo, e se uma trilha
  musical for adicionada no futuro, ela deve respeitar o mesmo estado global de mute definido aqui.
- A preferência de mute é persistida localmente no navegador do jogador (mesmo mecanismo de
  persistência local já usado pelo ranking de high score em `specs/012-high-score-local`), sem
  sincronização entre dispositivos ou backend — alinhado ao Princípio II (client-only) do projeto.
- Não há controle granular de volume (ex.: slider) nesta feature — apenas o toggle binário
  mute/desmute pedido explicitamente; um controle de volume contínuo, se necessário, é tratado como
  feature própria futura.
- O controle de mute é único e global ao jogo (não há mute separado por categoria de som, como só
  efeitos ou só ambiente) — simplicidade deliberada alinhada ao Princípio IV.
