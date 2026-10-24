package com.lucianotoscano.pokesearchoverlay;

/** Run standalone with JDK17, no Android SDK or user-installed permissions. */
public final class PopupTouchGeometryTest {
    private static int passed;
    private static void check(boolean ok,String name){
        if(!ok)throw new AssertionError(name);
        passed++;
    }
    public static void main(String[] args){
        PopupTouchGeometry.Bounds bottom=PopupTouchGeometry.place(
            1080,2400,150,300,660,72,120,300,430,6);
        check(bottom.visible(),"popup is visible");
        check(!bottom.above,"popup below when there is space");
        check(bottom.y==372,"popup starts after toolbar, not over it");
        check(bottom.width==300,"popup uses content width");
        check(bottom.width<660,"popup does not inherit long toolbar width");
        check(bottom.x>=6&&bottom.x+bottom.width<=1074,"horizontal screen clamp");

        PopupTouchGeometry.Bounds top=PopupTouchGeometry.place(
            1080,2400,300,2220,660,72,320,200,350,6);
        check(top.above,"above when insufficient room below");
        check(top.y+top.height==2220,"no overlap with toolbar above");
        check(top.y>=6,"popup visible on display");

        PopupTouchGeometry.Bounds rightEdge=PopupTouchGeometry.place(
            720,1280,600,100,115,34,110,380,230,8);
        check(rightEdge.x+rightEdge.width<=712,"right edge clamp");
        check(rightEdge.width==380,"retains measured width when possible");

        PopupTouchGeometry.Bounds tiny=PopupTouchGeometry.place(
            180,260,50,80,100,40,50,320,220,6);
        check(tiny.width==168,"content clipped to available width");
        check(tiny.height<=Math.max(74,134),"height bounded to available space");
        check(tiny.x>=6&&tiny.x+tiny.width<=174,"tiny viewport clamped");

        PopupTouchGeometry.Bounds hidden=PopupTouchGeometry.place(
            1080,2400,0,0,300,34,100,0,100,8);
        check(!hidden.visible(),"zero-width popup never steals touches");
        check(hidden.width==0&&hidden.height==0,"zero-sized native touch window");
        PopupTouchGeometry.Bounds rail=PopupTouchGeometry.alignRail(
            bottom,1080,150,660,120,78,6);
        check(rail.x==231,"filter rail centered beneath originating tile");
        check(rail.y==bottom.y&&rail.height==bottom.height,
            "rail alignment preserves height and vertical placement");
        PopupTouchGeometry.Bounds clippedRail=PopupTouchGeometry.alignRail(
            rightEdge,720,600,115,110,78,8);
        check(clippedRail.x+clippedRail.width<=712,
            "lateral editor stays within right display margin");
        check(PopupTouchGeometry.alignRail(hidden,1080,0,300,100,78,8)==hidden,
            "zero-sized popup remains unclickable after anchoring");
        System.out.println("PopupTouchGeometry: "+passed+"/"+passed+" checks passed");
    }
}
