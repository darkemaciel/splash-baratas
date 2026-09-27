# Research: Cursor Animado da Pata do Gato

## 1. Como ocultar o cursor nativo de forma robusta (e reversível em caso de falha)

**Decision**: Adicionar `#game.cursor-paw-ready canvas { cursor: none !important; }` ao `<style>`
de `client/index.html` — **condicionado a uma classe** (`cursor-paw-ready`) aplicada ao elemento
`#game`, em vez de `#game canvas { ... }` incondicional ou de
`scene.input.setDefaultCursor('none')` do Phaser. A classe só é adicionada quando o asset da pata
termina de carregar com sucesso (`BootScene`, evento `filecomplete-image-cursor-paw`).

**Rationale**: Vários botões existentes (`StartScene`, `GameOverScene`, `PauseOverlayScene`,
`AudioControlScene`) usam `setInteractive({ useHandCursor: true })`, que faz o Phaser escrever
`canvas.style.cursor = 'pointer'` diretamente via JS a cada `pointerover` nesses objetos. Um
`setDefaultCursor('none')` de uma Scene só vale como *default*, e ainda perderia para o inline
style que o Phaser aplica ao entrar num botão — o cursor do sistema reapareceria exatamente nas
áreas mais importantes (os botões). Uma regra CSS com `!important` no elemento `canvas` vence
qualquer `style.cursor` inline que o Phaser escreva, sem precisar tocar nos botões existentes.
Condicionar a regra a uma classe (em vez de aplicá-la sempre) é o que resolve FR-008: uma regra
incondicional esconderia o cursor nativo mesmo se o asset da pata falhasse ao carregar, deixando o
jogo sem cursor nenhum — o oposto da degradação graciosa exigida. Como a classe só é ligada no
sucesso do carregamento, uma falha simplesmente nunca a adiciona, e o cursor nativo permanece
visível sem precisar de nenhum handler de erro dedicado (ver `contracts/cursor-scene.md`).

**Alternatives considered**:
- `#game canvas { cursor: none !important; }` incondicional (versão original desta decisão,
  revisada após `/speckit-analyze`) — rejeitado: não tem como reverter se o asset falhar ao
  carregar, violando FR-008 (achado E1 da análise de 2026-09-26).
- `scene.input.setDefaultCursor('none')` em cada Scene — rejeitado: não sobrevive ao
  `useHandCursor` dos botões (ver acima).
- Remover `useHandCursor: true` de todos os botões existentes — rejeitado: espalha a mudança por
  5 arquivos não relacionados à feature, violando a Simplicidade Deliberada (Princípio IV) por
  puro acaso de implementação; a regra CSS resolve com uma linha, num único arquivo.

## 2. Como saber a posição do ponteiro numa Scene sempre-ativa e separada

**Decision**: `CursorScene` (nova) registra seu próprio listener `this.input.on('pointermove', ...)`
e guarda a última posição conhecida em campo de instância; em `update()`, reposiciona o sprite da
pata a cada frame — mesmo padrão usado por `AudioControlScene`/`PauseOverlayScene` para terem seu
próprio `Input Plugin` independente da `GameScene`.

**Rationale**: cada `Phaser.Scene` ativa tem seu próprio `Input Plugin`, que recebe eventos de
ponteiro do mesmo `canvas` compartilhado independentemente de outras Scenes (múltiplas Scenes
recebem `pointermove` em paralelo, ao contrário de cliques em objetos interativos específicos, que
podem ser interrompidos por `stopPropagation()` — ver item 3). Isso já é o padrão usado por
`PauseOverlayScene` para seu próprio botão "Continuar" funcionar com a `GameScene` pausada.

**Alternatives considered**: ler `this.game.input.activePointer` diretamente de qualquer Scene sem
listener próprio — funciona, mas descarta o padrão já estabelecido no projeto (Scene com seu
próprio Input Plugin) sem ganho real, e fica menos explícito sobre quando a posição é atualizada.

## 3. Como a `CursorScene` sabe que um clique "de jogo" aconteceu (para o golpe)

**Decision**: `GameScene.handlePointerDown` — chamado apenas quando o clique não foi interceptado
antes por `event.stopPropagation()` (caso do botão de pausa, já existente) — emite
`this.game.events.emit('cursor:strike')` como última linha, depois de todo o hit-test/lógica de
jogo já ter rodado. `CursorScene.create()` assina `this.game.events.on('cursor:strike', ...)` e
dispara a animação de golpe.

**Rationale**: `this.game.events` é um `Phaser.Events.EventEmitter` global, compartilhado por
todas as Scenes de um mesmo `Phaser.Game`, já embutido no framework — não é uma dependência nova
(Princípio VII) nem um acoplamento ao domínio (Princípio I): é estritamente inter-Scene,
apresentacional dos dois lados. Emitir só ao final de `handlePointerDown` garante FR-005/FR-010 —
a emissão não pode competir com o hit-test em si, só acontece depois dele ter concluído. E como o
botão de pausa já usa `stopPropagation()` para nunca chegar a `handlePointerDown`, o mesmo emit
naturalmente nunca dispara para esse clique — sem lógica extra de exclusão, resolvendo FR-004 (o
golpe não dispara em botões de menu) de graça.

**Alternatives considered**:
- Escutar `pointerdown` diretamente na `CursorScene` e tentar distinguir "clique de jogo" vs
  "clique de menu" por posição/hit-test próprio — rejeitado: duplicaria a lógica de hit-test que já
  existe em `GameScene`/`CollisionSystem`, violando a Simplicidade Deliberada e arriscando
  dessincronia com o hit-test real (Princípio V).
- Um novo evento do `MatchStateManager` (`EventTarget` de domínio) — rejeitado: o clique em si
  (acertar ou não) não é uma regra de domínio, é um evento de input; forçar isso pelo
  `MatchStateManager` misturaria apresentação com domínio (violaria Princípio I).

## 4. Tamanho da pata (FR-001, SC-005)

**Decision (revisado em 2026-09-26, feedback de playtest)**: tamanho fixo de 56px de altura na base
landscape, escalado por `UI_SCALE` (`CURSOR_PAW_HEIGHT_PX` em `gameConfig.ts`), desacoplado de
qualquer botão da UI.

**Rationale**: a decisão original (`0.5 * alturaDoMenorBotão`, com o menor botão sendo o de mute em
`AudioControlScene`, ~26px) gerava uma pata de ~13px — exatamente o problema antecipado na nota de
validação abaixo: pequena demais para reconhecer a forma de uma pata com garras. Como a pata é
centralizada no ponteiro (`setOrigin(0.5)`) e o hit-test de clique sempre usa a posição real do
ponteiro (nunca o sprite renderizado, FR-010), cobrir visualmente um botão pequeno ao passar por
cima dele não compromete nenhuma interação — o mesmo raciocínio já usado para justificar que a
animação de golpe nunca interfere no hit-test (research.md §3). Por isso a amarração ao tamanho de
um botão específico era uma cautela desnecessária.

**Alternatives considered**:
- Manter a fórmula relativa ao botão de mute, só aumentando o próprio botão de mute para compensar
  — rejeitado: mudaria a aparência de uma feature não relacionada (`specs/014-mute-som-jogo`) só
  para satisfazer uma regra de tamanho do cursor.
- Valor absoluto fixo em pixels sem relação com nenhum botão — era a Option A rejeitada na
  clarification original da spec; acabou sendo a escolha final após o valor relativo (Option B) se
  mostrar impraticável no playtest.

**Nota histórica**: a validação manual antecipou exatamente este resultado — "~26px de altura de
botão gera uma pata de ~13px — bem pequena... Se o playtest mostrar que isso compromete a
legibilidade da animação, é uma questão de tuning de UI a resolver depois, não uma reabertura desta
spec." Foi o que aconteceu; resolvido aqui sem reabrir o restante da spec.

## 5. Como animar a pata sem depender de arte final ainda inexistente

**Decision**: usar uma única textura estática carregada de `client/public/assets/sprites/paw.png`
e animar via transformações procedurais em código — rotação suave seguindo a direção do movimento
do ponteiro (parada quando ele não se move) para o "idle", e uma rotação/escala mais acentuada e
breve, com retorno, para o golpe — em vez de um spritesheet com múltiplos frames desenhados à mão.
(O "idle" original balançava a pata continuamente com o ponteiro parado; revisado a pedido do
usuário em 2026-09-26 — ver §6.)

**Nota de implementação**: a referência original (`paw.jpg`) era uma foto/arte em formato JPEG, que
não suporta canal alfa — o quadriculado que os editores de imagem usam para indicar "fundo
transparente" tinha sido "queimado" nos pixels do arquivo em vez de virar transparência real.
Reprocessada para `paw.png` (recortada ao redor da pata + fundo tornado transparente de fato) antes
de ser carregada pelo jogo; `paw.jpg` foi removido do repositório por ficar redundante.

**Rationale**: nenhum arquivo de imagem em `client/public/assets/sprites/` é carregado pelo jogo
hoje — `BootScene` gera todas as texturas atuais (barata, comida, prateleira, fundo) em runtime via
`this.make.graphics(...).generateTexture(...)`, e a referência original era só uma foto/arte ainda
não integrada. Esperar por frames de animação desenhados à mão bloquearia a implementação inteira desta
spec. O projeto já tem precedente direto para animação procedural sem frames extras: o "juice" da
barata (`specs/008-juice-animacao-barata`) usa squash/stretch e tremor calculados em código sobre um
único sprite estático, não uma sequência de frames. Seguir o mesmo padrão aqui é consistente com a
Simplicidade Deliberada (Princípio IV) e não bloqueia em arte que ainda não existe.

**Alternatives considered**: aguardar a produção de spritesheets dedicados de idle/golpe antes de
implementar — rejeitado: sem necessidade real (a spec não exige frames desenhados, só reagir ao
movimento e "bater ao clicar"), e adiaria toda a feature por um motivo de produção de arte alheio ao
código. Se no futuro frames dedicados forem produzidos, eles substituem a textura única sem mudar o
contrato do evento `cursor:strike` nem a estrutura de `CursorScene`.

## 6. Como calcular a inclinação da pata na direção do movimento (revisado, feedback do usuário)

**Decision**: a cada `update()`, calcular `dx`/`dy` entre a posição atual do ponteiro e a do frame
anterior. Se o deslocamento for maior que um limiar mínimo (`MOVEMENT_DEADZONE_PX`), calcular o
ângulo de direção via `atan2(dy, dx)`, subtrair a orientação de repouso da arte (garras para cima =
-90° no referencial do `atan2`), normalizar para (-180°, 180°], multiplicar por um fator pequeno
(`LEAN_FACTOR`) e limitar a um máximo (`LEAN_MAX_DEG`) — esse é o ângulo-alvo. O ângulo atual da
pata se aproxima do alvo suavemente a cada frame (interpolação linear simples, `LEAN_SMOOTHING`),
nunca pulando direto para o valor final. Sem movimento, o ângulo-alvo é 0° e a pata relaxa de volta
à posição reta.

**Rationale**: o pedido original ("balanço automático contínuo, nunca estática") foi
deliberadamente substituído pelo oposto: pata parada em repouso, reagindo apenas a movimento real,
em qualquer direção — inclusive vertical, que uma rotação simples de sprite 2D não representa
"apontando" literalmente, mas representa como uma inclinação proporcional à distância angular entre
a direção do movimento e a orientação de repouso da arte. Isso faz mover na direção que a pata já
"encara" (para cima) não gerar inclinação nenhuma, mover para os lados inclinar moderadamente, e
mover na direção oposta (para baixo) gerar a inclinação máxima — um efeito consistente e prático de
implementar com uma única rotação, sem precisar de skew/3D.

**Alternatives considered**:
- Usar o ângulo de movimento diretamente como rotação-alvo (sem o offset de orientação de repouso)
  — rejeitado: faria a pata "apontar" literalmente para a direção do movimento (ex.: virar de
  lado ao mover para a direita), longe de "leve inclinação" pedida.
- Usar só a componente horizontal do movimento (ignorando vertical) — rejeitado: não atenderia o
  pedido explícito de reagir também a movimento vertical.
- Aplicar o ângulo-alvo instantaneamente (sem suavização por frame) — rejeitado: produziria um
  "tremor" brusco a cada pequena mudança de direção do mouse; a interpolação linear por frame
  mantém o movimento "leve" como pedido.
