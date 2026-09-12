# PRD: Jogo das Baratas na Geladeira

## 1. Visão Geral e Contexto
* **O Problema:** Disponibilizar uma versão jogável do jogo diretamente pelo navegador, sem necessidade de instalação, reduzindo o atrito para alguém experimentar o jogo pela primeira vez.
* **O Impacto:** Reduzir a barreira de entrada para novos jogadores, permitir testar e validar o interesse pelo jogo com uma base real de usuários, e criar uma fundação técnica reaproveitável para futuras oportunidades (app mobile, monetização).
* **Contexto do Sistema:** O jogo é um produto próprio, desenvolvido do zero, inicialmente como MVP web para validar a experiência principal, coletar feedback qualitativo de jogadores reais e decidir se vale investir em uma versão mobile e/ou features adicionais.
* **Stack Definida:** Cliente desenvolvido em **TypeScript + Phaser**, usando **Bun** como gerenciador de pacotes/runtime, sem backend no MVP (todo o estado da partida vive no cliente). Deploy previsto na **Vercel** como build estático. Detalhes de princípios técnicos em `constitution.md`.

## 2. Objetivos e Sucesso
* **Objetivos de Negócio:**
  * Validar se a experiência principal do jogo é divertida/interessante o suficiente para os jogadores.
  * Garantir que o MVP seja jogável de ponta a ponta, sem bugs críticos que impeçam a conclusão de uma partida.
  * Conseguir pelo menos 5 feedbacks qualitativos de jogadores reais.
  * Manter os custos de infraestrutura em R$ 0 ou próximos disso (hospedagem gratuita/tier free).
* **Métricas de Sucesso (KPIs):**
  * Pelo menos 10 jogadores únicos testando o MVP.
  * Pelo menos 5 feedbacks coletados (qualitativos ou via formulário).
  * Pelo menos 80% dos jogadores que iniciarem uma partida conseguem completar o loop principal (jogar até vencer ou perder).
  * 0 bugs críticos que impeçam o progresso ou a conclusão da experiência principal.
  * Pelo menos 50% dos jogadores relatarem interesse em jogar novamente.

## 3. Público-Alvo e Personas
* **Persona Principal:** Jogadores casuais que acessam o jogo pelo navegador, sem instalar nada, buscando uma experiência rápida e simples de entender nos primeiros segundos.
* **Benefício:** Poder jogar imediatamente, sem fricção de cadastro ou download, e decidir em poucos minutos se a proposta do jogo vale a pena continuar explorando.

## 4. Escopo do Projeto

### Dentro do Escopo (In-Scope)
* [ ] Disponibilizar o jogo rodando diretamente no navegador (sem instalação).
* [ ] Implementar o loop principal de gameplay: baratas surgem em direção a comidas específicas, jogador clica para eliminá-las.
* [ ] Implementar interface básica de navegação (tela inicial, tela de jogo, tela de fim de partida).
* [ ] Implementar condição de derrota: partida termina quando todas as comidas forem roubadas.
* [ ] Tratar os principais erros e garantir ausência de bugs críticos que impeçam o jogador de concluir a experiência.
* [ ] Disponibilizar uma forma simples de coletar feedback dos jogadores (ex: link para formulário ao final da partida).

### Fora do Escopo (Out-of-Scope)
* [ ] Sistema de pontuação (backlog — próxima iteração após o MVP).
* [ ] Dificuldade progressiva / aumento de frequência e velocidade das baratas (backlog — próxima iteração após o MVP).
* [ ] Sistema completo de contas, perfis e autenticação de jogadores.
* [ ] Multiplayer ou qualquer funcionalidade online não essencial ao loop principal.
* [ ] Sistema avançado de progressão, ranking ou conquistas.
* [ ] Monetização, compras dentro do jogo e anúncios.
* [ ] Grande quantidade de conteúdo, fases ou modos de jogo adicionais.
* [ ] App mobile nativo (planejado para uma fase futura, após validação do MVP web).

## 5. Requisitos Funcionais e Histórias de Usuário

### Módulo: Spawn e Movimento das Baratas
* **História de Usuário:** Como um `jogador`, eu quero ver baratas surgirem periodicamente e se movendo em direção a uma comida específica da geladeira para que eu tenha alvos claros para reagir e proteger.
* **Regras de Negócio:**
  * Cada barata surge mirando em uma comida específica de uma prateleira (não em qualquer lugar aleatório da tela).
  * A barata leva um tempo fixo (janela de reação) entre o momento em que surge e o momento em que alcança a comida-alvo.
  * A frequência e a velocidade de spawn das baratas são **fixas** durante toda a partida no MVP (sem dificuldade progressiva).

### Módulo: Clique para Eliminar a Barata
* **História de Usuário:** Como um `jogador`, eu quero clicar em uma barata na tela para eliminá-la antes que ela alcance a comida que está tentando roubar.
* **Regras de Negócio:**
  * O clique é validado se atingir a área clicável da barata (com uma pequena margem de tolerância, para não punir cliques quase certeiros).
  * Ao ser clicada, a barata "cai" (animação de queda) e desaparece da tela imediatamente.
  * Não há pontuação no MVP — eliminar a barata apenas impede o roubo da comida correspondente.

### Módulo: Roubo de Comida
* **História de Usuário:** Como um `jogador`, eu quero que fique claro quando uma barata rouba com sucesso uma comida (porque não cliquei a tempo), para que eu entenda o impacto da minha falha na partida.
* **Regras de Negócio:**
  * Se a barata alcança a comida-alvo antes de ser clicada, a comida é removida da prateleira (efeito visual de "sumiu/foi roubada") e a barata some da tela junto com ela.
  * Uma comida roubada não pode ser recuperada na mesma partida.

### Módulo: Início e Fim de Partida
* **História de Usuário:** Como um `jogador`, eu quero uma tela inicial clara para começar a partida e uma tela final que indique que perdi, para que eu saiba exatamente quando a partida terminou.
* **Regras de Negócio:**
  * A partida termina em derrota quando todas as comidas das prateleiras forem roubadas.
  * A tela final indica a derrota (ex: "Todas as comidas foram roubadas!") e oferece opção de reiniciar.
  * O jogador pode reiniciar a partida sem recarregar a página.

## 6. Requisitos Não-Funcionais
* **Segurança:** Não há dados sensíveis no MVP (sem contas de usuário); se houver coleta de feedback com e-mail, tratar como dado pessoal mínimo, sem armazenar senha ou dado financeiro.
* **Desempenho e Responsividade do Clique (crítico):**
  * O tempo entre o clique do jogador e a resposta visual (barata caindo) deve ser imperceptível — sem lag perceptível de input.
  * A detecção de colisão do clique deve ser calculada a cada clique de forma direta (sem depender de física complexa), garantindo que a área clicável da barata seja precisa e consistente com o que é renderizado na tela.
  * O jogo deve manter uma taxa de quadros estável (idealmente 60 FPS) em um notebook comum — quedas de frame rate afetam diretamente a precisão do clique, já que a posição da barata na tela e a posição real usada para a colisão podem dessincronizar.
  * O jogo deve carregar em menos de 3 segundos em conexão de banda larga padrão.
* **Compatibilidade:** Funcionar nas versões atuais de Chrome, Firefox e Edge, em resolução desktop (mobile fica fora do escopo do MVP web, conforme seção 4). Input tratado via pointer events, para não travar a futura migração para toque em mobile.
* **Acessibilidade:** Contraste visual claro entre baratas, comidas e fundo da geladeira, para que o alvo seja sempre bem distinguível; WCAG completo fica fora de escopo do MVP.
