package com.lucianotoscano.pokesearchoverlay;

public final class PgsAutoWatchUiPolicyTest {
    private static void check(boolean pass,String description){
        if(!pass)throw new AssertionError(description);
    }
    private static String state(boolean enabled,boolean connected,
            boolean watching,boolean model,boolean safe,boolean found){
        return PgsAutoWatchUiPolicy.resolve(enabled,connected,watching,model,safe,found);
    }
    public static void main(String[] args){
        check("off".equals(state(false,false,false,false,false,false)),
            "off by default, even without permission");
        check("permission".equals(state(true,false,false,false,false,false)),
            "enabled preference does not imply running Accessibility");
        check("no_model".equals(state(true,true,false,false,false,false)),
            "model absence is explicit");
        check("paused".equals(state(true,true,true,true,false,false)),
            "background or warning pauses");
        check("paused".equals(state(true,true,false,true,true,false)),
            "preference is not active scanner");
        check("observing".equals(state(true,true,true,true,true,false)),
            "watching is not an automatic gesture");
        check("found".equals(state(true,true,true,true,true,true)),
            "only confirmed presence reports found");
        check("pausado".equals(PgsAutoWatchUiPolicy.label("paused")),
            "Portuguese compact state label");
        System.out.println("LT362 independent passive watch UI states PASS");
    }
}
