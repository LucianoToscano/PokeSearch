package com.lucianotoscano.pokesearchoverlay;
public final class PgsAutoVisualStateTest {
    private static int count=0;
    private static void eq(Object expected,Object actual,String label){
        if(!expected.equals(actual))throw new AssertionError(label+" esperado="+expected+" atual="+actual);
        count++;
    }
    public static void main(String[] args){
        PgsAutoVisualState.Core W=PgsAutoVisualState.Core.WHITE;
        PgsAutoVisualState.Core G=PgsAutoVisualState.Core.GREEN;
        PgsAutoVisualState.Core R=PgsAutoVisualState.Core.RED;
        eq(W,PgsAutoVisualState.core(false,false,false,"PARADO"),"parado");
        eq(W,PgsAutoVisualState.core(false,false,false,"✨ SHINY PAUSADO"),"shiny");
        eq(W,PgsAutoVisualState.core(true,false,false,"ABRA O JOGO"),"precisa abrir jogo");
        eq(W,PgsAutoVisualState.core(true,false,false,"LENDO TELA"),"leitura sem overlay");
        eq(W,PgsAutoVisualState.core(true,false,false,"PROCURANDO 1"),"busca branco original");
        eq(W,PgsAutoVisualState.core(true,false,false,"CONFIRMANDO Pikachu"),"confirma branco natural");
        eq(W,PgsAutoVisualState.core(true,false,false,"RELENDO ÍCONES"),"relendo sem sobreposição");
        eq(G,PgsAutoVisualState.core(true,true,false,"AGUARDANDO MAPA"),"aguardando mapa");
        eq(W,PgsAutoVisualState.core(true,false,false,"CARREGANDO 5/60"),"sem estado de mapa não pisca");
        eq(G,PgsAutoVisualState.core(true,true,false,"ESPERA 4s"),"esperando cena");
        eq(R,PgsAutoVisualState.core(false,false,true,"PAUSADO VER AVISO"),"falha pausada");
        eq(G,PgsAutoVisualState.core(true,true,false,"TEMPO ESGOTADO"),"timeout não é falha do ciclo");
        eq(R,PgsAutoVisualState.core(false,false,false,"SEM CAPTURA"),"sem screenshot");
        eq(R,PgsAutoVisualState.core(false,false,false,"SEM MODELO"),"sem modelo");
        eq(W,PgsAutoVisualState.core(true,false,false,"PRÓXIMO"),"normal ligado");
        eq(false,PgsAutoVisualState.active(false,false,false),"desligado");
        eq(false,PgsAutoVisualState.active(false,true,false),"pausado shiny");
        eq(false,PgsAutoVisualState.active(false,false,true),"pausado erro");
        eq(true,PgsAutoVisualState.active(true,false,false),"ativo");
        eq(44,PgsAutoVisualState.TOUCH_DP,"toque 44dp");
        eq(35,PgsAutoVisualState.RESULT_SLOT_WIDTH_DP,"slot 35");
        eq(30,PgsAutoVisualState.RESULT_SLOT_HEIGHT_DP,"slot 30");
        eq(21,PgsAutoVisualState.RESULT_ART_DP,"arte 21");
        eq(850L,PgsAutoVisualState.PULSE_MS,"paridade CSS");
        System.out.println("LT339 PGS visual: "+count+" casos PASS");
    }
}
