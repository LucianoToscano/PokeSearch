package com.lucianotoscano.pokesearchoverlay;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;

public final class PgsAutoModelSelectionPolicyTest {
    private static void eq(boolean v,String why){if(!v)throw new AssertionError(why);}
    public static void main(String[] args){
        List<Integer> all=new ArrayList<>();
        for(int i=1;i<=1025;i++)all.add(i);
        List<Integer> selected=PgsAutoModelSelectionPolicy.selectedOnly(all,10);
        eq(selected.size()==10&&selected.get(0)==1&&selected.get(9)==10,
            "1025 species indexed but only ten active per scan");
        eq(PgsAutoModelSelectionPolicy.selectedOnly(
            Arrays.asList(376,376,null,-1,25,1025),10)
                .equals(Arrays.asList(376,25,1025)),
            "IDs deduplicated in stable priority order");
        eq(PgsAutoModelSelectionPolicy.selectedOnly(all,0).isEmpty(),
            "zero active filter never triggers templates");
        eq(PgsAutoModelSelectionPolicy.selectedOnly(Collections.emptyList(),10).isEmpty(),
            "empty filter never triggers templates");
        System.out.println("LT356: all species in index, ten active per scan, stable priority PASS");
    }
}
