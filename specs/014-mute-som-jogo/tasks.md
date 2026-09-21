---

description: "Task list template for feature implementation"
---

# Tasks: Mute e Desmute do Som do Jogo

**Input**: Design documents from `/specs/014-mute-som-jogo/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md,
contracts/audio-preference-store.md, quickstart.md

**Tests**: incluídas apenas para `AudioPreferenceStore` (persistência, função pura sem `import
Phaser`) — `plan.md` § Technical Context já decide por essa cobertura, no mesmo padrão de
`highScoreStore.test.ts`. `AudioControlScene` (Phaser `Scene`) não tem harness de teste automatizado
neste projeto — validada via `quickstart.md` (mesmo padrão de `009-pausar-partida`).

**Organization**: Tasks agrupadas por user story (spec.md) para permitir implementação e teste
independentes de cada uma.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Pode rodar em paralelo (arquivos diferentes, sem dependência de tarefas incompletas)
- **[Story]**: A qual user story esta tarefa pertence (US1, US2, US3)
- Caminhos de arquivo exatos em cada descrição

## Path Conventions

Projeto único — `client/src/scenes/`, `client/src/systems/`, `client/src/config/`, `client/index.ts`
(ver `plan.md` → Project Structure). Dois arquivos novos de produção
(`client/src/scenes/AudioControlScene.ts`, `client/src/systems/AudioPreferenceStore.ts`), um novo
arquivo de teste (`client/tests/unit/audioPreferenceStore.test.ts`), e uma alteração pontual em
`client/src/scenes/BootScene.ts`; todo o restante é aditivo sobre arquivos já existentes do MVP
(`001-roach-fridge-clicker`) e da feature de SFX (`003-feedback-sonoro-sfx`).

---

## Phase 1: Setup

**Purpose**: Confirmar um ponto de partida limpo antes de tocar no código.

- [X] T001 Rodar `bun test` em `client/` e confirmar que toda a suíte existente passa antes de
  iniciar qualquer alteração (baseline; nenhuma dependência nova é necessária — `plan.md` §
  Technical Context)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Nenhuma tarefa fundacional separada é necessária nesta feature. Toda a implementação
mínima do toggle de mute/desmute (bidirecional por natureza — um único handler que inverte o
estado) pertence à User Story 1; User Story 2 apenas valida esse mesmo código sob o ângulo da
reativação, e User Story 3 adiciona a camada de indicação visual e persistência por cima do toggle
já funcional. Ver seção "Dependencies & Execution Order" abaixo.

**Checkpoint**: nada a fazer aqui — User Story 1 pode começar imediatamente após o Setup.

---

## Phase 3: User Story 1 - Silenciar todo o áudio do jogo com um clique (Priority: P1) 🎯 MVP

**Goal**: Prover um controle global que, ao ser acionado, silencia imediatamente todo o áudio do
jogo (efeitos discretos e o loop ambiente de voo), sem exigir nenhuma outra ação do jogador
(FR-001, FR-002, FR-003, FR-008).

**Independent Test**: iniciar uma partida com som ativo, acionar o controle de mute, e confirmar que
nenhum som (acerto, erro, roubo, ambiente de voo) é reproduzido enquanto o mute estiver ativo, mesmo
que os eventos de jogo que normalmente disparariam esses sons continuem ocorrendo.

### Implementation for User Story 1

- [X] T002 [US1] Criar `client/src/scenes/AudioControlScene.ts`: nova `Phaser.Scene` (chave
  `"AudioControlScene"`) com um botão de texto (mesmo padrão visual/interativo dos botões de
  `StartScene`/`GameOverScene`/`PauseOverlayScene` — `fontSize`/`fontFamily`/`color`/
  `backgroundColor`/`padding`, `setInteractive({ useHandCursor: true })`, sem asset gráfico novo,
  Princípio VI), posicionado num canto fixo, e um campo privado `muted: boolean` inicializado em
  `false` (padrão "som ativo" — sem leitura de persistência ainda, isso fica para User Story 3). A
  posição escolhida (coordenadas + largura/altura do botão) DEVE ficar fora da faixa vertical de
  qualquer prateleira (`SHELF_Y_POSITIONS` de `client/src/config/gameConfig.ts`, com margem de
  `ROACH_VISUAL_RADIUS + HITBOX_PADDING_PX` para cima e para baixo) e fora das zonas de borda usadas
  como pontos de spawn de barata — evita criar uma "zona morta" onde um clique numa barata em
  trânsito seria capturado pelo botão em vez do hit-testing da partida (Princípio V,
  contracts/audio-preference-store.md § "Garantias") — data-model.md § "Preferência de Áudio"
- [X] T003 [US1] Em `AudioControlScene.create()` (T002), aplicar `this.sound.mute = this.muted`
  logo após criar o botão, garantindo que o `SoundManager` global reflita o estado inicial da Scene
  assim que ela entra — depende de T002
- [X] T004 [US1] Implementar o handler `pointerdown` do botão criado em T002: inverte `this.muted`
  e aplica imediatamente `this.sound.mute = this.muted` — silencia/restaura todo áudio do
  `SoundManager` global, incluindo o loop `sfx-fly` em andamento, sem exigir nenhuma alteração nos
  pontos de disparo de SFX existentes em `client/src/scenes/GameScene.ts` (`sfx-hit`, `sfx-miss`,
  `sfx-steal`, `sfx-fly`) — contracts/audio-preference-store.md § "AudioControlScene" — depende de
  T002, T003
- [X] T005 [US1] Registrar `AudioControlScene` no array `scene: [...]` de `client/index.ts` como a
  **última** entrada (depois de `PauseOverlayScene`, junto ao import das demais Scenes: `BootScene`,
  `StartScene`, `GameScene`, `GameOverScene`, `PauseOverlayScene`) — a posição no array define a
  ordem de renderização/prioridade de input do Phaser, garantindo que o controle sempre fique por
  cima de todas as outras Scenes, incluindo a overlay semitransparente de `PauseOverlayScene`
  (contracts/audio-preference-store.md § "Ciclo de vida") — depende de T002
- [X] T006 [US1] Em `client/src/scenes/BootScene.ts`, adicionar `this.scene.launch("AudioControlScene")`
  em `create()` (antes do `this.scene.start("StartScene")` já existente ao final do método) — é a
  única forma de `AudioControlScene` efetivamente iniciar, já que apenas constar no array
  `scene: [...]` não a ativa (nenhuma Scene além da primeira do array é auto-iniciada pelo Phaser
  neste projeto — único precedente hoje é `GameScene.ts` chamando `this.scene.launch("PauseOverlayScene")`
  manualmente) — research.md §3 (Refinamento pós-`/speckit-analyze`) — depende de T002, T005
- [X] T007 [US1] Validar manualmente o cenário 2 de `specs/014-mute-som-jogo/quickstart.md`
  (silenciar tudo com um clique: o loop de voo para imediatamente, e eliminar baratas/errar
  cliques/deixar roubar comida não produzem nenhum som enquanto o mute estiver ativo) rodando
  `bun run dev` em `client/` — depende de T004, T006

**Checkpoint**: User Story 1 completa e testável de forma independente — controle global de mute
funcional (ainda sem indicação visual diferenciada nem persistência), visível a partir do boot em
todas as Scenes.

---

## Phase 4: User Story 2 - Reativar o áudio a qualquer momento (Priority: P1)

**Goal**: Confirmar que o mesmo controle criado em User Story 1 permite reativar o áudio a qualquer
momento, restaurando corretamente inclusive o loop ambiente de voo já em andamento (FR-004).

**Independent Test**: com o mute ativo, acionar novamente o controle e confirmar que os sons voltam
a ser reproduzidos nos eventos de jogo seguintes, incluindo o retorno do som ambiente de voo se
houver baratas ativas em cena no momento da reativação.

### Implementation for User Story 2

- [X] T008 [US2] Em `AudioControlScene.ts`, junto ao handler de T004, adicionar um comentário curto
  documentando o invariante: como `this.sound.mute = true` apenas silencia o output do
  `SoundManager` (não pausa nem para as instâncias em reprodução), reativar (`this.sound.mute =
  false`) restaura automaticamente até o loop `sfx-fly` já em andamento, sem precisar recriá-lo ou
  chamar `play()` novamente — referenciar `research.md` §1 — depende de T004 (comentário apenas;
  nenhuma mudança de comportamento, já que o mesmo handler de T004 implementa as duas direções do
  toggle, por ser bidirecional por natureza)
- [X] T009 [US2] Validar manualmente o cenário 3 de `specs/014-mute-som-jogo/quickstart.md`
  (reativar o áudio: o loop de voo volta a tocar se ainda houver barata ativa em cena, e o próximo
  acerto/erro/roubo produz som normalmente) rodando `bun run dev` em `client/` — depende de T007

**Checkpoint**: User Stories 1 e 2 funcionam de forma independente — toggle completo (mutar e
reativar) confirmado.

---

## Phase 5: User Story 3 - Ver o estado atual do áudio e persistir a preferência (Priority: P2)

**Goal**: Tornar o estado atual do áudio visualmente identificável no próprio controle, e persistir
a preferência de mute entre sessões — com "som ativo" como padrão na primeira visita e degradação
graciosa quando `localStorage` está indisponível (FR-006, FR-007, Clarifications Q1/Q2).

**Independent Test**: silenciar o áudio, observar que o controle muda de aparência para refletir o
estado "mudo", recarregar a página/reiniciar o jogo, e confirmar que o áudio permanece silenciado e
o controle exibe o estado correto sem exigir nova ação do jogador.

### Tests for User Story 3

- [X] T010 [P] [US3] Criar `client/tests/unit/audioPreferenceStore.test.ts` (mesmo padrão de
  `client/tests/unit/highScoreStore.test.ts`): cobre `getMuted()` retornando `false` quando nada foi
  salvo ainda (padrão "som ativo", Clarifications Q1), `getMuted()` refletindo um `setMuted(true)`
  anterior, `getMuted()` retornando `false` diante de um valor corrompido/em formato inesperado
  salvo em `localStorage`, e `getMuted()`/`setMuted()` nunca lançando exceção quando
  `globalThis.localStorage` está indisponível (mesma técnica de simulação usada no teste de
  `HighScoreStore`) — contracts/audio-preference-store.md — escrever este teste ANTES de T012 e
  confirmar que falha (o módulo ainda não existe)

### Implementation for User Story 3

- [X] T011 [P] [US3] Adicionar constante `AUDIO_MUTE_STORAGE_KEY = "baratas-na-geladeira:audio-muted"`
  em `client/src/config/gameConfig.ts`, ao lado de `HIGH_SCORE_STORAGE_KEY`
- [X] T012 [US3] Criar `client/src/systems/AudioPreferenceStore.ts` (sem `import Phaser`, mesmo
  padrão defensivo de `HighScoreStore.ts`): `isStorageAvailable()`, `getMuted(): boolean` (lê
  `AUDIO_MUTE_STORAGE_KEY` de `localStorage`; retorna `false` como valor de fallback seguro sempre
  que a chave estiver ausente, `localStorage` indisponível, o valor salvo estiver corrompido/em
  formato inesperado, ou qualquer exceção ocorrer — nunca lança), `setMuted(muted: boolean): void`
  (escreve `muted` protegido por `try/catch`; nunca lança, mesmo se a escrita falhar) —
  contracts/audio-preference-store.md § "getMuted"/"setMuted" — depende de T011; faz T010 passar
- [X] T013 [US3] Em `AudioControlScene.create()` (T002/T003), trocar a inicialização fixa
  `this.muted = false` por `this.muted = getMuted()` (importando `getMuted` de
  `client/src/systems/AudioPreferenceStore.ts`) — depende de T003, T012
- [X] T014 [US3] No handler de T004/T008, logo após inverter `this.muted` e aplicar
  `this.sound.mute`, chamar `setMuted(this.muted)` (importado de `AudioPreferenceStore.ts`) para
  persistir a nova preferência — depende de T004, T012
- [X] T015 [US3] Em `AudioControlScene.ts`, adicionar diferenciação visual ao botão de T002
  refletindo `this.muted` (ex.: texto alternando entre "🔊 Som" e "🔇 Mudo", ou troca de
  `backgroundColor`), atualizada tanto ao definir o estado inicial (T013) quanto a cada toggle
  (T014) — FR-006 — depende de T013, T014
- [X] T016 [US3] Validar manualmente o cenário 1 (áudio ativo por padrão na primeira visita, com
  `localStorage` limpo), o cenário 5 (preferência sobrevive a um reload de página) e o cenário 6
  (jogo continua funcionando com `localStorage` bloqueado, degradação graciosa dentro da sessão) de
  `specs/014-mute-som-jogo/quickstart.md` rodando `bun run dev` em `client/` — depende de T013,
  T014, T015

**Checkpoint**: as três user stories funcionam de forma independente e em conjunto — toggle
completo, com indicação visual clara e persistência entre sessões (com fallback gracioso quando o
armazenamento local está indisponível).

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Validação final cobrindo toda a feature de ponta a ponta, incluindo aspectos que não
pertencem a nenhuma user story específica.

- [X] T017 [P] Validar manualmente o cenário 4 de `specs/014-mute-som-jogo/quickstart.md` (controle
  disponível, visível e com estado consistente em todas as telas — início, partida, fim de jogo)
  rodando `bun run dev` em `client/`
- [X] T018 [P] Validar manualmente o cenário 8 de `specs/014-mute-som-jogo/quickstart.md` (controle
  permanece visível e clicável por cima da overlay de `PauseOverlayScene` durante a pausa, sem ser
  coberto nem ter seus cliques bloqueados pelo retângulo semitransparente) rodando `bun run dev` em
  `client/` — depende de T005, T006
- [X] T019 [P] Validar manualmente o cenário 7 de `specs/014-mute-som-jogo/quickstart.md` (com o
  mute ativo, pontuação/progressão de dificuldade/spawn/condição de derrota se comportam de forma
  idêntica ao jogo com som ativo; nenhum atraso perceptível ao clicar em baratas; e nenhuma barata
  passando visualmente pela área do botão de mute tem seu clique interceptado por ele — FR-008,
  FR-009) rodando `bun run dev` em `client/` — depende de T002
- [X] T020 Rodar `bun test` completo em `client/` e confirmar zero regressões na suíte existente,
  incluindo o novo `audioPreferenceStore.test.ts` (T010) passando
- [X] T021 [P] Rodar `tsc --noEmit` e `bun run build` em `client/` e confirmar zero erros de
  compilação/build
- [X] T022 Rodar a validação manual completa de `specs/014-mute-som-jogo/quickstart.md` (todos os 8
  cenários) como conferência final de ponta a ponta

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: sem dependências — pode começar imediatamente
- **Foundational (Phase 2)**: vazia — não bloqueia nada além do próprio Setup
- **User Story 1 (Phase 3)**: depende de Setup — é o MVP; toda a implementação mínima do toggle vive
  aqui
- **User Story 2 (Phase 4)**: depende de User Story 1 (T004) já existir — o mesmo handler
  bidirecional já implementa a reativação; esta fase só documenta o invariante e valida
- **User Story 3 (Phase 5)**: depende de User Story 1 (T002/T003) já existir — adiciona persistência
  (`AudioPreferenceStore`) e diferenciação visual por cima do toggle já funcional
- **Polish (Phase 6)**: depende de todas as user stories completas

### User Story Dependencies

- **User Story 1 (P1)**: depende apenas de Setup — nenhuma dependência de outra story
- **User Story 2 (P1)**: depende do código produzido pela User Story 1 (não é uma implementação
  independente — o toggle bidirecional de T004 já cobre mutar e reativar), mas é independentemente
  **testável**: dá para confirmar a reativação assim que US1 estiver pronta
- **User Story 3 (P2)**: depende do código produzido pela User Story 1 (o botão e o campo `muted` já
  existem desde T002); independentemente **testável** em relação a US1/US2 — mede aspectos
  diferentes (indicação visual e persistência entre sessões, não o silenciamento em si)

### Within Each User Story

- `AudioControlScene` criada (T002) antes de aplicar o estado inicial ao `SoundManager` (T003) e
  antes do handler de toggle (T004)
- Botão e handler (T002-T004) antes de registrar a Scene em `index.ts` (T005) e antes do
  `scene.launch` em `BootScene.ts` (T006, que depende também de T005 já ter adicionado a classe ao
  array)
- Implementação antes da validação manual em cada story (T004/T006 → T007; T008 → T009; T013/T014/
  T015 → T016)
- Em User Story 3: teste de `AudioPreferenceStore` (T010) escrito antes do módulo em si (T012);
  constante de storage (T011) antes do módulo que a usa (T012); módulo (T012) antes de ser
  consumido pela Scene (T013, T014)

### Parallel Opportunities

- Na Phase 5, T010 (teste de `AudioPreferenceStore`) e T011 (constante em `gameConfig.ts`) podem
  começar em paralelo — arquivos diferentes, T010 só precisa existir antes de T012 rodar (não antes
  de ser escrito)
- Na Phase 6, T017, T018, T019 e T021 podem rodar em paralelo entre si (validações e build
  independentes)
- Fora esses casos, as tarefas de implementação formam uma cadeia majoritariamente sequencial dentro
  de cada arquivo (`AudioControlScene.ts` em particular: T002 → T003 → T004 → T013 → T014 → T015)

---

## Parallel Example: User Story 3

```bash
# T010 e T011 podem começar em paralelo (arquivos diferentes, sem dependência mútua para começar):
Task: "Criar audioPreferenceStore.test.ts cobrindo getMuted()/setMuted() em client/tests/unit/audioPreferenceStore.test.ts"
Task: "Adicionar AUDIO_MUTE_STORAGE_KEY em client/src/config/gameConfig.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Completar Phase 1: Setup
2. Completar Phase 3: User Story 1 (Phase 2 não tem tarefas)
3. **PARAR e VALIDAR**: testar a User Story 1 de forma independente (T007)
4. Neste ponto já existe um controle de mute funcional (silencia tudo, e — por ser um toggle
   bidirecional — também já reativa), ainda sem indicação visual diferenciada nem persistência

### Incremental Delivery

1. Setup → ponto de partida confirmado
2. User Story 1 → testar independentemente → toggle de mute/desmute funcional (MVP)
3. User Story 2 → testar independentemente → reativação (incluindo o loop de voo) confirmada
4. User Story 3 → testar independentemente → indicação visual e persistência entre sessões
   confirmadas, com fallback gracioso sem `localStorage`
5. Polish → disponibilidade em todas as telas (incluindo a tela de pausa), ausência de efeitos
   colaterais em outros sistemas, regressão de testes, build limpo, validação de ponta a ponta

---

## Notes

- [P] = tarefas sem dependência de arquivo/lógica entre si — usado aqui em T010/T011 (Phase 5) e
  T017/T018/T019/T021 (Phase 6)
- [Story] mapeia cada tarefa à user story correspondente para rastreabilidade
- Único teste automatizado gerado: `audioPreferenceStore.test.ts` (T010), pois é a única parte desta
  feature que é uma função pura sem `import Phaser` — `AudioControlScene` (Phaser `Scene`) segue o
  mesmo padrão de `PauseOverlayScene`/`GameOverScene`, sem harness de teste automatizado neste
  projeto, validada via `quickstart.md`
- O toggle bidirecional (T004) nasce já em User Story 1 porque não é possível "silenciar" sem também
  implementar a inversão de estado que "reativa" — User Story 2 é deliberadamente
  validação/documentação (T008/T009), não implementação do zero, seguindo o mesmo critério já usado
  em `specs/009-pausar-partida` para o par pausar/retomar
- **Correção pós-`/speckit-analyze` (2026-09-20)**: T005/T006 substituem a formulação vaga original
  ("registrar como Scene sempre ativa") por um mecanismo concreto — posição fixa no array +
  `scene.launch` explícito em `BootScene` — depois de identificado que, neste projeto, apenas a
  primeira Scene do array é auto-iniciada pelo Phaser. T002 e T019 ganharam a checagem de
  sobreposição com prateleiras/zonas de spawn (evitar "zona morta" de clique). T018 (novo) valida
  explicitamente a interação com `PauseOverlayScene`
- Parar em qualquer checkpoint para validar a story correspondente de forma independente
