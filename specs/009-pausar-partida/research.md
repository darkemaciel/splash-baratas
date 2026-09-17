# Research: Pausar Partida

Resolve as decisões técnicas necessárias para implementar o efeito descrito em `spec.md`, sem
deixar nenhum `NEEDS CLARIFICATION` — o escopo é pequeno e o codebase (e o próprio Phaser) já
estabelecem os padrões relevantes (Scene Manager para telas/estados dedicados, padrão de botão
`setInteractive`/`pointerdown` de `StartScene`/`GameOverScene`).

## 1. Como congelar o "relógio lógico" da partida

**Decision (corrigida após teste manual — ver §1a)**: usar `this.scene.pause()` na própria
`GameScene` continua correto para congelar `this.tweens` (feedback de eliminação/roubo) e o Input
Plugin da Scene (nenhum `pointerdown` chega a `handlePointerDown` enquanto pausada) — mas **não** é
suficiente sozinho para congelar o relógio lógico usado por `progress`/`positionAt`/`elapsedMs`.
Adicionalmente, `GameScene` acumula o tempo real gasto pausado (`pausedAccumMs`, medido via
`performance.now()` nos eventos `PAUSE`/`RESUME` da própria Scene) e expõe um `logicalNow()` =
`this.time.now - pausedAccumMs`, usado por **todo** consumidor de tempo que alimenta o domínio
(`matchStateManager.tick()`, `positionAt()`, `elapsedMs()`, `computeRoachSquashStretch`/
`computeRoachTremorOffset`, e o `now` usado em `handlePointerDown`/`tryEliminateRoach`) em vez de
`this.time.now` diretamente.

**Rationale**: satisfaz FR-003 a FR-009 e a clarificação "tudo congela" combinando os dois
mecanismos — `scene.pause()` cuida de tweens/input/render (que já são baseados em delta acumulado
por frame, então pausam corretamente sozinhos), e `logicalNow()` cuida especificamente do relógio
absoluto que o domínio usa (`now - spawnedAt`), que `scene.pause()` sozinho NÃO corrige (ver §1a).
Manter a correção centralizada em um único método (`logicalNow()`) evita espalhar a subtração por
vários pontos do código — apenas troca `this.time.now` por `this.logicalNow()` nos mesmos pontos que
já liam `this.time.now` antes desta feature existir.

**Alternatives considered**: manter uma flag `isPaused` em `GameScene` e ignorar cliques via um
`if (this.isPaused) return;` no início de `handlePointerDown`, em vez de usar `scene.pause()` para
desativar o Input Plugin automaticamente — rejeitada porque ainda exigiria pausar `this.tweens`
manualmente (`pauseAll()`/`resumeAll()`) para congelar as animações de feedback, sem ganhar nada em
troca (o `scene.pause()` nativo já faz isso de graça); a única parte que realmente precisa de
correção manual é o relógio absoluto (§1a), não o resto.

## 1a. Por que `scene.pause()` sozinho NÃO congela `this.time.now` corretamente

**Problema descoberto em teste manual** (2026-09-17, após implementação inicial): pausar com uma
barata em trajeto e retomar alguns segundos depois fazia a barata completar o roubo imediatamente,
mesmo estando longe do alvo no momento da pausa — como se o tempo de viagem tivesse continuado
correndo durante a pausa.

**Causa raiz**: `this.time.now` (`Phaser.Time.Clock`) só é atualizado dentro do método `update()` do
próprio Clock, chamado a cada `step()` da Scene — e `step()` genuinely não roda enquanto a Scene
está pausada (confirmado lendo `node_modules/phaser/src/scene/SceneManager.js` e
`.../scene/Systems.js`: `SceneManager.update()` só chama `sys.step()` para Scenes com
`status <= RUNNING`, e `PAUSED` é maior que `RUNNING` nessa enumeração). Até aqui, o comportamento é
o esperado: `this.time.now` fica congelado, parado, durante toda a pausa.

O problema aparece no instante em que a Scene retoma: o próximo `step()` chama
`Clock.update(time, delta)`, que faz `this.now = time` — e `time` é o timestamp **real e atual** do
loop principal do Phaser (`this.systems.game.loop.time`), que nunca parou de avançar em segundo
plano (o loop principal do `Game` continua rodando mesmo com uma Scene pausada — é assim que
`PauseOverlayScene` continua recebendo cliques). Ou seja: `this.time.now` não "continua de onde
parou" ao retomar — ele **salta instantaneamente** do valor congelado para o tempo real atual,
incluindo todo o intervalo em que a partida esteve pausada. Como `roach.spawnedAt` é um timestamp
absoluto fixado no spawn, `progress(roach, now)` (`= (now - spawnedAt) / travelDurationMs`) salta
junto — se o jogador ficou pausado por mais tempo do que faltava de viagem, a barata é tratada como
tendo chegado ao alvo no exato frame em que a partida retoma.

**Fix**: `logicalNow()` (§1) neutraliza esse salto subtraindo o tempo real gasto pausado
(`pausedAccumMs`, medido de forma independente do Clock do Phaser via `performance.now()`) do valor
já saltado de `this.time.now`.

## 2. Onde exibir o indicador "Pausado" e o botão "Continuar"

**Decision**: uma segunda Scene, `PauseOverlayScene`, iniciada com `this.scene.launch("PauseOverlayScene")`
no mesmo instante em que `GameScene` se pausa (`this.scene.pause()`), rodando em paralelo por cima
dela. Ao clicar em "Continuar": `this.scene.stop()` (encerra a si mesma) + `this.scene.resume("GameScene")`.

**Rationale**: uma Scene pausada desliga seu próprio Input Plugin — um botão de "Continuar" vivendo
dentro da própria `GameScene` pausada seria inclicável, então o indicador/botão precisam viver numa
Scene que *não* está pausada. Este é o padrão explicitamente documentado pelo próprio Phaser: o
método `ScenePlugin.run()` diz "Use this if you wish to open a modal Scene by calling `pause` on the
current Scene, then `run` on the modal Scene" — `launch()` tem o mesmo efeito de iniciar em paralelo
sem alterar o estado da Scene atual. Mantém a garantia do Princípio I (nenhuma lógica de domínio na
Scene) e do Princípio IV (arquivo pequeno, mesmo porte de `StartScene`/`GameOverScene`, não um
sistema novo).

**Alternatives considered**: manter o indicador/botão como objetos normais dentro de `GameScene` e,
em vez de `scene.pause()`, usar apenas uma flag `isPaused` que faz `update()` retornar cedo (sem
pausar a Scene de fato) — rejeitada porque reintroduz a mesma dessincronia manual de tempo
descartada na decisão §1, e ainda exigiria excluir manualmente o próprio botão de pausa do
hit-testing de cliques perdidos. Um atalho de teclado (ex. `ESC`) como único gatilho de
pausar/retomar — rejeitado porque a spec (Assumptions) exige que nenhuma interação essencial
dependa exclusivamente de teclado (Princípio III); um atalho pode ser cogitado como extra opcional
futuro, mas não é necessário para esta spec.

## 3. Clique no botão de pausar não pode "vazar" para o hit-test de baratas

**Decision**: no handler `pointerdown` do botão de pausa (dentro de `GameScene`), chamar
`event.stopPropagation()` — o 4º argumento recebido pelo listener `gameObject.on("pointerdown", (pointer, localX, localY, event) => ...)`
de um Game Object interativo no Phaser.

**Rationale**: o Phaser despacha um único clique em cascata —
`GAMEOBJECT_POINTER_DOWN` → `GAMEOBJECT_DOWN` → `POINTER_DOWN` (este último é o evento que
`GameScene` já escuta via `this.input.on("pointerdown", ...)` para `handlePointerDown`, FR-018 de
`specs/001`). Sem interromper essa cascata, clicar no botão de pausa também dispararia
`handlePointerDown`, que não encontraria nenhuma barata naquela posição (o botão fica fora da área
de trajeto/comida) e chamaria `matchStateManager.registerMissedClick()` + `sfx-miss` — quebrando o
combo de pontuação e tocando um som de erro só por pausar, uma regressão de "game feel" que a spec
não pede e que o Princípio V trata como inaceitável (dessincronia entre intenção do clique e efeito
real). A documentação oficial do Phaser confirma que "higher-up event handlers can stop the
propagation of this event" nessa cascata.

**Alternatives considered**: verificar em `handlePointerDown` se as coordenadas do clique caem
dentro da área retangular do botão de pausa e ignorar nesse caso — rejeitada por duplicar a geometria
do botão em dois lugares diferentes do código (o próprio botão + uma checagem paralela), com risco
de divergência se a posição/tamanho do botão mudar no futuro; `stopPropagation()` resolve na fonte,
sem duplicar estado.

## 4. Som ambiente durante a pausa

**Decision**: `this.sound.pauseAll()` ao pausar, `this.sound.resumeAll()` ao retomar — sem tocar na
flag `isFlyLoopActive` já existente (specs/003-feedback-sonoro-sfx).

**Rationale**: o `SoundManager` é global ao `Game`, não por-Scene (já documentado no código-fonte
atual de `GameScene`). `pauseAll()`/`resumeAll()` preserva a posição exata de playback de qualquer
som em andamento (incluindo o loop `sfx-fly`), cobrindo o Edge Case ("som ambiente para durante a
pausa e retoma ao despausar") sem nenhuma lógica adicional de bookkeeping — a flag `isFlyLoopActive`
continua representando corretamente "existe barata ativa" e não precisa saber nada sobre pausa.

**Alternatives considered**: `this.sound.stopByKey("sfx-fly")` ao pausar e `this.sound.play("sfx-fly", { loop: true })`
ao retomar (mesmo padrão já usado na transição para `match:lost`) — rejeitada porque reinicia o loop
do zero em vez de retomar de onde parou, e exigiria coordenar manualmente com `isFlyLoopActive` só
para a pausa, sem necessidade.

## 5. Restart defensivo

**Decision**: no início de `GameScene.create()`, chamar `this.scene.stop("PauseOverlayScene")` — o
mesmo padrão defensivo já usado para `this.sound.stopByKey("sfx-fly")` logo acima na mesma função.

**Rationale**: `create()` roda tanto no primeiro início da partida quanto em qualquer restart
(`matchStateManager.restart()` → evento `match:started` → `this.scene.start("GameScene")` em
`GameOverScene`/`StartScene`). Como o Scene Manager é global ao `Game` (não recriado a cada
partida), uma `PauseOverlayScene` deixada "pendurada" de uma sessão anterior (ainda que este fluxo
não deva ocorrer normalmente, já que FR-005/FR-011 impedem a partida de terminar estando pausada)
não teria como se auto-limpar sem essa guarda — `scene.stop()` numa Scene que já não está rodando é
uma chamada inofensiva (no-op seguro), então o custo de adicionar a guarda é desprezível frente ao
risco eliminado.

**Alternatives considered**: nenhuma — este é o mesmo padrão já estabelecido no código para o mesmo
tipo de problema (estado global ao `Game` que sobrevive a um restart de `Match`), sem alternativa
razoável a avaliar.

## 6. Atalho de teclado (FR-014, adicionado após feedback do usuário)

**Decision**: `this.input.keyboard?.on("keydown-P", () => this.triggerPause())` em `GameScene`
(pausar) e `this.input.keyboard?.on("keydown-P", () => this.resumeMatch())` em
`PauseOverlayScene` (retomar) — a mesma tecla "P" alterna nos dois sentidos, cada listener vivendo
na Scene que está de fato ativa/recebendo input no momento (nunca as duas Scenes escutando ao mesmo
tempo, já que uma está sempre pausada enquanto a outra roda).

**Rationale**: reaproveita a mesma sequência de transição já usada pelos botões (`triggerPause()`/
`resumeMatch()` extraídos como métodos privados, chamados tanto pelo `pointerdown` quanto pelo
atalho) — nenhuma lógica duplicada. Satisfaz o Princípio III (o atalho é aditivo; o botão continua
sendo a interação essencial via Pointer Events) e a Assumption do `spec.md` que já previa essa
extensão. O operador opcional (`?.`) é necessário porque o plugin de teclado só existe se
`input.keyboard` estiver habilitado na config do `Game` (é o padrão do Phaser, mas o tipo é
opcional).

**Alternatives considered**: um único listener global (fora de qualquer Scene, ex. direto no
`document`) — rejeitado porque duplicaria a responsabilidade de decidir "pausar ou retomar" fora do
Scene Manager, quando cada Scene já sabe exatamente qual dos dois sentidos faz sentido no seu
próprio contexto (rodando → só pausar; overlay ativa → só retomar).

## 7. Testes

**Decision**: nenhuma função pura nova é adicionada a `entities/`/`systems/`, então a suíte
`bun test` existente permanece inalterada por esta feature. A validação do comportamento de
pausar/retomar é manual, via `bun run dev`, seguindo os cenários do `quickstart.md`.

**Rationale**: consistente com o precedente já registrado em `003-feedback-sonoro-sfx`,
`007-tempo-de-sobrevivencia` e `008-juice-animacao-barata` — este projeto não tem harness de teste
automatizado para comportamento de `Scene`/Scene Manager do Phaser, e o comportamento de pausa é
inteiramente observável ao jogar (congelamento visual, botão "Continuar", ausência de cliques
perdidos).

**Alternatives considered**: nenhuma função nova exportada de `entities/`/`systems/` foi criada por
esta feature (ao contrário de features anteriores que ao menos discutiram extrair funções puras) —
não há nada de novo para `bun test` cobrir; a decisão real desta seção foi apenas confirmar que isso
permanece verdadeiro após o design das seções 1–5 acima.
