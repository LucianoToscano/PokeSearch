package com.lucianotoscano.pokesearchoverlay;

import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashSet;
import java.util.List;

/** Limita o processamento aos filtros ativos, sem perder o índice global. */
final class PgsAutoModelSelectionPolicy {
    private PgsAutoModelSelectionPolicy(){}
    static List<Integer> selectedOnly(List<Integer> requested,int maxSelected){
        if(requested==null||requested.isEmpty()||maxSelected<=0)
            return Collections.emptyList();
        LinkedHashSet<Integer> unique=new LinkedHashSet<>();
        for(Integer id:requested){
            if(id==null||id<=0)continue;
            unique.add(id);
            if(unique.size()>=maxSelected)break;
        }
        return new ArrayList<>(unique);
    }
}
