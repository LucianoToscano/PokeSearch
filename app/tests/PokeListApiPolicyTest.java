package com.lucianotoscano.pokesearchoverlay;
public final class PokeListApiPolicyTest {
    private static void assertTrue(boolean good,String why){if(!good)throw new AssertionError(why);}
    private static void bad(Runnable r,String why){
        try{r.run();throw new AssertionError("Accepted: "+why);}
        catch(IllegalArgumentException ok){}
    }
    public static void main(String[] args){
        for(String type:PokeListApiPolicy.TYPES){
            String url=new PokeListApiPolicy.Query(type,-5.915,-35.205,50,"25, 150,25",90)
                .url(1763190000000L);
            assertTrue(url.startsWith("https://moonani.com/PokeList/api.v2.php?type="+type),
                "fixed HTTPS host and exact type");
            assertTrue(url.contains("mons=25,150"),"stable dedup");
            assertTrue(url.contains("lat=-5.915000&lng=-35.205000"),"root locale");
            if(!"pokemon".equals(type))assertTrue(!url.contains("ivMin"),
                "No Pokémon-only filter on other sources");
        }
        bad(()->new PokeListApiPolicy.Query("http://evil",-1,2,20,"",0),"type");
        bad(()->new PokeListApiPolicy.Query("pokemon",91,0,20,"",0),"lat");
        bad(()->new PokeListApiPolicy.Query("pokemon",0,-181,20,"",0),"lon");
        bad(()->new PokeListApiPolicy.Query("pokemon",0,0,201,"",0),"radius");
        bad(()->new PokeListApiPolicy.Query("pokemon",0,0,1,"1&lat=90",0),"injection");
        bad(()->new PokeListApiPolicy.Query("pokemon",0,0,1,"1,,2",0),"empty id");
        bad(()->new PokeListApiPolicy.Query("pokemon",0,0,1,"1",101),"IV");
        assertTrue(PokeListApiPolicy.mustStop(401)&&PokeListApiPolicy.mustStop(403),
            "never retry authentication/permission");
        assertTrue(PokeListApiPolicy.backoffMillis(429,"120")==120000L,"retry-after");
        assertTrue(PokeListApiPolicy.backoffMillis(429,"garbage")==60000L,"safe fallback");
        long t=1763190000000L;
        assertTrue(!PokeListApiPolicy.expired(1763190600,t),"seconds future");
        assertTrue(PokeListApiPolicy.expired(1763180000,t),"seconds expired");
        assertTrue(!PokeListApiPolicy.expired(1763190600000L,t),"ms future");
        assertTrue(PokeListApiPolicy.expired(22,t),"unverifiable end timestamp");
        assertTrue(!PokeListApiPolicy.safeLabel("a\nb").contains("\n"),"clean untrusted text");
        System.out.println("LT364 PokeList HTTPS query, injection, TTL and backoff PASS");
    }
}
