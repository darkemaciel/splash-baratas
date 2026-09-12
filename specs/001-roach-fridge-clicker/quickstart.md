# Quickstart: Loop Principal — Baratas na Geladeira

Guia de validação ponta a ponta para esta feature, uma vez que as tarefas de implementação
(`tasks.md`, ainda não gerado por este comando) tiverem sido concluídas.

## Pré-requisitos

- Bun instalado (gerenciador de pacotes/runtime, constitution Princípio VII).
- Repositório clonado, branch `001-roach-fridge-clicker`.
- `client/vite.config.ts` criado e `client/index.ts` atuando como bootstrap do jogo Phaser (parte
  do trabalho de implementação — ainda não existe no scaffold atual).

## Setup

```bash
cd client
bun install
```

## Rodar o jogo localmente

```bash
bun run dev   # script Vite a ser adicionado em client/package.json pelas tasks de implementação
```

Abra o endereço local impresso pelo Vite (tipicamente `http://localhost:5173`) em Chrome,
Firefox ou Edge desktop.

## Rodar os testes de domínio

```bash
bun test      # exercita entities/ e systems/ isoladamente, sem o Phaser renderizar nada
```

## Cenários de validação manual (mapeados aos User Stories da spec)

1. **Tela inicial → início de partida (User Story 3 / FR-001)**
   - Abrir o jogo: confirmar que aparece a tela inicial, sem prateleiras/comidas/baratas visíveis.
   - Clicar em "Iniciar": confirmar que as 3 prateleiras aparecem com 9 comidas no total e que
     baratas começam a surgir periodicamente (research.md §3: a cada ~2.5s).

2. **Eliminar barata a tempo (User Story 1 / FR-006, FR-015)**
   - Com uma partida em andamento, clicar em uma barata visível antes de ela alcançar a comida.
   - Confirmar: a barata desaparece imediatamente (feedback visual de queda, FR-020) e a
     comida-alvo permanece na prateleira.

3. **Deixar uma barata roubar a comida (User Story 1 / FR-007, FR-008)**
   - Não clicar em uma barata até ela alcançar o alvo.
   - Confirmar: a comida some permanentemente (efeito visual, FR-020) e não pode ser recuperada
     nesta partida.

4. **Clique em barata já eliminada / área vazia (Edge Cases)**
   - Clicar novamente na posição onde uma barata já eliminada estava, e também em uma área vazia
     da tela.
   - Confirmar: nenhum efeito colateral em ambos os casos.

5. **Baratas sobrepostas (FR-018)**
   - Aguardar duas baratas visualmente sobrepostas e clicar na área de sobreposição.
   - Confirmar: apenas uma barata (a mais "acima" na pilha visual) é afetada.

6. **Derrota e reinício (User Story 2 / FR-010 a FR-014)**
   - Deixar todas as 9 comidas serem roubadas (ou testar com uma partida reduzida, se disponível
     via configuração de teste).
   - Confirmar: a tela final de derrota aparece imediatamente ao roubo da última comida, nenhuma
     nova barata surge, e a opção de reiniciar restaura a partida (novas 9 comidas, sem baratas)
     em menos de 2 segundos, sem recarregar a página (SC-005).
   - Medir com um cronômetro (ou o painel de performance do navegador) o tempo entre o clique em
     "Reiniciar" e a partida nova estar pronta para jogar; repetir ao menos 3 vezes seguidas para
     confirmar que fica sempre abaixo de 2 segundos (SC-005, Edge Case de reinícios rápidos).

## Critérios de aceite de performance (SC-002, SC-006, PRD §6)

- Observar visualmente: baratas devem se mover sem engasgos perceptíveis do início ao fim da
  partida.
- Cliques sobre baratas visíveis devem remover a barata sem atraso perceptível (ideal: verificar
  com o painel de performance do navegador que o jogo mantém ~60 FPS estável durante o teste).

## Referências

- Contrato de API interna: [contracts/domain-api.md](./contracts/domain-api.md)
- Modelo de dados: [data-model.md](./data-model.md)
- Decisões técnicas e alternativas: [research.md](./research.md)
