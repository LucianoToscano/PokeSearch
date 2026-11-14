package com.lucianotoscano.pokesearchoverlay;

/** Capturas liberadas em todas as páginas do PokeSearch — LT343. */
public final class ProfileScreenshotPolicyTest {
    private static int checks=0;
    private static void check(String label,String purpose,String url,boolean loaded){
        if(!ProfileScreenshotPolicy.allowsScreenshot(purpose,url,loaded))
            throw new AssertionError("Screenshot bloqueado: "+label);
        checks++;
    }
    public static void main(String[] args){
        check("perfil","manage","https://pogocoordinates.com/profile",true);
        check("login","login","https://pogocoordinates.com/search",false);
        check("Google OAuth","login","https://accounts.google.com",true);
        check("Discord OAuth","login","https://discord.com",true);
        check("falha de carregamento","login","https://pogocoordinates.com/search",false);
        check("URL desconhecida","unknown",null,false);
        System.out.println("SCREENSHOTS PERMITIDOS: "+checks+"/"+checks+" PASS");
    }
}
