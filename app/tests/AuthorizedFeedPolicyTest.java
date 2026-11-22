package com.lucianotoscano.pokesearchoverlay;

/** Pure JVM test for manually authorized HTTPS source and viewport policy. */
public final class AuthorizedFeedPolicyTest {
    static void ok(boolean condition,String reason){
        if(!condition)throw new AssertionError(reason);
    }
    static void bad(Runnable command,String reason){
        boolean rejected=false;
        try {command.run();}catch(IllegalArgumentException expected){rejected=true;}
        ok(rejected,reason);
    }
    public static void main(String[] args){
        String https=AuthorizedFeedPolicy.baseUrl("https://scanner.example.org/");
        ok(https.equals("https://scanner.example.org"),"trailing slash removed");
        bad(()->AuthorizedFeedPolicy.baseUrl("http://scanner.example.org"),"https only");
        bad(()->AuthorizedFeedPolicy.baseUrl("https://bob:pass@scanner.example.org"),"no credentials in url");
        bad(()->AuthorizedFeedPolicy.baseUrl("https://scanner.example.org/?token=abc"),"no url query");
        bad(()->AuthorizedFeedPolicy.baseUrl("https://scanner.example.org/#secret"),"no fragment");
        bad(()->AuthorizedFeedPolicy.baseUrl("https://scanner.example.org/../other"),"no traversal");
        bad(()->AuthorizedFeedPolicy.validateToken("short"),"strong session token");
        bad(()->AuthorizedFeedPolicy.validateToken("verylongsecret-value-with-newline\n"),"no header injection");
        ok(AuthorizedFeedPolicy.validateToken("abcDEF1234567890abcDEF123456").length()==28,
            "valid per-session read token");
        PokeListApiPolicy.Query q=new PokeListApiPolicy.Query("pokemon",-23.55,-46.63,5,"25",100);
        String url=AuthorizedFeedPolicy.requestUrl(https,q);
        ok(url.startsWith("https://scanner.example.org/raw_data?pokemon=true"),"one known path");
        ok(url.contains("pokemon_id=25") && url.contains("iv_min=100"),"server-side filters");
        ok(!url.contains("secret") && !url.contains("token"),"no token in url");
        ok(url.contains("swLat=")&&url.contains("neLng="),"viewport provided");
        PokeListApiPolicy.Query many=new PokeListApiPolicy.Query("pokemon",-23.55,-46.63,5,"25,150",0);
        ok(!AuthorizedFeedPolicy.requestUrl(https,many).contains("pokemon_id="),
            "multiple species fall back to safe local allowlist");
        PokeListApiPolicy.Query raid=new PokeListApiPolicy.Query("raid",-23.55,-46.63,5,"",0);
        bad(()->AuthorizedFeedPolicy.requestUrl(https,raid),"no imaginary raid feed");
        PokeListApiPolicy.Query huge=new PokeListApiPolicy.Query("pokemon",-23.55,-46.63,200,"",0);
        bad(()->AuthorizedFeedPolicy.requestUrl(https,huge),"no false 200 km coverage");
        System.out.println("PASS AuthorizedFeedPolicy HTTPS and bounds checks");
    }
}
