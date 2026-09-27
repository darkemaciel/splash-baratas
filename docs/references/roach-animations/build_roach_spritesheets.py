"""Gera os spritesheets da barata (andar/voar) a partir dos vídeos de referência.

specs/016-animacao-locomocao-barata. Rodar da raiz do repositório:

    uv run --with opencv-python-headless python docs/references/roach-animations/build_roach_spritesheets.py

Saídas:
- client/public/assets/sprites/roach-walk.png / roach-fly.png — spritesheets usados pelo jogo
  (quadros de FRAME_PX x FRAME_PX, lado a lado, fundo transparente).
- docs/references/roach-animations/frames/<anim>/NN.png — os mesmos quadros em MASTER_PX, para
  retoque/aprimoramento futuro.
- docs/references/roach-animations/<anim>_preview.png — tira com os 8 primeiros quadros sobre o
  fundo da geladeira, para conferência rápida.
"""
from pathlib import Path

import cv2
import numpy as np

ROOT = Path(__file__).resolve().parents[3]
REFS = ROOT / "docs" / "references"
OUT_SHEETS = ROOT / "client" / "public" / "assets" / "sprites"
OUT_DOCS = Path(__file__).resolve().parent

FRAME_PX = 128  # tamanho do quadro no spritesheet do jogo (exibido em escala 0.5)
MASTER_PX = 256  # tamanho dos quadros "master" guardados para aprimoramento
CONTENT_RATIO = 116 / 128  # fração do quadro ocupada pela barata (sobra de margem)

# (vídeo, spritesheet, quadros do vídeo): trechos escolhidos por fecharem bem o loop —
# o último quadro é visualmente próximo do primeiro.
ANIMATIONS = [
    ("barata_caminhada.mp4", "roach-walk", range(10, 64, 2)),
    ("barata_voo.mp4", "roach-fly", range(58, 89, 2)),
]

WATERMARK_ROWS = 200  # marca d'água "Pippit AI" no topo do vídeo
BG_TOLERANCE = 28  # distância LAB até a cor de fundo para o flood fill a partir da borda
HOLE_TOLERANCE = 14  # fundo "preso" dentro do contorno (ex.: entre asa e antena)
HOLE_MIN_AREA = 400


def read_frames(path: Path) -> list[np.ndarray]:
    cap = cv2.VideoCapture(str(path))
    frames = []
    while True:
        ok, frame = cap.read()
        if not ok:
            break
        frames.append(frame)
    return frames


def extract_rgba(frame: np.ndarray) -> np.ndarray:
    """Remove o fundo claro: flood fill a partir das bordas + maior componente conexo."""
    h, w = frame.shape[:2]
    lab = cv2.cvtColor(frame, cv2.COLOR_BGR2LAB).astype(int)
    border = np.concatenate([lab[WATERMARK_ROWS:, 0], lab[WATERMARK_ROWS:, -1], lab[-1]])
    bg_color = np.median(border, axis=0)
    dist = np.sqrt(((lab - bg_color) ** 2).sum(-1))

    fill = (dist < BG_TOLERANCE).astype(np.uint8)
    mask = np.zeros((h + 2, w + 2), np.uint8)
    seeds = [(x, h - 1) for x in range(0, w, 20)]
    seeds += [(x, y) for y in range(WATERMARK_ROWS, h, 20) for x in (0, w - 1)]
    for x, y in seeds:
        if fill[y, x] == 1:
            cv2.floodFill(fill, mask, (x, y), 2)

    fg = (fill != 2).astype(np.uint8)
    fg[:WATERMARK_ROWS] = 0
    _, labels, stats, _ = cv2.connectedComponentsWithStats(fg, 8)
    biggest = 1 + np.argmax(stats[1:, cv2.CC_STAT_AREA])
    fg = (labels == biggest).astype(np.uint8)  # descarta linhas de velocidade soltas

    holes = ((dist < HOLE_TOLERANCE) & (fg == 1)).astype(np.uint8)
    n, hole_labels, hole_stats, _ = cv2.connectedComponentsWithStats(holes, 8)
    for k in range(1, n):
        if hole_stats[k, cv2.CC_STAT_AREA] > HOLE_MIN_AREA:
            fg[hole_labels == k] = 0

    alpha = cv2.GaussianBlur(fg.astype(np.float32) * 255, (5, 5), 0)
    alpha = np.clip((alpha - 40) * 1.3, 0, 255).astype(np.uint8)
    return np.dstack([frame, alpha])


def place(rgba: np.ndarray, cx: float, cy: float, side: float, size: int) -> np.ndarray:
    """Recorta/centraliza usando a mesma caixa para todos os quadros (sem "pular" entre eles)."""
    s = size * CONTENT_RATIO / side
    m = np.float32([[s, 0, size / 2 - cx * s], [0, s, size / 2 - cy * s]])
    premul = rgba.astype(np.float32)
    premul[:, :, :3] *= premul[:, :, 3:] / 255
    tile = cv2.warpAffine(premul, m, (size, size), flags=cv2.INTER_AREA, borderValue=(0, 0, 0, 0))
    a = tile[:, :, 3:]
    tile[:, :, :3] = np.where(a > 0, tile[:, :, :3] * 255 / np.maximum(a, 1), 0)
    return np.clip(tile, 0, 255).astype(np.uint8)


def main() -> None:
    for video, name, frame_range in ANIMATIONS:
        frames = read_frames(REFS / video)
        cutouts = [extract_rgba(frames[i]) for i in frame_range]

        ys, xs = [], []
        for c in cutouts:
            yy, xx = np.where(c[:, :, 3] > 20)
            ys += [yy.min(), yy.max()]
            xs += [xx.min(), xx.max()]
        cx, cy = (min(xs) + max(xs)) / 2, (min(ys) + max(ys)) / 2
        side = max(max(xs) - min(xs), max(ys) - min(ys))

        tiles = [place(c, cx, cy, side, FRAME_PX) for c in cutouts]
        sheet = np.hstack(tiles)
        cv2.imwrite(str(OUT_SHEETS / f"{name}.png"), sheet)

        frames_dir = OUT_DOCS / "frames" / name
        frames_dir.mkdir(parents=True, exist_ok=True)
        for old in frames_dir.glob("*.png"):
            old.unlink()
        for idx, c in enumerate(cutouts):
            cv2.imwrite(str(frames_dir / f"{idx:02d}.png"), place(c, cx, cy, side, MASTER_PX))

        preview = sheet[:, : FRAME_PX * 8]
        bg = np.full((FRAME_PX, preview.shape[1], 3), (242, 241, 232), np.float32)
        a = preview[:, :, 3:] / 255
        cv2.imwrite(
            str(OUT_DOCS / f"{name}_preview.png"),
            (bg * (1 - a) + preview[:, :, :3] * a).astype(np.uint8),
        )
        print(f"{name}: {len(tiles)} quadros")


if __name__ == "__main__":
    main()
