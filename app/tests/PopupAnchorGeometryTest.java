package com.lucianotoscano.pokesearchoverlay;

/** LT77 Stage 4: real-pixel anchored popups without Android runtime. */
public final class PopupAnchorGeometryTest {
    private static int count=0;
    private static void check(boolean ok,String label){
        if(!ok)throw new AssertionError(label);
        count++;
        System.out.println("PASS LT77 Stage4 "+label);
    }
    public static void main(String[] args){
        PopupTouchGeometry.Bounds regular=PopupTouchGeometry.placeBesideMeasured(
            1080,2400,100,300,220,232,95,30,260,340,6);
        check(regular.visible(),"vertical popup visible");
        check(regular.x==320,"popup next to icon toolbar (right)");
        check(regular.y==380,"popup begins at icon top (center minus half height)");
        PopupTouchGeometry.Bounds tallIcon=PopupTouchGeometry.placeBesideMeasured(
            1080,2400,100,300,220,232,95,60,260,340,6);
        check(tallIcon.y==365,"icon height changes anchor rather than fixed 16px");
        PopupTouchGeometry.Bounds compact=PopupTouchGeometry.placeBesideMeasured(
            420,900,230,300,184,232,210,26,280,420,6);
        check(compact.visible()&&compact.x+compact.width==230,"small phone opens to left");
        check(compact.y==497,"left-side popup anchors to icon top");
        PopupTouchGeometry.Bounds bottom=PopupTouchGeometry.placeBesideMeasured(
            720,1280,100,1040,220,232,200,26,300,350,6);
        check(bottom.y+bottom.height<=1274,"bottom screen clamp");
        PopupTouchGeometry.Bounds missing=PopupTouchGeometry.placeBesideMeasured(
            720,1280,100,200,220,232,80,0,300,350,6);
        check(!missing.visible(),"invalid trigger has no touch window");
        PopupTouchGeometry.Bounds horizontal=PopupTouchGeometry.place(
            1080,2400,120,400,800,96,650,230,260,6);
        check(horizontal.visible()&&horizontal.y==496,"horizontal icon opens directly below bar");
        PopupTouchGeometry.Bounds above=PopupTouchGeometry.place(
            1080,2400,120,2170,800,96,650,230,260,6);
        check(above.above&&above.y+above.height==2170,"low icon opens directly above");
        System.out.println("LT77 Stage4 PopupAnchorGeometryTest: "+count+"/"+count+" PASS");
    }
}
