# Animações da barata (andar/voar)

Material-fonte das animações entregues em `specs/016-animacao-locomocao-barata`, guardado para
aprimoramento futuro (ver card "Aprimorar animações da barata" no `backlog.md`, seção 1).

## Conteúdo

| Caminho | O que é |
|---|---|
| `build_roach_spritesheets.py` | Pipeline que extrai os quadros dos vídeos em `docs/references/`, remove o fundo e gera os spritesheets do jogo. |
| `frames/roach-walk/NN.png` | 27 quadros de andar, 256x256, fundo transparente (versão "master", 2x maior que a do jogo). |
| `frames/roach-fly/NN.png` | 16 quadros de voar, 256x256, fundo transparente. |
| `roach-walk_preview.png`, `roach-fly_preview.png` | Tira com os 8 primeiros quadros sobre o fundo da geladeira, para conferência rápida. |

Os spritesheets usados pelo jogo ficam em `client/public/assets/sprites/roach-walk.png` e
`roach-fly.png` (quadros de 128x128, exibidos em escala 0.5 por `GameScene` — corpo com ~40px, o
mesmo diâmetro da antiga bolinha placeholder).

## Origem dos quadros

| Animação | Vídeo | Quadros usados | Velocidade no jogo |
|---|---|---|---|
| Andar | `barata_caminhada.mp4` (30 fps) | 10 a 62, de 2 em 2 | 15 fps (`BootScene.createRoachAnimations`) |
| Voar | `barata_voo.mp4` (30 fps) | 58 a 88, de 2 em 2 | 20 fps |

Os trechos foram escolhidos porque o último quadro é visualmente próximo do primeiro, para o loop
não "pular". Nos quadros, a barata olha para a direita com a cabeça ~25° para cima
(`ROACH_SPRITE_FORWARD_DEG` em `GameScene.ts`), e o jogo a gira/espelha conforme a direção do
trajeto.

## Regenerar

Da raiz do repositório (precisa de [uv](https://docs.astral.sh/uv/); nenhuma dependência Python é
adicionada ao projeto):

```bash
uv run --with opencv-python-headless python docs/references/roach-animations/build_roach_spritesheets.py
```

Sobrescreve os spritesheets em `client/public/assets/sprites/` e os quadros/prévias desta pasta. Se
mudar o número de quadros ou o tamanho do quadro, ajuste `ROACH_FRAME_SIZE_PX` em `BootScene.ts`.

## Limitações conhecidas (pontos de partida para aprimorar)

- Os vídeos vêm de um gerador de IA: traços e proporções variam levemente entre quadros.
- O loop fecha "quase" — pode haver um pequeno salto na volta ao primeiro quadro.
- Remoção de fundo automática: contornos podem ter halo claro, e partes finas (antenas, pontas das
  pernas, asas translúcidas) podem ficar serrilhadas.
- A vista é 3/4 lateral, não de cima — girar o sprite em trajetos verticais fica menos natural.
- Não há quadros de morte/queda nem de "comendo".
