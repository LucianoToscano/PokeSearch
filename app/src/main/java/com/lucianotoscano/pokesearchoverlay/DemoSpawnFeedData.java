package com.lucianotoscano.pokesearchoverlay;

import java.util.ArrayList;

/**
 * Explicit OFFLINE presentation fixtures only. Every row is fictional:
 * never sent to a webhook, never attributed to a game scanner, never copied
 * as a real Pokémon location or silently mixed with source observations.
 */
final class DemoSpawnFeedData {
    private DemoSpawnFeedData(){}

    static PokeListFeedClient.Response generate(PokeListApiPolicy.Query q,long now) {
        if(!"pokemon".equals(q.type))
            throw new IllegalArgumentException("O modo demonstração inclui apenas aparições Pokémon fictícias.");
        ArrayList<PokeListFeedClient.Item> rows=new ArrayList<>();
        int[] dex={25,133,150,443,669,1,4,7};
        String[] names={"Pikachu","Eevee","Mewtwo","Gible","Flabébé",
                "Bulbasaur","Charmander","Squirtle"};
        int[] iv={100,91,82,-1,100,0,98,100};
        int[] cp={560,812,2300,418,790,365,900,672};
        int[] level={22,29,40,-1,30,12,31,28};
        // Keep fixtures inside the entered radius. Point locations and
        // encounter IDs change with the test center and are NEVER spawns.
        double delta=Math.min(q.distance,5)*0.004;
        for(int i=0;i<dex.length;i++){
            double dLat=(i%4-1.5)*delta/3.0;
            double dLon=(i/4==0?1:-1)*delta*0.30;
            double lat=Math.max(-89.99,Math.min(89.99,q.latitude+dLat));
            double lon=Math.max(-179.99,Math.min(179.99,q.longitude+dLon));
            long expires=now+(7+i*4)*60000L;
            rows.add(new PokeListFeedClient.Item("DEMO-"+i,names[i],"",
                "","DADOS FICTÍCIOS · NÃO SÃO SPAWNS REAIS","","",false,
                dex[i],iv[i],cp[i],level[i],lat,lon,true,true,expires));
        }
        return new PokeListFeedClient.Response(rows,0,0,rows.size());
    }
}
