<!--
Sync Impact Report
- Version change: 1.0.0 → 1.1.0
- Rationale for MINOR: Added a new principle (VIII); no existing principle was removed or
  redefined incompatibly.
- Modified principles: n/a
- Added sections:
  - Core Principle VIII (Confirmação prévia para mudanças críticas) — governs actions the AI
    assistant (Claude Code) may take in this repo, requiring explicit user confirmation before
    any critical/destructive/hard-to-reverse operation.
- Removed sections: none
- Templates checked for alignment:
  - .specify/templates/plan-template.md — still not present in repo; no action taken (n/a)
  - .specify/templates/tasks-template.md — still not present in repo; no action taken (n/a)
  - .specify/templates/spec-template.md — still not present in repo; no action taken (n/a)
- Follow-up TODOs: none
-->

# Baratas na Geladeira Constitution

## Core Principles

### I. Separação entre lógica de jogo e renderização
As regras do jogo (quando uma barata alcança a comida, quando a partida termina, quais
comidas restam) DEVEM ser implementadas independentemente de detalhes visuais (posição de
pixel, animação em andamento, ciclo de frames do Phaser). O estado e as regras do jogo DEVEM
poder ser descritos e verificados sem depender do Phaser renderizar nada na tela — por
exemplo, como classes de domínio puras, sem importar `Phaser.Scene`, exercitáveis de forma
isolada.

**Rationale**: bugs de regra de jogo não podem ficar escondidos atrás de bugs de renderização,
e a lógica precisa continuar testável e portável caso o motor gráfico mude no futuro.

### II. Cliente como única camada, tratado como não confiável
Não há backend no MVP — todo o estado (comidas restantes, baratas ativas) vive no cliente.
Ainda assim, essa lógica DEVE ficar isolada em classes/serviços de domínio próprios, nunca
espalhada em callbacks de UI ou handlers de eventos do Phaser.

**Rationale**: se pontuação ou outra regra migrar para validação server-side no backlog, a
migração deve trocar apenas onde a lógica roda, não como ela é escrita.

### III. Web-first, mobile depois
O MVP roda 100% no navegador via Phaser + TypeScript. Toda interação de clique/toque DEVE ser
tratada via Pointer Events, não exclusivamente Mouse Events ou Keyboard Events.

**Rationale**: eventos de ponteiro funcionam tanto para mouse quanto para toque, permitindo uma
futura migração para mobile via Capacitor sem reescrever a camada de input.

### IV. Simplicidade deliberada no MVP
O MVP tem dificuldade fixa, sem pontuação e sem progressão. Nenhuma feature do backlog
(dificuldade progressiva, pontuação) DEVE ser antecipada na estrutura de código atual "pra já
deixar pronto".

**Rationale**: generalizar para requisitos ainda não validados adiciona complexidade sem
benefício comprovado. Quando essas features forem priorizadas, entram como spec nova.

### V. Responsividade do clique é não-negociável
A precisão e a velocidade de resposta ao clique/toque do jogador são o núcleo da experiência.
Qualquer decisão técnica que comprometa isso — lógica de colisão pesada, delay de eventos,
dessincronia entre posição lógica e posição renderizada — É INACEITÁVEL e DEVE ser resolvida
antes de a feature ser considerada concluída. Hit-testing direto é preferido a física pesada
para detecção de clique.

**Rationale**: a hitbox da barata depende de posições de render/colisão sincronizadas; qualquer
lag ou dessincronia quebra a jogabilidade central do jogo.

### VI. Assets versionados e organizados desde o início
Sprites, sons e fontes — mesmo arte placeholder — DEVEM seguir a estrutura de pastas definida
(`client/public/assets/sprites`, `/audio`, `/fonts`). Nenhum arquivo solto fora dessa convenção.

**Rationale**: manter a convenção desde o início evita retrabalho de reorganização quando arte
final substituir os placeholders.

### VII. Stack fixada para o MVP
- **Cliente/jogo**: TypeScript + Phaser.
- **Gerenciador de pacotes/runtime**: Bun (instalação de dependências, execução de scripts e
  build).
- **Hospedagem do MVP**: Vercel (build estático do cliente).
- Backend e banco de dados ficam fora do MVP (ver `prd.md`, seção 4 — Fora do Escopo) e só
  entram quando uma feature do backlog exigir persistência real.

**Rationale**: fixar a stack evita decisões de infraestrutura recorrentes a cada feature e
mantém o MVP deployável como site estático.

### VIII. Confirmação prévia para mudanças críticas
O assistente de IA (Claude Code) operando neste repositório NÃO DEVE executar mudanças críticas
sem antes pedir confirmação explícita ao usuário. Consideram-se críticas: operações destrutivas
ou de difícil reversão (`git push --force`, `reset --hard`, exclusão de branches/arquivos/
tags), alterações em configuração de deploy/CI/produção, merges ou publicações que afetam
sistemas compartilhados, e qualquer ação cujo efeito se propague para fora do working tree
local. Ações locais e reversíveis (editar arquivos, criar branches, rodar testes) não exigem
essa confirmação prévia.

**Rationale**: decisões com impacto irreversível ou que afetam produção/colaboradores cabem ao
usuário; o assistente deve propor e explicar, não executar por iniciativa própria.

## Governance

Esta constituição rege todas as decisões de `/speckit-plan` e `/speckit-tasks` deste projeto.
Toda spec DEVE ser compatível com os princípios acima. Se uma necessidade nova conflitar com um
princípio, o princípio DEVE ser revisado explicitamente neste arquivo — nunca contornado
silenciosamente dentro de uma feature.

**Procedimento de emenda**: uma mudança de princípio requer (1) uma proposta explícita do texto
alterado, (2) o incremento de versão segundo as regras abaixo, e (3) uma checagem de
compatibilidade das specs/plans ativos com o novo texto, registrada no Sync Impact Report do
commit que altera este arquivo.

**Política de versionamento** (semântico, `MAJOR.MINOR.PATCH`):
- **MAJOR**: remoção ou redefinição incompatível de um princípio existente.
- **MINOR**: adição de um novo princípio ou expansão material de orientação existente.
- **PATCH**: clarificação de redação, correção de erro de digitação, refinamento não semântico.

**Revisão de conformidade**: toda revisão de plan/PR DEVE verificar aderência aos princípios
acima. Complexidade que viole a Simplicidade Deliberada (Princípio IV) ou arrisque a
Responsividade do Clique (Princípio V) DEVE ser justificada explicitamente na spec/plan
correspondente ou rejeitada.

**Version**: 1.1.0 | **Ratified**: 2026-09-12 | **Last Amended**: 2026-09-26
