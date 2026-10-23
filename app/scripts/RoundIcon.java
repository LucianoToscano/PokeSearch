import java.awt.AlphaComposite;
import java.awt.Graphics2D;
import java.awt.RenderingHints;
import java.awt.geom.Ellipse2D;
import java.awt.image.BufferedImage;
import java.io.File;
import javax.imageio.ImageIO;

/**
 * Generate launcher resources from the official PokeSearch Shiny Blue Effect artwork.
 *
 * One UI and other launchers often inset legacy round icons. Keep the legacy
 * circle as a fallback, but also generate an adaptive foreground at Android's
 * required 108dp canvas size so the icon fills the launcher mask.
 *
 * Full artwork is fitted inside the safe area, protecting blue glow and Shiny stars.
 * This is an offline resource step; it does not run in the app.
 */
public final class RoundIcon {
    private static final int LEGACY_SIZE = 192;
    private static final int ADAPTIVE_SIZE = 432;
    // The original image already fills a square, including stars and glow.
    private static int[] sourceCrop(BufferedImage image) {
        return new int[] {0, 0, image.getWidth(), image.getHeight()};
    }

    private static Graphics2D configure(BufferedImage target) {
        Graphics2D g = target.createGraphics();
        g.setComposite(AlphaComposite.Src);
        g.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
        g.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BICUBIC);
        g.setRenderingHint(RenderingHints.KEY_RENDERING, RenderingHints.VALUE_RENDER_QUALITY);
        return g;
    }

    private static void save(BufferedImage image, String path) throws Exception {
        File output = new File(path);
        File parent = output.getParentFile();
        if (parent != null && !parent.exists() && !parent.mkdirs()) {
            throw new IllegalStateException("Cannot create launcher resource directory: " + parent);
        }
        if (!ImageIO.write(image, "png", output)) {
            throw new IllegalStateException("PNG writer missing");
        }
    }

    public static void main(String[] args) throws Exception {
        System.setProperty("java.awt.headless","true");
        if (args.length != 2 && args.length != 3) {
            throw new IllegalArgumentException(
                "Usage: RoundIcon <original.png> <legacy_round.png> [adaptive_foreground.png]");
        }

        BufferedImage original = ImageIO.read(new File(args[0]));
        if (original == null) {
            throw new IllegalArgumentException("Could not decode original PokeSearch artwork");
        }
        int[] crop = sourceCrop(original);

        BufferedImage legacy = new BufferedImage(LEGACY_SIZE, LEGACY_SIZE, BufferedImage.TYPE_INT_ARGB);
        Graphics2D legacyG = configure(legacy);
        try {
            legacyG.setClip(new Ellipse2D.Double(0, 0, LEGACY_SIZE, LEGACY_SIZE));
            int padding = 8; // Restore margin for Samsung legacy mask: do not crop glow and stars.
            legacyG.drawImage(original, padding, padding,
                LEGACY_SIZE - padding, LEGACY_SIZE - padding,
                crop[0], crop[1], crop[2], crop[3], null);
        } finally {
            legacyG.dispose();
        }
        save(legacy, args[1]);

        // Backward-compatible two-argument invocation used by the original
        // debug verification workflow only regenerates the legacy icon.
        if (args.length == 2) return;

        // Android adaptive icons have a 108dp canvas. The launcher displays
        // the central 72dp area; drawing the artwork there avoids the tiny,
        // padded appearance that occurred with a legacy-only circular PNG.
        BufferedImage adaptive = new BufferedImage(ADAPTIVE_SIZE, ADAPTIVE_SIZE,
            BufferedImage.TYPE_INT_ARGB);
        Graphics2D adaptiveG = configure(adaptive);
        try {
            int artworkSize = 288; // Samsung One UI: safe-area compromise; preserve whole shiny artwork.
            int inset = (ADAPTIVE_SIZE - artworkSize) / 2;
            adaptiveG.drawImage(original, inset, inset, inset + artworkSize, inset + artworkSize,
                crop[0], crop[1], crop[2], crop[3], null);
        } finally {
            adaptiveG.dispose();
        }
        save(adaptive, args[2]);
    }
}
