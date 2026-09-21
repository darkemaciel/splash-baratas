# Implementation Plan: Mute e Desmute do Som do Jogo

**Branch**: `014-mute-som-jogo` | **Date**: 2026-09-20 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/014-mute-som-jogo/spec.md`

## Summary

Adicionar um controle global de mute/desmute do áudio do jogo, visível em todas as telas (início,
partida, fim de jogo), que silencia e reativa imediatamente todos os sons já entregues em
`specs/003-feedback-sonoro-sfx` (efeitos discretos e o loop ambiente). O estado (ativo/mudo)
persiste localmente entre sessões, com "som ativo" como padrão na primeira visita e degradação
graciosa (toggle funcional só na sessão atual) quando `localStorage` está indisponível. Abordagem
técnica: usar a propriedade global `this.sound.mute` do `SoundManager` do Phaser (compartilhada por
todas as Scenes) para silenciar/restaurar áudio sem tocar nos pontos de disparo de SFX existentes,
persistir a preferência com o mesmo padrão defensivo de `HighScoreStore.ts`, e renderizar o
controle numa nova Scene paralela sempre ativa (`AudioControlScene`), no mesmo padrão de Scene
overlay já usado por `PauseOverlayScene`.

## Technical Context

**Language/Version**: TypeScript (stack fixa do projeto, Constitution Princípio VII)

**Primary Dependencies**: Phaser 4 (`Phaser.Sound.BaseSoundManager.mute`, já em uso via
`this.sound` em `GameScene.ts`/`PauseOverlayScene.ts`)

**Storage**: `localStorage` do navegador (client-only), mesmo padrão de
`client/src/systems/HighScoreStore.ts`

**Testing**: `bun test` para a lógica de persistência (`AudioPreferenceStore`, unitário, mesmo
padrão de `client/tests/unit/highScoreStore.test.ts`); validação manual do toggle visual e do
silenciamento de áudio via `quickstart.md` (Phaser Scenes não são unit-testáveis isoladamente)

**Target Platform**: Navegador desktop (Chrome, Firefox, Edge atuais), resoluções desktop

**Project Type**: Single project client-side (`client/` é o único workspace do repositório)

**Performance Goals**: 60 FPS estáveis, resposta ao clique sem atraso perceptível (Constitution
Princípio V)

**Constraints**: Sem backend (Constitution Princípio II); o controle de mute não pode interferir no
hit-testing das baratas nem atrasar a resposta ao clique/toque (FR-008)

**Scale/Scope**: Um único estado binário global (`muted: boolean`), compartilhado por todas as
Scenes; nenhuma nova entidade de domínio

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Princípio | Avaliação |
|---|---|
| I. Separação lógica/renderização | PASS — a preferência de áudio não é regra de domínio; vive em `systems/AudioPreferenceStore.ts` (sem `import Phaser`), separada de `entities/`/`MatchStateManager`. A Scene (`AudioControlScene`) só consome esse módulo e a API de áudio do Phaser. |
| II. Cliente como única camada, não confiável | PASS — persistência 100% client-side (`localStorage`), sem novo acoplamento a backend. |
| III. Web-first, mobile depois | PASS — o controle de mute é acionado via Pointer Events (input padrão do Phaser), igual a todo o resto da UI já entregue. |
| IV. Simplicidade deliberada | PASS — toggle binário único e global, reaproveitando padrões já existentes (`HighScoreStore`, `PauseOverlayScene`) em vez de introduzir volume granular, mute por categoria, ou uma nova arquitetura de configuração. |
| V. Responsividade do clique não-negociável | PASS — usa `this.sound.mute` (uma escrita de propriedade, sem lógica pesada) e o botão ocupa apenas sua própria hitbox; não adiciona nenhuma lógica ao hit-testing das baratas (FR-008). |
| VI. Assets versionados e organizados | PASS — não introduz novos assets de áudio/sprite; reaproveita os arquivos já existentes em `client/public/assets/audio/`. Se um ícone dedicado for usado para o botão, segue a convenção de `client/public/assets/sprites/`. |
| VII. Stack fixada | PASS — TypeScript + Phaser + Bun, sem novas dependências. |

Nenhuma violação — sem necessidade de preencher Complexity Tracking.

## Project Structure

### Documentation (this feature)

```text
specs/014-mute-som-jogo/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/           # Phase 1 output (/speckit-plan command)
│   └── audio-preference-store.md
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
client/
├── index.ts                              # registra AudioControlScene como última Scene do array
├── src/
│   ├── config/
│   │   └── gameConfig.ts                 # nova constante: chave de storage da preferência de áudio
│   ├── systems/
│   │   ├── HighScoreStore.ts             # padrão de referência (não alterado)
│   │   └── AudioPreferenceStore.ts       # NOVO: getMuted()/setMuted(), sem import Phaser
│   └── scenes/
│       ├── BootScene.ts                  # alterado: create() ganha this.scene.launch("AudioControlScene")
│       ├── StartScene.ts                 # não alterado
│       ├── GameScene.ts                  # não alterado (continua disparando this.sound.play(...))
│       ├── GameOverScene.ts              # não alterado
│       ├── PauseOverlayScene.ts          # não alterado (padrão de referência para Scene overlay)
│       └── AudioControlScene.ts          # NOVO: Scene paralela sempre ativa, registrada por último
│                                          # no array de Scenes (render/input acima de todas,
│                                          # incluindo PauseOverlayScene) — com o botão de mute
└── tests/
    └── unit/
        ├── highScoreStore.test.ts        # padrão de referência (não alterado)
        └── audioPreferenceStore.test.ts  # NOVO: testes unitários de getMuted()/setMuted()
```

**Structure Decision**: Projeto único client-side (`client/`, único workspace do repositório).
Segue a separação já estabelecida entre `entities/` (domínio puro), `systems/` (serviços sem
`import Phaser`, ex. `HighScoreStore`) e `scenes/` (únicas consumidoras de `systems/` e do Phaser).
Esta feature adiciona um módulo em `systems/` e uma Scene em `scenes/`, sem tocar nas entidades de
domínio nem no `MatchStateManager`.

## Complexity Tracking

> Sem violações de Constitution Check — seção não aplicável a esta feature.
