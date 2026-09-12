# Contract: API interna Domínio ↔ Renderização (Phaser)

Este projeto não expõe API externa (sem backend, sem outros sistemas consumindo o jogo). O
contrato relevante aqui é **interno**: a fronteira entre a camada de domínio pura (`entities/`,
`systems/`) e as `scenes/` do Phaser, exigida pelo Princípio I e II da constitution. As `scenes/`
DEVEM interagir com o domínio apenas através desta API — nunca reimplementar regras de jogo em
callbacks de UI.

## MatchStateManager

Serviço de domínio único, dono da instância corrente de `Match`. Nenhum método aceita ou retorna
tipos do Phaser.

### Métodos

| Método | Assinatura | Efeito |
|---|---|---|
| `start()` | `(): void` | Cria uma nova `Match` com `status: 'playing'`, 3 prateleiras / 9 comidas (`present`), sem baratas ativas. Emite `match:started`. |
| `restart()` | `(): void` | Equivalente a `start()`, chamável a partir de `status === 'lost'` (FR-013). Emite `match:started` novamente. |
| `tryEliminateRoach(roachId, clientTimestamp)` | `(string, number): boolean` | Tenta eliminar a barata `roachId` se ela ainda estiver `'active'` e o timestamp for anterior (ou igual, por FR-017) ao instante calculado de chegada. Retorna `true` se eliminada. Emite `roach:eliminated` em caso de sucesso. |
| `tick(now)` | `(number): void` | Avança o relógio de simulação: spawna novas baratas conforme a frequência fixa (research.md §3), avalia baratas cujo `travelDurationMs` expirou (chamando internamente a lógica equivalente a "roubo"), e recalcula `status`. Emite `food:stolen`, `match:lost` conforme aplicável. |
| `getSnapshot()` | `(): MatchSnapshot` | Retorna uma cópia somente-leitura do estado atual (`shelves`, `foodItems`, `activeRoaches`, `status`) para a scene renderizar. |

### Eventos emitidos (pub-sub simples, sem `Phaser.Events`)

| Evento | Payload | Quando |
|---|---|---|
| `match:started` | `MatchSnapshot` | após `start()`/`restart()` |
| `roach:spawned` | `Roach` | uma nova barata entra em `activeRoaches` |
| `roach:eliminated` | `{ roachId: string }` | clique elimina uma barata a tempo |
| `food:stolen` | `{ foodItemId: string }` | uma barata alcança o alvo sem ter sido clicada |
| `match:lost` | `MatchSnapshot` | última `FoodItem` transiciona para `stolen` |

## CollisionSystem (hit-testing)

Função pura de apoio, sem estado próprio, usada pela scene a cada evento de ponteiro (Princípio
III — Pointer Events, não Mouse Events).

| Função | Assinatura | Efeito |
|---|---|---|
| `hitTestRoach(pointerX, pointerY, roach, roachVisualRadius)` | `(number, number, Roach, number): boolean` | Retorna `true` se o ponto do ponteiro cai dentro do círculo de raio `roachVisualRadius + 6px` (research.md §4) centrado na posição interpolada atual da barata. Não usa física do Phaser (Princípio V). |
| `pickTopmostHit(pointerX, pointerY, roaches, ...)` | `(number, number, Roach[], ...): Roach \| undefined` | Quando múltiplas baratas se sobrepõem, retorna apenas a barata mais "acima" na pilha visual (FR-018) — nunca mais de uma. |

## Uso esperado pela camada de renderização

- `GameScene` (Phaser) chama `MatchStateManager.tick(scene.time.now)` a cada frame, lê
  `getSnapshot()` para posicionar sprites, e chama `hitTestRoach`/`pickTopmostHit` +
  `tryEliminateRoach` em `pointerdown`.
- `StartScene`/`GameOverScene` chamam apenas `start()`/`restart()` e escutam `match:started` /
  `match:lost` para trocar de scene — nunca leem ou escrevem campos de `Match` diretamente.
