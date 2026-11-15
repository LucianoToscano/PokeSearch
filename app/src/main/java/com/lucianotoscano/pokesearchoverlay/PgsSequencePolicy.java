package com.lucianotoscano.pokesearchoverlay;

import java.util.List;

/**
 * LT367: regras puras do editor de sequências. Coordenadas normalizadas,
 * sem GPS, sem acionar gesto/Clipboard nem acessar dados de outros clientes.
 */
final class PgsSequencePolicy {
    static final int MAX_STEPS=12;
    static final long MAX_ESTIMATED_MS=120000L;
    static final long SPRITE_TIMEOUT_MS=5000L;
    enum Type { TAP, SWIPE, SPRITE, WAIT }
    static final class Step {
        final Type type;
        final float x,y,endX,endY;
        final int gestureMs,waitMs;
        final String modelId,modelName;

        Step(Type type,float x,float y,float endX,float endY,int gestureMs,
             int waitMs,String modelId,String modelName) {
            if(type==null)throw new IllegalArgumentException("Tipo inválido");
            if(type==Type.TAP||type==Type.SWIPE){
                if(!validPoint(x,y))throw new IllegalArgumentException("Ponto fora da tela");
                if(type==Type.SWIPE&&!validPoint(endX,endY))
                    throw new IllegalArgumentException("Destino fora da tela");
            }
            if(type==Type.SWIPE&&(gestureMs<150||gestureMs>1800))
                throw new IllegalArgumentException("Arraste fora do limite");
            if(type==Type.TAP&&(gestureMs<60||gestureMs>230))
                throw new IllegalArgumentException("Toque fora do limite");
            if(type==Type.WAIT&&(waitMs<300||waitMs>30000))
                throw new IllegalArgumentException("Espera fora do limite");
            if(type!=Type.WAIT&&(waitMs<0||waitMs>10000))
                throw new IllegalArgumentException("Pausa entre etapas inválida");
            if(type==Type.SPRITE&&(modelId==null||modelId.trim().isEmpty()||
                modelId.length()>130||modelName==null||modelName.trim().isEmpty()||
                modelName.length()>80))
                throw new IllegalArgumentException("Sprite precisa estar salva");
            this.type=type;this.x=x;this.y=y;this.endX=endX;this.endY=endY;
            this.gestureMs=gestureMs;this.waitMs=waitMs;
            this.modelId=type==Type.SPRITE?modelId:"";
            this.modelName=type==Type.SPRITE?modelName:"";
        }
        Step withWait(int ms){
            return new Step(type,x,y,endX,endY,gestureMs,ms,modelId,modelName);
        }
        Step withGesture(int ms){
            return new Step(type,x,y,endX,endY,ms,waitMs,modelId,modelName);
        }
        Step withPoint(float nx,float ny,boolean destination){
            return new Step(type,destination?x:nx,destination?y:ny,
                destination?nx:endX,destination?ny:endY,
                gestureMs,waitMs,modelId,modelName);
        }
        String title(){
            switch(type){
                case TAP:return "Toque";
                case SWIPE:return "Arrastar";
                case SPRITE:return "Sprite · "+modelName;
                default:return "Aguardar";
            }
        }
    }
    static boolean validPoint(float x,float y){
        return Float.isFinite(x)&&Float.isFinite(y)&&
            x>=.025f&&x<=.975f&&y>=.09f&&y<=.91f;
    }
    static Step tap(float x,float y){return new Step(Type.TAP,x,y,0,0,90,600,"","");}
    static Step swipe(float x,float y,float ex,float ey){
        return new Step(Type.SWIPE,x,y,ex,ey,500,700,"","");
    }
    static Step waitStep(int ms){return new Step(Type.WAIT,0,0,0,0,0,ms,"","");}
    static Step sprite(String id,String name){
        return new Step(Type.SPRITE,0,0,0,0,90,1000,id,name);
    }
    static long estimatedMs(List<Step> steps){
        if(steps==null)return Long.MAX_VALUE;
        long sum=0L;
        for(Step s:steps){
            if(s==null)return Long.MAX_VALUE;
            sum+=(long)s.gestureMs+s.waitMs+(s.type==Type.SPRITE?SPRITE_TIMEOUT_MS:0L);
        }
        return sum;
    }
    static boolean validSequence(List<Step> steps){
        return steps!=null&&!steps.isEmpty()&&steps.size()<=MAX_STEPS&&
            estimatedMs(steps)<=MAX_ESTIMATED_MS;
    }
    static boolean mayExecute(String savedProfile,String liveProfile,
        boolean orientationMatches,boolean optedIn,boolean gameVisible,
        boolean safetyClear,boolean anotherEngineRunning){
        return PgsAutoHostPolicy.profile(savedProfile).equals(
            PgsAutoHostPolicy.profile(liveProfile))&&
            !PgsAutoHostPolicy.OTHER.equals(PgsAutoHostPolicy.profile(liveProfile))&&
            orientationMatches&&optedIn&&gameVisible&&safetyClear&&
            !anotherEngineRunning;
    }
    private PgsSequencePolicy(){}
}
