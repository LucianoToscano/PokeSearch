package com.lucianotoscano.pokesearchoverlay;

/** Testes locais sem Android para evitar falso alerta e pausa indevida. */
public final class PgsAutoShinySignalTest {
    private static void check(boolean actual,boolean expected,String label){
        if(actual!=expected)throw new AssertionError(label+": esperado "+expected+", obtido "+actual);
    }
    public static void main(String[] args){
        check(PgsAutoShinySignal.isPositive(null),false,"nulo");
        check(PgsAutoShinySignal.isPositive(""),false,"vazio");
        check(PgsAutoShinySignal.isPositive("✨ Novidades da temporada"),false,"emoji generico");
        check(PgsAutoShinySignal.isPositive("✨ Shiny tips and events"),false,"marketing");
        check(PgsAutoShinySignal.isPositive("Shiny:"),false,"valor ausente");
        check(PgsAutoShinySignal.isPositive("Shiny: false"),false,"booleano falso");
        check(PgsAutoShinySignal.isPositive("Shiny = 0"),false,"zero");
        check(PgsAutoShinySignal.isPositive("No shiny found"),false,"negacao inglesa");
        check(PgsAutoShinySignal.isPositive("Nao e brilhante"),false,"negacao portuguesa");
        check(PgsAutoShinySignal.isPositive("Not a shiny"),false,"nao shiny");
        check(PgsAutoShinySignal.isPositive("Shiny found: Pikachu"),true,"achou shiny");
        check(PgsAutoShinySignal.isPositive("Found a shiny Eevee"),true,"shiny achado");
        check(PgsAutoShinySignal.isPositive("Shiny detected!"),true,"deteccao");
        check(PgsAutoShinySignal.isPositive("Shiny: true"),true,"booleano verdadeiro");
        check(PgsAutoShinySignal.isPositive("Brilhante encontrado: Eevee"),true,"portugues");
        check(PgsAutoShinySignal.isPositive("✨ Shiny: no; shiny found"),false,"negacao prioritária");
        System.out.println("PGS shiny classifier: 16/16 PASS");
    }
}
