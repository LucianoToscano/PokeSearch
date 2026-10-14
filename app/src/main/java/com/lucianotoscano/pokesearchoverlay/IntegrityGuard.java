package com.lucianotoscano.pokesearchoverlay;

import android.content.Context;
import android.content.pm.PackageManager;
import android.content.pm.Signature;
import android.content.pm.SigningInfo;
import android.os.Build;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;

/** Basic local integrity checks. A release certificate pin is required for real signer authentication. */
public final class IntegrityGuard {
    private static final String PACKAGE = "com.lucianotoscano.pokesearch";
    private static final String OFFICIAL_PIX_SHA256 = "c2862867b812f44058a0a4c78d69ead87cb5195a0cd00072575e1a2d29c707fe";
    private IntegrityGuard() {}

    static boolean matchesPix(String payload) {
        if (payload == null) return false;
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256")
                .digest(payload.getBytes(StandardCharsets.UTF_8));
            byte[] expected = new byte[32];
            for (int i = 0; i < expected.length; i++)
                expected[i] = (byte) Integer.parseInt(OFFICIAL_PIX_SHA256.substring(i * 2, i * 2 + 2), 16);
            return MessageDigest.isEqual(digest, expected);
        } catch (Exception e) { return false; }
    }

    public static boolean verify(Context context) {
        if (context == null || !PACKAGE.equals(context.getPackageName()) ||
            !matchesPix(PixSupport.PAYLOAD)) return false;
        try {
            PackageManager pm = context.getPackageManager();
            Signature[] signatures;
            if (Build.VERSION.SDK_INT >= 28) {
                SigningInfo info = pm.getPackageInfo(PACKAGE, PackageManager.GET_SIGNING_CERTIFICATES).signingInfo;
                if (info == null) return false;
                signatures = info.hasMultipleSigners() ? info.getApkContentsSigners() :
                    info.getSigningCertificateHistory();
            } else {
                signatures = pm.getPackageInfo(PACKAGE, PackageManager.GET_SIGNATURES).signatures;
            }
            if (signatures == null || signatures.length == 0) return false;
            for (Signature signature : signatures)
                if (signature == null || signature.toByteArray().length == 0) return false;
            return true;
        } catch (Exception e) { return false; }
    }
}
