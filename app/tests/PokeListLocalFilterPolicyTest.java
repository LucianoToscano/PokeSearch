package com.lucianotoscano.pokesearchoverlay;

public final class PokeListLocalFilterPolicyTest {
    private static void check(boolean okay,String msg){
        if(!okay)throw new AssertionError(msg);
    }
    private static void bad(Runnable test,String msg){
        boolean thrown=false;
        try{test.run();}catch(IllegalArgumentException expected){thrown=true;}
        check(thrown,msg);
    }
    public static void main(String[] args){
        long now=1763830800000L, future=now+600000L;
        PokeListLocalFilterPolicy.Criteria broad=new PokeListLocalFilterPolicy.Criteria(
            "pokemon","",0,"",0,0,false,false);
        check(broad.accepts(25,"Pikachu",-1,-1,-1,true,false,0,now),
            "Unknown stats must remain visible to broad filters");
        PokeListLocalFilterPolicy.Criteria precise=new PokeListLocalFilterPolicy.Criteria(
            "pokemon","25",90,"#025",500,20,false,true);
        check(precise.accepts(25,"Pikachu",100,550,25,true,true,future,now),
            "A qualifying spawn must match every chosen field");
        check(!precise.accepts(133,"Eevee",100,550,25,true,true,future,now),
            "Provider ignores requested species: reject locally");
        check(!precise.accepts(25,"Pikachu",-1,550,25,true,true,future,now),
            "Strict IV does not accept missing IV");
        check(!precise.accepts(25,"Pikachu",100,-1,25,true,true,future,now),
            "Strict CP does not accept missing CP");
        check(!precise.accepts(25,"Pikachu",100,550,-1,true,true,future,now),
            "Strict level does not accept missing level");
        check(!precise.accepts(25,"Pikachu",100,550,25,false,true,future,now),
            "Coordinate-only mode checks coordinate presence");
        check(!precise.accepts(25,"Pikachu",100,550,25,true,true,now,now),
            "Expired spawns are not rendered");
        PokeListLocalFilterPolicy.Criteria names=new PokeListLocalFilterPolicy.Criteria(
            "pokemon","",0,"Flabébe",0,0,false,false);
        check(names.accepts(669,"Flabébé",80,800,10,true,false,0,now),
            "Accent insensitive name search");
        PokeListLocalFilterPolicy.Criteria hundo=new PokeListLocalFilterPolicy.Criteria(
            "pokemon","",0,"",0,0,true,false);
        check(!hundo.accepts(25,"Pikachu",99,1000,25,true,false,0,now),
            "IV100 is an exact match");
        check(hundo.accepts(25,"Pikachu",100,1000,25,true,false,0,now),
            "IV100 matches known 100");
        PokeListLocalFilterPolicy.Criteria raids=new PokeListLocalFilterPolicy.Criteria(
            "raid","",100,"",0,0,true,false);
        check(raids.accepts(25,"Raid Pikachu",-1,-1,-1,true,false,0,now),
            "Pokemon-only IV rules never hide unrelated raid results");
        bad(()->new PokeListLocalFilterPolicy.Criteria("pokemon","25",0,"",20001,0,false,false),"CP cap");
        bad(()->new PokeListLocalFilterPolicy.Criteria("pokemon","",0,"",0,56,false,false),"level cap");
        System.out.println("PASS PokeListRadar local UI criteria; missing source fields stay unknown");
    }
}
