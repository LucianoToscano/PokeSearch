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
            // Expand the EXISTING artwork rather than drawing a new icon.
            // Detect excessive transparent/flat padding and retain 4% safe margin.
            int w=original.getWidth(),h=original.getHeight();
            int first=original.getRGB(0,0);
            int minX=w,minY=h,maxX=-1,maxY=-1;
            int cornerR=(first>>16)&255,cornerG=(first>>8)&255,cornerB=first&255;
            for(int y=0;y<h;y++)for(int x=0;x<w;x++){
                int rgba=original.getRGB(x,y);
                int alpha=rgba>>>24;
                int distance=Math.abs(((rgba>>16)&255)-cornerR)
                    +Math.abs(((rgba>>8)&255)-cornerG)
                    +Math.abs((rgba&255)-cornerB);
                if(alpha<25||((first>>>24)>245&&distance<50))continue;
                if(x<minX)minX=x;if(x>maxX)maxX=x;
                if(y<minY)minY=y;if(y>maxY)maxY=y;
            }
            int sx=0,sy=0,ex=w,ey=h;
            if(maxX>minX&&maxY>minY){
                int bw=maxX-minX+1,bh=maxY-minY+1;
                int side=Math.max(bw,bh);
                int pad=Math.max(3,Math.round(side*.065f));
                // Cropping only helps when whitespace truly dominates the input.
                if(side<Math.min(w,h)*.91f){
                    side=Math.min(Math.min(w,h),side+pad*2);
                    sx=Math.max(0,Math.min(w-side,(minX+maxX+1-side)/2));
                    sy=Math.max(0,Math.min(h-side,(minY+maxY+1-side)/2));
                    ex=sx+side;ey=sy+side;
                }
            }
            // The approved artwork has a dark outer band. Zoom its contents 12%
            // so the launcher no longer looks smaller than neighboring icons.
            int cropW=ex-sx,cropH=ey-sy;
            int extraX=Math.round(cropW*0.085f),extraY=Math.round(cropH*0.085f);
            sx+=extraX;sy+=extraY;ex-=extraX;ey-=extraY;
            g.drawImage(original,0,0,n,n,sx,sy,ex,ey,null);
        } finally { g.dispose(); }
        File target=new File(args[1]);
        if(target.getParentFile()!=null)target.getParentFile().mkdirs();
        if(!ImageIO.write(round,"png",target))throw new IllegalStateException("PNG writer missing");
    }
}
