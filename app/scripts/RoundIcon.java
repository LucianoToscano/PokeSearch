import java.awt.AlphaComposite;
import java.awt.Graphics2D;
import java.awt.RenderingHints;
import java.awt.geom.Ellipse2D;
import java.awt.image.BufferedImage;
import java.io.File;
import javax.imageio.ImageIO;

/** Offline build tool: preserve the approved logo, crop it to a transparent circle. */
public class RoundIcon {
    public static void main(String[] args) throws Exception {
        System.setProperty("java.awt.headless","true");
        if (args.length != 2) throw new IllegalArgumentException("Source and target PNG required");
        BufferedImage original = ImageIO.read(new File(args[0]));
        if (original == null) throw new IllegalArgumentException("Could not decode original PNG");
        int n = 192;
        BufferedImage round = new BufferedImage(n,n,BufferedImage.TYPE_INT_ARGB);
        Graphics2D g = round.createGraphics();
        try {
            g.setComposite(AlphaComposite.Src);
            g.setRenderingHint(RenderingHints.KEY_ANTIALIASING,RenderingHints.VALUE_ANTIALIAS_ON);
            g.setRenderingHint(RenderingHints.KEY_INTERPOLATION,RenderingHints.VALUE_INTERPOLATION_BICUBIC);
            g.setClip(new Ellipse2D.Double(0,0,n,n));
            g.drawImage(original,0,0,n,n,null);
        } finally { g.dispose(); }
        File target=new File(args[1]);
        if(target.getParentFile()!=null)target.getParentFile().mkdirs();
        if(!ImageIO.write(round,"png",target))throw new IllegalStateException("PNG writer missing");
    }
}
