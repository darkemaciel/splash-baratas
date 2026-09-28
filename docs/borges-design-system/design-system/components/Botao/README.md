Botão de ação em forma de bolha, com rótulo em Luckiest Guy caixa alta, borda de 3px e sombra dura.

- **Variantes:** `primario` (fundo `cor-vermelho`, texto `cor-branco`), `secundario` (`cor-limao`, texto `cor-traco`), `terciario` (`cor-branco`, texto `cor-traco`).
- **Tamanhos:** `G` (34px, sombra-g) para a ação principal, `M` (22px, sombra-m) em menus e painéis, `P` (17px, sombra-p) em diálogos. Altura mínima: `toque-minimo`.
- **Estados:** hover sobe 3px, gira (primário -3°, secundário +3°, terciário -2°) e usa `sombra-hover`. Pressionado desce 3px, achata (scaleY 0.92), usa `sombra-pressionado` e a bolha pressionada. Desabilitado usa `cor-papel`, texto `cor-cinza-quente` e borda tracejada, sem sombra.
- **Regras:** um único primário por grupo; botões vizinhos alternam bolha A e B (prop `bolha`); em pilhas dentro de painéis use `pilha` (largura mínima de 280px); no menu inicial gire levemente com `rotacao` (-2° / +2°).

O consumidor fornece o texto (`children`), `onClick` (ou `href`) e, quando precisar, `variante`, `tamanho`, `bolha`, `rotacao`, `disabled`. A prop `estado` força um estado visual para documentação.
