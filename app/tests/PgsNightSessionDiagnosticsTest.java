package com.lucianotoscano.pokesearchoverlay;

public final class PgsNightSessionDiagnosticsTest {
    private static void ok(boolean result,String msg){
        if(!result)throw new AssertionError(msg);
    }
    private static void has(String text,String expected){
        ok(text.contains(expected),"Faltou: "+expected+" em "+text);
    }
    public static void main(String[] args){
        PgsNightSessionDiagnostics d=new PgsNightSessionDiagnostics();
        has(d.summary(1000),"Supervisao: parada");
        d.start(1000,true,true);
        has(d.summary(1000),"Supervisao: ativa");
        has(d.summary(1000),"leituras: 0");
        has(d.summary(1000),"movimento nao verificado");
        has(d.summary(1000),"Tentativa de captura: nao observada");
        has(d.summary(1000),"conexao nao verificada");
        has(d.summary(1000),"Captura confirmada: nenhuma evidência");
        ok(!d.stale(61000,30000),"boundary at 60s");
        ok(d.stale(61001,30000),"late tick flagged");
        d.sampled(31000,true,false);
        has(d.summary(32000),"leituras: 1");
        has(d.summary(32000),"ha 1s");
        ok(!d.stale(32000,30000),"fresh sample");
        d.sampled(61000,false,true);
        has(d.summary(62000),"ausencias: 1");
        has(d.summary(62000),"avisos: 1");
        d.stop("Aviso de seguranca detectado.");
        has(d.summary(64000),"Parada: Aviso de seguranca detectado.");
        ok(!d.active(),"supervisor actually stopped");
        d.sampled(65000,true,false);
        has(d.summary(66000),"leituras: 2");
        d.start(70000,false,false);
        has(d.summary(71000),"leituras: 0");
        has(d.summary(71000),"Caminhada externa: nao verificada");
        has(d.summary(71000),"Tentativa de captura: nao observada");
        has(d.summary(71000),"Captura confirmada: nenhuma evidência");
        System.out.println("LT372 night session diagnostics PASS");
    }
}
