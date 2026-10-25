package com.lucianotoscano.pokesearchoverlay;
public final class VersionNamesTest {
    private static int checks=0;
    private static void check(String message,boolean condition){
        if(!condition)throw new AssertionError(message);
        System.out.println("PASS LT107 VERSION "+message);checks++;
    }
    public static void main(String[] args){
        check("99 remains 0.00.99","0.00.99".equals(VersionNames.canonical("0.00.99")));
        for(int i=100;i<=106;i++){
            String legacy="0.00."+i;
            String corrected=String.format(java.util.Locale.ROOT,"0.01.%02d",i-100);
            check(legacy+" becomes "+corrected,corrected.equals(VersionNames.canonical(legacy)));
            check(legacy+" historical only",VersionNames.isLegacyPublished(legacy));
        }
        check("107 becomes 0.01.07","0.01.07".equals(VersionNames.canonical("0.00.107")));
        check("200 becomes 0.02.00","0.02.00".equals(VersionNames.canonical("0.00.200")));
        check("new correct version accepted",VersionNames.isCanonical("0.01.06"));
        check("new malformed version rejected",!VersionNames.isCanonical("0.00.106"));
        check("never claim future malformed 0.00.107 as historical",!VersionNames.isLegacyPublished("0.00.107"));
        check("already canonical is stable","0.01.07".equals(VersionNames.canonical("0.01.07")));
        System.out.println("VersionNames: "+checks+"/"+checks+" PASS");
    }
}
