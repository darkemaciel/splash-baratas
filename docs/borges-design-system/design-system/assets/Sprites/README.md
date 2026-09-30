Sprites do jogo, vindos de `darkemaciel/splash-baratas` (client/public/assets/sprites), em PNG com fundo transparente.

- `paw.png`: a pata do gato usada como cursor, branca com contorno preto e sombra azul-acinzentada, 406 × 514. É exibida com `cursor-pata` (56px) de altura (componente PataCursor).
- `roach-walk.png`: barata andando, 27 quadros de 128 × 128 lado a lado, olhando para a direita com a cabeça ~25° para cima. Roda a 15fps.
- `roach-fly.png`: barata voando, 16 quadros de 128 × 128. Roda a 20fps.

As baratas são desenhadas em 2x e exibidas pela metade (`barata`, 64px), pelo componente Barata. É arte provisória: tem sombreado e não segue o traço preto chapado da direção.
