# Quickstart: Cursor Animado da Pata do Gato

Guia de validação ponta a ponta para esta feature, uma vez que as tarefas de implementação
(`tasks.md`) tiverem sido concluídas. Pressupõe o loop principal
(`specs/001-roach-fridge-clicker/`) já funcionando.

## Pré-requisitos

- Bun instalado (gerenciador de pacotes/runtime, constitution Princípio VII).
- Repositório na branch de implementação desta feature.
- Navegador desktop (Chrome, Firefox ou Edge) com mouse/trackpad — a feature não tem efeito
  observável em touch (ver spec, Assumptions).
- Arte da pata já processada e disponível em `client/public/assets/sprites/paw.png` (recortada,
  fundo transparente); frames dedicados de idle/golpe, se produzidos a partir das referências em
  `docs/references/`, ainda não existem — a animação atual é procedural (research.md §5).

## Setup

```bash
cd client
bun install
```

## Rodar o jogo localmente

```bash
bun run dev
```

Abra o endereço local impresso pelo Vite (tipicamente `http://localhost:5173`).

## Rodar os testes de domínio

```bash
bun test      # nenhum teste novo esperado — feature 100% em scenes/ (ver plan.md, Testing)
```

## Cenários de validação manual (mapeados aos User Stories da spec)

1. **Cursor substituído em toda a janela (User Story 1 / FR-001)**
   - Abrir o jogo (tela inicial) e mover o mouse por toda a janela, incluindo sobre os botões.
   - Confirmar: o cursor padrão do sistema nunca aparece — nem mesmo ao passar sobre um botão
     (`useHandCursor`) — e a pata do gato o substitui em todo lugar.

2. **Pata acompanha o ponteiro sem atraso (User Story 1 / FR-002, SC-001)**
   - Mover o mouse rapidamente por toda a área do jogo.
   - Confirmar: a pata acompanha a posição do ponteiro em tempo real, sem lag perceptível — a
     mesma sensação de resposta do cursor nativo do sistema.

3. **Inclinação na direção do movimento, parada quando parado (User Story 1 / FR-003)**
   - Mover o mouse para a direita, para a esquerda, para cima e para baixo (movimentos distintos,
     um de cada vez), observando a pata a cada um.
   - Confirmar: a pata inclina levemente na direção de cada movimento (a inclinação muda conforme a
     direção). Parar o mouse completamente.
   - Confirmar: a pata volta a ficar reta (sem inclinação) e não exibe nenhuma animação automática
     enquanto o ponteiro estiver parado.

4. **Cursor volta ao padrão fora da janela (User Story 1, cenário 4)**
   - Mover o ponteiro para fora da janela do navegador (ex.: para a barra de tarefas).
   - Confirmar: o cursor padrão do sistema reaparece fora da janela do jogo.

5. **Golpe ao acertar uma barata (User Story 2 / FR-004, FR-007)**
   - Iniciar uma partida e clicar sobre uma barata em tela.
   - Confirmar: a pata toca a animação de golpe e a barata é eliminada normalmente (som/efeito de
     acerto já existente dispara no mesmo instante).

6. **Golpe ao clicar em espaço vazio (User Story 2 / FR-004, FR-007)**
   - Durante uma partida, clicar em um ponto do campo de jogo sem nenhuma barata sob o cursor.
   - Confirmar: a pata toca exatamente a mesma animação de golpe do cenário anterior, sem nenhum
     outro efeito de jogo.

7. **Golpe não dispara em botões de menu (Clarifications, FR-004)**
   - Clicar no botão de pausa durante a partida, e nos botões das telas de início, pausa e fim de
     jogo.
   - Confirmar: nenhum desses cliques aciona a animação de golpe — só cliques dentro do campo de
     jogo ativo (barata ou espaço vazio) acionam.

8. **Cliques rápidos sucessivos reiniciam o golpe (User Story 2, cenário 3 / FR-006)**
   - Clicar repetidamente e rápido em sequência dentro do campo de jogo (spam de clique).
   - Confirmar: a animação de golpe reinicia a cada clique, sem fila de espera nem atraso
     perceptível na resposta visual.

9. **Golpe não atrasa o hit-testing (FR-005, FR-010, SC-003, Princípio V)**
   - Jogar uma partida inteira até o fim, clicando em baratas normalmente.
   - Confirmar: o tempo entre o clique e a eliminação da barata (ou ausência de efeito, em clique
     vazio) permanece igual ao comportamento sem esta feature — nenhum atraso perceptível.

10. **Pata com tamanho fixo e reconhecível, sem quebrar cliques em botões (FR-001, SC-005)**
    - Em cada tela com botões (início, pausa, fim, controle de mute), observar a pata (56px de
      altura, escalada por `UI_SCALE`) e posicioná-la sobre o botão de mute em `AudioControlScene`
      (o menor botão do jogo).
    - Confirmar: a pata é claramente reconhecível como uma pata de gato (garras visíveis, sem
      fundo/quadriculado); ela pode cobrir visualmente o botão de mute ao passar por cima dele, mas
      o clique nesse botão continua funcionando normalmente (o hit-test usa a posição real do
      ponteiro, nunca o sprite — FR-010).

11. **Pata continua ativa durante a pausa, sem acionar efeitos de barata (Edge Cases)**
    - Iniciar uma partida com ao menos uma barata ativa em tela e pausar (botão ou tecla P,
      `specs/009-pausar-partida`).
    - Confirmar: a pata continua seguindo o ponteiro e tocando a animação idle normalmente, e o
      botão "Continuar" da overlay de pausa é clicável; clicar sobre a barata congelada (visível
      atrás da overlay, se aplicável) ou em qualquer ponto do campo de jogo NÃO aciona a animação de
      golpe nem nenhum efeito de acerto/erro/roubo enquanto a partida estiver pausada.

12. **Degradação graciosa se o asset falhar (Edge Cases / FR-008)**
    - Simular falha de carregamento do asset da pata (ex.: renomear/remover temporariamente o
      arquivo em `client/public/assets/sprites/` e recarregar).
    - Confirmar: o cursor padrão do sistema volta a aparecer, e cliques continuam funcionando
      normalmente (eliminando baratas), sem erro que quebre a interação.

13. **Sem efeito em dispositivos touch (Edge Cases, Assumptions)**
    - Abrir o jogo num navegador mobile/emulador touch (fora do suporte oficial do MVP, apenas para
      confirmar ausência de regressão).
    - Confirmar: nenhum cursor de pata aparece (não há cursor de sistema a substituir), e toques
      continuam funcionando normalmente.

## Referências

- Contrato dos módulos novos: [contracts/cursor-scene.md](./contracts/cursor-scene.md)
- Modelo de dados: [data-model.md](./data-model.md)
- Decisões técnicas e alternativas: [research.md](./research.md)
