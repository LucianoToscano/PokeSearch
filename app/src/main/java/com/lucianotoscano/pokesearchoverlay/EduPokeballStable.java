package com.lucianotoscano.pokesearchoverlay;

import android.graphics.Bitmap;

/**
 * LT334: a Pokébola não pode fazer o Edu encolher.
 *
 * Frames #00–03 das fontes originais são menores que a pose parada #42.
 * Em vez de esticar os PNGs de maneira anisotrópica (que deformava rosto e
 * óculos na LT332), conservamos a anatomia canônica da #42 pixel a pixel.
 * Somente o braço esquerdo e a Pokébola são transpostos da pose original.
 *
 * Composição feita uma vez no carregamento do frame (antes do LRU), sem
 * interpolação; as 64 outras poses, #42, e os efeitos contextuais não mudam.
 */
final class EduPokeballStable {
    private static final int CELL = 512;
    // Escala UNIFORME apenas da camada do braço/objeto (não do corpo inteiro).
    // Ancoragem calibrada com as fontes #00–03 do master 512.
    private static final float ARM_SCALE = 1.305f;
    private static final int OFFSET_X = -79;
    private static final int OFFSET_Y = -120;

    private EduPokeballStable() {}

    static Bitmap compose(Bitmap action, Bitmap canonical, int frame) {
        if (action == null || canonical == null || frame < 0 || frame > 3 ||
                action.getWidth() != CELL || action.getHeight() != CELL ||
                canonical.getWidth() != CELL || canonical.getHeight() != CELL) {
            return action;
        }

        final int[] base = new int[CELL * CELL];
        final int[] source = new int[CELL * CELL];
        canonical.getPixels(base, 0, CELL, 0, 0, CELL, CELL);
        action.getPixels(source, 0, CELL, 0, 0, CELL, CELL);

        // Remover SOMENTE o braço esquerdo abaixado da pose parada #42.
        // A cabeça, óculos, torso, calça e sapatos permanecem idênticos à #42.
        for (int y = 265; y <= 400; y++) {
            final int cutoff = armEraseRight(y);
            for (int x = 0; x < cutoff; x++) {
                base[y * CELL + x] = 0;
            }
        }

        // Compor o braço animado e a Pokébola sobre a base canônica.
        // Ampliar a camada do gesto em escala uniforme, usando NEAREST.
        // O restante do Edu NUNCA passa por resize.
        for (int y = 40; y < 420; y++) {
            final int maxX = gestureRight(y);
            int sy = Math.round((y - OFFSET_Y) / ARM_SCALE);
            if (sy < 0 || sy >= CELL) continue;
            int row = y * CELL;
            int from = sy * CELL;
            for (int x = 0; x < maxX; x++) {
                int sx = Math.round((x - OFFSET_X) / ARM_SCALE);
                if (sx < 0 || sx >= CELL) continue;
                int color = source[from + sx];
                if ((color >>> 24) != 0) base[row + x] = color;
            }
        }

        // No quadro #02, a Pokébola está acima da cabeça. A escala do braço
        // deixaria o objeto sair da tela; preservar a bola/effects no lugar.
        if (frame == 2) {
            for (int y = 45; y < 110; y++) {
                int row = y * CELL;
                for (int x = 160; x < 230; x++) {
                    int pixel = source[row + x];
                    if ((pixel >>> 24) != 0) base[row + x] = pixel;
                }
            }
        }

        Bitmap result = Bitmap.createBitmap(CELL, CELL, Bitmap.Config.ARGB_8888);
        result.setPixels(base, 0, CELL, 0, 0, CELL, CELL);
        return result;
    }

    // Contorno do braço neutro na #42 (não apagar ombro ou torso).
    private static int armEraseRight(int y) {
        if (y < 286) return interpolate(y, 265, 286, 186, 225);
        if (y < 315) return interpolate(y, 286, 315, 225, 224);
        if (y < 360) return 224;
        return interpolate(y, 360, 400, 224, 210);
    }

    // Recorte do gesto isolado: a região do rosto original não é copiada.
    private static int gestureRight(int y) {
        if (y < 180) return 164;
        if (y < 214) return 185;
        if (y < 244) return 192;
        if (y < 280) return 226;
        if (y < 360) return 218;
        return 185;
    }

    private static int interpolate(int y, int y0, int y1, int x0, int x1) {
        return Math.round(x0 + (x1 - x0) * ((float) (y - y0) / (y1 - y0)));
    }
}
