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
     * LT63: keep the *native touch rectangle* away from the visible results
     * overlay, even after the user drags either surface. CSS transparency
     * cannot stop a TYPE_APPLICATION_OVERLAY window intercepting touches.
     * Prefer the nearest full-size location; when none fits, use the largest
     * non-overlapping screen region and let WebView scroll internally.
     */
    static Bounds avoidResult(Bounds popup,Bounds results,int screenWidth,
                              int screenHeight,int edgeMargin) {
        if(popup==null || !popup.visible() || results==null || !results.visible() ||
                !overlaps(popup,results))return popup;
        int edge=Math.max(0,edgeMargin),gap=edge;
        int left=clamp(results.x-gap,edge,Math.max(edge,screenWidth-edge));
        int right=clamp(results.x+results.width+gap,edge,Math.max(edge,screenWidth-edge));
        int top=clamp(results.y-gap,edge,Math.max(edge,screenHeight-edge));
        int bottom=clamp(results.y+results.height+gap,edge,Math.max(edge,screenHeight-edge));
        int[][] regions={
            {edge,edge,left,screenHeight-edge},
            {right,edge,screenWidth-edge,screenHeight-edge},
            {edge,edge,screenWidth-edge,top},
            {edge,bottom,screenWidth-edge,screenHeight-edge}
        };
        Bounds best=null;
        long bestScore=Long.MAX_VALUE;
        for(int[] r:regions){
            int rw=r[2]-r[0],rh=r[3]-r[1];
            if(rw<=0||rh<=0)continue;
            int w=Math.min(popup.width,rw),h=Math.min(popup.height,rh);
            // A truncated rail or a button-only strip would be unusable.
            if(w<Math.min(70,popup.width)||h<Math.min(38,popup.height))continue;
            int x=clamp(popup.x,r[0],r[2]-w);
            int y=clamp(popup.y,r[1],r[3]-h);
            Bounds candidate=new Bounds(x,y,w,h,popup.above);
            if(overlaps(candidate,results))continue;
            long lostArea=(long)popup.width*popup.height-(long)w*h;
            long displacement=Math.abs((long)x-popup.x)+Math.abs((long)y-popup.y);
            long score=(lostArea==0?0:1000000000L)+lostArea*100L+displacement;
            if(score<bestScore){best=candidate;bestScore=score;}
        }
        // Never leave an invisible native hitbox over sprites.
        return best!=null?best:new Bounds(0,0,0,0,popup.above);
    }

    static boolean overlaps(Bounds a,Bounds b){
        return a!=null&&b!=null&&a.visible()&&b.visible()&&
            a.x<b.x+b.width&&b.x<a.x+a.width&&
            a.y<b.y+b.height&&b.y<a.y+a.height;
    }

    private static int clamp(int value,int min,int max){
        return Math.max(min,Math.min(Math.max(min,max),value));
    }
}
