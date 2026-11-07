package com.lucianotoscano.pokesearchoverlay;

import android.app.Activity;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
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
import java.nio.ByteBuffer;

import com.google.mlkit.vision.common.InputImage;
import com.google.mlkit.vision.text.TextRecognition;
import com.google.mlkit.vision.text.TextRecognizer;
import com.google.mlkit.vision.text.latin.TextRecognizerOptions;

/** Projeção explicitamente autorizada por sessão. Apenas OCR local e rótulos fixos. */
public final class RaidDayScreenCaptureService extends Service {
    public static final String START="com.lucianotoscano.pokesearch.RAID_DAY_CAPTURE_START";
    public static final String STOP="com.lucianotoscano.pokesearch.RAID_DAY_CAPTURE_STOP";
    public static final String RESULT_CODE="code",RESULT_DATA="data";
    private static final String CHANNEL="pokesearch_raid_day_capture";
    private static final long FRAME_INTERVAL_MS=850L;
    private static volatile boolean active;
    public static boolean isActive(){return active;}

    private MediaProjection projection;
    private MediaProjection.Callback callback;
    private VirtualDisplay display;
    private ImageReader reader;
    private HandlerThread thread;
    private Handler handler;
    private TextRecognizer ocr;
    private final RaidDayScreenDetector.Stable stable=new RaidDayScreenDetector.Stable();
    private volatile boolean stopped,visible=true,inFlight;
    private long lastFrameAt;
    private SharedPreferences prefs;
    @Override public IBinder onBind(Intent intent){return null;}
    @Override public void onCreate(){
        super.onCreate();
        prefs=getSharedPreferences("raid_assistant_overlay",MODE_PRIVATE);
        NotificationManager manager=(NotificationManager)getSystemService(NOTIFICATION_SERVICE);
        if(manager!=null)manager.createNotificationChannel(
            new NotificationChannel(CHANNEL,"Dia de Reides · Tela autorizada",
                NotificationManager.IMPORTANCE_LOW));
    }
    private void status(String label){
        prefs.edit().putString("raid_day_capture_status",label).apply();
    }
    @Override public int onStartCommand(Intent intent,int flags,int startId){
        if(intent!=null&&STOP.equals(intent.getAction())){
            stopSelf();return START_NOT_STICKY;
        }
        if(intent==null||!START.equals(intent.getAction())||active||
            !RaidDayAssistantOverlayService.isRunning()||
            !prefs.getBoolean("raid_day_visual_consent",false)||
            CandyScreenCaptureService.isActive()){
            status("Modo manual · captura não iniciada");
            stopSelf();return START_NOT_STICKY;
        }
        int code=intent.getIntExtra(RESULT_CODE,0);
        Intent grant=Build.VERSION.SDK_INT>=33?
            intent.getParcelableExtra(RESULT_DATA,Intent.class):
            intent.getParcelableExtra(RESULT_DATA);
        if(code!=Activity.RESULT_OK||grant==null){
            stopSelf();return START_NOT_STICKY;
        }
        try{
            if(Build.VERSION.SDK_INT>=29)startForeground(1989,notification(),
                ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PROJECTION);
            else startForeground(1989,notification());
            MediaProjectionManager manager=(MediaProjectionManager)
                getSystemService(MEDIA_PROJECTION_SERVICE);
            if(manager==null)throw new IllegalStateException("Projection unavailable");
            projection=manager.getMediaProjection(code,grant);
            if(projection==null)throw new IllegalStateException("Projection rejected");
            thread=new HandlerThread("PokeSearchRaidDayFrames");
            thread.start();handler=new Handler(thread.getLooper());
            callback=new MediaProjection.Callback(){
                @Override public void onStop(){
                    status("Captura encerrada · continue manualmente");
                    stopSelf();
                }
                @Override public void onCapturedContentVisibilityChanged(boolean onScreen){
                    visible=onScreen;
                    if(!onScreen){
                        stable.reset();
                        status("Tela não visível · continue manualmente");
                    }else status("Tela visível · análise local ativa");
                }
                @Override public void onCapturedContentResize(int w,int h){
                    if(stopped||display==null||w<100||h<160)return;
                    try{
                        ImageReader newer=ImageReader.newInstance(w,h,
                            PixelFormat.RGBA_8888,2);
                        newer.setOnImageAvailableListener(
                            RaidDayScreenCaptureService.this::frame,handler);
                        display.resize(w,h,getResources().getDisplayMetrics().densityDpi);
                        display.setSurface(newer.getSurface());
                        ImageReader old=reader;reader=newer;
                        if(old!=null){old.setOnImageAvailableListener(null,null);old.close();}
                    }catch(RuntimeException e){stopSelf();}
                }
            };
            projection.registerCallback(callback,handler);
            ocr=TextRecognition.getClient(TextRecognizerOptions.DEFAULT_OPTIONS);
            WindowManager window=(WindowManager)getSystemService(WINDOW_SERVICE);
            DisplayMetrics dm=new DisplayMetrics();
            window.getDefaultDisplay().getRealMetrics(dm);
            int w=Math.max(100,dm.widthPixels),h=Math.max(160,dm.heightPixels);
            reader=ImageReader.newInstance(w,h,PixelFormat.RGBA_8888,2);
            reader.setOnImageAvailableListener(this::frame,handler);
            display=projection.createVirtualDisplay("PokeSearchRaidDayVisual",
                w,h,dm.densityDpi,DisplayManager.VIRTUAL_DISPLAY_FLAG_AUTO_MIRROR,
                reader.getSurface(),null,handler);
            active=true;
            prefs.edit().remove("raid_day_capture_stage")
                .remove("raid_day_capture_time").apply();
            status("Leitura visual autorizada · sugerindo etapas");
        }catch(Exception error){
            status("Captura indisponível · continue manualmente");
            stopSelf();
        }
        return START_NOT_STICKY;
    }
    private Notification notification(){
        Intent stop=new Intent(this,RaidDayScreenCaptureService.class).setAction(STOP);
        PendingIntent action=PendingIntent.getService(this,1989,stop,
            PendingIntent.FLAG_IMMUTABLE|PendingIntent.FLAG_UPDATE_CURRENT);
        return new Notification.Builder(this,CHANNEL)
            .setSmallIcon(R.drawable.ic_notification)
            .setContentTitle("PokeSearch · acompanhamento visual")
            .setContentText("Captura autorizada · OCR somente no aparelho")
            .setOngoing(true)
            .addAction(new Notification.Action.Builder(
                android.R.drawable.ic_menu_close_clear_cancel,
                "Parar captura",action).build())
            .build();
    }
    private void frame(ImageReader source){
        Image image=null;
        try{
            image=source.acquireLatestImage();
            if(image==null)return;
            long now=SystemClock.elapsedRealtime();
            if(stopped||!active||!visible||inFlight||
                now-lastFrameAt<FRAME_INTERVAL_MS)return;
            lastFrameAt=now;
            Image.Plane plane=image.getPlanes()[0];
            int w=image.getWidth(),h=image.getHeight();
            if(plane.getPixelStride()!=4||w<100||h<160)return;
            int sampleW=Math.min(w,540),sampleH=Math.max(1,h*sampleW/w);
            int[] pixels=new int[sampleW*sampleH];
            ByteBuffer buffer=plane.getBuffer();
            int stride=plane.getRowStride(),limit=buffer.limit();
            for(int y=0;y<sampleH;y++){
                int sourceY=Math.min(h-1,y*h/sampleH);
                for(int x=0;x<sampleW;x++){
                    int sourceX=Math.min(w-1,x*w/sampleW);
                    int offset=sourceY*stride+sourceX*4;
                    if(offset+3>=limit)return;
                    int red=buffer.get(offset)&255,green=buffer.get(offset+1)&255;
                    int blue=buffer.get(offset+2)&255;
                    pixels[y*sampleW+x]=0xff000000|red<<16|green<<8|blue;
                }
            }
            final Bitmap bitmap=Bitmap.createBitmap(pixels,sampleW,sampleH,
                Bitmap.Config.ARGB_8888);
            inFlight=true;
            try{
                ocr.process(InputImage.fromBitmap(bitmap,0))
                    .addOnSuccessListener(text->{
                        try{
                            if(stopped||!active||!visible)return;
                            String candidate=RaidDayScreenDetector.guess(text.getText());
                            String confirmed=stable.observe(candidate);
                            if(!confirmed.isEmpty()){
                                prefs.edit().putString("raid_day_capture_stage",confirmed)
                                    .putLong("raid_day_capture_time",
                                        System.currentTimeMillis()).apply();
                                status("Possível tela reconhecida · confirme manualmente");
                            }
                        }finally{bitmap.recycle();inFlight=false;}
                    })
                    .addOnFailureListener(e->{
                        bitmap.recycle();inFlight=false;stable.reset();
                        status("OCR não conseguiu verificar · continue manualmente");
                    });
            }catch(RuntimeException failure){
                bitmap.recycle();inFlight=false;stable.reset();
            }
        }catch(RuntimeException issue){
            status("Quadro indisponível · continue manualmente");
            stable.reset();inFlight=false;
        }finally{if(image!=null)image.close();}
    }
    @Override public void onDestroy(){
        stopped=true;active=false;visible=false;
        if(reader!=null){reader.setOnImageAvailableListener(null,null);reader.close();reader=null;}
        if(display!=null){display.release();display=null;}
        if(projection!=null){
            if(callback!=null)projection.unregisterCallback(callback);
            projection.stop();projection=null;
        }
        if(ocr!=null){ocr.close();ocr=null;}
        if(thread!=null){thread.quitSafely();thread=null;}
        prefs.edit().putBoolean("raid_day_visual_consent",false)
            .remove("raid_day_capture_stage").remove("raid_day_capture_time").apply();
        status("Captura encerrada · manual disponível");
        super.onDestroy();
    }
}
