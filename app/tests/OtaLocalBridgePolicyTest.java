package com.lucianotoscano.pokesearchoverlay;

public final class OtaLocalBridgePolicyTest {
    private static void yes(String url,String expected){
        if(!LocalBridgePagePolicy.allows(url,expected))
            throw new AssertionError("Rejected trusted local URI: "+url);
    }
    private static void no(String url,String expected){
        if(LocalBridgePagePolicy.allows(url,expected))
            throw new AssertionError("Accepted untrusted URI: "+url);
    }
    public static void main(String[] args){
        yes("https://appassets.androidplatform.net/assets/dock.html","dock.html");
        yes("https://appassets.androidplatform.net/assets/dock.html?results=1","dock.html");
        yes("https://appassets.androidplatform.net/assets/dock.html?controls=1&popup=1","dock.html");
        yes("https://appassets.androidplatform.net/assets/detail.html","detail.html");
        no("https://appassets.androidplatform.net.evil.invalid/assets/dock.html","dock.html");
        no("http://appassets.androidplatform.net/assets/dock.html","dock.html");
        no("https://appassets.androidplatform.net/other/dock.html","dock.html");
        no("https://appassets.androidplatform.net/assets/dock.html?admin=1","dock.html");
        no("https://appassets.androidplatform.net/assets/detail.html?results=1","detail.html");
        no("https://appassets.androidplatform.net/assets/dock.html#fake","dock.html");
        no("https://evil.invalid/assets/dock.html","dock.html");
        no("https://appassets.androidplatform.net/assets/%64ock.html","dock.html");
        no("https://appassets.androidplatform.net/assets/../assets/dock.html","dock.html");
        System.out.println("LT173 OTA bridge origin security: OK");
    }
}
