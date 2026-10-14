package com.lucianotoscano.pokesearchoverlay;

/** Standalone, Android-free regression suite; run with javac + java in CI. */
public final class DiagnosticSanitizerTest {
    private static int count=0;
    private static void check(boolean condition,String reason){
        count++;
        if(!condition)throw new AssertionError("Sanitizer: "+reason);
    }
    private static void masks(String input,String hidden){
        String output=DiagnosticSanitizer.clean(input);
        check(!output.contains(hidden),"leaked forbidden input: "+hidden);
        check(output.contains("[") && output.contains("omitid"),"missing redaction marker");
    }
    public static void main(String[] args){
        check("RESULTS | 5 válidos".equals(DiagnosticSanitizer.clean("RESULTS | 5 válidos")),"normal logs unchanged");
        masks("password=MyLongPassword123","MyLongPassword123");
        masks("senha: 'uma senha secreta'","uma senha secreta");
        masks("access_token=abcDEF123456","abcDEF123456");
        masks("refresh-token: ZXCV0987654321","ZXCV0987654321");
        masks("api_key=ABCDEFGHIJ","ABCDEFGHIJ");
        masks("Authorization: Bearer HelloVeryPrivateToken","HelloVeryPrivateToken");
        masks("Cookie: session=private; other=secret","private");
        masks("Bearer ABCDEFGHIJKL","ABCDEFGHIJKL");
        masks("Visit https://pogocoordinates.com/search?token=private123","private123");
        masks("abc@example.com","abc@example.com");
        masks("1234 5678 9012","1234 5678 9012");
        masks("-23.5505,-46.6333","-23.5505,-46.6333");
        masks("+23.5505, -46.6333","+23.5505, -46.6333");
        check(!DiagnosticSanitizer.clean("first\nsecond").contains("\n"),"actual newline removed");
        check(DiagnosticSanitizer.clean("texto \\n literal").contains("\\n"),"literal backslash-n preserved");
        check(DiagnosticSanitizer.clean("X".repeat(500)).length()==220,"field bounded");
        check(DiagnosticSanitizer.clean(null).isEmpty(),"null is safe");
        System.out.println("DiagnosticSanitizer: "+count+" assertions passed");
    }
}
