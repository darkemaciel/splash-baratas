# Quickstart: HUD de Progresso/Risco

Guia de validação ponta a ponta para esta feature, uma vez que as tarefas de implementação
(`tasks.md`, ainda não gerado por este comando) tiverem sido concluídas. Pressupõe o loop
principal (`specs/001-roach-fridge-clicker/`) já funcionando.

## Pré-requisitos

- Bun instalado (gerenciador de pacotes/runtime, constitution Princípio VII).
- Repositório na branch de implementação desta feature, a partir de `main` já com o MVP mesclado.

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
bun test      # inclui match.hud.test.ts (foodRemainingCount, foodTotalCount, riskLevel)
```

## Cenários de validação manual (mapeados aos User Stories da spec)

1. **Estado inicial do HUD (User Story 1 / FR-001, FR-002)**
   - Iniciar uma partida.
   - Confirmar: o HUD mostra a contagem numérica igual ao total de comidas da partida (9) e o
     indicador visual de risco no estado "seguro".

2. **Atualização ao roubo de comida (User Story 1 / FR-003)**
   - Deixar uma barata roubar uma comida (não clicar nela a tempo).
   - Confirmar: o número exibido diminui em 1 no mesmo momento em que a comida desaparece da
     prateleira, sem atraso perceptível.

3. **Eliminação de barata não afeta o HUD (User Story 1 / FR-004)**
   - Clicar em uma barata antes de ela alcançar o alvo.
   - Confirmar: o número exibido no HUD permanece inalterado.

4. **Transição de nível de risco (User Story 2 / FR-005)**
   - Deixar comidas serem roubadas até restar 50% ou menos do total (ex.: 4 de 9).
   - Confirmar: o indicador visual muda para o estado "risco elevado".
   - Continuar até restar exatamente 1 comida.
   - Confirmar: o indicador visual muda para o estado "crítico", visualmente distinto do "risco
     elevado" anterior.

5. **HUD ausente fora da tela de jogo (FR-008)**
   - Observar a tela inicial antes de começar a partida, e a tela final após a derrota.
   - Confirmar: o HUD não aparece em nenhuma das duas.
   - No exato momento em que a última comida é roubada (transição para a tela final, Edge Case da
     spec), confirmar que não há nenhum "flash" perceptível do indicador em nível "crítico" antes
     de a tela final substituir a tela de jogo.

6. **Reinício restaura o HUD (User Story 3 / FR-006, SC-004)**
   - Jogar até a derrota (todas as comidas roubadas) e reiniciar a partir da tela final.
   - Confirmar: o HUD volta a mostrar a contagem total original e o estado "seguro" antes de
     qualquer nova barata surgir.
   - Repetir esse ciclo (derrota → reiniciar) pelo menos 3 vezes seguidas para confirmar que o HUD
     é redefinido corretamente em 100% das tentativas (SC-004), não só na primeira.

7. **Posicionamento não interfere no clique (FR-007)**
   - Com o HUD visível, tentar clicar em baratas que passam próximas ao topo da tela (ponto de
     spawn superior).
   - Confirmar: o clique continua funcionando normalmente, sem nenhuma área "morta" causada pelo
     HUD sobre baratas ou comidas.

## Critérios de aceite de performance (SC-003)

- Com o painel de performance do navegador aberto, jogar uma partida completa e confirmar que a
  adição do HUD não introduz quedas perceptíveis de FPS nem atraso entre clique e remoção da
  barata, mantendo o mesmo padrão de responsividade já validado no MVP.

## Referências

- Contrato de API interna: [contracts/domain-api-hud.md](./contracts/domain-api-hud.md)
- Modelo de dados: [data-model.md](./data-model.md)
- Decisões técnicas e alternativas: [research.md](./research.md)
