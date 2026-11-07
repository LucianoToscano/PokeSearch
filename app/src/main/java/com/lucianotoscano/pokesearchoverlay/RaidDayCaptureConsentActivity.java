package com.lucianotoscano.pokesearchoverlay;

import android.app.Activity;
import android.app.AlertDialog;
import android.content.Intent;
import android.media.projection.MediaProjectionManager;
import android.os.Build;
import android.os.Bundle;
import android.widget.Toast;

/** Autorização por sessão. Não captura sem clique, não tem modo silencioso. */
public final class RaidDayCaptureConsentActivity extends Activity {
    private static final int REQUEST=9718;
    private boolean asked;
    @Override public void onCreate(Bundle state){
        super.onCreate(state);
        if(state!=null)asked=state.getBoolean("asked",false);
        if(!RaidDayAssistantOverlayService.isRunning()||
            CandyScreenCaptureService.isActive()){
            Toast.makeText(this,"Conclua a captura do Doce Raro antes de iniciar outra",
                Toast.LENGTH_LONG).show();
            finish();return;
        }
        if(asked)return;
        new AlertDialog.Builder(this)
            .setTitle("Compartilhar a tela com o Assistente?")
            .setMessage("O Android solicitará autorização por sessão. "+
                "O PokeSearch faz leitura de texto em quadros reduzidos, "+
                "somente neste aparelho. Nenhuma captura ou texto OCR é "+
                "salvo ou enviado. Os resultados são sugestões e não "+
                "avançam etapas sem sua confirmação. Você pode parar "+
                "pela notificação a qualquer momento.")
            .setPositiveButton("Autorizar leitura",(d,which)->request())
            .setNegativeButton("Continuar manual",(d,which)->finish())
            .setOnCancelListener(d->finish()).show();
    }
    private void request(){
        MediaProjectionManager manager=(MediaProjectionManager)
            getSystemService(MEDIA_PROJECTION_SERVICE);
        if(manager==null){finish();return;}
        asked=true;
        try{startActivityForResult(manager.createScreenCaptureIntent(),REQUEST);}
        catch(RuntimeException unavailable){finish();}
    }
    @Override protected void onSaveInstanceState(Bundle state){
        state.putBoolean("asked",asked);super.onSaveInstanceState(state);
    }
    @Override protected void onActivityResult(int request,int result,Intent data){
        super.onActivityResult(request,result,data);
        if(request!=REQUEST)return;
        if(result==RESULT_OK&&data!=null){
            getSharedPreferences("raid_assistant_overlay",MODE_PRIVATE).edit()
                .putBoolean("raid_day_visual_consent",true).apply();
            Intent run=new Intent(this,RaidDayScreenCaptureService.class)
                .setAction(RaidDayScreenCaptureService.START)
                .putExtra(RaidDayScreenCaptureService.RESULT_CODE,result)
                .putExtra(RaidDayScreenCaptureService.RESULT_DATA,data);
            try{
                if(Build.VERSION.SDK_INT>=26)startForegroundService(run);
                else startService(run);
            }catch(RuntimeException failed){
                getSharedPreferences("raid_assistant_overlay",MODE_PRIVATE).edit()
                    .putBoolean("raid_day_visual_consent",false).apply();
                Toast.makeText(this,"Não foi possível iniciar. Continue manualmente.",
                    Toast.LENGTH_LONG).show();
            }
        }
        finish();
    }
}
