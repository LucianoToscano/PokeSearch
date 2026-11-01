package com.lucianotoscano.pokesearchoverlay;

/**
 * Pure geometry, in PHYSICAL PIXELS, for independent Android overlay windows.
 * Repositions a rectangle but never resizes it, its buttons or any sprites.
 * When no complete non-overlapping candidate fits the screen, the original
 * clamped position is preserved rather than hiding content off-screen.
 */
final class OverlayPlacementPolicy {
    private OverlayPlacementPolicy() {}

    static int clamp(int value, int min, int max) {
        return Math.max(min, Math.min(Math.max(min,max),value));
    }

    static boolean intersects(int ax,int ay,int aw,int ah,
                              int bx,int by,int bw,int bh) {
        return aw>0 && ah>0 && bw>0 && bh>0 &&
            ax<bx+bw && bx<ax+aw && ay<by+bh && by<ay+ah;
    }

    /**
     * Keep the current top/left first. When overlapping, pick the NEAREST
     * complete free rectangle among right/left/below/above each obstacle.
     * Obstacle entries are {x,y,width,height}; null entries are ignored.
     */
    static int[] avoid(int x,int y,int width,int height,
                       int screenWidth,int screenHeight,int margin,
                       int[][] obstacles) {
        final int edge=Math.max(0,margin);
        final int maxX=Math.max(edge,screenWidth-edge-width);
        final int maxY=Math.max(edge,screenHeight-edge-height);
        final int startX=clamp(x,edge,maxX);
        final int startY=clamp(y,edge,maxY);
        if(width<=0||height<=0||width>screenWidth-2*edge||
                height>screenHeight-2*edge)
            return new int[]{startX,startY};
        if(free(startX,startY,width,height,obstacles))
            return new int[]{startX,startY};
        int[] winner=null;
        long score=Long.MAX_VALUE;
        if(obstacles!=null)for(int[] o:obstacles) {
            if(o==null||o.length<4||o[2]<=0||o[3]<=0)continue;
            int[][] candidates={
                {o[0]+o[2]+edge,startY},
                {o[0]-width-edge,startY},
                {startX,o[1]+o[3]+edge},
                {startX,o[1]-height-edge}
            };
            for(int[] c:candidates) {
                int cx=c[0],cy=c[1];
                if(cx<edge||cy<edge||cx>maxX||cy>maxY||
                        !free(cx,cy,width,height,obstacles))continue;
                long dx=(long)cx-startX,dy=(long)cy-startY;
                long distance=Math.abs(dx)+Math.abs(dy);
                // Prefer shorter movement; equal score prefers side-by-side.
                if(distance<score) {
                    winner=new int[]{cx,cy};
                    score=distance;
                }
            }
        }
        return winner!=null?winner:new int[]{startX,startY};
    }

    private static boolean free(int x,int y,int w,int h,int[][] obstacles) {
        if(obstacles==null)return true;
        for(int[] o:obstacles)
            if(o!=null&&o.length>=4&&intersects(x,y,w,h,
                    o[0],o[1],o[2],o[3]))
                return false;
        return true;
    }
}
