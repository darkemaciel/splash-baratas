# Backlog — Baratas na Geladeira

Ideias de melhoria identificadas durante a especificação e clarificação do MVP
(`specs/001-roach-fridge-clicker/spec.md`), mas deliberadamente deixadas fora do escopo do MVP
por simplicidade (Princípio IV da `constitution.md`). Cada item referencia a decisão de MVP
correspondente para contexto.

## Jogabilidade e experiência do jogador

- **Destaque visual da comida-alvo**: ao surgir, a barata poderia acionar um destaque
  (highlight/glow) na comida que está mirando, facilitando a priorização de cliques quando várias
  baratas estão em tela. No MVP, o único indício do alvo é a trajetória de movimento da barata
  (ver Clarifications, spec 001, FR-004).
- **Feedback sonoro**: efeitos sonoros para eliminação de barata e para roubo de comida. No MVP
  apenas feedback visual é obrigatório (FR-020).
- **Indicador de progresso/risco (HUD)**: contador visível de comidas restantes/roubadas durante
  a partida, ou uma barra de risco geral. No MVP o jogador acompanha o estado apenas observando
  visualmente as prateleiras (FR-022).
- **Variação no ponto de surgimento das baratas**: baratas surgindo de múltiplos pontos ou padrões
  diferentes (não apenas bordas fixas da cena), para variar a leitura espacial do jogador. No MVP,
  o surgimento é sempre em pontos de entrada fixos nas bordas da cena (FR-005).
- **Dificuldade progressiva**: aumento gradual da frequência de surgimento e/ou velocidade das
  baratas ao longo da partida. Fora do MVP por decisão explícita do PRD e da constitution
  (Princípio IV).
- **Sistema de pontuação**: pontuação por barata eliminada, combos, ranking, etc. Fora do MVP por
  decisão explícita do PRD (FR-019).
- **Teto numérico independente de baratas simultâneas**: no MVP o limite de baratas simultâneas é
  implícito (uma por comida restante, FR-021); uma versão futura poderia impor um teto artificial
  menor para controlar ritmo/dificuldade independentemente do número de comidas.

## Fora do escopo geral (mencionado no PRD)

- Coleta de feedback dos jogadores (ex.: link para formulário ao final da partida).
- Métricas de sucesso do produto.
- Suporte funcional a mobile/touch (a arquitetura de input já é compatível via Pointer Events,
  mas UX mobile dedicada — layout responsivo, testes em dispositivo — fica para depois).
- Backend e persistência de dados (ex.: salvar progresso, leaderboard).

## Como usar este backlog

Quando um destes itens for priorizado, ele deve entrar como uma **spec nova** via
`/speckit-specify`, não como alteração retroativa da spec do MVP (`001-roach-fridge-clicker`) —
conforme o Princípio IV da constitution.
