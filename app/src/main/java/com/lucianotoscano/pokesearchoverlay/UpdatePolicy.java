package com.lucianotoscano.pokesearchoverlay;

/** LT72 pure policy: independently testable without Android/network. */
public final class UpdatePolicy {
    private UpdatePolicy() {}
    public static boolean shouldDisplay(boolean enabled,int remoteCode,
                                        int installedCode,int dismissedCode) {
        return enabled && remoteCode>0 && installedCode>0 &&
               remoteCode>installedCode && remoteCode!=dismissedCode;
    }
    public static boolean validVersion(String versionName,String apkName) {
        return VersionNames.isCanonical(versionName) &&
               ("PokeSearch-v"+versionName+"-LT.apk").equals(apkName);
    }
    public static boolean validHash(String sha) {
        return sha!=null && sha.matches("[0-9a-fA-F]{64}");
    }
    public static boolean safeDownloadLink(String id,String url) {
        return id!=null && id.matches("[A-Za-z0-9_-]{15,128}") &&
            ("https://drive.google.com/uc?export=download&id="+id).equals(url);
    }
}
