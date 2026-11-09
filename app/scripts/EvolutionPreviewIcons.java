import java.awt.Graphics2D;
import java.awt.RenderingHints;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import javax.imageio.ImageIO;

/** Generates small transparent UI previews while preserving untouched PNG masters. */
public class EvolutionPreviewIcons {
    private static final String[] NAMES = {
        "sun-stone.png", "kings-rock.png", "metal-coat.png", "dragon-scale.png",
        "upgrade.png", "sinnoh-stone.png", "unova-stone.png", "sweet-apple.png",
        "tart-apple.png", "syrupy-apple.png", "gimmighoul-coins.png",
        "magnetic-lure-module.png", "mossy-lure-module.png",
        "glacial-lure-module.png", "rainy-lure-module.png"
    };
    private static final int SIDE = 64;
    private static final int MAX_TOTAL_BYTES = 180_000;

    public static void main(String[] args) throws Exception {
        if (args.length != 2) throw new IllegalArgumentException("source-dir output-dir required");
        Path input = Path.of(args[0]);
        Path target = Path.of(args[1]).resolve("evolution-items");
        Files.createDirectories(target);
        int total = 0;
        for (String name : NAMES) {
            Path src = input.resolve(name);
            if (!Files.isRegularFile(src)) throw new IOException("Missing source preview: " + name);
            BufferedImage original = ImageIO.read(src.toFile());
            if (original == null || !original.getColorModel().hasAlpha() ||
                original.getWidth() < SIDE || original.getHeight() < SIDE ||
                original.getWidth() > 2048 || original.getHeight() > 2048) {
                throw new IOException("Unexpected transparent PNG master: " + name);
            }
            BufferedImage preview = new BufferedImage(SIDE, SIDE, BufferedImage.TYPE_INT_ARGB);
            Graphics2D graphics = preview.createGraphics();
            try {
                graphics.setRenderingHint(RenderingHints.KEY_INTERPOLATION,
                    RenderingHints.VALUE_INTERPOLATION_BICUBIC);
                graphics.setRenderingHint(RenderingHints.KEY_RENDERING,
                    RenderingHints.VALUE_RENDER_QUALITY);
                graphics.setRenderingHint(RenderingHints.KEY_ALPHA_INTERPOLATION,
                    RenderingHints.VALUE_ALPHA_INTERPOLATION_QUALITY);
                graphics.drawImage(original, 0, 0, SIDE, SIDE, null);
            } finally { graphics.dispose(); }
            int visible = 0;
            for (int y=0;y<SIDE;y++)for(int x=0;x<SIDE;x++)
                if (((preview.getRGB(x,y) >>> 24) & 0xff) > 0) visible++;
            if (visible < 80) throw new IOException("Empty preview: " + name);
            ByteArrayOutputStream bytes = new ByteArrayOutputStream();
            if (!ImageIO.write(preview, "PNG", bytes)) throw new IOException("No PNG encoder");
            byte[] encoded = bytes.toByteArray();
            if (encoded.length > 30_000) throw new IOException("Oversized icon: " + name);
            Files.write(target.resolve(name),encoded);
            total += encoded.length;
        }
        if (total > MAX_TOTAL_BYTES) throw new IOException("Preview budget exceeded: " + total);
        System.out.println("LT322 15/15 previews 64x64 RGBA, PNG bytes=" + total);
    }
}
