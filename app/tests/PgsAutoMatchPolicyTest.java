package com.lucianotoscano.pokesearchoverlay;

public final class PgsAutoMatchPolicyTest {
    private static void expect(boolean correct,String info){
        if(!correct)throw new AssertionError(info);
    }
    public static void main(String[] args){
        expect(PgsAutoMatchPolicy.sameSlot(0,0,32,32,1,1,32,32),
            "two scale/refinement detections of one sprite must coalesce");
        expect(PgsAutoMatchPolicy.sameSlot(0,0,40,40,9,9,24,24),
            "nested scale detections must coalesce");
        expect(!PgsAutoMatchPolicy.sameSlot(0,0,32,32,0,27,32,32),
            "different adjacent vertical icons must remain distinct");
        expect(!PgsAutoMatchPolicy.sameSlot(0,0,32,32,27,0,32,32),
            "different adjacent horizontal icons must remain distinct");
        expect(!PgsAutoMatchPolicy.sameSlot(0,0,0,30,0,0,30,30),
            "zero-width candidates cannot form a slot");
        expect(PgsAutoMatchPolicy.ambiguousDifferentSpecies("pikachu","eevee",.851f,.833f),
            "two close-ranked different species in one slot are ambiguous");
        expect(!PgsAutoMatchPolicy.ambiguousDifferentSpecies("pikachu","pikachu",.851f,.852f),
            "multiple templates of the same species are legitimate");
        expect(!PgsAutoMatchPolicy.ambiguousDifferentSpecies("pikachu","eevee",.934f,.811f),
            "clear confidence lead is not a tie");
        expect(PgsAutoMatchPolicy.ambiguousNativeVariants(
            true,"alola","normal",true,"galar","normal",.851f,.833f),
            "same species with competing native forms is ambiguous");
        expect(PgsAutoMatchPolicy.ambiguousNativeVariants(
            true,"base","shiny",true,"base","normal",.851f,.833f),
            "different native variants at same slot require human QA");
        expect(!PgsAutoMatchPolicy.ambiguousNativeVariants(
            true,"alola","normal",true,"alola","normal",.851f,.852f),
            "same form and variant may be deduplicated");
        expect(!PgsAutoMatchPolicy.ambiguousNativeVariants(
            true,"alola","normal",true,"galar","normal",.934f,.811f),
            "large confidence margin is not ambiguous");
        expect(!PgsAutoMatchPolicy.ambiguousNativeVariants(
            false,"base","personal",true,"base","normal",.851f,.852f),
            "personal samples retain established behavior");
        System.out.println("LT358 native form/variant NMS policy 5/5 PASS");
        System.out.println("LT356: overlap-aware NMS and ambiguous species policy PASS");
    }
}
