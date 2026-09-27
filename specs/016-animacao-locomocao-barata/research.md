# Research: Animação de Locomoção da Barata (Andar/Voar)

## 1. Como animar sem depender de arte final ainda inexistente

> **Superado em 2026-09-27** — ver §6. Mantido como registro da decisão original.

**Decision**: usar o sprite placeholder `"roach"` já existente (círculo gerado em runtime por
`BootScene.generatePlaceholderTextures()`) e animar via rotação procedural (`sprite.setAngle(...)`)
em vez de um spritesheet com frames de andar/voar desenhados à mão.

**Rationale**: nenhuma arte final existe hoje — as referências em `docs/references/` são vídeos, não
frames prontos para spritesheet. Esperar pela produção de arte bloquearia a feature inteira. O
projeto já tem dois precedentes diretos e recentes para animação procedural sem frames extras: o
"juice" da barata (`specs/008-juice-animacao-barata`, squash/stretch + tremor) e o cursor da pata
(`specs/015-cursor-pata-animada`, rotação de golpe/inclinação). Seguir o mesmo padrão aqui é
consistente com a Simplicidade Deliberada (Princípio IV) e não bloqueia em arte que ainda não
existe.

**Alternatives considered**: aguardar spritesheets dedicados antes de implementar — rejeitado pelo
mesmo motivo já registrado em `specs/015` (research.md §5): a spec não exige frames desenhados, só o
comportamento (nunca estática, dois estilos reconhecíveis). Se frames dedicados forem produzidos a
partir de `docs/references/`, eles substituem a rotação procedural depois sem mudar onde/como o
estilo é escolhido nem o contrato de `computeRoachLocomotionAngle`.

## 2. Onde armazenar o estilo de locomoção por barata

**Decision**: um `Map<string, "andando" | "voando">` privado em `GameScene`, preenchido com
`Math.random() < 0.5 ? "andando" : "voando"` no momento em que o sprite de uma barata é criado pela
primeira vez (dentro de `syncRoachSprites()`, no branch `if (!sprite) { ... }`), e removido do Map no
mesmo loop que já destrói sprites de baratas inativas.

**Rationale**: `Roach` (`entities/Roach.ts`) é domínio puro (Princípio I) — a spec já define o
estilo como "atributo de apresentação... não é uma regra de domínio" (Key Entities). O `id` da
barata (`roach.id`, já estável do spawn à eliminação/roubo — `createRoach`) é a chave natural para
associar um valor client-side-only sem tocar a entidade. Esse é o mesmo padrão já usado para o
`roachPhase(roach.id)` existente (usado por `computeRoachSquashStretch`/`computeRoachTremorOffset`
para dar a cada barata uma fase de oscilação individual sem estado extra no domínio).

**Alternatives considered**:
- Adicionar um campo `locomotionStyle` a `Roach`/`createRoach()` — rejeitado: violaria o Princípio I
  (regra de domínio não deveria carregar uma preferência puramente visual), e exigiria mudar
  `MatchStateManager`/testes de domínio existentes sem necessidade.
- Derivar o estilo deterministicamente do `id` (ex.: hash do id) em vez de um `Map` com sorteio no
  momento da criação — funcionaria igualmente bem (mesma garantia de estabilidade) mas adicionaria
  uma função de hash só para evitar um `Map`; o `Map` já é o padrão estabelecido pelo próprio
  `roachPhase()` (que usa uma soma de char codes do id, um "hash" simples, mas para produzir uma
  fase contínua, não uma escolha binária) — manter os dois padrões simples e separados é mais direto
  que introduzir uma terceira técnica.

## 3. Como a animação de locomoção compõe com o "juice" já existente

**Decision**: a locomoção usa exclusivamente o canal `angle` do sprite (`sprite.setAngle(...)`),
enquanto o "juice" já existente continua usando `scale` (`computeRoachSquashStretch`) e o
deslocamento de posição somado a `positionAt()` (`computeRoachTremorOffset`) — três canais
independentes, aplicados na mesma chamada de `syncRoachSprites()`, nunca lidos de volta uns pelos
outros.

**Rationale**: o backlog já apontava a necessidade de compor as duas camadas ("locomoção como
baseline sempre ativo, urgência como modulação por cima") — a forma mais simples de garantir isso
sem nenhuma interação indesejada entre as fórmulas é usar canais de transformação totalmente
distintos. Diferente do "juice" (cuja amplitude cresce com `progress(roach, now)`, começando em zero
no spawn), a locomoção tem amplitude **constante** desde o primeiro frame — é isso que garante
FR-001 ("já está em execução desde o primeiro frame visível").

**Alternatives considered**: somar a locomoção ao mesmo deslocamento de posição do tremor (`dx`/`dy`)
— rejeitado: misturaria duas fórmulas com propósitos diferentes (uma cresce com a proximidade do
alvo, a outra é constante) no mesmo par de números, tornando mais difícil ajustar uma sem afetar a
outra; usar `angle` (um canal livre, não tocado por nenhuma feature anterior) evita esse
acoplamento.

## 4. Fórmulas de rotação para os dois estilos

**Decision**: duas funções senoidais com frequência/amplitude diferentes, reaproveitando o mesmo
`roachPhase(roach.id)` já existente para que cada barata individual não oscile em sincronia perfeita
com as outras (mesma técnica de `computeRoachSquashStretch`/`computeRoachTremorOffset`):

- **"voando"**: oscilação rápida e de amplitude pequena (leve inclinação, como um bater de asas) —
  frequência alta, amplitude pequena.
- **"andando"**: oscilação mais lenta e de amplitude um pouco maior (um "balanço" mais perceptível,
  como pernas alternando o passo) — frequência menor, amplitude maior que a de voo.

**Rationale**: com um único canal (`angle`) e sem frames de pernas/asas reais, a forma mais direta
de tornar os dois estilos **visualmente distinguíveis** (User Story 2, SC-002) é usar parâmetros de
oscilação claramente diferentes — voo rápido e sutil (associando-se a asas), andar mais lento e
acentuado (associando-se a passadas). Os valores exatos (graus, Hz) são um ajuste de tuning a
refinar durante a implementação/validação manual, não uma decisão que trava o design.

**Alternatives considered**: usar a mesma fórmula para os dois estilos, variando só a cor/tint do
sprite — rejeitado: não corresponde ao pedido do usuário (referências de vídeo mostram movimento
distinto, não cor), e SC-002 exige que os dois estilos sejam identificáveis por movimento.

## 5. Interação com o efeito de eliminação e a pausa já existentes

**Decision**: nenhuma mudança em `playRoachEliminated()` nem no congelamento de pausa já garantido
pelo padrão `logicalNow()`/`pausedAccumMs` (`specs/009-pausar-partida`) — a rotação de locomoção é
calculada a partir de `now = this.logicalNow()`, exatamente como `computeRoachSquashStretch`/
`computeRoachTremorOffset` já fazem, então herda o congelamento durante a pausa automaticamente, sem
nenhum código novo para isso.

**Rationale**: `logicalNow()` já é a fonte de tempo corrigida usada por todo o resto do "juice" —
reutilizá-la para o ângulo de locomoção é a forma mais simples de satisfazer FR-007 (congela na
pausa) sem duplicar lógica. Para FR-006 (parar ao eliminar **ou ao roubar a comida** — revisado
após `/speckit-analyze` identificar que a formulação original só cobria o clique explicitamente):
nos dois casos a barata sai de `snapshot.activeRoaches` (eliminação via `playRoachEliminated()`, ou
remoção genérica quando rouba a comida), e o sprite/entrada do Map de estilo são removidos pelo
mesmo loop de limpeza de `syncRoachSprites()` — que simplesmente para de recalcular o ângulo dela a
partir daí. Nenhuma lógica extra é necessária, mesmo raciocínio já validado para squash/stretch/
tremor pararem em ambos os casos.

**Alternatives considered**: nenhuma — este comportamento já é uma consequência direta do design
existente, não uma decisão nova.

## 6. Arte por quadros a partir dos vídeos de referência (revisão 2026-09-27)

**Decision**: extrair quadros de `docs/references/barata_caminhada.mp4` e `barata_voo.mp4` com um
script Python (OpenCV, rodado via `uv run --with`, sem dependência nova no projeto), remover o fundo
e gerar dois spritesheets (`roach-walk.png`, `roach-fly.png`), tocados como animações do Phaser. A
barata é orientada pelo vetor spawn → alvo e espelhada quando vai para a esquerda; a oscilação
procedural de §4 continua somada ao ângulo.

**Rationale**: validando no servidor dev, o usuário viu a bolinha girando e pediu as animações
reais. Os vídeos já estavam no repositório, então a arte pôde ser derivada deles sem esperar
ilustração manual.

Detalhes que valem registrar:
- **Trechos do vídeo**: andar = quadros 10-62, voar = 58-88 (de 2 em 2), escolhidos por menor
  diferença entre o primeiro e o último quadro (loop quase contínuo). O vídeo de voo tem outros
  trechos (fundo bege com sombra, vista de cima) descartados por não fecharem loop com a vista
  lateral.
- **Remoção de fundo**: flood fill a partir das bordas (tolerância na cor LAB mediana da borda),
  maior componente conexo (descarta linhas de velocidade soltas), remoção de "buracos" de fundo
  presos dentro do contorno, borda do alfa suavizada. As 200 linhas do topo são ignoradas (marca
  d'água).
- **Tamanho**: quadros de 128px desenhados em 2x e exibidos em escala 0.5 — corpo com ~40px, mesmo
  diâmetro da bolinha anterior (`ROACH_VISUAL_RADIUS * 2`). O squash/stretch de `specs/008`
  multiplica essa escala base.
- **Orientação**: nos quadros a barata olha para a direita com a cabeça ~25° acima da horizontal
  (`ROACH_SPRITE_FORWARD_DEG = -25`). O rumo vem de `roach.spawnPoint` → alvo, fixo desde o spawn,
  então não é guardado estado novo.
- **Dessincronização**: cada sprite começa a animação num quadro aleatório.
- **Pausa**: `scene.pause()` já congela o update dos sprites, então as animações por quadros
  congelam junto sem código novo (FR-007).

**Alternatives considered**: manter só a rotação procedural (rejeitado pelo usuário); desenhar os
quadros à mão (bloquearia a entrega); usar os vídeos direto como textura de vídeo (pesado, sem
fundo transparente, contra o requisito de 60 FPS).
