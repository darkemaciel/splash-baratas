# Quickstart: Sistema de Pontuação

Guia de validação ponta a ponta para esta feature, uma vez que as tarefas de implementação
(`tasks.md`, ainda não gerado por este comando) tiverem sido concluídas. Pressupõe o loop principal
(`specs/001-roach-fridge-clicker/`) e o HUD de progresso/risco (`specs/002-hud-progresso-risco/`)
já funcionando.

## Pré-requisitos

- Bun instalado (gerenciador de pacotes/runtime, constitution Princípio VII).
- Repositório na branch de implementação desta feature, a partir de `main` já com o MVP e o HUD
  de progresso/risco mesclados.

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
bun test      # inclui match.score.test.ts e matchStateManager.score.test.ts
```

## Cenários de validação manual (mapeados aos User Stories da spec)

1. **Pontuação básica por eliminação (User Story 1 / FR-001, FR-002, FR-003)**
   - Iniciar uma partida.
   - Confirmar: a pontuação exibida começa em `0`.
   - Clicar em uma barata antes de ela alcançar o alvo.
   - Confirmar: a pontuação aumenta imediatamente (pelo menos o valor base, `+100`).
   - Deixar deliberadamente uma barata roubar uma comida (não clicar nela a tempo).
   - Confirmar: a pontuação **não muda** com o roubo.

2. **Bônus de velocidade de reação (User Story 2 / FR-004, FR-005)**
   - Clicar em uma barata muito rapidamente após seu spawn (dentro de ~500ms).
   - Anotar os pontos ganhos (deve ser o valor base + o maior bônus de velocidade, `100 + 50 = 150`,
     assumindo combo zerado).
   - Em outra rodada, clicar em uma barata próxima de alcançar o alvo (fora das faixas de bônus,
     `> 1500ms` desde o spawn).
   - Confirmar: os pontos ganhos são exatamente o valor base (`100`), sem bônus de velocidade.

3. **Bônus de combo por eliminações consecutivas (User Story 3 / FR-006, FR-007, FR-008)**
   - Eliminar 3 baratas seguidas rapidamente, sem nenhum clique sem acertar nenhuma barata e sem
     deixar nenhuma comida ser roubada entre as eliminações.
   - Confirmar: a pontuação da 2ª e da 3ª eliminação da sequência é maior que a da 1ª (bônus de
     combo crescente), mesmo comparando eliminações com reação parecida.
   - Clicar deliberadamente em um ponto sem nenhuma barata.
   - Confirmar (indiretamente): eliminar uma barata logo em seguida não recebe mais bônus de combo
     acumulado da sequência anterior — volta a se comportar como início de sequência.
   - Repetir o teste deixando uma comida ser roubada no meio de uma sequência de combo, e
     confirmar o mesmo reset.
   - Repetir o teste esperando mais tempo do que a janela de combo entre duas eliminações
     consecutivas, e confirmar que o combo reinicia mesmo sem erro nem roubo.

4. **Pontuação final e reinício (FR-010, FR-011)**
   - Ao longo de uma partida completa, anotar manualmente os pontos ganhos a cada eliminação
     exibidos no HUD (base + bônus de reação + bônus de combo, conforme aplicável).
   - Jogar até a derrota (todas as comidas roubadas).
   - Confirmar: a tela de fim de jogo exibe a pontuação final acumulada, e que esse valor é
     exatamente a soma dos pontos anotados a cada eliminação — sem nenhum ponto perdido ou
     contado em duplicidade (SC-004).
   - Reiniciar a partir da tela final.
   - Confirmar: a pontuação volta a `0` antes de qualquer nova barata surgir.
   - Repetir esse ciclo (derrota → reiniciar) pelo menos 3 vezes seguidas para confirmar reset
     consistente em 100% das tentativas (FR-011).

## Critérios de aceite de performance (SC-005)

- Com o painel de performance do navegador aberto, jogar uma partida completa (incluindo
  sequências de combo) e confirmar que a pontuação não introduz quedas perceptíveis de FPS nem
  atraso entre clique e remoção da barata, mantendo o mesmo padrão de responsividade já validado
  no MVP e no HUD de progresso/risco.

## Referências

- Contrato de API interna: [contracts/domain-api-score.md](./contracts/domain-api-score.md)
- Modelo de dados e constantes de balanceamento: [data-model.md](./data-model.md)
- Decisões técnicas e alternativas: [research.md](./research.md)
