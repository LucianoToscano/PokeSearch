package com.lucianotoscano.pokesearchoverlay;

/** Teste Java puro para o bloqueio de captura no diálogo PoGoCoordinates. */
public final class ProfileScreenshotPolicyTest {
    private static int checks=0;
    private static void check(String name,String purpose,String url,boolean ok,boolean expected){
        boolean actual=ProfileScreenshotPolicy.allowsScreenshot(purpose,url,ok);
        if(actual!=expected)
            throw new AssertionError(name+" esperado="+expected+", recebido="+actual);
        checks++;
    }
    public static void main(String[] args){
        check("perfil oficial","manage","https://pogocoordinates.com/profile",true,true);
        check("perfil com query","manage","https://pogocoordinates.com/profile?tab=accounts",true,true);
        check("perfil com hash","manage","https://pogocoordinates.com/profile#linked",true,true);
        check("perfil erro","manage","https://pogocoordinates.com/profile",false,false);
        check("login usa a mesma rota mas deve ficar protegido","login","https://pogocoordinates.com/profile",true,false);
        check("oauth Google","manage","https://accounts.google.com/o/oauth2/v2/auth",true,false);
        check("oauth Discord","manage","https://discord.com/oauth2/authorize",true,false);
        check("pagina de pesquisa","manage","https://pogocoordinates.com/search",true,false);
        check("outro caminho","manage","https://pogocoordinates.com/profile/settings",true,false);
        check("falso dominio sufixo","manage","https://pogocoordinates.com.example.org/profile",true,false);
        check("subdominio","manage","https://auth.pogocoordinates.com/profile",true,false);
        check("origem http","manage","http://pogocoordinates.com/profile",true,false);
        check("usuario embutido na URL","manage","https://user@pogocoordinates.com/profile",true,false);
        check("URL javascript","manage","javascript:alert(1)",true,false);
        check("URL nula","manage",null,true,false);
        check("URL malformada","manage","%%%://",true,false);
        check("estado desconhecido","unknown","https://pogocoordinates.com/profile",true,false);
        System.out.println("PROFILE SCREENSHOT POLICY: "+checks+"/"+checks+" PASS");
    }
}
