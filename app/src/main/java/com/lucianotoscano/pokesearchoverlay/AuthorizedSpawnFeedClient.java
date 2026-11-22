package com.lucianotoscano.pokesearchoverlay;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.HashSet;
import javax.net.ssl.HttpsURLConnection;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

/**
 * Real, manual HTTPS adapter for an operator's authorized Golbat webhook
 * gateway. The parser consumes observations actually returned by that server;
 * unknown IV, shiny, expiration and Pokémon levels are never fabricated.
 */
final class AuthorizedSpawnFeedClient {
    private AuthorizedSpawnFeedClient(){}

    static PokeListFeedClient.Response fetch(PokeListApiPolicy.Query query,
                                            String configuredBase, String secret)
            throws IOException,JSONException {
        String target=AuthorizedFeedPolicy.requestUrl(configuredBase,query);
        String token=AuthorizedFeedPolicy.validateToken(secret);
        HttpsURLConnection conn=null;
        try {
            URL address=new URL(target);
            conn=(HttpsURLConnection)address.openConnection();
            conn.setInstanceFollowRedirects(false);
            conn.setConnectTimeout(10000);
            conn.setReadTimeout(12000);
            conn.setRequestMethod("GET");
            conn.setRequestProperty("Accept","application/json");
            conn.setRequestProperty("Cache-Control","no-store");
            conn.setRequestProperty("X-Feed-Secret",token);
            int status=conn.getResponseCode();
            if(status!=200) {
                String detail=status==401||status==403
                    ? "Servidor recusou a chave de leitura. Confirme com seu operador."
                    : status==429 ? "Servidor limitou consultas; aguarde."
                    : status>=300&&status<400
                      ? "Redirecionamento não permitido para proteger a chave."
                      : "Servidor HTTPS retornou HTTP "+status;
                throw new PokeListFeedClient.ApiError(status,detail,
                    PokeListApiPolicy.backoffMillis(status,conn.getHeaderField("Retry-After")));
            }
            ByteArrayOutputStream bytes=new ByteArrayOutputStream(16384);
            try(InputStream stream=conn.getInputStream()) {
                byte[] tmp=new byte[8192];
                int n;
                while((n=stream.read(tmp))!=-1) {
                    if(bytes.size()+n>PokeListApiPolicy.MAX_BODY_BYTES)
                        throw new IOException("Resposta do gateway excedeu 512 KB.");
                    bytes.write(tmp,0,n);
                }
            }
            return parse(new JSONObject(new String(bytes.toByteArray(),StandardCharsets.UTF_8)),
                         System.currentTimeMillis());
        }finally {
            if(conn!=null)conn.disconnect();
        }
    }

    static PokeListFeedClient.Response parse(JSONObject root,long now) throws JSONException {
        if(root==null)throw new JSONException("Resposta vazia do gateway");
        if(root.optBoolean("demo",false))
            throw new JSONException("O servidor marcou a fonte como demonstrativa, não como live");
        JSONArray raw=root.optJSONArray("pokemons");
        if(raw==null)throw new JSONException("O gateway não enviou pokemons[]");
        ArrayList<PokeListFeedClient.Item> entries=new ArrayList<>();
        HashSet<String> seen=new HashSet<>();
        int invalid=0,expired=0;
        for(int i=0;i<Math.min(raw.length(),1000);i++) {
            JSONObject row=raw.optJSONObject(i);
            if(row==null){invalid++;continue;}
            int dex=readInteger(row,"pokemon_id",1,1025);
            double lat=row.optDouble("latitude",Double.NaN),
                   lon=row.optDouble("longitude",Double.NaN);
            if(dex<1||!Double.isFinite(lat)||!Double.isFinite(lon)
                    ||lat< -90||lat>90||lon< -180||lon>180
                    ||(lat==0&&lon==0)){invalid++;continue;}
            long expire=timestamp(row.opt("disappear_time"));
            if(expire<0){invalid++;continue;}
            if(expire<=now){expired++;continue;}
            String id=PokeListApiPolicy.safeLabel(row.optString("encounter_id",""));
            if(id.isEmpty()||id.length()>64){invalid++;continue;}
            if(!seen.add(id)){invalid++;continue;}
            int attack=readInteger(row,"individual_attack",0,15);
            int defense=readInteger(row,"individual_defense",0,15);
            int stamina=readInteger(row,"individual_stamina",0,15);
            int iv=attack>=0&&defense>=0&&stamina>=0
                ? (int)Math.round(100.0*(attack+defense+stamina)/45.0) : -1;
            int cp=readInteger(row,"cp",0,20000);
            int level=readInteger(row,"level",1,55);
            if(level<0) level=readInteger(row,"pokemon_level",1,55);
            String source=PokeListApiPolicy.safeLabel(row.optString("source_id",""));
            String displayName=PokeListApiPolicy.safeLabel(row.optString("pokemon_name",""));
            if(displayName.isEmpty())displayName="#"+dex;
            String form=row.has("form")&&!row.isNull("form")
                ? PokeListApiPolicy.safeLabel(row.optString("form","")) : "";
            String evidence=source.isEmpty()
                ? "Feed autorizado · IV confirmado somente com 3 atributos"
                : "Origem "+source+" · IV confirmado somente com 3 atributos";
            entries.add(new PokeListFeedClient.Item(id,displayName,form,
                "",evidence,"","",false,dex,iv,cp,level,
                lat,lon,true,true,expire));
            if(entries.size()>=PokeListApiPolicy.MAX_VISIBLE)break;
        }
        return new PokeListFeedClient.Response(entries,expired,invalid,raw.length());
    }

    private static int readInteger(JSONObject row,String key,int lo,int hi) {
        if(!row.has(key)||row.isNull(key))return -1;
        Object raw=row.opt(key);
        if(!(raw instanceof Number))return -1;
        double n=((Number)raw).doubleValue();
        return Double.isFinite(n)&&n>=lo&&n<=hi&&Math.floor(n)==n ? (int)n : -1;
    }

    /** Golbat bridge uses Unix milliseconds. Seconds require explicit support. */
    private static long timestamp(Object raw) {
        if(!(raw instanceof Number))return -1;
        double d=((Number)raw).doubleValue();
        if(!Double.isFinite(d)||d<1_000_000_000_000d||d>9_999_999_999_999d
                ||Math.floor(d)!=d)return -1;
        return (long)d;
    }
}
