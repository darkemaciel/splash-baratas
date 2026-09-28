# Quickstart: validar a navegação da pausa e do fim de jogo

**Feature**: `specs/018-navegacao-pausa-fim`

## Automático

```bash
cd client
bun test          # inclui matchStateManager.forfeit.test.ts (contracts/navigation.md)
bun run build
```

Esperado: toda a suíte passa (os testes existentes sem alteração) e o build sai sem erro.

## Manual (`bun run dev`, numa aba normal do navegador, paisagem e retrato)

| # | Passo | Esperado | Req. |
|---|---|---|---|
| 1 | Pausar | Pilha CONTINUAR / REINICIAR / ENCERRAR PARTIDA, bolhas A/B/A | FR-001 |
| 2 | CONTINUAR e, em outra pausa, a tecla P | Partida segue como antes | FR-002 |
| 3 | REINICIAR → CONTINUAR (diálogo) | Volta ao painel de pausa; partida intacta | FR-007a |
| 4 | Com o diálogo aberto, apertar P | Nada acontece | FR-007b |
| 5 | Fazer pontos, pausar, REINICIAR → REINICIAR | Partida nova: 9/9, PONTOS 0, 0:00, sem baratas, Pausar normal; sem som de voo até a 1ª barata | FR-003, FR-012, SC-004 |
| 6 | Anotar os pontos do HUD, pausar, ENCERRAR PARTIDA → ENCERRAR; na tela de nome, apertar P | FIM DE JOGO! com os mesmos pontos; nome pedido; P só digita a letra (não pausa nada); Top 5 atualizado | FR-005, FR-006, SC-005 |
| 7 | Na etapa de resultado | DE NOVO! e MENU lado a lado (no retrato, empilhados se não couberem) | FR-008 |
| 8 | MENU → JOGAR | Tela inicial sem recarregar; partida nova normal | FR-010 |
| 9 | Clique duplo rápido em REINICIAR (diálogo), ENCERRAR, DE NOVO! e MENU | Uma única transição em cada caso | FR-014 |
| 10 | Repetir 10 vezes os caminhos do SC-003 | Sem elementos, sons ou proxies duplicados (`document.querySelectorAll('#ui-a11y button')` só com os botões da tela atual + som) | FR-013, SC-003 |
| 11 | Tab até REINICIAR e Enter; depois Enter de novo | Diálogo abre com o foco em CONTINUAR (não em REINICIAR); o 2º Enter cancela e o foco volta para REINICIAR da pausa. Com o mouse, nenhum anel de foco aparece | FR-015, FR-015a |
