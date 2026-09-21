# Research: Mute e Desmute do Som do Jogo

## 1. Como silenciar/reativar todo o áudio de forma global

**Decision**: Usar a propriedade global `this.sound.mute` do `Phaser.Sound.BaseSoundManager`
(acessível como `game.sound`, compartilhado por todas as Scenes) em vez de rastrear/parar cada
instância de som individualmente.

**Rationale**: O SoundManager do Phaser já é global ao `Game` e compartilhado entre Scenes — o
código atual (`GameScene.ts`, `PauseOverlayScene.ts`) já o usa dessa forma (`this.sound.stopByKey`,
`pauseAll`/`resumeAll`). Definir `mute = true/false` silencia/restaura imediatamente qualquer som em
reprodução (incluindo o loop `sfx-fly`) e qualquer som futuro disparado por `this.sound.play(...)`,
sem exigir alterar nenhum dos pontos de disparo de SFX já existentes em `GameScene.ts`
(`sfx-hit`, `sfx-miss`, `sfx-steal`, `sfx-fly`) e sem precisar enumerar chaves de som manualmente —
satisfaz FR-002/FR-003/FR-004 com a menor superfície de código possível.

**Alternatives considered**:
- Pausar/parar manualmente cada som ativo por chave (`stopByKey` para cada key conhecida) a cada
  toggle: exige manter uma lista de chaves sincronizada com cada nova feature de áudio futura
  (risco de esquecer uma chave nova), violando a Simplicidade Deliberada (Princípio IV). Rejeitado.
- Ajustar `volume = 0` manualmente por instância: mais código que `mute`, sem benefício adicional
  já que não há requisito de fade ou volume granular (fora de escopo, ver spec Assumptions).
  Rejeitado.

## 2. Onde e como persistir a preferência de mute

**Decision**: Persistir em `localStorage`, sob uma nova chave dedicada em `gameConfig.ts`, seguindo
o mesmo padrão defensivo já usado por `HighScoreStore.ts` (`isStorageAvailable()` + leitura/escrita
protegidas por `try/catch`, nunca lançando exceção).

**Rationale**: É o mecanismo de persistência local já validado e testado no projeto
(`specs/012-high-score-local`), alinhado ao Princípio II (client-only, sem backend) e à decisão de
Clarifications (degradação graciosa quando o storage está indisponível). Reaproveitar o padrão
evita inventar um segundo mecanismo de persistência para um único boolean.

**Alternatives considered**:
- `sessionStorage`: rejeitado — não sobrevive a uma nova sessão/aba, contrariando FR-007/SC-004.
- `IndexedDB`: complexidade desnecessária para persistir um único valor booleano.
- Cookies: exigiriam lógica de expiração/parsing sem nenhum benefício, já que não há servidor para
  lê-los.

## 3. Onde renderizar o controle de mute para que apareça em todas as telas

**Decision**: Criar uma nova Scene persistente (`AudioControlScene`), lançada uma única vez no boot
e nunca parada, rodando em paralelo por cima de todas as outras Scenes — no mesmo padrão de Scene
paralela já usado por `PauseOverlayScene`.

**Refinamento (pós-`/speckit-analyze`, 2026-09-20)**: o mecanismo concreto de ativação e de
prioridade de renderização precisa ser explícito, porque neste projeto nenhuma Scene além da
primeira do array (`BootScene`) é auto-iniciada pelo Phaser — todas as demais (`StartScene`,
`GameOverScene`, `PauseOverlayScene`) só entram em jogo porque alguma outra Scene chama
`this.scene.start(...)`/`this.scene.launch(...)` explicitamente (único precedente hoje:
`GameScene.ts` chama `this.scene.launch("PauseOverlayScene")`). Logo:
- `AudioControlScene` DEVE ser a **última** entrada do array `scene: [...]` em `client/index.ts`
  (depois de `PauseOverlayScene`) — a ordem desse array determina a ordem de renderização/prioridade
  de input do Phaser, então essa posição garante que o controle sempre renderiza e recebe cliques por
  cima de **todas** as outras Scenes, incluindo a overlay semitransparente de `PauseOverlayScene`
  (resolve o caso de a partida estar pausada, que FR-005 também cobre por ser uma das "telas" do
  jogo, mesmo sem menção explícita).
- `BootScene.create()` DEVE chamar `this.scene.launch("AudioControlScene")` explicitamente (mesmo
  padrão de `this.scene.start("StartScene")` já existente no fim do método), já que apenas estar no
  array não ativa a Scene.

**Rationale**: FR-005 exige que o controle esteja visível e funcional em todas as telas (início,
partida, fim de jogo — incluindo a tela de pausa) refletindo um único estado global. Uma Scene
sempre ativa evita duplicar a criação/renderização do botão em cada uma das Scenes existentes
(`BootScene`, `StartScene`, `GameScene`, `GameOverScene`, `PauseOverlayScene`), o que geraria código
repetido e risco de o estado visual (ativo/mudo) dessincronizar entre telas — contrário à
Simplicidade Deliberada (Princípio IV).

**Alternatives considered**:
- Adicionar o botão de forma independente dentro de cada Scene existente: rejeitado por duplicação
  de código e risco de dessincronia de estado visual entre telas.
- Botão DOM fora do canvas do Phaser: rejeitado — mistura tecnologia de renderização, contraria a
  convenção de assets/renderização via Phaser (Princípios I/VI), sem necessidade já que Pointer
  Events já funcionam normalmente dentro do canvas (Princípio III).

## 4. Onde vive a lógica de preferência de áudio na arquitetura do projeto

**Decision**: Novo módulo `AudioPreferenceStore` em `client/src/systems/`, no mesmo nível de
`HighScoreStore.ts` — não faz parte do domínio de partida (`entities/`, `MatchStateManager`).

**Rationale**: A preferência de áudio é uma configuração de apresentação/sistema, ortogonal às
regras de partida (Princípio I/II) — não deve viver dentro de `Match`/`MatchStateManager`, e deve
sobreviver a reinícios de partida e à transição para `GameOverScene` sem qualquer interferência
(FR-009).

**Alternatives considered**:
- Estender o barramento de eventos do `MatchStateManager` com um flag de mute: rejeitado — mistura
  estado de domínio de partida com uma preferência de UI que atravessa partidas e transições de
  Scene, violando a separação de responsabilidades do Princípio I.

## Resumo do Technical Context

| Campo | Valor |
|---|---|
| Language/Version | TypeScript (stack fixa do projeto, Princípio VII) |
| Primary Dependencies | Phaser 4 (`Phaser.Sound.BaseSoundManager.mute`) |
| Storage | `localStorage` do navegador (client-only, Princípio II) |
| Testing | `bun test` para a lógica de persistência (unitário, mesmo padrão de `highScoreStore.test.ts`); validação manual do toggle visual via `quickstart.md` |
| Target Platform | Navegador desktop (Chrome/Firefox/Edge atuais) |
| Project Type | Single project client-side (`client/`) |
| Performance Goals | 60 FPS, resposta ao clique sem atraso perceptível (Princípio V) |
| Constraints | Sem backend; toggle de mute não pode interferir no hit-testing das baratas |
| Scale/Scope | Um único estado binário global, compartilhado por todas as Scenes |
