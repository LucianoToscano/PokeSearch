package com.lucianotoscano.pokesearchoverlay;
import java.util.ArrayList;
import java.util.List;

public final class PgsSequencePolicyTest {
    private static void ok(boolean value,String detail){
        if(!value)throw new AssertionError(detail);
    }
    private static void reject(Runnable test,String detail){
        try{test.run();throw new AssertionError("Expected rejection: "+detail);}
        catch(IllegalArgumentException expected){}
    }
    public static void main(String[] args){
        PgsSequencePolicy.Step touch=PgsSequencePolicy.tap(.5f,.5f);
        ok(touch.type==PgsSequencePolicy.Type.TAP&&touch.gestureMs==90,
            "visible manual tap has bounded timing");
        ok(PgsSequencePolicy.swipe(.2f,.6f,.8f,.4f).gestureMs==500,
            "drag has source and destination");
        ok(PgsSequencePolicy.waitStep(1000).waitMs==1000,"1s wait");
        ok(PgsSequencePolicy.sprite("model1","Pikachu").modelId.equals("model1"),
            "sprite references an explicitly selected model");
        reject(()->PgsSequencePolicy.tap(Float.NaN,.5f),"NaN");
        reject(()->PgsSequencePolicy.tap(-.1f,.5f),"off screen");
        reject(()->PgsSequencePolicy.tap(.5f,.98f),"avoid bottom system controls");
        reject(()->PgsSequencePolicy.swipe(.5f,.5f,2f,.5f),"invalid destination");
        reject(()->PgsSequencePolicy.waitStep(120000),"unbounded wait");
        reject(()->PgsSequencePolicy.sprite("","Pikachu"),"unselected sprite");
        reject(()->touch.withGesture(6000),"gesture too long");
        reject(()->touch.withWait(35000),"delay too long");
        PgsSequencePolicy.Step moved=touch.withPoint(.3f,.4f,false);
        ok(moved.x==.3f&&moved.y==.4f&&touch.x==.5f,
            "editing points does not mutate stored step");
        List<PgsSequencePolicy.Step> list=new ArrayList<>();
        list.add(touch);list.add(PgsSequencePolicy.waitStep(1500));
        ok(PgsSequencePolicy.validSequence(list),"bounded mixed sequence");
        for(int i=0;i<11;i++)list.add(touch);
        ok(!PgsSequencePolicy.validSequence(list),"maximum 12 steps");
        list.clear();
        for(int i=0;i<5;i++)list.add(PgsSequencePolicy.waitStep(30000));
        ok(!PgsSequencePolicy.validSequence(list),"global runtime budget");
        ok(PgsSequencePolicy.mayExecute("pokemod","pokemod",
            true,true,true,true,false),"explicit host with safeguards");
        ok(!PgsSequencePolicy.mayExecute("pokemod","pgsharp",
            true,true,true,true,false),"prevent cross-client execution");
        ok(!PgsSequencePolicy.mayExecute("pokemod","pokemod",
            false,true,true,true,false),"portrait landscape mismatch");
        ok(!PgsSequencePolicy.mayExecute("pgsharp","pgsharp",
            true,false,true,true,false),"OFF by default");
        ok(!PgsSequencePolicy.mayExecute("pgsharp","pgsharp",
            true,true,true,false,false),"account safety guard");
        ok(!PgsSequencePolicy.mayExecute("pgsharp","pgsharp",
            true,true,false,true,false),"not in game");
        ok(!PgsSequencePolicy.mayExecute("pgsharp","pgsharp",
            true,true,true,true,true),"no simultaneous Auto Hunt");
        ok(!PgsSequencePolicy.mayExecute("other","other",
            true,true,true,true,false),"unknown client never gestures");
        System.out.println("LT367 point/sprite/swipe/wait sequence validation and host isolation PASS");
    }
}
