package com.lucianotoscano.pokesearchoverlay;
/** No Android dependencies: tests the actual notification labels. */
public final class EncounterAlertTextTest {
    private static void equal(String actual,String expected){
        if(!expected.equals(actual))
            throw new AssertionError("Expected "+expected+" but got "+actual);
    }
    public static void main(String[] args){
        equal(EncounterAlertText.title("Quagsire","#195","15/15/15","100",
            true,"iv",""),"Quagsire #195 · ✨ SHUNDO");
        equal(EncounterAlertText.title("Gengar","#94","15/15/15","100",
            false,"iv",""),"Gengar #94 · 💯 HUNDO");
        equal(EncounterAlertText.title("Pikachu","#25","0/0/0","0",
            true,"raw",""),"Pikachu #25 · ✨ SHNUNDO");
        equal(EncounterAlertText.title("Sableye","#302","0/0/0","0",
            false,"raw",""),"Sableye #302 · ⭕ NUNDO");
        equal(EncounterAlertText.title("Annihilape","#979","0/15/14","64",
            false,"gl","1"),"Annihilape #979 · GL #1");
        equal(EncounterAlertText.title("Togekiss","#468","0/15/15","67",
            true,"ul","2"),"Togekiss #468 · UL #2 ✨");
        equal(EncounterAlertText.title("Noibat","#714","0/13/13","58",
            false,"raw",""),"Noibat #714 · IV 0/13/13");
        equal(EncounterAlertText.title("Lucario","#448","","",
            false,"gl",""),"Lucario #448 · GL");
        equal(EncounterAlertText.title("Eevee","#133","","",
            false,"iv",""),"Eevee #133 · Pokémon encontrado");
        if(!EncounterAlertText.details(true,true,"427","15/15/15","100",
            "Halloween 2025","","XXL","Female","Fortaleza").contains("⭐ Favorito"))
            throw new AssertionError("Favorite notification missing");
        if(!EncounterAlertText.details(false,false,"427","15/15/15","100",
            "Halloween 2025","","XXL","Female","Fortaleza").contains("P1 · Novo Pokémon"))
            throw new AssertionError("P1 identity missing");
        System.out.println("PASS LT136 actual Java alert formatting: species first, quality, leagues, form, size and P1/P2");
    }
}
