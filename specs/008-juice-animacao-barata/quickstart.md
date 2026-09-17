# Quickstart: Juice na Animação da Barata

Guia de validação ponta a ponta para esta feature, uma vez que as tarefas de implementação
(`tasks.md`, ainda não gerado por este comando) tiverem sido concluídas. Pressupõe o loop principal
(`specs/001-roach-fridge-clicker/`) já funcionando.

## Pré-requisitos

- Bun instalado (gerenciador de pacotes/runtime, constitution Princípio VII).
- Repositório na branch de implementação desta feature.

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
bun test      # suíte inalterada por esta feature — nenhuma função pura nova foi adicionada a entities/ ou systems/
```

## Cenários de validação manual (mapeados aos User Stories da spec)

1. **Intensidade cresce com a proximidade do alvo (User Story 1 / FR-001, FR-002, FR-003)**
   - Iniciar uma partida e observar uma barata assim que ela surge (spawn).
   - Confirmar: o squash/stretch e o tremor estão praticamente imperceptíveis nesse momento.
   - Continuar observando a mesma barata até ela estar prestes a alcançar a comida-alvo.
   - Confirmar: o squash/stretch e o tremor estão visivelmente mais intensos do que no spawn —
     deformação de escala mais perceptível e trepidação mais rápida.

2. **Cada barata anima de forma independente (User Story 1 / FR-008)**
   - Deixar pelo menos 3 baratas ativas simultaneamente, em pontos diferentes do trajeto.
   - Confirmar: cada uma exibe uma intensidade de squash/stretch/tremor proporcional apenas ao
     próprio progresso, e as trepidações não estão sincronizadas entre si (não "piscam" no mesmo
     instante).

3. **Hitbox real não muda (User Story 2 / FR-004)**
   - Clicar repetidamente em baratas em diferentes pontos do trajeto, incluindo perto do alvo
     (onde o efeito é mais intenso).
   - Confirmar: a eliminação acontece de forma consistente quando o clique cai sobre a posição real
     da barata, sem nenhuma diferença perceptível de precisão em relação ao jogo antes desta
     feature (mesma sensação de responsividade do clique, Princípio V).
   - Clicar deliberadamente logo fora do sprite de uma barata próxima do alvo (na "sobra" visual do
     tremor).
   - Confirmar: o clique é tratado como clique perdido (mesmo comportamento/som de erro de antes).

4. **Efeito para imediatamente ao eliminar ou roubar (Edge Cases / FR-005)**
   - Clicar em uma barata bem no meio do trajeto, com o efeito já visível, e observar a animação de
     queda.
   - Confirmar: a animação de queda/fade assume imediatamente, sem nenhum resíduo de tremor
     "vazando" durante a queda.
   - Deixar deliberadamente uma barata alcançar sua comida-alvo sem clicar nela.
   - Confirmar: o efeito de squash/stretch/tremor desaparece junto com a barata, sem nenhum
     resíduo visual após o roubo.

## Critérios de aceite de performance (User Story 3 / FR-006, SC-003, Princípio V)

- Com o painel de performance do navegador aberto (ou o contador de FPS do próprio navegador),
  deixar o número máximo de baratas simultâneas permitido pelo jogo ativo ao mesmo tempo, todas
  exibindo o efeito.
- Confirmar: o jogo mantém 60 FPS estáveis, sem engasgos perceptíveis no movimento das baratas nem
  atraso entre clique e eliminação, mantendo o mesmo padrão de responsividade já validado no MVP.

## Referências

- Contrato do efeito visual: [contracts/roach-juice-effect.md](./contracts/roach-juice-effect.md)
- Modelo de dados (funções derivadas): [data-model.md](./data-model.md)
- Decisões técnicas e alternativas: [research.md](./research.md)
