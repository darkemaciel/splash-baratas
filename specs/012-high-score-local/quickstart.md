# Quickstart: High Score Local

**Revisão pós-implementação (2026-09-19)**: cenários reescritos para o ranking Top 5
(`spec.md` → Clarifications). Se você já tinha testado a versão de recorde único neste navegador,
o valor antigo salvo em `localStorage` é ignorado automaticamente (tratado como ranking vazio,
research.md §6) — nenhuma limpeza manual é necessária, mas fazer `localStorage.clear()` no site
antes de repetir os cenários abaixo dá um ponto de partida limpo e mais fácil de acompanhar.

Guia de validação ponta a ponta para esta feature, uma vez que as tarefas de implementação
(`tasks.md`) tiverem sido concluídas. Pressupõe o loop principal
(`specs/001-roach-fridge-clicker/`) e o sistema de pontuação
(`specs/004-sistema-pontuacao/`) já funcionando.

## Pré-requisitos

- Bun instalado (gerenciador de pacotes/runtime, constitution Princípio VII).
- Repositório na branch de implementação desta feature.
- Navegador com `localStorage` habilitado (fora de modo de navegação privada restritivo, para os
  cenários 1-4 abaixo; o cenário 5 exige justamente o oposto).

## Setup

```bash
cd client
bun install
```

## Rodar o jogo localmente

```bash
bun run dev
```

Abra o endereço local impresso pelo Vite (tipicamente `http://localhost:5173`) em Chrome, Firefox
ou Edge desktop.

## Rodar os testes de domínio

```bash
bun test      # inclui highScoreStore.test.ts (novo)
```

## Cenários de validação manual (mapeados aos User Stories da spec)

1. **Primeira partida sempre entra no ranking (User Story 1 / FR-002)**
   - Em um navegador/perfil onde o jogo nunca foi jogado (ou após limpar o `localStorage` do
     site nas DevTools), jogar uma partida até perder.
   - Confirmar: a tela de derrota indica a posição alcançada (1º lugar) junto da pontuação final,
     mesmo que o resultado tenha sido baixo.

2. **Ranking preenche até 5 posições (User Story 1 / FR-002)**
   - Jogar mais 3 partidas (total de 4), cada uma reiniciando a partir da tela de derrota.
   - Confirmar: todas as 4 primeiras partidas indicam entrada no ranking (ainda há espaço livre),
     em posições consistentes com suas pontuações relativas.

3. **Ranking cheio: entrada desloca a menor pontuação (User Story 1 / FR-002, FR-003)**
   - Com 5 pontuações já registradas, jogar uma 6ª partida com pontuação maior que a menor das 5
     já registradas.
   - Confirmar: a tela de derrota indica a posição alcançada, e a menor pontuação anterior não
     aparece mais no ranking (continua com exatamente 5 entradas).

4. **Ranking cheio: pontuação não entra (User Story 1 / FR-004)**
   - Com o ranking cheio, jogar uma partida terminando com pontuação igual ou menor que a menor
     pontuação já registrada (ex.: perder rapidamente de propósito).
   - Confirmar: a tela de derrota NÃO indica entrada no ranking, e as 5 pontuações registradas
     permanecem as mesmas de antes.

5. **Ranking visível na tela inicial, mesmo após fechar o navegador (User Story 2 / FR-006,
   FR-007)**
   - Antes de qualquer partida (`localStorage` limpo), abrir a tela inicial e confirmar um
     indicador de "nenhuma partida registrada ainda", não uma lista de "0"s.
   - Jogar algumas partidas, voltar à tela inicial e confirmar que a lista exibida bate com as
     pontuações já registradas, em ordem decrescente.
   - Fechar completamente o navegador, reabrir e voltar à tela inicial: confirmar que o mesmo
     ranking continua sendo exibido.

6. **Jogo continua funcionando sem `localStorage` (User Story 3 / FR-009)**
   - Abrir uma janela anônima/privada configurada para bloquear armazenamento local (ou usar as
     DevTools para negar acesso a `localStorage` do site).
   - Jogar uma partida inteira, do início à tela de derrota.
   - Confirmar: nenhum erro visível, nenhuma trava — o fluxo de fim de partida se comporta como se
     fosse a primeira partida de sempre.

7. **Reiniciar não afeta o ranking salvo (Edge Cases / FR-011)**
   - Com um ranking já salvo, jogar uma nova partida com pontuação que não entra no ranking e
     reiniciar a partir da tela de derrota várias vezes.
   - Confirmar: o ranking exibido na tela inicial permanece o mesmo durante todo esse processo.

## Referências

- Contrato do módulo de ranking: [contracts/high-score-store.md](./contracts/high-score-store.md)
- Modelo de dados (constantes novas e funções): [data-model.md](./data-model.md)
- Decisões técnicas e alternativas: [research.md](./research.md)
