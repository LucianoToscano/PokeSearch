package com.lucianotoscano.pokesearchoverlay;

import android.content.Context;
import android.content.pm.PackageManager;

/** Perfil de interface selecionado pelo usuário, separado de contas e filtros. */
final class PgsAutoHostSettings {
    private static final String PREF="pgs_auto_host_v1",KEY="profile";
    private PgsAutoHostSettings(){}
    static String current(Context context){
        return PgsAutoHostPolicy.profile(
            context.getSharedPreferences(PREF,Context.MODE_PRIVATE)
                .getString(KEY,PgsAutoHostPolicy.PGSHARP));
    }
    static void select(Context context,String profile){
        context.getSharedPreferences(PREF,Context.MODE_PRIVATE).edit()
            .putString(KEY,PgsAutoHostPolicy.profile(profile)).apply();
    }
    static boolean pokemodManagerInstalled(Context context){
        try{
            context.getPackageManager().getPackageInfo(
                PgsAutoHostPolicy.POKEMOD_MANAGER,0);
            return true; // instalado != injetado nem jogo em primeiro plano
        }catch(PackageManager.NameNotFoundException absent){return false;}
        catch(RuntimeException unavailable){return false;}
    }
}
