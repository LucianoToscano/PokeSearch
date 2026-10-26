package com.lucianotoscano.pokesearchoverlay;

public class LocalBridgePagePolicyTest {
    private static void verify(boolean actual,boolean expected,String name){
        if(actual!=expected)throw new AssertionError(name+": expected "+expected+", got "+actual);
    }
    public static void main(String[] args){
        String[] allowed={
            "file:///android_asset/dock.html",
            "file:///android_asset/dock.html?controls=1",
            "file:///android_asset/dock.html?controls=1&popup=1",
            "file:///android_asset/dock.html?results=1",
            "file:///android_asset/detail.html"
        };
        for(String url:allowed)verify(LocalBridgePagePolicy.allows(url,
           url.contains("detail")?"detail.html":"dock.html"),true,url);
        String[] bad={
            "https://evil.example/dock.html","http://pogocoordinates.com/dock.html",
            "javascript:alert(1)","data:text/html,<script>alert(1)</script>",
            "content://example.provider/dock.html",
            "file:///android_asset/evil.html",
            "file:///android_asset/dock.html.evil",
            "file:///android_asset/dock.html%2F..%2Fsecret",
            "file:///android_asset/dock.html?results=1&trusted=false",
            "file:///android_asset/detail.html?controls=1",
            "file://remote/android_asset/dock.html",
            "file:///android_asset/../android_asset/dock.html",
            "not a url"
        };
        for(String url:bad){
            verify(LocalBridgePagePolicy.allows(url,"dock.html"),false,url);
            verify(LocalBridgePagePolicy.allows(url,"detail.html"),false,url);
        }
        verify(LocalBridgePagePolicy.allows("file:///android_asset/detail.html","dock.html"),false,"wrong page");
        verify(LocalBridgePagePolicy.allows(null,"dock.html"),false,"null");
        for(boolean home:new boolean[]{false,true})
            for(boolean primary:new boolean[]{false,true})
                for(boolean secondary:new boolean[]{false,true})
                    verify(PresenceWindowState.isActive(home,primary,secondary),
                      home||primary||secondary,"presence matrix");
        verify(PresenceWindowState.isActive(false,false,true),true,"P1 stops, P2 remains");
        verify(PresenceWindowState.isActive(false,true,false),true,"P2 stops, P1 remains");
        verify(PresenceWindowState.isActive(false,false,false),false,"both stopped");
        System.out.println("LT121 Java exact URL policy + presence matrix PASS");
    }
}
