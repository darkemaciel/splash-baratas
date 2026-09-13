# Feature Specification: Feedback Sonoro (SFX)

**Feature Branch**: `003-feedback-sonoro-sfx`

**Created**: 2026-09-13

**Status**: Draft

**Input**: User description: "Feedback sonoro (SFX) — Adicionar efeitos sonoros ao jogo para reforçar o feedback sensorial das ações da barata. Os arquivos de áudio já existem em client/public/assets/audio/ (hit.mp3, miss.mp3, fly.mp3, steal.mp3, walk.mp3) e devem ser reproduzidos nos seguintes eventos: hit.mp3 ao eliminar uma barata; miss.mp3 ao clicar e não acertar nenhuma barata; fly.mp3 em loop enquanto houver ao menos uma barata ativa em cena; steal.mp3 quando uma barata rouba a comida-alvo; walk.mp3 reservado para uma futura feature de locomoção 'andando' ainda não implementada — deixar o asset disponível sem trigger funcional nesta feature. Item P0 do backlog.md, seção 1 'Jogabilidade e feedback sensorial': 'Feedback sonoro (SFX): Efeitos de eliminação de barata e de roubo de comida. MVP só tem feedback visual (FR-020). Requer popular client/public/assets/audio/ (Princípio VI).'"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Ouvir confirmação sonora ao eliminar uma barata (Priority: P1)

Como jogador, eu quero ouvir um som distinto no instante em que acerto e elimino uma barata, para
sentir confirmação imediata de que meu clique funcionou, sem depender só da animação visual de
eliminação.

**Why this priority**: É o evento mais frequente da partida (todo clique bem-sucedido) e o de
maior impacto no "game feel" — sem ele, a feature não entrega o valor central do item de backlog.

**Independent Test**: iniciar uma partida, esperar uma barata aparecer, clicar nela dentro do
hitbox e confirmar que o som de acerto (`hit.mp3`) toca no mesmo momento em que a barata é
removida da cena.

**Acceptance Scenarios**:

1. **Given** uma barata ativa em cena dentro do seu hitbox clicável, **When** o jogador clica/toca
   nela e a elimina, **Then** o som de acerto toca imediatamente, sem atraso perceptível em relação
   à remoção visual da barata.
2. **Given** duas baratas eliminadas em cliques consecutivos e muito próximos no tempo, **When** o
   segundo clique acerta antes do som do primeiro terminar, **Then** o som de acerto toca novamente
   (sobreposição permitida) sem cortar abruptamente nem travar o áudio anterior.

---

### User Story 2 - Ouvir feedback diferenciado ao errar o clique (Priority: P1)

Como jogador, eu quero ouvir um som diferente quando clico na tela e não acerto nenhuma barata,
para distinguir claramente um clique certeiro de um clique perdido sem precisar checar a tela.

**Why this priority**: Junto da User Story 1, fecha o par de feedback sonoro do core loop de
clique (acerto vs. erro), que é a ação mais repetida do jogo.

**Independent Test**: iniciar uma partida, clicar em uma área da tela onde não há nenhuma barata
sob o ponteiro no momento do clique, e confirmar que o som de erro (`miss.mp3`) toca — e que o som
de acerto não toca nesse mesmo clique.

**Acceptance Scenarios**:

1. **Given** uma partida em andamento, **When** o jogador clica/toca em um ponto que não contém
   nenhuma barata sob o hitbox, **Then** o som de erro toca e o som de acerto não toca nesse
   clique.
2. **Given** um clique que acerta uma barata, **When** o hit-testing confirma o acerto, **Then**
   apenas o som de acerto toca para esse clique (nunca os dois sons juntos no mesmo evento).

---

### User Story 3 - Ouvir a ameaça sonora das baratas em cena (Priority: P2)

Como jogador, eu quero ouvir um som ambiente de baratas voando enquanto houver pelo menos uma
barata ativa na tela, para sentir a presença/urgência da ameaça mesmo quando não estou olhando
diretamente para ela, e perceber pelo silêncio quando a cena está livre de baratas.

**Why this priority**: Reforça a tensão contínua da partida (item de "game feel" do backlog), mas
depende dos sons de evento discretos (US1/US2) já estarem funcionando primeiro; sem ele o jogo
ainda é jogável e tem feedback sonoro básico.

**Independent Test**: iniciar uma partida e observar que o som ambiente de voo começa a tocar
assim que a primeira barata da partida aparece; eliminar ou deixar roubar todas as baratas ativas
até a cena ficar momentaneamente sem nenhuma, e confirmar que o som ambiente para; deixar uma nova
barata surgir e confirmar que o som ambiente volta a tocar.

**Acceptance Scenarios**:

1. **Given** nenhuma barata ativa em cena, **When** a primeira barata da partida (ou de uma nova
   leva) surge, **Then** o som ambiente de voo começa a tocar em loop.
2. **Given** o som ambiente de voo tocando com uma ou mais baratas ativas, **When** a última barata
   ativa é eliminada ou rouba sua comida-alvo, **Then** o som ambiente para de tocar assim que a
   cena fica sem nenhuma barata ativa.
3. **Given** múltiplas baratas ativas simultaneamente, **When** algumas são eliminadas mas ao menos
   uma permanece ativa, **Then** o som ambiente continua tocando sem reiniciar nem duplicar (nunca
   mais de uma instância do loop audível ao mesmo tempo).
4. **Given** uma partida reiniciada a partir da tela de game over, **When** a nova partida começa
   sem nenhuma barata ainda spawnada, **Then** o som ambiente não está tocando (nenhum resíduo de
   áudio da partida anterior).

---

### User Story 4 - Ouvir a barata roubando a comida-alvo (Priority: P2)

Como jogador, eu quero ouvir um som específico no momento em que uma barata alcança e rouba sua
comida-alvo, para perceber claramente uma perda mesmo que meu foco visual estivesse em outra parte
da tela.

**Why this priority**: Cobre o segundo evento citado explicitamente no item de backlog ("efeitos
de... roubo de comida"), mas é um evento menos frequente que acerto/erro de clique, daí a
prioridade um degrau abaixo de US1/US2.

**Independent Test**: iniciar uma partida, deixar deliberadamente uma barata alcançar sua
comida-alvo sem clicar nela, e confirmar que o som de roubo (`steal.mp3`) toca no mesmo momento em
que a comida é removida da prateleira.

**Acceptance Scenarios**:

1. **Given** uma barata ativa a caminho de uma comida-alvo, **When** ela alcança a comida antes de
   ser eliminada, **Then** o som de roubo toca no mesmo momento em que a comida desaparece da
   prateleira.
2. **Given** duas baratas roubando comidas em momentos muito próximos, **When** o segundo roubo
   acontece antes do som do primeiro terminar, **Then** o som de roubo toca novamente (sobreposição
   permitida), sem cortar o som anterior.

---

### Edge Cases

- O que acontece se o navegador bloquear reprodução automática de áudio antes de qualquer
  interação do jogador? → O sistema de áudio só é inicializado/desbloqueado após o primeiro gesto
  de interação do jogador (ex.: clicar em "iniciar partida" na `StartScene`), então nenhum som
  depende de autoplay sem gesto prévio.
- O que acontece se várias baratas forem eliminadas ou roubarem comida no mesmo frame (ex.: várias
  baratas alcançam o alvo simultaneamente)? → Cada evento dispara sua própria reprodução; sons
  idênticos podem soar sobrepostos, mas nenhum evento é perdido silenciosamente.
- O que acontece com o som ambiente de voo se a partida terminar (game over) enquanto ele está
  tocando? → O som ambiente para imediatamente ao término da partida, junto da transição para a
  `GameOverScene`.
- O que acontece com `walk.mp3` nesta feature? → Permanece apenas como asset disponível em
  `client/public/assets/audio/` (Princípio VI); nenhum evento de jogo o aciona, pois a locomoção
  "andando" da barata ainda não existe (fora de escopo — ver seção Assumptions).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema DEVE reproduzir um efeito sonoro de acerto (`hit.mp3`) sempre que o jogador
  eliminar uma barata via clique/toque dentro do hitbox.
- **FR-002**: O sistema DEVE reproduzir um efeito sonoro de erro (`miss.mp3`) sempre que o jogador
  clicar/tocar na tela de jogo sem acertar nenhuma barata.
- **FR-003**: O sistema NÃO DEVE reproduzir os sons de acerto e erro simultaneamente para o mesmo
  evento de clique — cada clique dispara exatamente um dos dois.
- **FR-004**: O sistema DEVE reproduzir um efeito sonoro de roubo (`steal.mp3`) sempre que uma
  barata alcançar sua comida-alvo antes de ser eliminada.
- **FR-005**: O sistema DEVE iniciar a reprodução em loop do som ambiente de voo (`fly.mp3`) assim
  que houver pelo menos uma barata ativa em cena.
- **FR-006**: O sistema DEVE parar a reprodução do som ambiente de voo assim que não houver mais
  nenhuma barata ativa em cena, incluindo ao final da partida (game over) e ao reiniciar uma nova
  partida.
- **FR-007**: O sistema DEVE garantir que nunca mais de uma instância do loop de voo esteja
  audível simultaneamente, independentemente de quantas baratas estejam ativas ao mesmo tempo.
- **FR-008**: A reprodução de efeitos sonoros NÃO DEVE introduzir atraso perceptível ou
  degradação na resposta ao clique/toque (Princípio V) — o hit-testing e a atualização visual
  continuam ocorrendo independentemente do carregamento/reprodução de áudio.
- **FR-009**: O sistema DEVE permitir sobreposição de instâncias do mesmo efeito sonoro discreto
  (acerto, erro, roubo) quando eventos ocorrem em rápida sucessão, sem cortar reproduções em
  andamento.
- **FR-010**: O sistema DEVE inicializar/desbloquear o áudio somente a partir de um gesto de
  interação do jogador (ex.: iniciar a partida), respeitando políticas de autoplay dos navegadores
  alvo.
- **FR-011**: O arquivo `walk.mp3` DEVE permanecer disponível em `client/public/assets/audio/`
  (Princípio VI), mas esta feature NÃO DEVE criar nenhum gatilho de reprodução para ele — a
  reprodução de som de "barata andando" fica fora de escopo até que a mecânica de locomoção
  correspondente seja especificada em uma feature própria.

### Key Entities

- **Efeito sonoro (SFX)**: associação entre um evento de partida (acerto, erro, roubo) e um asset
  de áudio (`hit.mp3`, `miss.mp3`, `steal.mp3`) reproduzido uma vez por ocorrência do evento.
- **Som ambiente (loop)**: asset de áudio (`fly.mp3`) cuja reprodução é controlada pelo estado
  agregado "há baratas ativas em cena?" (sim = tocando, não = parado), não por eventos discretos.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Todo clique do jogador durante uma partida produz exatamente um retorno sonoro
  (acerto ou erro), perceptível no mesmo instante da resposta visual já existente.
- **SC-002**: O tempo entre a ação do jogador (clique/toque) e o início da resposta sonora
  correspondente é imperceptível para o jogador (sem atraso audível em relação ao feedback
  visual), preservando o padrão de responsividade já validado nas specs anteriores.
- **SC-003**: O som ambiente de voo está audível durante 100% do tempo em que houver ao menos uma
  barata ativa em cena, e silencioso durante 100% do tempo em que não houver nenhuma.
- **SC-004**: Em uma sessão de playtest informal, jogadores identificam corretamente, apenas pelo
  áudio, se acertaram ou erraram um clique, e se uma comida acabou de ser roubada.

## Assumptions

- Os cinco arquivos de áudio (`hit.mp3`, `miss.mp3`, `fly.mp3`, `steal.mp3`, `walk.mp3`) já
  existem em `client/public/assets/audio/` e têm qualidade/volume adequados para uso direto,
  sem necessidade de reprocessamento ou normalização como parte desta feature.
- `walk.mp3` é tratado como asset reservado, sem trigger nesta feature, para não antecipar a
  mecânica de locomoção "andando" (ainda não especificada) dentro da estrutura de código atual —
  alinhado ao Princípio IV (simplicidade deliberada); quando essa locomoção for priorizada, o
  gatilho de som correspondente entra junto, em spec própria.
- Não há requisito de controle de volume/mute nesta feature — esse controle já está registrado
  separadamente no backlog ("Mute/volume toggle", seção 3, dependente deste item) e deve virar
  spec própria depois que este item for concluído.
- O volume relativo entre os sons (mixagem) segue o padrão dos arquivos fornecidos; ajuste fino de
  balanceamento sonoro, se necessário, é tratado como iteração dentro desta mesma feature e não
  como spec separada.
- Falha ao carregar um asset de áudio (ex.: arquivo ausente/corrompido) não deve impedir a
  jogabilidade — o jogo continua funcional mesmo sem aquele som específico.
