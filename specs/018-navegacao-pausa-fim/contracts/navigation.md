# Contract: Navegação da pausa e do fim de jogo

## Domínio: `MatchStateManager.forfeit`

```ts
/** Encerra a partida em andamento pelo jogador. Idempotente. */
forfeit(now: number): boolean;
```

| Pré-condição | Resultado | Evento |
|---|---|---|
| `status === "playing"` | `true`; `endedAt = now`; `status = "lost"` | `match:lost` exatamente uma vez |
| `status !== "playing"` | `false`; nada muda | nenhum |

Testes (`client/tests/unit/matchStateManager.forfeit.test.ts`):
1. Partida em andamento com pontos e comidas roubadas: `forfeit(t)` devolve `true`, o snapshot
   tem `status "lost"`, `endedAt t`, a mesma `score` e as mesmas comidas presentes.
2. `match:lost` é emitido uma vez; um segundo `forfeit` devolve `false` e não emite.
3. `forfeit` antes de `start()` (status `notStarted`) devolve `false`.
4. Depois de `forfeit`, `tick(t + muito)` não cria baratas nem rouba comidas.
5. `elapsedMs(snapshot, t + 10_000)` depois de `forfeit(t)` é igual a `t − startedAt`.
6. `restart()` depois de `forfeit` volta a `"playing"` com o estado inicial.

## Cena: `GameScene` → `PauseOverlayScene`

- `triggerPause()` chama `this.scene.launch("PauseOverlayScene", { pausedAtLogicalMs: this.logicalNow() })`.
- Nada mais muda na `GameScene`. O handler de `match:lost` que já existe (para o `sfx-fly` e
  inicia a `GameOverScene`) também atende o `forfeit`.

## Cena: `PauseOverlayScene`

| Ação | Estado exigido | Efeito |
|---|---|---|
| CONTINUAR (painel) ou tecla P | `painel`, `!leaving` | `resumeMatch()` como hoje (`resumeAll`, `resume("GameScene")`, `stop()`) |
| REINICIAR (painel) | `painel`, `!leaving` | vai para `confirmarReiniciar` |
| ENCERRAR PARTIDA (painel) | `painel`, `!leaving` | vai para `confirmarEncerrar` |
| CONTINUAR (diálogo) | diálogo, `!leaving` | volta para `painel` |
| REINICIAR (diálogo) | `confirmarReiniciar`, `!leaving` | `leaving = true`; `sound.stopAll()`; `matchStateManager.restart(this.time.now)`; `scene.start("GameScene")` |
| ENCERRAR (diálogo) | `confirmarEncerrar`, `!leaving` | `leaving = true`; `sound.stopAll()`; `matchStateManager.forfeit(pausedAtLogicalMs)`; `scene.stop()` (a `GameScene` troca para `GameOverScene` pelo `match:lost`) |

Composição:
- **painel**: sobreposição `ALFA.sobreposicao`; painel com largura `min(TAMANHO.painelPausa,
  GAME_WIDTH − 2L)`; título "PAUSADO"; pilha com vão `ESPACO.e12` de CONTINUAR (primário, M, bolha
  A, pilha), REINICIAR (secundário, M, bolha B, pilha) e ENCERRAR PARTIDA (terciário, M, bolha A,
  pilha).
- **diálogo**: mesma sobreposição, sem o painel de pausa, com `createDialog` centrado.

## Kit de UI

```ts
// client/src/ui/Dialog.ts
createDialog(scene, x, y, {
  titulo: string; texto: string;
  cancelar: string; confirmar: string;
  onCancelar: () => void; onConfirmar: () => void;
}): { destroy(): void };

// client/src/ui/Button.ts (acréscimo)
button.setPosition(x: number, y: number): Button; // move container + zona de clique + base do hover
```

- Diálogo: painel creme (`RAIO.painel`, `SOMBRA.painel`), largura `min(TAMANHO.dialogo,
  GAME_WIDTH − 2L)`; título em display `TEXTO.titulo_p`, `COR.traco`, −2°; texto em
  `FONTE.texto` `TEXTO.corpo` (600 · 16), `COR.traco`, com quebra na largura interna; botões P lado
  a lado com vão `ESPACO.e12` (cancelar = terciário bolha B, confirmar = primário bolha A). Se não
  couberem lado a lado, empilham com o de confirmar embaixo.
- **Foco (FR-015a)**: `a11y.ts` ganha `focus()` no `A11yProxy` e a função `isProxyFocused():
  boolean` (verdadeiro se `document.activeElement` é um proxy em `#ui-a11y`). `Button` ganha
  `focus()`, que repassa para o proxy. `createDialog` aceita `focusCancel?: boolean`: com `true`,
  foca o botão de cancelar logo após criar. A overlay lê `isProxyFocused()` **antes** de trocar de
  estado. Se era teclado, abre o diálogo com `focusCancel: true` e, ao cancelar, foca de novo o botão
  da pausa que o abriu.
- `TAMANHO.dialogo = 400` entra em `theme.ts` (design system: "painel de 400px").

## Cena: `GameOverScene` (etapa de resultado)

- Cria DE NOVO! (primário, M, bolha A) e MENU (secundário, M, bolha B, rótulo acessível "Menu").
- Lado a lado centralizados com vão `ESPACO.e16` se couberem em `GAME_WIDTH − 2L`; senão,
  empilhados com vão `ESPACO.e12`, DE NOVO! em cima. O orçamento de altura considera a pilha no
  retrato (que tem espaço de sobra).
- DE NOVO!: `leaving = true` e depois `matchStateManager.restart(this.time.now)`, como hoje (a
  inscrição em `match:started` inicia a `GameScene`).
- MENU: `leaving = true` e depois `this.scene.start("StartScene")`.
- Nenhum dos dois aparece durante a entrada de nome (sem mudança: os botões já são criados só em
  `showResults`).
