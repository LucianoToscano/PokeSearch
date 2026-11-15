package com.lucianotoscano.pokesearchoverlay;

public final class PgsAutoScreenGeometryTest {
    private static void check(boolean ok,String why){
        if(!ok)throw new AssertionError(why);
    }
    public static void main(String[] args){
        int[] portrait=PgsAutoScreenGeometry.map(370,760,740,1520,1080,2218);
        check(portrait!=null&&Math.abs(portrait[0]-540)<2,
            "portrait coordinates should match scaled display");
        int[] landscape=PgsAutoScreenGeometry.map(700,300,1480,740,2960,1480);
        check(landscape!=null&&landscape[0]==1400&&landscape[1]==600,
            "landscape conversion must be symmetric");
        check(PgsAutoScreenGeometry.map(400,600,740,1500,1080,1920)==null,
            "mismatched navigation insets must fail closed");
        check(PgsAutoScreenGeometry.map(740,20,740,1500,1080,2189)==null,
            "outside frame may never dispatch a gesture");
        check(PgsAutoScreenGeometry.map(1,1,0,100,100,100)==null,
            "invalid screenshots fail closed");
        System.out.println("LT355: conservative screenshot-to-display map PASS");
    }
}
