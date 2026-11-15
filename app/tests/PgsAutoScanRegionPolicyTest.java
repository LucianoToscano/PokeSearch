package com.lucianotoscano.pokesearchoverlay;

public final class PgsAutoScanRegionPolicyTest {
    private static void eq(boolean result,boolean expected,String label){
        if(result!=expected)throw new AssertionError(label+" expected "+expected+" got "+result);
    }
    private static void eq(String result,String expected,String label){
        if(!expected.equals(result))throw new AssertionError(label+" expected "+expected+" got "+result);
    }
    private static void yes(boolean result,String label){eq(result,true,label);}
    public static void main(String[] args){
        eq(PgsAutoScanRegionPolicy.side(null),"left","default to user screenshot left");
        eq(PgsAutoScanRegionPolicy.side("RIGHT"),"right","right normalized");
        eq(PgsAutoScanRegionPolicy.side("unknown"),"left","invalid side safe left");
        // Indicadores aproximados das imagens fornecidas: apenas centros
        // normalizados, não copiar a imagem do usuário para o repositório.
        yes(PgsAutoScanRegionPolicy.inside("pokemod","left",50,930,691,1536),
            "photo 1 portrait circle left");
        yes(PgsAutoScanRegionPolicy.inside("pokemod","left",90,1160,864,1536),
            "photo 3 portrait circle left");
        eq(PgsAutoScanRegionPolicy.inside("pokemod","left",813,1160,864,1536),
            false,"right side excluded in left profile");
        eq(PgsAutoScanRegionPolicy.inside("pokemod","left",432,1160,864,1536),
            false,"3D map middle ignored");
        yes(PgsAutoScanRegionPolicy.inside("pokemod","right",813,1160,864,1536),
            "right-side user preference");
        eq(PgsAutoScanRegionPolicy.inside("pokemod","right",90,1160,864,1536),
            false,"left excluded in right mode");
        yes(PgsAutoScanRegionPolicy.inside("pgsharp","left",90,1160,864,1536),
            "legacy PGSharp left");
        yes(PgsAutoScanRegionPolicy.inside("pgsharp","right",813,1160,864,1536),
            "legacy PGSharp right unaffected");
        yes(PgsAutoScanRegionPolicy.inside("other","left",90,1160,864,1536),
            "unhomologated preview left");
        yes(PgsAutoScanRegionPolicy.inside("other","left",813,1160,864,1536),
            "unhomologated preview right");
        eq(PgsAutoScanRegionPolicy.inside("pokemod","left",50,1500,691,1536),
            false,"bottom nav excluded");
        eq(PgsAutoScanRegionPolicy.inside("pokemod","left",50,32,691,1536),
            false,"top status bar excluded");
        eq(PgsAutoScanRegionPolicy.inside("pokemod","left",-1,920,691,1536),
            false,"negative x excluded");
        eq(PgsAutoScanRegionPolicy.inside("pokemod","left",0,0,0,1536),
            false,"zero width excluded");
        yes(PgsAutoScanRegionPolicy.inside("pokemod","left",100,350,1536,691),
            "landscape left");
        yes(PgsAutoScanRegionPolicy.inside("pokemod","right",1420,350,1536,691),
            "landscape right");
        int leftMax=PgsAutoScanRegionPolicy.lastX("pokemod","left",740,1645,52);
        int rightMin=PgsAutoScanRegionPolicy.firstX("pokemod","right",740,1645,52);
        yes(leftMax<240&&leftMax>=0,"left bounding cut reduces full-screen scanning");
        yes(rightMin>500&&rightMin<740,"right bounding cut reduces full-screen scanning");
        eq(PgsAutoScanRegionPolicy.firstX("pgsharp","right",740,1645,52)==0,
            true,"PGSharp scan start preserved");
        eq(PgsAutoScanRegionPolicy.lastX("pgsharp","left",740,1645,52)==688,
            true,"PGSharp scan end preserved");
        System.out.println("LT360 Pokemod sidebar ROI and rotation/host isolation PASS");
    }
}
