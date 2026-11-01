package com.lucianotoscano.pokesearchoverlay;

public final class FavoritePanelGeometryTest {
    private static int checks=0;
    private static void equal(String label,int[] xy,int x,int y){
        if(xy[0]!=x||xy[1]!=y)
            throw new AssertionError(label+" expected "+x+","+y+" but got "+xy[0]+","+xy[1]);
        checks++;
    }
    public static void main(String[] args){
        // Center-ish toolbar with enough room below => below with 4px gap.
        equal("near top -> below",FavoritePanelGeometry.adjacent(
            360,300,740,1500,620,270,8,4,17),60,321);
        // Low toolbar -> prefer above and leave the entire bar unobstructed.
        equal("near bottom -> above",FavoritePanelGeometry.adjacent(
            360,1050,740,1500,620,270,8,4,17),60,759);
        equal("right edge stays visible",FavoritePanelGeometry.adjacent(
            739,300,740,1500,620,270,8,4,17),112,321);
        equal("left edge stays visible",FavoritePanelGeometry.adjacent(
            0,300,740,1500,620,270,8,4,17),8,321);
        equal("drag stays within display",FavoritePanelGeometry.onScreen(
            900,-500,740,1500,620,270,8),112,8);
        equal("drag cannot fall below screen",FavoritePanelGeometry.onScreen(
            -500,9000,740,1500,620,270,8),8,1222);
        equal("display shrinks while saved position is restored",FavoritePanelGeometry.onScreen(
            400,1200,500,800,420,330,8),72,462);
        equal("too-tall popup clamps safely",FavoritePanelGeometry.onScreen(
            40,400,740,250,620,280,8),40,8);
        System.out.println("PASS LT209 FavoritePanelGeometry: "+checks+" visible-placement and drag tests");
    }
}
