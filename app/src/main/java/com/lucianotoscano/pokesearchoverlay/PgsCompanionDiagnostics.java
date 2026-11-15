package com.lucianotoscano.pokesearchoverlay;

import android.content.Context;
import android.content.pm.PackageInfo;
import android.content.pm.PackageManager;

/** Consulta pontual sob demanda, sem QUERY_ALL_PACKAGES nem API de terceiros. */
final class PgsCompanionDiagnostics {
    private PgsCompanionDiagnostics(){}
    static String status(Context context,PgsCompanionPolicy.Spec spec){
        if(context==null||spec==null)return "consulta indisponível";
        try{
            PackageInfo info=context.getPackageManager().getPackageInfo(spec.packageName,0);
            String version=PgsCompanionPolicy.safeVersion(info.versionName);
            return version.isEmpty()?"instalado":"instalado · v"+version;
        }catch(PackageManager.NameNotFoundException ignored){
            return "não detectado";
        }catch(RuntimeException unavailable){
            return "consulta indisponível";
        }
    }
}
