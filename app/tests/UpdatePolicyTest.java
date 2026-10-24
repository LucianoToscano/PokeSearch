package com.lucianotoscano.pokesearchoverlay;

public final class UpdatePolicyTest {
    private static int passed=0;
    private static void check(String label,boolean condition) {
        if(!condition)throw new AssertionError(label);
        passed++;
        System.out.println("PASS LT72 "+label);
    }
    public static void main(String[] args) {
        check("newer enabled version visible",UpdatePolicy.shouldDisplay(true,54290,54272,-1));
        check("equal version hidden",!UpdatePolicy.shouldDisplay(true,54272,54272,-1));
        check("older Drive version hidden",!UpdatePolicy.shouldDisplay(true,54260,54272,-1));
        check("disabled publishing hidden",!UpdatePolicy.shouldDisplay(false,54290,54272,-1));
        check("dismissed version hidden",!UpdatePolicy.shouldDisplay(true,54290,54272,54290));
        check("new release after dismissal visible",UpdatePolicy.shouldDisplay(true,54291,54272,54290));
        check("invalid local code hidden",!UpdatePolicy.shouldDisplay(true,54290,0,-1));
        check("valid version and official APK filename",UpdatePolicy.validVersion("0.00.72","PokeSearch-v0.00.72-LT.apk"));
        check("wrong APK filename rejected",!UpdatePolicy.validVersion("0.00.72","other.apk"));
        check("URL matches Drive file id",UpdatePolicy.safeDownloadLink("1K59Jh1jw1Qd6BvAYE-geFdp3Z53dOFej",
           "https://drive.google.com/uc?export=download&id=1K59Jh1jw1Qd6BvAYE-geFdp3Z53dOFej"));
        check("malicious host rejected",!UpdatePolicy.safeDownloadLink("1K59Jh1jw1Qd6BvAYE-geFdp3Z53dOFej",
           "https://example.com/update.apk"));
        check("mismatching Drive ID rejected",!UpdatePolicy.safeDownloadLink("1K59Jh1jw1Qd6BvAYE-geFdp3Z53dOFej",
           "https://drive.google.com/uc?export=download&id=wrong"));
        check("64-character sha accepted",UpdatePolicy.validHash(
            "73d9d83dd4e8a537da7328863b0e8e6cfe14a2a34ef8149ae7b1150e268a6616"));
        check("truncated sha rejected",!UpdatePolicy.validHash("1234"));
        System.out.println("UpdatePolicy: "+passed+"/"+passed+" checks passed");
    }
}
