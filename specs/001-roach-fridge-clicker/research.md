# Research: Loop Principal — Baratas na Geladeira

Resolve as lacunas técnicas explicitamente deixadas para o planejamento pela spec (`spec.md`,
seção Assumptions) e pela ausência de configuração de testes no scaffold atual.

## 1. Framework de testes

**Decision**: usar o test runner nativo do Bun (`bun test`) para testes unitários da camada de
domínio (`entities/`, `systems/`).

**Rationale**: Bun já é o gerenciador de pacotes/runtime fixado pela constitution (Princípio
VII); seu test runner é compatível com sintaxe Jest, não exige configuração adicional e nenhuma
nova dependência — consistente com o Princípio IV (Simplicidade Deliberada). Ele também viabiliza
diretamente o Princípio I: a lógica de domínio deve ser exercitável isoladamente, sem depender do
Phaser renderizar nada.

**Alternatives considered**: Vitest (integra nativamente com a config do Vite já presente) foi
considerado, mas rejeitado por adicionar uma dependência de teste extra quando o Bun já resolve o
mesmo problema sem custo adicional, e o projeto não testa nada relacionado a bundling/HMR do Vite
em si.

## 2. Número de prateleiras e itens de comida

**Decision**: 3 prateleiras, com 3 itens de comida cada — 9 comidas no total por partida.

**Rationale**: número redondo o suficiente para dar ritmo a uma partida (perder algumas comidas
antes da derrota final) sem tornar a partida excessivamente longa; um grid 3×3 mapeia
naturalmente para o visual de compartimentos de uma geladeira aberta.

**Alternatives considered**: 2 prateleiras × 4 itens (8 comidas) — rejeitado por não distribuir
tão simetricamente o espaço de spawn quanto um 3×3.

## 3. Frequência de spawn e tempo de reação das baratas

**Decision**: uma nova barata surge a cada 2.5s fixos; cada barata leva 3s fixos para percorrer o
trajeto do ponto de entrada até a comida-alvo.

**Rationale**: dá ao jogador uma janela de reação perceptível e justa (~3s) sem ser trivial;
combinado com o limite implícito de baratas simultâneas (FR-021, no máximo uma por comida
restante) e 9 comidas totais, o número de baratas em tela simultaneamente fica pequeno o
suficiente para não comprometer a meta de 60 FPS (SC-006).

**Alternatives considered**: ciclo mais rápido (1.5s/1.5s) rejeitado por ser excessivamente
punitivo para um MVP casual; ciclo mais lento (4s/5s) rejeitado por não testar de forma
significativa a responsividade de clique que é o núcleo da experiência (Princípio V).

## 4. Margem de tolerância da área clicável da barata

**Decision**: hit-test circular = raio visual do sprite da barata + 6px fixos de padding.

**Rationale**: um padding fixo em pixels é a forma mais simples de implementar hit-testing direto
(Princípio V — evitar física pesada), sem precisar de cálculos proporcionais à resolução, já que o
MVP é desktop-only em resoluções fixas (Assumption da spec). 6px é pequeno o suficiente para não
criar ambiguidade quando baratas estão sobrepostas (FR-018).

**Alternatives considered**: padding percentual relativo ao tamanho do sprite — rejeitado como
complexidade desnecessária para o escopo desktop-only do MVP.

## 5. Pontos de entrada das baratas em cena

**Decision**: pontos de entrada fixos nas quatro bordas da área de jogo visível (fora das
prateleiras); a cada spawn, o sistema escolhe o ponto de entrada mais direto em relação à
prateleira que contém a comida-alvo sorteada.

**Rationale**: implementa diretamente a clarificação já registrada na spec (FR-005) — baratas
surgem em bordas fixas e percorrem toda a distância visível até a comida — mantendo o cálculo de
trajetória simples (interpolação linear entre dois pontos fixos).

**Alternatives considered**: um único ponto de entrada fixo (ex.: sempre pela parte inferior) —
rejeitado por reduzir a variedade visual sem ganho de simplicidade real.

## 6. Separação entre lógica de domínio e renderização (Phaser)

**Decision**: classes puras em TypeScript em `entities/` e `systems/`, sem nenhum import de
`phaser`. A comunicação de estado para as `scenes/` do Phaser é feita por um `MatchStateManager`
que expõe um pub-sub simples baseado em callbacks/`EventTarget` nativo do navegador — não no
sistema de eventos do próprio Phaser.

**Rationale**: cumpre literalmente o Princípio I (lógica de domínio exercitável sem o Phaser
renderizar nada) e o Princípio II (estado isolado em serviços de domínio, nunca espalhado em
handlers de UI). Usar `Phaser.Events.EventEmitter` dentro do domínio reintroduziria acoplamento ao
framework gráfico.

**Alternatives considered**: usar diretamente `Phaser.Events.EventEmitter` nas classes de domínio
— rejeitado por acoplar a camada de domínio ao Phaser, o que a constitution proíbe.
