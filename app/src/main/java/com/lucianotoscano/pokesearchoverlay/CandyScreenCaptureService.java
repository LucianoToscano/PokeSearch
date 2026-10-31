package com.lucianotoscano.pokesearchoverlay;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.ServiceInfo;
import android.graphics.Bitmap;
import android.graphics.PixelFormat;
import android.hardware.display.DisplayManager;
import android.hardware.display.VirtualDisplay;
import android.media.Image;
import android.media.ImageReader;
import android.media.projection.MediaProjection;
import android.media.projection.MediaProjectionManager;
import android.os.Build;
import android.os.Handler;
import android.os.HandlerThread;
import android.os.IBinder;
import android.os.SystemClock;
import android.util.DisplayMetrics;
import android.view.WindowManager;

import com.google.android.gms.tasks.Task;
import com.google.mlkit.vision.common.InputImage;
import com.google.mlkit.vision.text.Text;
import com.google.mlkit.vision.text.TextRecognition;
import com.google.mlkit.vision.text.TextRecognizer;
import com.google.mlkit.vision.text.latin.TextRecognizerOptions;

import java.nio.ByteBuffer;

/** Optional on-device visual detector. Not a background surveillance feature. */
public final class CandyScreenCaptureService extends Service {
    static final String ACTION_START="com.lucianotoscano.pokesearch.CANDY_CAPTURE_START";
    static final String ACTION_STOP="com.lucianotoscano.pokesearch.CANDY_CAPTURE_STOP";
    static final String EXTRA_RESULT_CODE="resultCode";
    static final String EXTRA_RESULT_DATA="resultData";
    private static final String CHANNEL="pokesearch_candy_capture";
    private static final int NOTIFICATION_ID=1987;
    // Sample while waiting for the short Pokemon GO item banner.
    // The previous one-frame-per-second gate could miss a transient popup.
    private static final long SAMPLE_INTERVAL_MS=350L;
    private static volatile boolean active=false;
    static boolean isActive(){return active;}

    private MediaProjection projection;
    private MediaProjection.Callback projectionCallback;
    private VirtualDisplay display;
    private ImageReader reader;
    private HandlerThread thread;
    private Handler handler;
    private TextRecognizer textRecognizer;
    private volatile boolean inFlight=false,stopped=false,sourceVisible=true;
    private long lastFrameAt=0L;
    private long lastFrameSharedAt=0L;
    private long inFlightSince=0L;
    private long lastVisualPositiveAt=0L;
    private long pendingSince=0L;
    private String pendingPoint="";
    private boolean previousBannerVisible=false;
    private boolean waitForOldBannerToClear=false;
    private int bannerAbsentFrames=0;
    private final CandyPickupEvidence.TwoFrameGate gate=
        new CandyPickupEvidence.TwoFrameGate();

    @Override public IBinder onBind(Intent intent){return null;}

    // Diagnostic consists only of predefined status strings. Never store OCR
    // content, pixels, screenshots, or exact coordinates.
    private void reportStatus(String status){
        SharedPreferences prefs=getSharedPreferences("rare_candy_overlay",MODE_PRIVATE);
        if(!status.equals(prefs.getString("candyCaptureStatus","")))
            prefs.edit().putString("candyCaptureStatus",status).apply();
    }

    @Override public void onCreate(){
        super.onCreate();
        reportStatus("Iniciando detector");
        ((NotificationManager)getSystemService(NOTIFICATION_SERVICE))
            .createNotificationChannel(new NotificationChannel(CHANNEL,
                "Detecção de Doce Raro · Captura autorizada",
                NotificationManager.IMPORTANCE_LOW));
    }

    @Override public int onStartCommand(Intent intent,int flags,int startId){
        if(intent==null)return START_NOT_STICKY;
        if(ACTION_STOP.equals(intent.getAction())){
            stopSelf();return START_NOT_STICKY;
        }
        if(!ACTION_START.equals(intent.getAction())||active||projection!=null){
            return START_NOT_STICKY;
        }
        SharedPreferences prefs=getSharedPreferences("rare_candy_overlay",MODE_PRIVATE);
        if(!RareCandyOverlayService.isRunning()||
            !prefs.getBoolean("candyAutoPickupOptIn",false)){
            stopSelf();return START_NOT_STICKY;
        }
        int code=intent.getIntExtra(EXTRA_RESULT_CODE,0);
        Intent data;
        if(Build.VERSION.SDK_INT>=33)
            data=intent.getParcelableExtra(EXTRA_RESULT_DATA,Intent.class);
        else data=intent.getParcelableExtra(EXTRA_RESULT_DATA);
        if(code!=android.app.Activity.RESULT_OK||data==null){
            stopSelf();return START_NOT_STICKY;
        }

        try{
            Notification note=notification();
            if(Build.VERSION.SDK_INT>=29)
                startForeground(NOTIFICATION_ID,note,
                    ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PROJECTION);
            else startForeground(NOTIFICATION_ID,note);
            MediaProjectionManager manager=(MediaProjectionManager)
                getSystemService(MEDIA_PROJECTION_SERVICE);
            if(manager==null)throw new IllegalStateException("MediaProjection unavailable");
            projection=manager.getMediaProjection(code,data);
            if(projection==null)throw new IllegalStateException("MediaProjection not granted");
            thread=new HandlerThread("PokeCandyTopBanner");
            thread.start();
            handler=new Handler(thread.getLooper());
            projectionCallback=new MediaProjection.Callback(){
                @Override public void onStop(){stopSelf();}
                @Override public void onCapturedContentResize(int width,int height){
                    // Android 14+ may share a selected app window instead of
                    // the whole display. Resize the SAME virtual display.
                    if(stopped||display==null||width<100||height<200)return;
                    try{
                        ImageReader next=ImageReader.newInstance(
                            width,height,PixelFormat.RGBA_8888,2);
                        next.setOnImageAvailableListener(
                            CandyScreenCaptureService.this::onFrame,handler);
                        display.resize(width,height,
                            getResources().getDisplayMetrics().densityDpi);
                        display.setSurface(next.getSurface());
                        ImageReader old=reader;
                        reader=next;
                        if(old!=null){old.setOnImageAvailableListener(null,null);old.close();}
                    }catch(RuntimeException ex){stopSelf();}
                }
                @Override public void onCapturedContentVisibilityChanged(boolean visible){
                    sourceVisible=visible;
                    if(!visible)reportStatus("Captura pausada · retorne ao Pokémon GO");
                    else reportStatus("Aguardando aviso do Doce Raro");
                }
            };
            projection.registerCallback(projectionCallback,handler);
            textRecognizer=TextRecognition.getClient(
                TextRecognizerOptions.DEFAULT_OPTIONS);
            WindowManager window=(WindowManager)getSystemService(WINDOW_SERVICE);
            DisplayMetrics dm=new DisplayMetrics();
            window.getDefaultDisplay().getRealMetrics(dm);
            int width=Math.max(1,dm.widthPixels),height=Math.max(1,dm.heightPixels);
            reader=ImageReader.newInstance(width,height,PixelFormat.RGBA_8888,2);
            reader.setOnImageAvailableListener(this::onFrame,handler);
            // Never reuse this projection token to create another virtual display.
            display=projection.createVirtualDisplay("PokeSearchCandyConsent",
                width,height,dm.densityDpi,DisplayManager.VIRTUAL_DISPLAY_FLAG_AUTO_MIRROR,
                reader.getSurface(),null,handler);
            active=true;
            prefs.edit().putLong("candyCaptureLastFrameAtMs",0L)
                .putBoolean("candyCaptureHasValidPixels",false).apply();
            reportStatus("Captura iniciada · aguardando imagens");
        }catch(Exception ex){
            reportStatus("Falha ao iniciar captura · reautorize");
            stopSelf();
        }
        return START_NOT_STICKY;
    }

    private Notification notification(){
        Intent stop=new Intent(this,CandyScreenCaptureService.class)
            .setAction(ACTION_STOP);
        PendingIntent stopAction=PendingIntent.getService(this,579,stop,
            PendingIntent.FLAG_UPDATE_CURRENT|PendingIntent.FLAG_IMMUTABLE);
        return new Notification.Builder(this,CHANNEL)
            .setSmallIcon(R.drawable.ic_notification)
            .setContentTitle("Doce Raro · detecção de coleta ativa")
            .setContentText("Somente faixa superior · toque em Parar para interromper")
            .setOngoing(true)
            .addAction(new Notification.Action.Builder(
                android.R.drawable.ic_menu_close_clear_cancel,
                "Parar detecção",stopAction).build())
            .build();
    }

    private void onFrame(ImageReader source){
        Image image=null;
        try{
            image=source.acquireLatestImage();
            if(image==null)return;
            long now=SystemClock.elapsedRealtime();
            if(!RareCandyOverlayService.isRunning()){stopSelf();return;}
            if(stopped||!sourceVisible||now-lastFrameAt<SAMPLE_INTERVAL_MS)return;
            // Never stall frame sampling because ML Kit is downloading its
            // unbundled OCR model or a previous OCR request is unresolved.
            // Visual two-sprite evidence must remain independent of OCR.
            lastFrameAt=now;
            long wallTime=System.currentTimeMillis();
            if(wallTime-lastFrameSharedAt>=1500L){
                getSharedPreferences("rare_candy_overlay",MODE_PRIVATE).edit()
                    .putLong("candyCaptureLastFrameAtMs",wallTime).apply();
                lastFrameSharedAt=wallTime;
            }
            SharedPreferences prefs=getSharedPreferences("rare_candy_overlay",MODE_PRIVATE);
            // Idle uses no OCR: only scan after one single pending selection.
            String selected=prefs.getString("selectedCandyCoords","");
            boolean pending=prefs.getBoolean("pendingCandyPickup",false);
            long selectedAt=prefs.getLong("selectedCandyCopyAtMs",0L);
            long expiresAt=prefs.getLong("selectedCandyExpireAtMs",0L);
            long wallNow=System.currentTimeMillis();
            if(!pending||selectedAt<=0||wallNow<selectedAt||
                expiresAt<=selectedAt||wallNow>expiresAt||
                CandyCooldownPolicy.parseCoordinates(selected)==null){
                pendingPoint="";pendingSince=0;
                gate.reset();
                reportStatus(pending&&expiresAt>0&&wallNow>expiresAt?
                    "Doce expirado · copie outro":"Aguardando cópia de um doce");
                return;
            }
            if(!selected.equals(pendingPoint)||selectedAt!=pendingSince){
                // Prevent a second copy from reusing the same still-visible
                // banner that confirmed the previous pending candy.
                waitForOldBannerToClear=previousBannerVisible;
                bannerAbsentFrames=0;
                pendingPoint=selected;pendingSince=selectedAt;
                gate.reset();
                reportStatus("Procurando aviso de coleta");
            }
            int w=image.getWidth(),h=image.getHeight();
            Image.Plane plane=image.getPlanes()[0];
            if(plane.getPixelStride()!=4||w<100||h<200){
                reportStatus("Formato de imagem não suportado");
                return;
            }
            // Read ONLY the top band from ImageReader's full-screen frame.
            // Never materialize a full-screen Bitmap or keep raw screenshots.
            int bandHeight=Math.min(h,Math.max(80,h*27/100));
            int outW=Math.min(w,800);
            int outH=Math.max(40,(int)Math.round(
                bandHeight*(outW/(double)w)));
            int[] argb=new int[outW*outH];
            ByteBuffer buffer=plane.getBuffer();
            int rowStride=plane.getRowStride();
            int pixelStride=plane.getPixelStride();
            for(int y=0;y<outH;y++){
                int srcY=Math.min(bandHeight-1,y*bandHeight/outH);
                for(int x=0;x<outW;x++){
                    int srcX=Math.min(w-1,x*w/outW);
                    int offset=srcY*rowStride+srcX*pixelStride;
                    if(offset+3>=buffer.limit()){
                        reportStatus("Erro na leitura dos pixels");
                        return;
                    }
                    int red=buffer.get(offset)&255;
                    int green=buffer.get(offset+1)&255;
                    int blue=buffer.get(offset+2)&255;
                    argb[y*outW+x]=0xff000000|(red<<16)|(green<<8)|blue;
                }
            }
            Bitmap top=Bitmap.createBitmap(
                argb,outW,outH,Bitmap.Config.ARGB_8888);
            getSharedPreferences("rare_candy_overlay",MODE_PRIVATE).edit()
                .putBoolean("candyCaptureHasValidPixels",true).apply();
            processTopBand(top,selected,selectedAt);
        }catch(RuntimeException issue){
            reportStatus("Falha ao processar quadro · reinicie a captura");
            inFlight=false;
        }finally{
            if(image!=null)image.close();
        }
    }

    private void processTopBand(Bitmap top,String selected,long selectedAt){
        final int w=top.getWidth(),h=top.getHeight();
        final int[] pixels=new int[w*h];
        top.getPixels(pixels,0,w,0,0,w,h);
        final boolean rainbow=CandyPickupEvidence.hasCandyRainbow(pixels,w,h);
        final boolean dualBanner=CandyPickupEvidence.hasDualCandyBanner(pixels,w,h);
        // Visual fallback is essential: "DOCE RARO" is white-on-white in
        // the actual popup, and unbundled OCR can still be downloading.
        if(dualBanner){
            bannerAbsentFrames=0;
            lastVisualPositiveAt=SystemClock.elapsedRealtime();
            observeEvidence(true,true,selected,selectedAt);
            top.recycle();
            return;
        }
        if(waitForOldBannerToClear&&++bannerAbsentFrames>=2){
            // Two frames without the old dual-sprite banner release the
            // next selected candy even if ML Kit OCR never returns.
            waitForOldBannerToClear=false;
            previousBannerVisible=false;
            gate.reset();
            reportStatus("Aviso anterior saiu · aguardando novo doce");
        }
        if(inFlight){
            // Keep scanning every 350ms even if OCR has stalled.
            if(SystemClock.elapsedRealtime()-inFlightSince>5000L)
                reportStatus("OCR lento · análise visual continua");
            top.recycle();
            return;
        }
        inFlight=true;
        inFlightSince=SystemClock.elapsedRealtime();
        final long frameAt=inFlightSince;
        Task<Text> task;
        try{
            task=textRecognizer.process(InputImage.fromBitmap(top,0));
        }catch(RuntimeException unavailable){
            reportStatus("OCR indisponível · verificando sprites");
            observeEvidence(false,false,selected,selectedAt);
            top.recycle();inFlight=false;return;
        }
        task.addOnSuccessListener(text->{
            try{
                // Guard both old selections and revoked consent in async results.
                SharedPreferences prefs=getSharedPreferences("rare_candy_overlay",MODE_PRIVATE);
                if(stopped||!active||!prefs.getBoolean("pendingCandyPickup",false)||
                    !selected.equals(prefs.getString("selectedCandyCoords",""))||
                    selectedAt!=prefs.getLong("selectedCandyCopyAtMs",0L))
                    return;
                // An older OCR response cannot cancel more recent,
                // confirmed visual evidence from the item-found banner.
                if(frameAt<lastVisualPositiveAt)return;
                boolean matched=CandyPickupEvidence.foundMessageWithCandy(
                    text.getText(),rainbow);
                observeEvidence(matched,false,selected,selectedAt);
                if(!matched)reportStatus(rainbow?
                    "Sprite vista · aguardando mensagem":
                    "Aguardando mensagem e sprite");
            }finally{
                top.recycle();inFlight=false;
            }
        }).addOnFailureListener(error->{
            if(frameAt>=lastVisualPositiveAt){
                reportStatus("OCR indisponível · verificando sprites");
                observeEvidence(false,false,selected,selectedAt);
            }
            top.recycle();inFlight=false;
        });
    }

    private void observeEvidence(boolean matched,boolean dualBanner,
        String selected,long selectedAt){
        SharedPreferences prefs=getSharedPreferences("rare_candy_overlay",MODE_PRIVATE);
        if(stopped||!active||!prefs.getBoolean("candyAutoPickupOptIn",false)||
            !prefs.getBoolean("pendingCandyPickup",false)||
            !selected.equals(prefs.getString("selectedCandyCoords",""))||
            selectedAt!=prefs.getLong("selectedCandyCopyAtMs",-1L))
            return;

        if(!matched){
            previousBannerVisible=false;
            waitForOldBannerToClear=false;
            gate.observe(false,SystemClock.elapsedRealtime());
            return;
        }
        if(waitForOldBannerToClear){
            reportStatus("Aguardando aviso anterior desaparecer");
            return;
        }
        previousBannerVisible=true;
        reportStatus(dualBanner?"Duas sprites reconhecidas · confirmando":
            "Mensagem e sprite reconhecidas · confirmando");
        if(!gate.observe(true,SystemClock.elapsedRealtime()))return;
        // Double evidence is restricted to the currently selected candy.
        // +1/+2 on the game's banner does not represent more coordinates.
        try{
            Intent event=new Intent(this,RareCandyOverlayService.class)
                .setAction(RareCandyOverlayService.ACTION_VISUAL_PICKUP_CONFIRMED)
                .putExtra(RareCandyOverlayService.EXTRA_VISUAL_COORDS,selected)
                .putExtra(RareCandyOverlayService.EXTRA_VISUAL_COPIED_AT,selectedAt);
            startService(event);
            reportStatus("Aviso reconhecido · aguardando confirmação do overlay");
        }catch(RuntimeException failure){
            reportStatus("Não foi possível confirmar · use ✓ Peguei");
        }
    }

    @Override public void onDestroy(){
        stopped=true;active=false;
        if(reader!=null){reader.setOnImageAvailableListener(null,null);reader.close();reader=null;}
        if(display!=null){display.release();display=null;}
        if(projection!=null){
            if(projectionCallback!=null)projection.unregisterCallback(projectionCallback);
            projection.stop();projection=null;
        }
        if(textRecognizer!=null){textRecognizer.close();textRecognizer=null;}
        if(thread!=null){thread.quitSafely();thread=null;}
        getSharedPreferences("rare_candy_overlay",MODE_PRIVATE).edit()
            .putBoolean("candyAutoPickupOptIn",false)
            .putLong("candyCaptureLastFrameAtMs",0L)
            .putBoolean("candyCaptureHasValidPixels",false).apply();
        super.onDestroy();
    }
}
