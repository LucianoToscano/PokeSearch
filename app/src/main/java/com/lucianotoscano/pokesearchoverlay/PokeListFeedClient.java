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
 * LT364: interface HTTPS da API PokeList declarada autorizada pelo usuário.
 * Sem automação de toques, consultas periódicas, localização do dispositivo,
 * cookies, cabeçalhos de login, redirecionamentos ou acesso a outros processos.
 */
final class PokeListFeedClient {
    static final class Item {
        final String name,id,form,kind,extra,gender,country;
        final boolean shinyIndicated;
        final int number,iv,cp,level;
        final double latitude,longitude;
        final boolean hasCoordinates,expiryKnown;
        final long expiresAt;
        Item(String id,String name,String form,String kind,String extra,
             String gender,String country,boolean shinyIndicated,
             int number,int iv,int cp,int level,double lat,double lng,
             boolean hasCoordinates,boolean expiryKnown,long expiresAt){
            this.id=id;this.name=name;this.form=form;this.kind=kind;this.extra=extra;
            this.gender=gender;this.country=country;
            this.shinyIndicated=shinyIndicated;
            this.number=number;this.iv=iv;this.cp=cp;this.level=level;
            this.latitude=lat;this.longitude=lng;this.hasCoordinates=hasCoordinates;
            this.expiryKnown=expiryKnown;this.expiresAt=expiresAt;
        }
    }
    static final class Response {
        final ArrayList<Item> items;
        final int expired,invalid,sourceCount;
        Response(ArrayList<Item> items,int expired,int invalid,int sourceCount){
            this.items=items;this.expired=expired;this.invalid=invalid;
            this.sourceCount=sourceCount;
        }
    }
    static final class ApiError extends IOException {
        final int httpCode;
        final long waitMs;
        ApiError(int code,String message,long waitMs){
            super(message);this.httpCode=code;this.waitMs=waitMs;
        }
    }

    static Response fetch(PokeListApiPolicy.Query query) throws IOException,JSONException{
        HttpsURLConnection conn=null;
        try{
            URL url=new URL(query.url(System.currentTimeMillis()));
            if(!"https".equals(url.getProtocol())||
               !"moonani.com".equals(url.getHost())||
               !"/PokeList/api.v2.php".equals(url.getPath()))
                throw new IOException("Origem não autorizada pela política da API");
            conn=(HttpsURLConnection)url.openConnection();
            conn.setInstanceFollowRedirects(false);
            conn.setRequestMethod("GET");
            conn.setRequestProperty("Accept","application/json");
            conn.setRequestProperty("Cache-Control","no-cache");
            conn.setConnectTimeout(10000);
            conn.setReadTimeout(10000);
            final int code=conn.getResponseCode();
            if(code!=200){
                long wait=PokeListApiPolicy.backoffMillis(code,conn.getHeaderField("Retry-After"));
                String reason=(code==401||code==403)?"Acesso negado pelo provedor":
                    code==429?"Limite de consultas do provedor":
                    code>=300&&code<400?"Redirecionamento recusado":
                    code>=500?"Servidor temporariamente indisponível":"HTTP "+code;
                throw new ApiError(code,reason,wait);
            }
            ByteArrayOutputStream buffer=new ByteArrayOutputStream(16*1024);
            try(InputStream stream=conn.getInputStream()){
                byte[] b=new byte[8192];
                int n;
                while((n=stream.read(b))!=-1){
                    if(buffer.size()+n>PokeListApiPolicy.MAX_BODY_BYTES)
                        throw new IOException("Resposta excede o limite seguro de 512 KB");
                    buffer.write(b,0,n);
                }
            }
            JSONObject root=new JSONObject(new String(buffer.toByteArray(),
                StandardCharsets.UTF_8));
            JSONArray list=root.optJSONArray("pokemons");
            if(list==null)throw new JSONException(
                "Resposta PokeList sem lista pokemons[]");
            ArrayList<Item> result=new ArrayList<>();
            HashSet<String> seen=new HashSet<>();
            long now=System.currentTimeMillis();
            int expired=0,invalid=0;
            int inspected=Math.min(list.length(),500);
            for(int i=0;i<inspected;i++){
                JSONObject record=list.optJSONObject(i);
                if(record==null){invalid++;continue;}
                String id=PokeListApiPolicy.safeLabel(record.optString("id",""));
                if(id.isEmpty()||id.length()>64||!seen.add(id)){invalid++;continue;}
                String name=PokeListApiPolicy.safeLabel(record.optString("name",""));
                if(name.isEmpty())name="Espécie "+record.optInt("number",0);
                int number=record.optInt("number",0);
                int iv=record.optInt("iv",-1);
                int cp=record.optInt("cp",-1);
                int level=record.optInt("level",-1);
                if(number<0||number>99999||iv>100||iv< -1||cp>100000||
                   cp< -1||level>100||level< -1){invalid++;continue;}
                long rawEnd=record.optLong("endTime",0);
                if(PokeListApiPolicy.expired(rawEnd,now)){expired++;continue;}
                long expiry=PokeListApiPolicy.epochMilliseconds(rawEnd);
                boolean expiryKnown=expiry>=0;
                double lat=record.optDouble("latitude",Double.NaN),
                       lng=record.optDouble("longitude",Double.NaN);
                boolean coordinate=Double.isFinite(lat)&&lat>=-90&&lat<=90&&
                    Double.isFinite(lng)&&lng>=-180&&lng<=180;
                String form=PokeListApiPolicy.safeLabel(record.optString("form",""));
                String kind=PokeListApiPolicy.safeLabel(record.optString("rocket_type",""));
                String extra=PokeListApiPolicy.safeLabel(record.optString("quest",""));
                // Optional fields; no gender/flag/shiny inferred when absent.
                String gender=PokeListResultPolicy.genderLabel(
                    record.optString("gender",""));
                String country=PokeListResultPolicy.countryLabel(
                    record.optString("country",""));
                boolean shinyHint=record.optBoolean("shiny",false);
                result.add(new Item(id,name,form,kind,extra,gender,country,shinyHint,
                    number,iv,cp,level,
                    lat,lng,coordinate,expiryKnown,expiry));
                if(result.size()>=PokeListApiPolicy.MAX_VISIBLE)break;
            }
            return new Response(result,expired,invalid,list.length());
        }finally{if(conn!=null)conn.disconnect();}
    }
}
