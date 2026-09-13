# Contract: Gatilhos de Áudio — Feedback Sonoro (SFX)

Esta feature não altera o contrato de domínio↔renderização existente
(`specs/001-roach-fridge-clicker/contracts/domain-api.md`,
`specs/002-hud-progresso-risco/contracts/domain-api-hud.md`) — nenhum evento novo é adicionado ao
`MatchStateManager`, nenhum campo novo é adicionado a `MatchSnapshot`. Este documento registra, em
vez disso, o contrato **novo** desta feature: a convenção de chaves de áudio e o mapeamento
evento→som, para que features futuras (mute/volume toggle, gatilho de `walk.mp3` quando a
locomoção "andando" existir) estendam o mesmo padrão em vez de criar um paralelo.

## Convenção de chaves de preload

Todas as chaves de áudio usam o prefixo `sfx-` seguido do nome do arquivo sem extensão:

| Arquivo (`client/public/assets/audio/`) | Chave de preload | Carregado por esta feature? |
|---|---|---|
| `hit.mp3` | `sfx-hit` | Sim |
| `miss.mp3` | `sfx-miss` | Sim |
| `steal.mp3` | `sfx-steal` | Sim |
| `fly.mp3` | `sfx-fly` | Sim (tocado em loop) |
| `walk.mp3` | `sfx-walk` (reservada, não usada) | **Não** — ver FR-011 do spec.md |

## Onde o preload acontece

`client/src/scenes/BootScene.ts`, método `preload()`:

```ts
preload(): void {
  this.load.audio("sfx-hit", "assets/audio/hit.mp3");
  this.load.audio("sfx-miss", "assets/audio/miss.mp3");
  this.load.audio("sfx-steal", "assets/audio/steal.mp3");
  this.load.audio("sfx-fly", "assets/audio/fly.mp3");
  // sfx-walk deliberadamente omitido — ver research.md §6
}
```

Nenhuma outra scene deve chamar `this.load.audio(...)` — `BootScene` é a única fronteira de
carregamento de assets do jogo (mesmo papel que já exerce para as texturas placeholder).

## Mapeamento evento → som (efeitos discretos)

| Gatilho | Local no código | Chamada |
|---|---|---|
| `roach:eliminated` (evento do `MatchStateManager`) | `GameScene`, listener já existente que dispara o tween de queda da barata | `this.sound.play("sfx-hit")` |
| `food:stolen` (evento do `MatchStateManager`) | `GameScene`, listener já existente que dispara o tween de sumiço da comida | `this.sound.play("sfx-steal")` |
| `pickTopmostHit` retorna `undefined` | `GameScene.handlePointerDown`, branch `else` do hit-test | `this.sound.play("sfx-miss")` |

Cada chamada usa o atalho `SoundManager.play(key)` (nova instância a cada chamada), nunca reutiliza
uma instância guardada — isso é o que permite sobreposição sem cortes (FR-009, ver research.md §3).

## Som ambiente (loop)

| Transição (comparada a cada `update()`) | Chamada |
|---|---|
| `activeRoaches.length` de `0` para `>0` | `this.sound.play("sfx-fly", { loop: true })` |
| `activeRoaches.length` de `>0` para `0` | `this.sound.stopByKey("sfx-fly")` |
| Evento `match:lost` (a qualquer momento) | `this.sound.stopByKey("sfx-fly")` — chamado antes de `this.scene.start("GameOverScene")` |
| Início de `GameScene.create()` | `this.sound.stopByKey("sfx-fly")` — guarda defensiva contra resíduo de partida anterior |

**Importante para features futuras**: `this.sound` é o `SoundManager` do `Game` (nível global), não
por-`Scene` — qualquer som iniciado numa `Scene` continua tocando após a troca de `Scene` a menos
que seja parado explicitamente. Qualquer feature futura que inicie um som deve prever seu próprio
`stop` explícito nas transições relevantes, não confiar no ciclo de vida da `Scene`.

## Extensão futura (fora de escopo desta feature)

- **Mute/volume toggle** (backlog, seção 3): deve envolver `this.sound.mute` /
  `this.sound.setVolume(...)` no `SoundManager` global — não deve exigir alterar nenhuma das
  chamadas de `play()` acima.
- **Gatilho de `walk.mp3`**: quando a locomoção "andando" for especificada, adicionar
  `this.load.audio("sfx-walk", "assets/audio/walk.mp3")` ao `preload()` de `BootScene` e o
  `play`/`stop` correspondente seguindo o mesmo padrão do loop de voo acima.
