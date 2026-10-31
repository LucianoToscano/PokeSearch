package com.lucianotoscano.pokesearchoverlay;

import android.app.Activity;
import android.app.AlertDialog;
import android.content.Intent;
import android.media.projection.MediaProjectionManager;
import android.os.Bundle;
import android.os.Build;
import android.widget.Toast;

/**
 * Transparent-ish one-shot entry point. Android's own screen-sharing picker
 * grants EACH projection session. No silent restart/auto-grant on boot.
 */
public final class CandyCaptureConsentActivity extends Activity {
    private static final int REQUEST=9717;
    private boolean requested=false;

    @Override public void onCreate(Bundle state){
        super.onCreate(state);
        if(state!=null)requested=state.getBoolean("requested",false);
        if(!getSharedPreferences("rare_candy_overlay",MODE_PRIVATE)
                .getBoolean("candyAutoPickupOptIn",false)){
            finish();return;
        }
        if(requested)return;
        new AlertDialog.Builder(this)
            .setTitle("Detectar Doce Raro na tela")
            .setMessage("O Android pedirá autorização para compartilhar a tela. "+
                "O PokeSearch analisa somente a faixa superior no aparelho, "+
                "para procurar 'Item encontrado! DOCE RARO' e a sprite colorida. "+
                "Nenhuma imagem é salva ou enviada. "+
                "A captura fica indicada em uma notificação e pode ser interrompida. "+
                "Se a detecção falhar, use o botão ✓ Peguei normalmente.")
            .setNegativeButton("Cancelar",(d,w)->abort())
            .setOnCancelListener(d->abort())
            .setPositiveButton("Continuar",(d,w)->requestProjection())
            .show();
    }

    private void abort(){
        getSharedPreferences("rare_candy_overlay",MODE_PRIVATE).edit()
            .putBoolean("candyAutoPickupOptIn",false).apply();
        finish();
    }

    private void requestProjection(){
        MediaProjectionManager manager=(MediaProjectionManager)
            getSystemService(MEDIA_PROJECTION_SERVICE);
        if(manager==null){abort();return;}
        requested=true;
        try{startActivityForResult(manager.createScreenCaptureIntent(),REQUEST);}
        catch(RuntimeException error){
            Toast.makeText(this,"Captura de tela indisponível",Toast.LENGTH_SHORT).show();
            abort();
        }
    }

    @Override protected void onSaveInstanceState(Bundle out){
        out.putBoolean("requested",requested);
        super.onSaveInstanceState(out);
    }

    @Override protected void onActivityResult(int req,int code,Intent data){
        super.onActivityResult(req,code,data);
        if(req!=REQUEST)return;
        if(code!=RESULT_OK||data==null){abort();return;}
        try{
            Intent service=new Intent(this,CandyScreenCaptureService.class)
                .setAction(CandyScreenCaptureService.ACTION_START)
                .putExtra(CandyScreenCaptureService.EXTRA_RESULT_CODE,code)
                .putExtra(CandyScreenCaptureService.EXTRA_RESULT_DATA,data);
            if(Build.VERSION.SDK_INT>=26)startForegroundService(service);
            else startService(service);
        }catch(RuntimeException e){
            Toast.makeText(this,"Não foi possível iniciar o detector",Toast.LENGTH_LONG).show();
            abort();return;
        }
        Toast.makeText(this,"Detecção opcional ativada · volte ao Pokémon GO",
            Toast.LENGTH_LONG).show();
        finish();
    }
}
