# Research: Feedback Sonoro (SFX)

Resolve as decisões técnicas necessárias para implementar os efeitos sonoros descritos em
`spec.md`, sem introduzir NEEDS CLARIFICATION — o escopo é pequeno e o codebase já estabelece os
padrões relevantes em `001-roach-fridge-clicker` e `002-hud-progresso-risco`.

## 1. Onde carregar os arquivos de áudio

**Decision**: adicionar um método `preload()` em `client/src/scenes/BootScene.ts` que carrega
`hit.mp3`, `miss.mp3`, `fly.mp3` e `steal.mp3` de `client/public/assets/audio/` com
`this.load.audio(key, path)`, usando chaves de textura previsíveis (`sfx-hit`, `sfx-miss`,
`sfx-fly`, `sfx-steal`). `walk.mp3` NÃO é incluído nesta chamada (FR-011).

**Rationale**: `BootScene` já é a única scene responsável por preparar assets antes de
`StartScene`/`GameScene` existirem (hoje gera texturas placeholder em `create()`); é o ponto único
e natural para também carregar os áudios, garantindo que o carregamento termine antes de qualquer
clique possível (Princípio V — nenhum carregamento de asset pode competir com hit-testing durante a
partida).

**Alternatives considered**: carregar os áudios sob demanda dentro de `GameScene.create()` —
rejeitado porque adicionaria uma dependência de carregamento assíncrono no caminho crítico de
início da partida, arriscando o primeiro som atrasar ou falhar caso o jogador clique antes do
carregamento terminar.

## 2. Como disparar os sons discretos (acerto, erro, roubo)

**Decision**: reproduzir os sons a partir dos pontos onde o resultado já é conhecido, sem nenhum
evento novo de domínio:
- `hit.mp3`: dentro do listener já existente `matchStateManager.on("roach:eliminated", ...)` em
  `GameScene.create()` (mesmo listener que já dispara o tween de queda da barata).
- `steal.mp3`: dentro do listener já existente `matchStateManager.on("food:stolen", ...)` (mesmo
  listener que já dispara o tween de sumiço da comida).
- `miss.mp3`: dentro de `handlePointerDown`, no branch em que `pickTopmostHit` retorna `undefined`
  (nenhuma barata atingida) — esse resultado já é calculado ali mesmo, sem necessidade de nenhum
  evento novo no `MatchStateManager`.

**Rationale**: os dois primeiros eventos já existem e já carregam a informação necessária
(Princípios I e II — `GameScene` só reage a eventos de domínio já publicados). O caso de "erro" não
é uma regra de jogo (não muda nenhum estado de `Match`), então não pertence ao domínio — é
puramente um resultado do hit-test já calculado na própria `Scene`, coerente com o fato de
`CollisionSystem.pickTopmostHit` já ser uma função de apresentação/entrada, não de domínio.

**Alternatives considered**: criar um evento `pointer:missed` no `MatchStateManager` — rejeitado
por forçar o domínio a saber sobre um conceito de input (clique errado) que não afeta nenhuma regra
de jogo, violando a separação de responsabilidades do Princípio II.

## 3. Sobreposição de sons discretos em rápida sucessão (FR-009)

**Decision**: usar `this.sound.play(key)` (o atalho do `SoundManager` que cria e toca uma nova
instância a cada chamada) para os três sons discretos, sem reutilizar/parar instâncias anteriores
do mesmo som.

**Rationale**: é o comportamento nativo do `Phaser.Sound.SoundManager.play()` — cada chamada cria
uma instância independente, permitindo sobreposição sem nenhum código extra de gerenciamento de
instâncias. Atende FR-009 (sobreposição permitida, nenhum som cortado) sem esforço adicional.

**Alternatives considered**: manter uma única instância por chave e chamar `.play()` novamente
nela — rejeitado porque reinicia a instância existente do zero, cortando o som anterior a cada novo
disparo (viola FR-009 quando dois acertos ocorrem em sucessão rápida).

## 4. Controle do loop ambiente de voo (`fly.mp3`)

**Decision**: em `GameScene.update()`, comparar `snapshot.activeRoaches.length` com o estado do
frame anterior (uma flag `private isFlyLoopActive = false`):
- transição de `0` para `>0`: `this.sound.play("sfx-fly", { loop: true })`.
- transição de `>0` para `0`: `this.sound.stopByKey("sfx-fly")`.
- qualquer outra transição (ex.: 2 → 1 baratas ativas): nenhuma ação — o loop já está tocando e
  continua tocando a mesma instância.

Adicionalmente, o listener de `match:lost` (que já existe e chama `this.scene.start("GameOverScene")`)
passa a chamar `this.sound.stopByKey("sfx-fly")` antes da transição de scene, e `GameScene.create()`
chama `this.sound.stopByKey("sfx-fly")` uma vez no início, como guarda defensiva.

**Rationale**: essa checagem é O(1) por frame (uma comparação de número), no mesmo espaço onde
`syncRoachSprites` já lê `snapshot.activeRoaches` a cada frame — não introduz nenhum custo
perceptível (Princípio V). O ponto crítico descoberto na pesquisa: `this.sound` em Phaser é o
`SoundManager` do `Game` (nível de jogo), **não** um manager por-`Scene` — um som iniciado em
`GameScene` continua tocando mesmo depois que a scene for trocada, a menos que seja explicitamente
parado. Por isso o `stopByKey` explícito no `match:lost` é obrigatório para satisfazer o Edge Case
"o som ambiente para imediatamente ao término da partida" e FR-006 — não é seguro depender do ciclo
de vida da `Scene` para isso.

**Alternatives considered**: recalcular e ligar/desligar o loop a partir dos eventos
`roach:spawned`/`roach:eliminated`/`food:stolen` (event-driven em vez de polling por frame) —
rejeitado por exigir manter uma contagem própria de baratas ativas na `Scene` (fonte de verdade
duplicada, Princípio II), quando `snapshot.activeRoaches.length`, já recalculado a cada frame para
`syncRoachSprites`, resolve o mesmo problema sem estado extra.

## 5. Desbloqueio de áudio / política de autoplay dos navegadores (FR-010)

**Decision**: nenhum código de desbloqueio manual é necessário — o `Phaser.Sound.SoundManager`
(WebAudio) já registra internamente um listener para o primeiro gesto de input do usuário
(pointerdown/keydown) e desbloqueia o `AudioContext` automaticamente antes de tocar qualquer som.
Como o próprio clique no botão "Iniciar" (`StartScene`) já é um gesto de input do jogador, e
nenhum som é reproduzido antes disso (o preload só carrega os arquivos, não os toca), a política de
autoplay dos navegadores-alvo (Chrome/Firefox/Edge) já é satisfeita sem esforço adicional.

**Rationale**: evita reimplementar manualmente uma checagem de "áudio desbloqueado?" que o próprio
Phaser já resolve internamente — comportamento documentado do `WebAudioSoundManager` desde
versões anteriores do Phaser, mantido no Phaser 4.

**Alternatives considered**: chamar explicitamente `this.sound.context.resume()` no handler de
clique do botão "Iniciar" — considerado desnecessário (redundante com o comportamento nativo do
Phaser) a menos que testes manuais no quickstart revelem um caso real de bloqueio; se isso
acontecer durante a implementação, a chamada explícita pode ser adicionada ali sem impacto em
nenhum outro ponto do design.

## 6. `walk.mp3` fora de escopo

**Decision**: `walk.mp3` permanece em `client/public/assets/audio/` sem ser referenciado em nenhum
`this.load.audio(...)` nem `this.sound.play(...)` desta feature.

**Rationale**: Princípio IV (simplicidade deliberada) — a mecânica de locomoção "andando" ainda não
existe no jogo; carregar/preparar um gatilho de som para uma feature inexistente anteciparia
estrutura sem uso real. Quando essa locomoção for especificada em spec própria, o preload e o
gatilho de `walk.mp3` entram junto, reaproveitando a mesma convenção de chaves (`sfx-walk`)
documentada em `contracts/audio-triggers.md`.

**Alternatives considered**: já adicionar `this.load.audio("sfx-walk", ...)` no `preload()` "para
deixar pronto" — rejeitado explicitamente pelo Princípio IV e pela seção Assumptions da spec.

## 7. Testes

**Decision**: nenhuma função pura nova é adicionada a `entities/`/`systems/`, então a suíte
`bun test` existente permanece inalterada por esta feature. A validação dos gatilhos de som é
manual, via `bun run dev` com áudio do dispositivo ativo, seguindo os cenários do `quickstart.md`.

**Rationale**: consistente com `research.md §5` de `001-roach-fridge-clicker` e `§5` de
`002-hud-progresso-risco` — este projeto não tem harness de teste automatizado para comportamento
de `Scene`/`SoundManager` do Phaser, e introduzir um agora seria desproporcional ao escopo "Baixo
esforço" deste item do backlog.

**Alternatives considered**: mockar `Phaser.Sound.SoundManager` em testes com Bun — rejeitado por
exigir infraestrutura de mock/teste de Phaser inexistente no projeto, para uma feature cujo risco
de regressão é baixo e observável diretamente ao jogar.
