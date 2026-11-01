package com.lucianotoscano.pokesearchoverlay;

public final class CandyClipboardCoordinatesTest {
    private static int checks=0;
    private static void expect(String input,String result){
        String got=CandyClipboardCoordinates.extract(input);
        if(!result.equals(got))throw new AssertionError("Expected ["+result+"] got ["+got+"]");
        checks++;
    }
    public static void main(String[] args){
        expect("-5.123456,-37.123456","-5.123456,-37.123456");
        expect("coords: -5.123456 ; -37.123456\nDistancia 15km","-5.123456,-37.123456");
        expect("https://example.com/?q=12.3,-45.6","12.3,-45.6");
        expect("90,180","90,180");
        expect("−5.2,−38.2","-5.2,-38.2");
        expect("90.1,0","");
        expect("0,180.1","");
        expect("not coords","");
        expect("1,2 outro 3,4","");
        expect("1,2 / 1,2","1,2");
        expect("1.2.3,4","");
        expect("x".repeat(513),"");
        expect(null,"");
        System.out.println("PASS LT214 candy clipboard coordinates: "+checks+" checks");
    }
}
