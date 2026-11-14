package com.lucianotoscano.pokesearchoverlay;

import android.content.Context;
import android.graphics.Bitmap;
import android.graphics.Color;
import java.io.IOException;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;

/**
 * Procura ícones pequenos cadastrados no feed inteiro em 3 escalas.
 * Correlação normalizada + supressão de duplicatas. Não identifica o Pokémon 3D.
 */
final class PgsAutoIconDetector {
    private static final int ANALYSIS_WIDTH=740;
    private static final float THRESHOLD=.805f;
    static final class Match {
        final int x,y,priority;
        final float score;
        final String name,id,group;
        Match(int x,int y,float score,String id,String name,int priority){
            this.x=x;this.y=y;this.score=score;this.id=id;this.name=name;
            this.priority=priority;this.group=speciesKey(name);
        }
    }
    static String speciesKey(String name){
        String normalized=name.toLowerCase(Locale.ROOT).trim();
        int samples=normalized.indexOf(" (amostra");
        return samples>=0 ? normalized.substring(0,samples) : normalized;
    }
    private static final class Template {
        final int width,height,priority;
        final String id,name;
        final int[] xs,ys;
        final float[] centered;
        final float variance;
        Template(Bitmap bmp,PgsAutoTemplateStore.Model model,int priority){
            width=bmp.getWidth();height=bmp.getHeight();
            this.priority=priority;id=model.id;name=model.name;
            List<Integer> xx=new ArrayList<>(),yy=new ArrayList<>();
            List<Float> values=new ArrayList<>();
            int step=Math.max(4,Math.round(width/13f));
            for(int y=1;y<height-1;y+=step)for(int x=1;x<width-1;x+=step){
                int pixel=bmp.getPixel(x,y);
                // Modelo recortado com transparência: ignorar amostras sem
                // Pokémon para evitar falso matching do fundo do feed.
                if(Color.alpha(pixel)<80)continue;
                xx.add(x);yy.add(y);values.add((float)gray(pixel));
            }
            xs=new int[xx.size()];ys=new int[xx.size()];centered=new float[xx.size()];
            float avg=0;for(float value:values)avg+=value;
            avg/=Math.max(1,values.size());
            float variance=0;
            for(int i=0;i<xs.length;i++){
                xs[i]=xx.get(i);ys[i]=yy.get(i);
                centered[i]=values.get(i)-avg;
                variance+=centered[i]*centered[i];
            }
            this.variance=variance;
        }
    }
    private static final class Candidate {
        final int x,y,width,height,priority;
        final String id,name;
        final float score;
        Candidate(int x,int y,Template t,float score){
            this.x=x;this.y=y;width=t.width;height=t.height;
            priority=t.priority;id=t.id;name=t.name;this.score=score;
        }
    }
    private final List<Template> templates=new ArrayList<>();
    private int modelCount=0;
    PgsAutoIconDetector(Context context) throws IOException {
        List<PgsAutoTemplateStore.Model> selected=new ArrayList<>();
        for(PgsAutoTemplateStore.Model model:PgsAutoTemplateStore.active(context))
            if(PgsAutoCatalog.isSelectedName(context,model.name))selected.add(model);
        selected.sort(Comparator.comparingInt(m->PgsAutoCatalog.priority(context,m.name)));
        modelCount=selected.size();
        // O tamanho agora vem da amostra escolhida no feed (24/32/44px),
        // não de um retângulo forçado de 68x52. Variações de zoom são testadas.
        float[] scales=selected.size()>12?
            new float[]{.90f,1f,1.10f}:
            new float[]{.76f,.88f,1f,1.12f,1.24f};
        for(int i=0;i<selected.size();i++) {
            PgsAutoTemplateStore.Model m=selected.get(i);
            Bitmap base=PgsAutoTemplateStore.decode(context,m);
            try{
                for(float scale:scales){
                    int w=Math.max(18,Math.round(base.getWidth()*scale));
                    int h=Math.max(16,Math.round(base.getHeight()*scale));
                    Bitmap scaled=Bitmap.createScaledBitmap(base,w,h,true);
                    try{templates.add(new Template(scaled,m,i));}
                    finally{if(scaled!=base)scaled.recycle();}
                }
            }finally{base.recycle();}
        }
    }
    int templateCount(){return modelCount;}
    List<Match> find(Bitmap screenshot){
        if(templates.isEmpty())return Collections.emptyList();
        float scale=ANALYSIS_WIDTH/(float)screenshot.getWidth();
        int height=Math.max(1,Math.round(screenshot.getHeight()*scale));
        Bitmap reduced=Bitmap.createScaledBitmap(screenshot,ANALYSIS_WIDTH,height,true);
        int w=reduced.getWidth(),h=reduced.getHeight();
        int[] raw=new int[w*h];reduced.getPixels(raw,0,w,0,0,w,h);
        if(reduced!=screenshot)reduced.recycle();
        int[] lum=new int[raw.length];
        for(int i=0;i<raw.length;i++)lum[i]=gray(raw[i]);
        ArrayList<Candidate> candidates=new ArrayList<>();
        // Pode ficar lento com muitos modelos; roda numa thread auxiliar.
        // Passos menores para ícones pequenos; posição final é refinada
        // por pixels e confirmada em dois frames antes do gesto.
        int scanStep=templates.size()>55 ? 7 : 4;
        for(Template t:templates){
            int maxX=w-t.width,maxY=h-t.height;
            if(maxX<0||maxY<0)continue;
            for(int y=0;y<=maxY;y+=scanStep){
                for(int x=0;x<=maxX;x+=scanStep){
                    float preliminary=correlation(lum,w,x,y,t);
                    if(preliminary<.55f)continue;
                    float best=preliminary;int bx=x,by=y;
                    // Refina com passos de 1px sem assumir posição fixa.
                    for(int dy=-4;dy<=4;dy++){
                        for(int dx=-4;dx<=4;dx++){
                            int xx=x+dx,yy=y+dy;
                            if(xx<0||yy<0||xx+t.width>w||yy+t.height>h)continue;
                            float current=correlation(lum,w,xx,yy,t);
                            if(current>best){best=current;bx=xx;by=yy;}
                        }
                    }
                    if(best>=THRESHOLD)candidates.add(new Candidate(bx,by,t,best));
                }
            }
        }
        candidates.sort((a,b)->Float.compare(b.score,a.score));
        List<Candidate> unique=new ArrayList<>();
        for(Candidate c:candidates){
            boolean duplicate=false;
            int x=c.x+c.width/2,y=c.y+c.height/2;
            for(Candidate seen:unique){
                int sx=seen.x+seen.width/2,sy=seen.y+seen.height/2;
                if(Math.abs(sx-x)<30&&Math.abs(sy-y)<32){duplicate=true;break;}
            }
            if(!duplicate)unique.add(c);
        }
        ArrayList<Match> result=new ArrayList<>();
        for(Candidate c:unique){
            result.add(new Match(
                Math.round((c.x+c.width/2f)/scale),
                Math.round((c.y+c.height/2f)/scale),
                c.score,c.id,c.name,c.priority));
        }
        result.sort(Comparator.comparingInt((Match m)->m.priority)
            .thenComparingInt(m->m.y).thenComparingInt(m->m.x));
        return result;
    }
    private static int gray(int c){return(77*Color.red(c)+150*Color.green(c)+29*Color.blue(c))>>8;}
    private static float correlation(int[] lum,int stride,int x,int y,Template t){
        int n=t.centered.length;
        float sum=0,ss=0,dot=0;
        for(int i=0;i<n;i++){
            float p=lum[(y+t.ys[i])*stride+x+t.xs[i]];
            sum+=p;ss+=p*p;dot+=p*t.centered[i];
        }
        float variance=ss-sum*sum/n;
        if(variance<1||t.variance<1)return 0;
        return (float)(dot/Math.sqrt(variance*t.variance));
    }
}
