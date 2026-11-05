package com.lucianotoscano.pokesearchoverlay;
public final class TopPvpAlertPolicyTest {
    public static void main(String[] args){
        for(String l:new String[]{"gl","ul"}){
            for(int threshold:new int[]{1,5,10}){
                require(TopPvpAlertPolicy.eligible(l,threshold,threshold,true,true));
                require(!TopPvpAlertPolicy.eligible(l,threshold,threshold+1,true,true));
                require(!TopPvpAlertPolicy.eligible(l,threshold,threshold,false,true));
                require(!TopPvpAlertPolicy.eligible(l,threshold,threshold,true,false));
            }
        }
        for(String l:new String[]{"iv","raw","percent","ml",null}){
            require(!TopPvpAlertPolicy.eligible(l,10,1,true,true));
        }
        for(int limit:new int[]{0,-1,2,50,100}){
            require(!TopPvpAlertPolicy.eligible("gl",limit,1,true,true));
        }
        for(int rank:new int[]{-1,0,999999}){
            require(!TopPvpAlertPolicy.eligible("gl",10,rank,true,true));
        }
        System.out.println("LT240 Top PvP alert policy PASS");
    }
    private static void require(boolean v){if(!v)throw new AssertionError();}
}
