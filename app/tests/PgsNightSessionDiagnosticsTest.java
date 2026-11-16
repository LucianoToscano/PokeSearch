package com.lucianotoscano.pokesearchoverlay;

public final class PgsNightSessionDiagnosticsTest {
    private static void yes(boolean ok,String why){if(!ok)throw new AssertionError(why);}
    public static void main(String[] args){
        PgsNightSessionDiagnostics session=new PgsNightSessionDiagnostics();
        yes(session.summary(0).contains("NÃO CONFIRMADA"),"no fabricated success before start");
        session.start(1000L,true);
        yes(session.active(),"active supervisor");
        yes(session.summary(1000L).contains("sem leitura"),"start is not a reading");
        session.observe(31000L,true,true,0);
        session.observe(61000L,false,true,1);
        session.observe(91000L,false,false,2);
        yes(session.reads()==3,"three readings");
        yes(session.missingStreak()==2,"two misses");
        yes(session.summary(95000L).contains("Captura no jogo: NÃO CONFIRMADA"),
            "no catch inferred from readings");
        yes(session.summary(95000L).contains("Tentativa de captura: NÃO OBSERVADA"),
            "no attempt inferred from active VGP");
        yes(session.summary(95000L).contains("Caminhada externa: NÃO CONFIRMADA"),
            "no movement inferred from notification or UI");
        session.stop(96000L,"Notificações do Android foram desativadas.");
        yes(!session.active(),"stopped");
        yes(session.summary(97000L).contains("notificações desativadas"),"stop reason");
        session.observe(98000L,true,true,0);
        yes(session.reads()==3,"ignore late callbacks");
        session.start(110000L,true);
        yes(session.reads()==0,"new session resets counters");
        session.stop(112000L,"conta de alguém / localização secreta");
        yes(!session.summary(113000L).contains("secreta"),"no arbitrary text echoed");
        System.out.println("LT372 session diagnostics 13/13 PASS");
    }
}
