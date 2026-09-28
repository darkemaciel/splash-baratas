# Quickstart: validar a pontuação flutuante

**Feature**: `specs/019-pontuacao-flutuante`

## Automático

```bash
cd client
bun test      # inclui matchStateManager.eliminatedPoints e ui.floatingScoreLayout (contracts/floating-score.md)
bun run build
```

## Manual (`bun run dev`, numa aba normal, paisagem e retrato)

| # | Passo | Esperado | Req. |
|---|---|---|---|
| 1 | Eliminar uma barata no meio da tela | "+N!" branco com contorno, inclinado para a direita, logo acima da pata, sem encostar nela; sobe e some em ~0,7s | FR-001–FR-004 |
| 2 | Anotar PONTOS, eliminar 5 baratas, somar os N | A soma é igual ao aumento de PONTOS | SC-001 |
| 3 | Duas eliminações rápidas (combo) | Dois números independentes; o 2º maior (bônus de combo) | FR-009 |
| 4 | Acertar e mover o mouse logo em seguida | O número continua subindo onde nasceu; a pata passa por cima | FR-002 |
| 5 | Acertar baratas junto às bordas esquerda, direita e ao topo (perto das pílulas) | Número inteiro na tela; no topo, ao lado da pata; nunca embaixo dela | FR-008, SC-005 |
| 6 | Clicar numa barata logo atrás de um número subindo | Eliminação normal | FR-006, SC-003 |
| 7 | Pausar com um número no ar e depois retomar | O número congela e continua | FR-011 |
| 8 | Com um número no ar: pausar → REINICIAR; e em outra partida, pausar → ENCERRAR | Nenhum número na partida nova nem no fim de jogo | FR-012, SC-006 |
| 9 | Clique perdido | Nenhum número | FR-014 |
| 10 | Ativar "reduzir movimento" e eliminar | O número aparece parado e some em ~0,7s | FR-005 |
| 11 | DevTools → Performance: 10 eliminações em 5s | ~60 FPS | SC-004 |
