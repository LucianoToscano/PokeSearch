package com.lucianotoscano.pokesearchoverlay;

/** Execute production classifier without Android, screenshots or permissions. */
public final class CandyPickupEvidenceTest {
    private static int checks=0;
    private static void expect(boolean ok,String msg){
        checks++;
        if(!ok)throw new AssertionError(msg);
    }
    private static int rgb(int r,int g,int b){
        return 0xff000000|(r<<16)|(g<<8)|b;
    }
    public static void main(String[] ignored){
        expect(CandyPickupEvidence.titleMatches(
            "Item encontrado!    DOCE RARO   +2"),"Portuguese banner +2");
        expect(CandyPickupEvidence.titleMatches(
            "Item\n encontrado! DOCE RARO"),"line breaks");
        expect(CandyPickupEvidence.titleMatches(
            "ITEM ENCONTRADO: Doce Raro"),"case insensitive");
        expect(!CandyPickupEvidence.titleMatches("DOCE RARO"),"no collection action");
        expect(!CandyPickupEvidence.titleMatches("Item encontrado! POTION"),"other item");
        expect(!CandyPickupEvidence.titleMatches("PokeSearch Doce Raro disponível"),
            "overlay should not auto-confirm");
        expect(!CandyPickupEvidence.titleMatches(null),"null OCR");
        int width=240,height=110;
        int[] image=new int[width*height];
        java.util.Arrays.fill(image,rgb(240,242,244));
        // A synthetic rainbow sprite in the upper-left portion.
        for(int y=10;y<82;y++)
            for(int x=34;x<64;x++)
                image[y*width+x]=y<35?rgb(245,55,95):
                    y<58?rgb(244,194,36):rgb(30,191,81);
        expect(CandyPickupEvidence.hasCandyRainbow(image,width,height),
            "red/yellow/green sprite accepted");
        int[] plain=image.clone();
        java.util.Arrays.fill(plain,rgb(245,245,245));
        expect(!CandyPickupEvidence.hasCandyRainbow(plain,width,height),
            "white banner alone rejected");
        int[] wrong=image.clone();
        for(int y=10;y<82;y++)for(int x=34;x<64;x++)
            wrong[y*width+x]=y<35?rgb(30,191,81):
                y<58?rgb(244,194,36):rgb(245,55,95);
        expect(!CandyPickupEvidence.hasCandyRainbow(wrong,width,height),
            "incorrect sprite color ordering rejected");
        int[] rightOnly=plain.clone();
        for(int y=10;y<82;y++)for(int x=192;x<222;x++)
            rightOnly[y*width+x]=image[y*width+40];
        expect(!CandyPickupEvidence.hasCandyRainbow(rightOnly,width,height),
            "right side unrelated badge not used");
        CandyPickupEvidence.TwoFrameGate g=new CandyPickupEvidence.TwoFrameGate();
        expect(!g.observe(true,1000),"first sight never confirms");
        expect(!g.observe(true,1199),"two quick frames not enough");
        expect(g.observe(true,1410),"separated independent second frame");
        expect(!g.observe(true,2000),"duplicate banner cannot confirm twice");
        g.observe(false,4000);
        expect(!g.observe(true,4500),"new sequence first frame");
        expect(g.observe(true,4900),"new sequence second frame");
        g.reset();
        expect(!g.observe(true,5000),"reset clears gate");
        expect(!g.observe(true,9001),"stale first evidence not accepted");
        expect(g.observe(true,9401),"fresh sequence accepted");
        System.out.println("PASS LT197 candy text/color gate: "+checks+" checks");
    }
}
