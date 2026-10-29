import java.io.FileInputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.security.Key;
import java.security.KeyStore;
import java.security.PrivateKey;
import java.security.Signature;
import java.util.Base64;

/**
 * Host-side only. Uses the protected permanent APK signing key; never embeds
 * private-key material in the repository or in the OTA payload.
 * Usage: java scripts/OtaSigner.java STORE PASSWORD ALIAS KEYPASS manifest.json manifest.sig
 */
public final class OtaSigner {
    public static void main(String[] args)throws Exception {
        if(args.length!=6)throw new IllegalArgumentException("Six required arguments");
        char[] password=args[1].toCharArray(),keypass=args[3].toCharArray();
        KeyStore store=KeyStore.getInstance("PKCS12");
        try(FileInputStream in=new FileInputStream(args[0])){store.load(in,password);}
        Key key=store.getKey(args[2],keypass);
        if(!(key instanceof PrivateKey))throw new SecurityException("Not a signing key");
        String algorithm="RSA".equalsIgnoreCase(key.getAlgorithm())?"SHA256withRSA":
            "EC".equalsIgnoreCase(key.getAlgorithm())?"SHA256withECDSA":null;
        if(algorithm==null)throw new SecurityException("Unsupported signing algorithm");
        Signature signer=Signature.getInstance(algorithm);
        signer.initSign((PrivateKey)key);
        signer.update(Files.readAllBytes(Path.of(args[4])));
        Files.writeString(Path.of(args[5]),
            Base64.getEncoder().encodeToString(signer.sign())+"\n");
        java.util.Arrays.fill(password,'\0');
        java.util.Arrays.fill(keypass,'\0');
    }
}
