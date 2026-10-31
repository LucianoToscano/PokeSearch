package com.lucianotoscano.pokesearchoverlay;

/**
 * Pure Java IV evidence policy, shared by both OverlayService instances.
 * No Android dependency: the production policy is executed by JVM regression tests.
 * A filter setting never proves the data on an individual spawn.
 */
final class VerifiedIvMath {
    private static final String RAW="(?:[0-9]|1[0-5])/(?:[0-9]|1[0-5])/(?:[0-9]|1[0-5])";
    private static final String PERCENT="(?:0|[1-9][0-9]?|100)(?:[.,][0-9]{1,8})?";

    private VerifiedIvMath(){}

    static int canonicalPercent(int sum){
        return sum>=0&&sum<=45?Math.round(sum*100f/45f):-1;
    }

    static boolean matchesVerifiedPercent(double observed,int sum){
        if(!Double.isFinite(observed)||observed<0||observed>100||sum<0||sum>45)
            return false;
        double exact=sum*100d/45d;
        return Math.abs(observed-Math.round(exact))<0.0000001d||
            Math.abs(observed-Math.round(exact*10d)/10d)<0.0000001d||
            Math.abs(observed-Math.round(exact*100d)/100d)<0.0000001d||
            Math.abs(observed-exact)<=0.0001d;
    }

    static int verifiedPercent(String rawValue,String percentValue){
        String raw=rawValue==null?"":rawValue.trim();
        String pct=percentValue==null?"":percentValue.trim();
        int sum=-1;
        if(!raw.isEmpty()){
            if(!raw.matches(RAW))return -1;
            String[] stats=raw.split("/");
            sum=Integer.parseInt(stats[0])+Integer.parseInt(stats[1])+Integer.parseInt(stats[2]);
        }
        if(pct.isEmpty())return canonicalPercent(sum);
        if(!pct.matches(PERCENT))return -1;
        final double observed;
        try{observed=Double.parseDouble(pct.replace(',','.'));}
        catch(NumberFormatException bad){return -1;}
        if(sum>=0)return matchesVerifiedPercent(observed,sum)?canonicalPercent(sum):-1;
        for(int possible=0;possible<=45;possible++)
            if(matchesVerifiedPercent(observed,possible))return canonicalPercent(possible);
        return -1;
    }

    static boolean matchesCriteria(String mode,String raw,String pct,
        int attack,int defense,int stamina,int percentMin,int percentMax){
        int percent=verifiedPercent(raw,pct);
        if(percent<0)return false;
        if("iv".equals(mode))return percent==100;
        if("raw".equals(mode))
            return (attack+"/"+defense+"/"+stamina).equals(raw==null?"":raw.trim());
        if("percent".equals(mode))return percent>=percentMin&&percent<=percentMax;
        return false;
    }
}
