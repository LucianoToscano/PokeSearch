package com.lucianotoscano.pokesearchoverlay;

public final class PgsAutoHostPolicyTest {
    private static void check(boolean valid,String name){
        if(!valid)throw new AssertionError(name);
    }
    public static void main(String[] args){
        check("pgsharp".equals(PgsAutoHostPolicy.profile(null)),"legacy null migrates");
        check("pgsharp".equals(PgsAutoHostPolicy.profile("  ")),"legacy blank migrates");
        check("pokemod".equals(PgsAutoHostPolicy.profile("POKEMOD")),"profile normalized");
        check("other".equals(PgsAutoHostPolicy.profile("unknown")),"unknown fails closed");
        check(PgsAutoHostPolicy.isGameWindow("com.nianticlabs.pokemongo"),"game window");
        check(!PgsAutoHostPolicy.isGameWindow("com.pokemod.app.public"),"injector is not game");
        check(PgsAutoHostPolicy.isManagerWindow("com.pokemod.app.public"),"manager identity");
        check(!PgsAutoHostPolicy.templateBelongsTo("pgsharp","pokemod"),"no cross-host sprite");
        check(PgsAutoHostPolicy.templateBelongsTo("pokemod","pokemod"),"same host sprite");
        check(!PgsAutoHostPolicy.mayAutoTap("other",true,true,true),"other preview only");
        check(!PgsAutoHostPolicy.mayAutoTap("pokemod",false,true,true),"game not visible");
        check(!PgsAutoHostPolicy.mayAutoTap("pokemod",true,false,true),"warning blocks");
        check(!PgsAutoHostPolicy.mayAutoTap("pokemod",true,true,false),"no own template");
        check(PgsAutoHostPolicy.mayAutoTap("pokemod",true,true,true),"calibrated game only");
        check("PM".equals(PgsAutoHostPolicy.shortLabel("pokemod")),"menu label");
        System.out.println("LT359 multihost policy 15/15 PASS");
    }
}
