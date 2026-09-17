# Feature Specification: Juice na Animação da Barata

**Feature Branch**: `008-juice-animacao-barata`

**Created**: 2026-09-16

**Status**: Draft

**Input**: User description: "Juice na animação da barata (P1 do backlog, seção 1 \"Jogabilidade e feedback sensorial\"): squash/stretch e leve tremor (shake) na barata conforme ela se aproxima do alvo (comida), para reforçar a sensação de urgência visual sem alterar nenhuma lógica de domínio (posição, timing, colisão ou hit-testing permanecem exatamente como hoje, calculados por Roach.positionAt/progress em client/src/entities/Roach.ts). É puramente uma camada de apresentação dentro de GameScene.syncRoachSprites (client/src/scenes/GameScene.ts), análoga aos tweens já existentes de playRoachEliminated/playFoodStolen. Deve intensificar (squash/stretch mais pronunciado e/ou tremor mais rápido) quanto mais perto a barata estiver do alvo (usar Roach.progress(roach, now) como entrada do efeito), sem nunca alterar a hitbox de clique real (que continua baseada em ROACH_VISUAL_RADIUS/HITBOX_PADDING_PX e na posição verdadeira retornada por positionAt — Princípio V, responsividade de clique não pode ser degradada por esse efeito visual). Não deve impactar performance (manter 60 FPS estável mesmo com múltiplas baratas ativas simultaneamente — Princípio V). Segue Princípio I (separação domínio/render): nenhuma mudança em client/src/entities/ ou client/src/systems/, tudo vive na scene Phaser."

## Clarifications

### Session 2026-09-16

- Q: Deve existir alguma forma de reduzir ou desativar o tremor da barata para jogadores sensíveis a excesso de movimento na tela? → A: Não incluir nenhum controle nesta fase — o efeito fica sempre ativo, sem toggle nem redução automática de intensidade.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Perceber a urgência crescente na animação da barata (Priority: P1)

Enquanto joga, o jogador quer perceber visualmente, só de olhar para uma barata, o quão perto ela está de roubar a comida — mesmo sem parar para calcular distâncias — para reagir com mais urgência às baratas mais perigosas.

**Why this priority**: É o valor central desta feature. Sem uma animação que se intensifique perto do alvo, não existe reforço de urgência nenhum — o resto (não afetar hitbox, manter performance) só importa porque esta animação passa a existir.

**Independent Test**: Deixar uma barata percorrer o trajeto até a comida sem clicar nela e observar que o movimento de squash/stretch e o tremor ficam visivelmente mais pronunciados conforme ela se aproxima do alvo, em comparação a como aparece logo no spawn. Entrega valor sozinho, mesmo sem as demais histórias.

**Acceptance Scenarios**:

1. **Given** uma barata acabou de surgir (início do trajeto), **When** o jogador observa seu movimento, **Then** o squash/stretch e o tremor aplicados são sutis, quase imperceptíveis.
2. **Given** uma barata está a meio caminho do alvo, **When** o jogador observa seu movimento, **Then** o squash/stretch e o tremor são visivelmente mais intensos do que no momento do spawn.
3. **Given** uma barata está prestes a alcançar o alvo, **When** o jogador observa seu movimento, **Then** o squash/stretch e o tremor estão no seu ponto mais intenso, reforçando a sensação de urgência.
4. **Given** várias baratas estão ativas simultaneamente em pontos diferentes do trajeto, **When** o jogador observa a tela, **Then** cada barata exibe um nível de intensidade de animação proporcional ao seu próprio progresso, independente das demais.

---

### User Story 2 - Continuar clicando com a mesma precisão de sempre (Priority: P2)

Enquanto joga, o jogador quer continuar clicando nas baratas com a mesma precisão de antes, mesmo com o novo efeito visual de squash/stretch e tremor, para que a nova animação nunca atrapalhe a jogabilidade central.

**Why this priority**: Preserva a responsividade do clique, que é o núcleo inegociável da experiência (Princípio V). Só faz sentido depois de a animação (US1) existir, mas sem isso o efeito viraria um risco em vez de uma melhoria.

**Independent Test**: Clicar repetidamente em baratas em diferentes pontos do trajeto (incluindo perto do alvo, onde o efeito é mais intenso) e confirmar que a eliminação acontece exatamente quando o clique cai sobre a posição real da barata, sem nenhuma diferença perceptível de precisão em relação ao comportamento sem o efeito.

**Acceptance Scenarios**:

1. **Given** uma barata está exibindo o efeito de squash/stretch e tremor em qualquer intensidade, **When** o jogador clica exatamente sobre a posição real da barata, **Then** a barata é eliminada normalmente, como acontecia antes da animação existir.
2. **Given** uma barata está próxima do alvo com o efeito no seu ponto mais intenso, **When** o jogador clica fora da área de acerto real da barata (mesmo que pareça visualmente "dentro" dela por causa do tremor), **Then** o clique é tratado como clique perdido, exatamente como antes da animação existir.

---

### User Story 3 - Jogo continua fluido com várias baratas animadas ao mesmo tempo (Priority: P3)

Enquanto joga, o jogador quer que o jogo continue fluido e sem travamentos mesmo quando várias baratas estão na tela exibindo o efeito de squash/stretch e tremor ao mesmo tempo, para que a nova animação nunca vire uma fonte de lentidão.

**Why this priority**: É uma garantia de qualidade que sustenta as duas histórias anteriores a longo prazo, mas o valor perceptível pelo jogador (US1) e a segurança do clique (US2) já existem sem que este item precise ser validado isoladamente primeiro.

**Independent Test**: Deixar o número máximo de baratas simultâneas permitido pelo jogo ativo na tela ao mesmo tempo, todas exibindo o efeito, e confirmar visualmente que o jogo continua fluido, sem engasgos perceptíveis no movimento das baratas ou atraso na resposta ao clique.

**Acceptance Scenarios**:

1. **Given** o número máximo de baratas simultâneas permitido está ativo na tela, todas exibindo o efeito de squash/stretch e tremor, **When** o jogador observa o jogo, **Then** o movimento de todas as baratas e comidas permanece fluido, sem engasgos perceptíveis.
2. **Given** o número máximo de baratas simultâneas permitido está ativo na tela, **When** o jogador clica em qualquer uma delas, **Then** a resposta ao clique acontece sem atraso perceptível em relação ao comportamento sem o efeito.

### Edge Cases

- O que acontece quando uma barata é eliminada no meio do efeito de squash/stretch/tremor? A animação de eliminação já existente (queda com fade) deve assumir imediatamente, sem que o tremor "vaze" ou sobreponha o efeito de eliminação.
- O que acontece quando uma barata alcança o alvo (rouba a comida) enquanto está no ponto mais intenso do efeito? O efeito de squash/stretch/tremor termina junto com a remoção da barata da tela, sem deixar nenhum resquício visual.
- O que acontece logo no instante do spawn (progresso zero)? O efeito deve começar praticamente imperceptível, para não criar a falsa impressão de urgência em uma barata recém-surgida.
- O que acontece com baratas em estágios de progresso bem diferentes na mesma tela? Cada barata deve animar de forma independente, proporcional apenas ao seu próprio progresso — nunca ao progresso de outras baratas ativas.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema DEVE aplicar um efeito visual de squash/stretch na barata enquanto ela se desloca em direção ao seu alvo.
- **FR-002**: O sistema DEVE aplicar um leve tremor (shake) visual na barata enquanto ela se desloca em direção ao seu alvo.
- **FR-003**: A intensidade do squash/stretch e do tremor DEVE aumentar de forma proporcional ao progresso da barata em direção ao alvo — sutil logo no spawn, mais pronunciada perto do alvo.
- **FR-004**: O efeito visual NÃO DEVE alterar a posição real usada para detectar cliques (hit-testing) — a área clicável da barata continua exatamente a mesma que existiria sem o efeito.
- **FR-005**: O efeito visual DEVE ser interrompido imediatamente quando a barata deixa de estar ativa (eliminada pelo jogador ou chegou ao alvo), cedendo lugar à animação de feedback já existente para esse evento, sem sobreposição.
- **FR-006**: O sistema DEVE manter a taxa de quadros estável (60 FPS) mesmo com o número máximo de baratas simultâneas permitido pelo jogo exibindo o efeito ao mesmo tempo.
- **FR-007**: Esta feature NÃO DEVE alterar nenhuma regra de domínio existente — spawn, timing de trajeto, condição de eliminação, condição de roubo de comida ou condição de derrota permanecem exatamente como são hoje.
- **FR-008**: O efeito visual DEVE ser calculado de forma independente para cada barata ativa, refletindo apenas o progresso individual daquela barata, nunca o estado de outras baratas na tela.

### Key Entities

- **Efeito de Urgência Visual (Juice)**: Não é uma nova entidade de domínio — é uma camada de apresentação derivada do progresso já existente de cada barata em direção ao seu alvo. Existe apenas enquanto a barata está ativa na tela e não persiste nem é lida por nenhuma regra de jogo.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Jogadores conseguem identificar, apenas observando a animação (sem nenhuma indicação textual ou numérica), quais baratas na tela estão mais perto de roubar uma comida.
- **SC-002**: A taxa de acerto de cliques em baratas não piora em relação ao comportamento sem o efeito — nenhum clique que acertaria a barata antes passa a errar por causa da nova animação, e vice-versa.
- **SC-003**: O jogo mantém 60 FPS estáveis mesmo com o número máximo de baratas simultâneas permitido exibindo o efeito ao mesmo tempo.
- **SC-004**: Em 100% dos casos observados, cada barata ativa exibe uma intensidade de animação proporcional apenas ao próprio progresso, independentemente de quantas outras baratas estão ativas simultaneamente.

## Assumptions

- "Squash/stretch" é entendido como uma deformação de escala do sprite da barata (achatamento/alongamento), e "tremor" como um pequeno deslocamento oscilante ao redor da posição real — ambos efeitos puramente visuais, sem nenhum efeito sobre a posição usada por regras de jogo ou detecção de clique.
- A "posição real" da barata para efeito de clique continua sendo exatamente a mesma já calculada hoje (a mesma usada antes desta feature existir); o efeito visual apenas desenha o sprite de forma levemente diferente ao redor dessa posição.
- O efeito é interrompido/substituído automaticamente pelas animações de feedback que já existem hoje para eliminação da barata e para roubo de comida — esta feature não cria nem substitui essas animações, apenas para de rodar antes delas assumirem.
- Confirmado (ver Clarifications): não há controle para o jogador reduzir ou desativar este efeito nesta fase — nenhum toggle de acessibilidade contra excesso de movimento faz parte desta spec; fica fora de escopo e pode virar um item futuro do backlog, se necessário.
- Caso haja algum trade-off entre a intensidade do efeito e a manutenção de 60 FPS estáveis, a performance e a responsividade do clique têm prioridade sobre a intensidade visual do efeito (Princípio V é inegociável; o "juice" nunca é).
- Nenhum arquivo em `client/src/entities/` ou `client/src/systems/` precisa mudar para esta feature — toda a implementação é esperada como uma alteração de apresentação dentro da camada de scenes do Phaser.
