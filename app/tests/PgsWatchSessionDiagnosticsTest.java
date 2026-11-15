package com.lucianotoscano.pokesearchoverlay;
public final class PgsWatchSessionDiagnosticsTest {
    private static void check(boolean b,String label){if(!b)throw new AssertionError(label);}
    public static void main(String[] args){
        PgsWatchSessionDiagnostics d=new PgsWatchSessionDiagnostics();
        check(d.readings()==0&&d.lastDurationMs()==-1,"no fake past readings");
        d.observe(80,30,5); d.finish(30,"MONITOR · OBSERVANDO");
        check(d.readings()==0,"callbacks without start ignored");
        d.begin(1000); d.observe(7,2,1);d.finish(2400,"MONITOR · 1 FAVORITO(S)");
        check(d.readings()==1&&d.candidates()==7&&d.confirmed()==2,
            "count confirmed visual observations");
        check(d.alertsRequested()==1&&d.lastDurationMs()==1400,
            "request is not delivery and monotonic duration");
        d.begin(3000);d.finish(3500,"MONITOR · LEITURA INCOMPLETA");
        check(d.readings()==2&&d.interrupted()==1,"aborted read recorded");
        d.begin(4000);d.cancel();d.finish(4500,"MONITOR · OBSERVANDO");
        check(d.readings()==2,"cancel drops stale callback");
        d.begin(5000);d.finish(4999,"MONITOR · OBSERVANDO");
        check(d.readings()==2,"clock rollback fails closed");
        check(d.summary().contains("Alertas solicitados 1"),"no claim of delivery");
        check(!d.summary().contains("screenshot"),"no screen content stored");
        System.out.println("LT363 ephemeral watch diagnostics PASS");
    }
}
