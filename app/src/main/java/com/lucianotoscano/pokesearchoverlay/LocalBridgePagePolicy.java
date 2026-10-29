package com.lucianotoscano.pokesearchoverlay;

import java.net.URI;

/** Fail-closed main-frame navigation guard for local WebViews exposing Native. */
final class LocalBridgePagePolicy {
    private LocalBridgePagePolicy(){}
    static boolean allows(String url,String expectedPage){
        if(url==null||expectedPage==null)return false;
        if(!"dock.html".equals(expectedPage)&&!"detail.html".equals(expectedPage))
            return false;
        try{
            URI uri=URI.create(url);
            if(uri.getRawFragment()!=null||uri.getRawUserInfo()!=null||uri.getPort()!=-1)return false;
            boolean original="file".equals(uri.getScheme()) &&
                uri.getRawAuthority()==null &&
                ("/android_asset/"+expectedPage).equals(uri.getRawPath());
            boolean ota="https".equals(uri.getScheme()) &&
                "appassets.androidplatform.net".equals(uri.getRawAuthority()) &&
                ("/assets/"+expectedPage).equals(uri.getRawPath());
            if(!original&&!ota)return false;
            String query=uri.getRawQuery();
            if("detail.html".equals(expectedPage))return query==null;
            return query==null||"controls=1".equals(query)||
                "controls=1&popup=1".equals(query)||"results=1".equals(query);
        }catch(IllegalArgumentException error){
            return false;
        }
    }
}
