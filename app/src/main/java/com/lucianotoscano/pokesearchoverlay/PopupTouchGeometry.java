package com.lucianotoscano.pokesearchoverlay;

/**
 * Pure geometry for a future independent, content-sized overlay popup window.
 * It does not alter the existing menu WebView or install a touchable window.
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

    private static int clamp(int value,int min,int max){
        return Math.max(min,Math.min(Math.max(min,max),value));
    }
}
