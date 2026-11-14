package com.lucianotoscano.pokesearchoverlay;

public final class PgsAutoNotificationPolicyTest {
    private static int count=0;
    private static void check(boolean actual,String message){
        count++;
        if(!actual)throw new AssertionError(message);
    }
    public static void main(String[] args){
        check("mute".equals(PgsAutoNotificationPolicy.defaultMode("newSound")),"feed default");
        check("mute".equals(PgsAutoNotificationPolicy.defaultMode("searchSound")),"busca default");
        check("strong".equals(PgsAutoNotificationPolicy.defaultMode("shinyMode")),"shiny default");
        check("default".equals(PgsAutoNotificationPolicy.mode("newSound","default")),"mode normal");
        check("strong".equals(PgsAutoNotificationPolicy.mode("newSound","strong")),"mode forte");
        check("mute".equals(PgsAutoNotificationPolicy.mode("searchSound","mute")),"mode mudo");
        check("custom".equals(PgsAutoNotificationPolicy.mode("shinyMode","custom")),"mode personalizado");
        check("mute".equals(PgsAutoNotificationPolicy.mode("newSound","invalid")),"fallback");
        check("mute".equals(PgsAutoNotificationPolicy.mode("unknown","strong")),"kind invalid");
        check(PgsAutoNotificationPolicy.channelId("newSound","strong",0).contains("newSound_strong"),"feed id");
        check(PgsAutoNotificationPolicy.channelId("searchSound","strong",0).contains("searchSound_strong"),"busca id");
        check(PgsAutoNotificationPolicy.channelId("shinyMode","strong",0).contains("shinyMode_strong"),"shiny id");
        check(!PgsAutoNotificationPolicy.channelId("newSound","default",0).equals(
            PgsAutoNotificationPolicy.channelId("searchSound","default",0)),"independencia entre PGS");
        check(!PgsAutoNotificationPolicy.channelId("newSound","custom",5).equals(
            PgsAutoNotificationPolicy.channelId("newSound","custom",6)),"troca de áudio muda canal");
        check(PgsAutoNotificationPolicy.channelId("shinyMode","custom",-2).contains("_default_"),"custom invalido");
        check(PgsAutoNotificationPolicy.channelId("shinyMode","custom",35).contains("_custom_35_"),"ultimo audio");
        check(PgsAutoNotificationPolicy.notificationId("newSound")==2101,"id feed");
        check(PgsAutoNotificationPolicy.notificationId("searchSound")==2102,"id busca");
        check(PgsAutoNotificationPolicy.notificationId("shinyMode")==2103,"id shiny");
        try{PgsAutoNotificationPolicy.channelId("not-pgs","mute",0);throw new AssertionError("kind invalido aceito");}
        catch(IllegalArgumentException expected){count++;}
        System.out.println("PGS Notification Policy: "+count+"/"+count+" PASS");
    }
}
