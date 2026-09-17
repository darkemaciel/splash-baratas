# Feature Specification: Pausar Partida

**Feature Branch**: `009-pausar-partida`

**Created**: 2026-09-17

**Status**: Draft

**Input**: User description: "Pausar partida (P1 do backlog, seção 1 \"Jogabilidade e feedback sensorial\"): permitir que o jogador pause e retome a partida em andamento através de uma tecla/botão de pausa, que congela o `tick()` do `MatchStateManager` (spawn de baratas, movimento/trajeto, detecção de roubo) sem resetar o `Match` nem perder o progresso atual (comidas restantes, vida, pontuação, cronômetro de sobrevivência). O loop principal já é orientado por timestamp (`now` via `this.time.now`), então pausar deve significar simplesmente parar de avançar esse relógio lógico (e o cronômetro de sobrevivência junto) enquanto pausado, retomando exatamente de onde parou ao despausar — sem qualquer penalidade ou perda de estado. Clique não deve eliminar baratas enquanto pausado. Fora de escopo: multiplayer, pausa automática ao perder foco da aba (pode ser considerado como melhoria futura, mas não é requisito desta spec), e qualquer persistência de pausa entre sessões."

## Clarifications

### Session 2026-09-17

- Q: Quando a partida é pausada, os efeitos puramente visuais — tweens de queda/roubo já em andamento e o tremor/squash contínuo do "juice" (spec 008) — devem congelar junto com o trajeto, ou podem continuar terminando/animando normalmente? → A: Tudo congela (screenshot estático) — nenhuma animação visual continua, nem tweens já em andamento nem o juice; cada uma retoma exatamente do ponto visual em que estava ao despausar.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Pausar e retomar sem perder progresso (Priority: P1)

Enquanto joga, o jogador quer poder pausar a partida a qualquer momento e retomá-la depois exatamente de onde parou, para poder se afastar da tela sem perder o progresso conquistado até ali (comidas salvas, vida, pontuação e tempo de sobrevivência).

**Why this priority**: É o valor central da feature — sem a capacidade de pausar e retomar fielmente, não existe nenhum benefício; o resto (bloquear cliques, indicar visualmente) só importa porque a pausa em si passa a existir.

**Independent Test**: Iniciar uma partida, deixar avançar até haver progresso visível (algumas baratas eliminadas, comidas roubadas, tempo decorrido), pausar, aguardar alguns segundos, retomar e confirmar que vida, comidas restantes, pontuação, tempo de sobrevivência e a posição de cada barata em seu trajeto são exatamente os mesmos de antes da pausa (o trajeto continua do ponto congelado, não pula nem reinicia). Entrega valor sozinho, mesmo sem as demais histórias.

**Acceptance Scenarios**:

1. **Given** uma partida em andamento com baratas ativas em diferentes pontos do trajeto, **When** o jogador pausa, **Then** nenhuma barata continua se movendo, nenhuma nova barata surge, nenhuma comida é roubada, e toda animação visual em andamento (incluindo tweens de feedback de eliminação/roubo já iniciados e o efeito de squash/stretch/tremor) congela no frame exato em que estava, enquanto a partida estiver pausada.
2. **Given** uma partida pausada, **When** o jogador retoma, **Then** cada barata continua seu trajeto exatamente do ponto em que estava ao pausar, sem saltar posição nem reiniciar o tempo de viagem, e qualquer animação visual congelada (tween de feedback ou efeito de juice) retoma exatamente do ponto visual em que parou, sem pular nem reiniciar.
3. **Given** uma partida pausada por qualquer intervalo de tempo, **When** o jogador retoma, **Then** o cronômetro de tempo de sobrevivência, a pontuação, a vida e a contagem de comidas restantes permanecem exatamente iguais aos valores de antes da pausa, sem contar o tempo em que a partida esteve pausada.
4. **Given** uma partida em andamento, **When** o jogador pausa e retoma repetidamente em sequência rápida, **Then** o estado da partida permanece consistente a cada alternância, sem perda ou duplicação de progresso.

---

### User Story 2 - Cliques não têm efeito enquanto pausado (Priority: P2)

Enquanto a partida está pausada, o jogador quer que cliques na tela não eliminem baratas nem contem como erro, para que pausar seja sempre uma ação segura, sem risco de perder pontuação ou vida por engano.

**Why this priority**: Preserva a integridade da pontuação e da vida, o núcleo de progresso do jogo — só faz sentido depois de a pausa (US1) existir, mas sem essa garantia a pausa se tornaria um risco (cliques acidentais durante a pausa) em vez de uma conveniência.

**Independent Test**: Pausar a partida com baratas visíveis na tela e clicar repetidamente sobre elas e fora delas; confirmar que nenhuma barata é eliminada, nenhum som de acerto/erro toca, e nem a pontuação nem a contagem de cliques perdidos mudam enquanto pausado.

**Acceptance Scenarios**:

1. **Given** uma partida pausada com uma barata visível na tela, **When** o jogador clica exatamente sobre a barata, **Then** a barata não é eliminada e nenhuma mudança de estado ocorre.
2. **Given** uma partida pausada, **When** o jogador clica em qualquer ponto vazio da tela, **Then** o clique não é registrado como erro (sem penalidade, sem quebra do combo de pontuação).

---

### User Story 3 - Saber visualmente que a partida está pausada (Priority: P3)

Enquanto a partida está pausada, o jogador quer ver de forma clara e imediata que o jogo está pausado (e não travado ou com problema técnico), para ter confiança de que pode retomar quando quiser.

**Why this priority**: É uma garantia de clareza que sustenta a confiança na feature, mas o valor central (US1) e a segurança contra cliques acidentais (US2) já existem sem essa indicação visual — sem ela, a pausa ainda funciona, apenas fica menos óbvia.

**Independent Test**: Pausar a partida e, sem nenhuma outra interação, observar a tela; confirmar que existe uma indicação visual inequívoca (ex.: mensagem ou overlay de "Pausado") visível enquanto a partida estiver pausada, e que ela desaparece imediatamente ao retomar.

**Acceptance Scenarios**:

1. **Given** uma partida em andamento, **When** o jogador pausa, **Then** uma indicação visual de "pausado" aparece imediatamente na tela.
2. **Given** uma partida pausada, **When** o jogador retoma, **Then** a indicação visual de "pausado" desaparece imediatamente e o jogo volta a se mover normalmente.

### Edge Cases

- O que acontece se o jogador pausar no instante exato em que uma barata alcançaria seu alvo? A chegada/roubo não deve ser antecipada nem perdida pela pausa — o trajeto fica congelado exatamente onde estava e o roubo só é avaliado quando a partida for retomada.
- O que acontece se o jogador tentar pausar antes de a partida começar (tela inicial) ou depois que ela já terminou (tela de derrota)? O controle de pausa não deve estar disponível fora de uma partida em andamento.
- O que acontece com o som ambiente de baratas voando enquanto pausado? Deve parar de tocar durante a pausa e retomar (se ainda houver baratas ativas) ao despausar, reforçando a sensação de jogo congelado.
- O que acontece se o jogador pausar exatamente durante uma animação de feedback já em andamento (queda de barata eliminada, encolhimento de comida roubada) ou durante o efeito contínuo de squash/stretch/tremor (specs/008-juice-animacao-barata) de uma barata ativa? A animação congela no frame exato em que estava — nenhuma animação visual, mesmo uma já disparada antes da pausa, continua tocando enquanto pausado — e retoma exatamente daquele ponto ao despausar.
- O que acontece se o jogador pausar e retomar sem que nenhum tempo perceptível se passe? O estado deve permanecer idêntico, sem nenhum efeito colateral perceptível de uma pausa muito curta.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema DEVE permitir ao jogador pausar uma partida em andamento através de um controle acessível por clique/toque na tela.
- **FR-002**: O sistema DEVE permitir ao jogador retomar uma partida pausada através de um controle acessível por clique/toque na tela.
- **FR-003**: Enquanto pausado, o sistema NÃO DEVE avançar o trajeto de nenhuma barata ativa — cada uma permanece exatamente na posição em que estava no instante da pausa.
- **FR-004**: Enquanto pausado, o sistema NÃO DEVE spawnar novas baratas.
- **FR-005**: Enquanto pausado, o sistema NÃO DEVE processar a chegada de nenhuma barata ao seu alvo (nenhum roubo de comida é avaliado ou concluído durante a pausa).
- **FR-006**: Ao retomar, cada barata ativa DEVE continuar seu trajeto exatamente do ponto em que estava ao pausar, preservando o tempo de viagem já decorrido antes da pausa.
- **FR-007**: Enquanto pausado, cliques/toques do jogador NÃO DEVEM eliminar nenhuma barata, mesmo que caiam exatamente sobre a posição de uma barata visível.
- **FR-008**: Enquanto pausado, cliques/toques do jogador NÃO DEVEM ser contabilizados como clique perdido nem quebrar nenhuma sequência de combo de pontuação em andamento.
- **FR-009**: O cronômetro de tempo de sobrevivência DEVE parar de avançar enquanto pausado e retomar a contagem exatamente de onde parou ao despausar — o tempo em que a partida esteve pausada nunca é contabilizado como tempo de sobrevivência.
- **FR-010**: Pausar e retomar a partida NÃO DEVE alterar nenhum valor de progresso existente (comidas restantes, vida, pontuação, sequência de combo) além de congelar/retomar o avanço do tempo.
- **FR-011**: O controle de pausa DEVE estar disponível apenas durante uma partida em andamento — indisponível antes do início da partida e depois que ela termina em derrota.
- **FR-012**: Enquanto pausado, o sistema DEVE exibir uma indicação visual clara e imediata de que a partida está pausada, removida imediatamente ao retomar.
- **FR-013**: Enquanto pausado, o sistema DEVE congelar toda animação visual em andamento — incluindo tweens de feedback de eliminação de barata, tweens de feedback de roubo de comida, e o efeito contínuo de squash/stretch/tremor (specs/008-juice-animacao-barata) — retomando cada uma exatamente do ponto visual em que estava ao pausar, sem pular nem reiniciar.
- **FR-014**: O sistema DEVE permitir pausar e retomar a partida também através de um atalho de teclado (tecla "P"), além do controle acessível por clique/toque — conveniência adicional para desktop, nunca a única forma de pausar/retomar (Princípio III).

### Key Entities

- **Estado de Pausa**: Não é uma nova entidade de progresso — é um estado booleano da partida corrente (pausado/não pausado) que determina se o relógio lógico da partida (usado para trajeto das baratas, spawn e cronômetro) avança ou não. Não persiste entre partidas nem é lido por nenhuma regra de pontuação ou derrota além de decidir se o tempo avança.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Em 100% das partidas pausadas e retomadas, o estado observável ao retomar (vida, comidas restantes, pontuação, posição relativa de cada barata em seu trajeto, e o frame de qualquer animação visual em andamento) é idêntico ao estado exato do momento em que a pausa começou.
- **SC-002**: Nenhum clique realizado enquanto a partida está pausada resulta em eliminação de barata, penalidade de clique perdido ou quebra de combo, em 100% dos casos observados.
- **SC-003**: Jogadores identificam se a partida está pausada ou em andamento em menos de 2 segundos, apenas observando a tela, sem precisar interagir para descobrir.
- **SC-004**: O tempo total em que uma partida esteve pausada nunca é somado ao tempo de sobrevivência exibido, independentemente de quantas vezes o jogador pausar e retomar na mesma partida.

## Assumptions

- O controle de pausa é um elemento clicável/tocável na própria tela de jogo (seguindo o mesmo padrão já usado para os botões de `StartScene`/`GameOverScene`: `setInteractive({ useHandCursor: true })` + evento `pointerdown`), atendendo ao Princípio III. Um atalho de teclado (tecla "P", FR-014) existe como conveniência adicional — nenhuma interação essencial desta feature depende exclusivamente de teclado.
- "Congelar o relógio lógico da partida" é entendido como impedir que o tempo decorrido (usado por `progress`/`positionAt` das baratas e por `elapsedMs` do cronômetro) avance durante a pausa — a forma exata de implementar isso (parar a `Scene`, ajustar timestamps armazenados no `Match`, ou outra abordagem) fica em aberto para `/speckit-plan`.
- Pausar não afeta o resultado final da partida além de congelar o avanço do tempo — não há penalidade de pontuação, vida ou combo por pausar, nem limite de quantas vezes ou por quanto tempo o jogador pode pausar.
- Multiplayer, pausa automática ao perder foco da aba/janela, e persistência do estado de pausa entre sessões/recarregamentos de página estão fora de escopo desta spec (podem virar itens futuros do backlog, se necessário).
- Nenhuma mudança de regra de derrota, pontuação ou spawn é introduzida por esta feature — pausar apenas congela e retoma o avanço do tempo já existente.
