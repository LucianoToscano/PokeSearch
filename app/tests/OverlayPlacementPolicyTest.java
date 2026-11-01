package com.lucianotoscano.pokesearchoverlay;

public final class OverlayPlacementPolicyTest {
    private static void check(boolean pass,String description){
        if(!pass)throw new AssertionError(description);
    }
    private static boolean same(int[] a,int x,int y){
        return a.length==2&&a[0]==x&&a[1]==y;
    }
    public static void main(String[] args){
        check(same(OverlayPlacementPolicy.avoid(100,100,34,384,440,1000,4,null),100,100),
            "Unobstructed menu keeps exact position");
        check(OverlayPlacementPolicy.intersects(100,100,34,384,110,100,34,384),
            "Overlap detection");
        check(!OverlayPlacementPolicy.intersects(100,100,34,384,134,100,34,384),
            "Touching edges do not intersect");
        int[] second=OverlayPlacementPolicy.avoid(110,100,34,384,440,1000,4,
            new int[][]{{100,100,34,384}});
        check(!OverlayPlacementPolicy.intersects(second[0],second[1],34,384,100,100,34,384),
            "Second Pokeball menu moves aside without reducing size");
        check(same(second,138,100),"Prefers nearest free side by side slot");
        int[] result=OverlayPlacementPolicy.avoid(180,400,34,384,720,1600,4,
            new int[][]{{120,480,400,200}});
        check(!OverlayPlacementPolicy.intersects(result[0],result[1],34,384,120,480,400,200),
            "Vertical toolbar never covers horizontal Pokemon results when space permits");
        int[] top=OverlayPlacementPolicy.avoid(-90,-50,34,384,440,1000,4,null);
        check(same(top,4,4),"Clamps to screen edges");
        int[] noRoom=OverlayPlacementPolicy.avoid(100,100,34,384,120,450,4,
            new int[][]{{0,0,120,450}});
        check(noRoom.length==2&&noRoom[0]>=4&&noRoom[1]>=4,
            "No solution stays on screen, not resized or pushed outside");
        int[] two=OverlayPlacementPolicy.avoid(110,100,34,384,440,1000,4,
            new int[][]{{100,100,34,384},{300,100,34,384}});
        check(!OverlayPlacementPolicy.intersects(two[0],two[1],34,384,100,100,34,384)
           &&!OverlayPlacementPolicy.intersects(two[0],two[1],34,384,300,100,34,384),
            "Avoid multiple independent windows");
        System.out.println("LT220 PASS: preserve menu dimensions, clear overlap, screen clamp and multiple overlays");
    }
}
