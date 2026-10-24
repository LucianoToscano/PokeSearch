package com.lucianotoscano.pokesearchoverlay;

/**
 * Pure geometry for the independent, content-sized overlay popup window.
 * No Android dependencies; the native service supplies physical pixel bounds.
 * Dimensions and coordinates are in the same physical pixel space.
 */
final class PopupTouchGeometry {
    static final class Bounds {
        final int x, y, width, height;
        final boolean above;
        Bounds(int x, int y, int width, int height, boolean above) {
            this.x=x; this.y=y; this.width=width; this.height=height; this.above=above;
        }
        boolean visible() { return width>0 && height>0; }
    }

    private PopupTouchGeometry() {}

    /**
     * Place a popup immediately above/below a stable toolbar. The native touch
     * area will be limited to the resulting rectangle, not the whole toolbar
     * width extended through the popup height. Caller must measure the actual
     * visible editor content (including rail and shadow) before calling.
     */
    static Bounds place(int screenWidth, int screenHeight,
                        int toolbarX, int toolbarY, int toolbarWidth, int toolbarHeight,
                        int triggerCenterX, int requestedWidth, int requestedHeight,
                        int edgeMargin) {
        final int margin=Math.max(0,edgeMargin);
        final int usableWidth=Math.max(0,screenWidth-2*margin);
        final int usableHeight=Math.max(0,screenHeight-2*margin);
        if(toolbarWidth<=0 || toolbarHeight<=0 || requestedWidth<=0 || requestedHeight<=0 ||
                usableWidth<=0 || usableHeight<=0)
            return new Bounds(0,0,0,0,false);
        final int width=Math.min(requestedWidth,usableWidth);
        final int safeToolbarY=clamp(toolbarY,margin,Math.max(margin,screenHeight-margin));
        final int aboveSpace=Math.max(0,safeToolbarY-margin);
        final int belowSpace=Math.max(0,screenHeight-margin-
                Math.min(screenHeight,safeToolbarY+toolbarHeight));
        final boolean above=belowSpace<requestedHeight && aboveSpace>belowSpace;
        final int available=above?aboveSpace:belowSpace;
        final int height=Math.min(requestedHeight,available);
        if(height<=0)return new Bounds(0,0,0,0,above);
        final int absoluteCenter=toolbarX+clamp(triggerCenterX,0,toolbarWidth);
        final int x=clamp(absoluteCenter-width/2,margin,screenWidth-margin-width);
        final int y=above?safeToolbarY-height:safeToolbarY+toolbarHeight;
        return new Bounds(x,y,width,height,above);
    }

    /**
     * An open lateral cascade uses a narrow rail followed by an editor.
     * Anchor that RAIL under the tapped icon instead of centering the
     * combined rail+editor width (which otherwise shifts the rail sideways).
     * Preserve the original screen and vertical clamps.
     */
    static Bounds alignRail(Bounds popup,int screenWidth,int toolbarX,
                            int toolbarWidth,int triggerCenterX,int railWidth,int margin) {
        if(popup==null||!popup.visible())return popup;
        int edge=Math.max(0,margin);
        int center=toolbarX+clamp(triggerCenterX,0,toolbarWidth);
        int rail=Math.max(0,Math.min(railWidth,popup.width));
        int left=clamp(center-rail/2,edge,Math.max(edge,screenWidth-edge-popup.width));
        return new Bounds(left,popup.y,popup.width,popup.height,popup.above);
    }

    /**
     * Vertical toolbar: put a short native popup BESIDE the icon's row.
     * Never grow the menu's own window or cover its other touch targets.
     * A narrow phone may have less room for the editor; caller must scroll.
     */
    static Bounds placeBeside(int screenWidth,int screenHeight,
                              int toolbarX,int toolbarY,int toolbarWidth,int toolbarHeight,
                              int triggerY,int requestedWidth,int requestedHeight,int margin) {
        int edge=Math.max(0,margin);
        int maxHeight=Math.max(0,screenHeight-2*edge);
        int right=Math.max(0,screenWidth-edge-(toolbarX+toolbarWidth));
        int left=Math.max(0,toolbarX-edge);
        if(toolbarWidth<=0||toolbarHeight<=0||requestedWidth<=0||requestedHeight<=0||
                maxHeight<=0||Math.max(left,right)<=0)
            return new Bounds(0,0,0,0,false);
        boolean useRight=right>=requestedWidth||
            (left<requestedWidth&&right>=left);
        int space=useRight?right:left;
        int width=Math.min(requestedWidth,space),height=Math.min(requestedHeight,maxHeight);
        if(width<=0||height<=0)return new Bounds(0,0,0,0,false);
        int x=useRight?toolbarX+toolbarWidth:toolbarX-width;
        int centerY=toolbarY+clamp(triggerY,0,toolbarHeight);
        int y=clamp(centerY-16,edge,screenHeight-edge-height);
        return new Bounds(x,y,width,height,false);
    }

    /**
     * Keep submenus from covering the live Pokémon result cards. The popup may
     * be moved beside/above/below results but must never be put on top of the
     * toolbar or moved outside the screen. If there is no free region, keep
     * original geometry instead of inventing a zero-sized/unreachable menu.
     */
    static Bounds avoidResults(Bounds popup,int screenWidth,int screenHeight,
                               int resultX,int resultY,int resultWidth,int resultHeight,
                               int menuX,int menuY,int menuWidth,int menuHeight,int margin) {
        if(popup==null||!popup.visible()||resultWidth<=0||resultHeight<=0||
                !overlap(popup.x,popup.y,popup.width,popup.height,
                         resultX,resultY,resultWidth,resultHeight))return popup;
        int edge=Math.max(0,margin);
        int[][] candidates={
            {popup.x,resultY-popup.height-edge},
            {popup.x,resultY+resultHeight+edge},
            {resultX-popup.width-edge,popup.y},
            {resultX+resultWidth+edge,popup.y}
        };
        Bounds best=null;
        long distance=Long.MAX_VALUE;
        for(int[] pos:candidates){
            int x=pos[0],y=pos[1];
            if(x<edge||y<edge||x+popup.width>screenWidth-edge||
                    y+popup.height>screenHeight-edge)continue;
            if(overlap(x,y,popup.width,popup.height,resultX,resultY,resultWidth,resultHeight)||
                    overlap(x,y,popup.width,popup.height,menuX,menuY,menuWidth,menuHeight))continue;
            long delta=(long)(x-popup.x)*(x-popup.x)+(long)(y-popup.y)*(y-popup.y);
            if(delta<distance){distance=delta;best=new Bounds(x,y,popup.width,popup.height,y<menuY);}
        }
        return best==null?popup:best;
    }

    private static boolean overlap(int ax,int ay,int aw,int ah,
                                   int bx,int by,int bw,int bh) {
        return aw>0&&ah>0&&bw>0&&bh>0&&ax<bx+bw&&ax+aw>bx&&
                ay<by+bh&&ay+ah>by;
    }

    private static int clamp(int value,int min,int max){
        return Math.max(min,Math.min(Math.max(min,max),value));
    }
}
