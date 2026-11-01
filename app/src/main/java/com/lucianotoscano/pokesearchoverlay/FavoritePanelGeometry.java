package com.lucianotoscano.pokesearchoverlay;

/** Pure, pixel-based geometry for the nonmodal Favorites overlay.
 * Coordinates use the same display reference frame as the native toolbar.
 * Can run in a plain JVM regression without any Android dependencies.
 */
final class FavoritePanelGeometry {
    private FavoritePanelGeometry(){}
    static int clamp(int value,int low,int high){
        return Math.max(low,Math.min(Math.max(low,high),value));
    }
    static int[] onScreen(int x,int y,int displayW,int displayH,
                          int panelW,int panelH,int margin){
        return new int[]{
            clamp(x,margin,displayW-panelW-margin),
            clamp(y,margin,displayH-panelH-margin)
        };
    }
    /** Chooses a side of the actual visible toolbar, not the expanded WebView.
     * The y coordinates are native WindowManager screen pixels, not menu-local.
     */
    static int[] adjacentToToolbar(int anchorX,int toolbarTop,int toolbarBottom,
                                   int displayW,int displayH,int panelW,int panelH,
                                   int margin,int gap){
        int above=Math.max(0,toolbarTop-gap-margin);
        int below=Math.max(0,displayH-margin-toolbarBottom-gap);
        boolean preferBelow=below>=panelH || (above<panelH && below>=above);
        int y=preferBelow?toolbarBottom+gap:toolbarTop-gap-panelH;
        return onScreen(anchorX-panelW/2,y,displayW,displayH,panelW,panelH,margin);
    }
    static boolean overlapsToolbar(int top,int height,int toolbarTop,int toolbarBottom){
        return toolbarTop>=0 && toolbarBottom>toolbarTop &&
            top<toolbarBottom && top+height>toolbarTop;
    }
    static int[] adjacent(int anchorX,int anchorY,int displayW,int displayH,
                          int panelW,int panelH,int margin,int gap,int halfToolbarH){
        int below=anchorY+halfToolbarH+gap;
        int above=anchorY-halfToolbarH-gap-panelH;
        int spaceBelow=Math.max(0,displayH-margin-below);
        int spaceAbove=Math.max(0,anchorY-halfToolbarH-gap-margin);
        boolean placeBelow=spaceBelow>=panelH ||
            (spaceAbove<panelH && spaceBelow>=spaceAbove);
        return onScreen(anchorX-panelW/2,placeBelow?below:above,
                        displayW,displayH,panelW,panelH,margin);
    }
}
