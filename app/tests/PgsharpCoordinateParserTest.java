package com.lucianotoscano.pokesearchoverlay;
public final class PgsharpCoordinateParserTest {
    private static void eq(String expected,String actual){
        if(!expected.equals(actual))throw new AssertionError("Expected ["+expected+"] got ["+actual+"]");
    }
    public static void main(String[]args){
        eq("-23.5505000,-46.6333000",PgsharpCoordinateParser.parse(
            "Current player location: -23.5505, -46.6333"));
        eq("35.6812000,139.7671000",PgsharpCoordinateParser.parse(
            "Player position lat:35.6812 lng:139.7671"));
        eq("-5.1880000,-37.3440000",PgsharpCoordinateParser.parse(
            "Localização atual do jogador: -5.188,-37.344"));
        eq("",PgsharpCoordinateParser.parse("Teleport to: -23.5505,-46.6333"));
        eq("",PgsharpCoordinateParser.parse("Current location selected target -23.5505,-46.6333"));
        eq("",PgsharpCoordinateParser.parse("Current location: -91,120"));
        eq("",PgsharpCoordinateParser.parse("Current location: 1,181"));
        eq("",PgsharpCoordinateParser.parse("My current place: 2,3"));
        eq("",PgsharpCoordinateParser.parse(null));
        System.out.println("PGSharp conservative coordinate parser OK (9 cases)");
    }
}
