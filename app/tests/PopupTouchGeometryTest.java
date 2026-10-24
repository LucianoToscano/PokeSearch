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
        PopupTouchGeometry.Bounds sideRight=PopupTouchGeometry.placeBeside(
            1080,2400,100,300,198,232,90,268,390,6);
        check(sideRight.visible(),"vertical toolbar gets a visible adjacent popup");
        check(sideRight.x==298,"vertical popup begins after right edge of rail");
        check(sideRight.y==374,"vertical popup starts beside tapped row");
        PopupTouchGeometry.Bounds sideLeft=PopupTouchGeometry.placeBeside(
            420,900,230,300,184,232,210,300,420,6);
        check(sideLeft.x+sideLeft.width==230,"vertical popup moves left when right side is full");
        check(sideLeft.x>=6&&sideLeft.y+sideLeft.height<=894,
            "vertical adjacent popup remains bounded to display");
        // LT63: simulated Samsung placements, independently dragged results,
        // left/right edges, vertical rail and cramped lower screen.
        int[][] phoneCases={
            {1080,2400,180,375,310,290,160,395,370,640},
            {1080,2400,690,375,310,290,700,390,360,600},
            {1080,2400,230,1950,310,310,220,2020,610,300},
            {720,1280,390,810,300,260,400,820,300,400},
            {420,900,90,340,310,260,110,345,200,350},
            {1440,3088,1020,800,310,330,1100,815,330,900}
        };
        for(int i=0;i<phoneCases.length;i++){
            int[] c=phoneCases[i];
            PopupTouchGeometry.Bounds popup=new PopupTouchGeometry.Bounds(c[2],c[3],c[4],c[5],false);
            PopupTouchGeometry.Bounds results=new PopupTouchGeometry.Bounds(c[6],c[7],c[8],c[9],false);
            PopupTouchGeometry.Bounds safe=PopupTouchGeometry.avoidResult(popup,results,c[0],c[1],6);
            check(!PopupTouchGeometry.overlaps(safe,results),"LT63 results untouched: "+i);
            if(safe.visible()){
                check(safe.x>=6&&safe.y>=6&&safe.x+safe.width<=c[0]-6&&
                      safe.y+safe.height<=c[1]-6,"LT63 safe bounds "+i);
            }
        }
        PopupTouchGeometry.Bounds clearPopup=new PopupTouchGeometry.Bounds(6,6,140,140,false);
        PopupTouchGeometry.Bounds farResults=new PopupTouchGeometry.Bounds(320,400,90,90,false);
        check(PopupTouchGeometry.avoidResult(clearPopup,farResults,420,900,6)==clearPopup,
              "LT63 non-overlapping popup stays anchored");
        check(!PopupTouchGeometry.overlaps(clearPopup,farResults),
              "LT63 disjoint rectangles");
        // LT69 Samsung screenshots: More uses the EXACT native edge; CSS
        // must render its first button at y=0 inside this popup (not +34dp).
        PopupTouchGeometry.Bounds moreBelow=PopupTouchGeometry.place(
            1080,2400,180,410,760,95,724,90,106,6);
        check(moreBelow.visible()&&!moreBelow.above,
            "LT69 More visible beneath toolbar");
        check(moreBelow.y==505,
            "LT69 More starts exactly at native bottom edge without an extra 34dp");
        check(moreBelow.width==90&&moreBelow.height==106,
            "LT69 More keeps enough native height for all utility icons");
        PopupTouchGeometry.Bounds moreAbove=PopupTouchGeometry.place(
            1080,2400,180,2240,760,95,724,90,106,6);
        check(moreAbove.above&&moreAbove.y+moreAbove.height==2240,
            "LT69 More stays flush against toolbar when it opens upward");
        PopupTouchGeometry.Bounds moreVertical=PopupTouchGeometry.placeBeside(
            1080,2400,100,400,220,720,650,90,106,6);
        check(moreVertical.x==320&&moreVertical.visible(),
            "LT69 vertical More appears beside the toolbar, never +232dp");
        System.out.println("PopupTouchGeometry: "+passed+"/"+passed+" checks passed");
    }
}
