package com.lucianotoscano.pokesearchoverlay;

import android.app.Activity;
import android.content.Context;
import android.os.CancellationSignal;
import androidx.credentials.ClearCredentialStateRequest;
import androidx.credentials.CredentialManager;
import androidx.credentials.CredentialManagerCallback;
import androidx.credentials.CustomCredential;
import androidx.credentials.GetCredentialRequest;
import androidx.credentials.GetCredentialResponse;
import androidx.credentials.exceptions.ClearCredentialException;
import androidx.credentials.exceptions.GetCredentialException;
import com.google.android.libraries.identity.googleid.GetSignInWithGoogleOption;
import com.google.android.libraries.identity.googleid.GoogleIdTokenCredential;
import com.google.firebase.FirebaseApp;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseUser;
import com.google.firebase.auth.GoogleAuthProvider;

/**
 * Firebase identity for Premium, independent from FirebaseStats anonymous counters.
 * Explicit user-initiated Google sign-in; OAuth occurs through Android Credential Manager,
 * NEVER inside the PoGoCoordinates WebView. No ID tokens or secrets are stored by this class.
 */
final class PremiumGoogleLogin {
    private static final String FIREBASE_APP_NAME="PokeSearchPremiumIdentity";
    interface Callback { void done(boolean signedIn,String message); }
    private PremiumGoogleLogin(){}

    static synchronized FirebaseAuth auth(Context context){
        FirebaseApp app;
        try{app=FirebaseApp.getInstance(FIREBASE_APP_NAME);}
        catch(IllegalStateException missing){
            // Reuse ONLY public Firebase project settings, not anonymous auth state.
            FirebaseApp stats=FirebaseStats.getNamedApp(context.getApplicationContext());
            app=FirebaseApp.initializeApp(context.getApplicationContext(),
                    stats.getOptions(),FIREBASE_APP_NAME);
        }
        return FirebaseAuth.getInstance(app);
    }

    private static boolean isGoogle(FirebaseUser user){
        if(user==null||user.isAnonymous())return false;
        for(com.google.firebase.auth.UserInfo provider:user.getProviderData()){
            if("google.com".equals(provider.getProviderId()))return true;
        }
        return false;
    }

    static boolean isGoogleSignedIn(Context context){
        return isGoogle(auth(context).getCurrentUser());
    }

    static String email(Context context){
        FirebaseUser user=auth(context).getCurrentUser();
        if(!isGoogle(user))return "";
        return user.getEmail()==null?"":user.getEmail();
    }

    static String uid(Context context){
        FirebaseUser user=auth(context).getCurrentUser();
        return isGoogle(user)?user.getUid():"";
    }

    static void signIn(Activity activity,Callback callback){
        if(!(activity instanceof MainActivity)){
            callback.done(false,"Abra a Home do PokeSearch para entrar com Google.");
            return;
        }
        final String clientId=BuildConfig.PREMIUM_GOOGLE_WEB_CLIENT_ID.trim();
        if(clientId.isEmpty()){
            callback.done(false,"Login Google aguardando configuração do OAuth Web Client ID no APK de testes.");
            return;
        }
        try{
            GetSignInWithGoogleOption option=new GetSignInWithGoogleOption.Builder(clientId).build();
            GetCredentialRequest request=new GetCredentialRequest.Builder()
                    .addCredentialOption(option).build();
            CredentialManager.create(activity).getCredentialAsync(
                    activity,request,new CancellationSignal(),activity.getMainExecutor(),
                    new CredentialManagerCallback<GetCredentialResponse,GetCredentialException>(){
                @Override public void onResult(GetCredentialResponse response){
                    if(!(response.getCredential() instanceof CustomCredential)){
                        callback.done(false,"A conta selecionada não é uma credencial Google.");
                        return;
                    }
                    CustomCredential credential=(CustomCredential)response.getCredential();
                    if(!GoogleIdTokenCredential.TYPE_GOOGLE_ID_TOKEN_CREDENTIAL.equals(
                            credential.getType())){
                        callback.done(false,"Credencial Google não reconhecida.");
                        return;
                    }
                    final String idToken;
                    try{
                        idToken=GoogleIdTokenCredential.createFrom(credential.getData()).getIdToken();
                    }catch(Exception badResponse){
                        callback.done(false,"Não foi possível validar a seleção da conta Google.");
                        return;
                    }
                    if(idToken==null||idToken.isEmpty()){
                        callback.done(false,"O Google não forneceu um token válido.");
                        return;
                    }
                    // Google signs into the SAME Firebase project as the Premium web panel.
                    // Thus the server sees the same UID across browsers and Android.
                    auth(activity).signInWithCredential(GoogleAuthProvider.getCredential(idToken,null))
                            .addOnCompleteListener(activity,task->{
                        if(!task.isSuccessful()||!isGoogle(auth(activity).getCurrentUser())){
                            callback.done(false,"Falha ao entrar no Firebase. Confira o SHA-1 do APK e o OAuth.");
                            return;
                        }
                        PremiumAccess.invalidateLease();
                        callback.done(true,"Conta Google conectada ao Premium.");
                    });
                }
                @Override public void onError(GetCredentialException error){
                    callback.done(false,"Login Google cancelado ou indisponível. Tente novamente.");
                }
            });
        }catch(RuntimeException error){
            callback.done(false,"Não foi possível abrir o login Google neste aparelho.");
        }
    }

    static void signOut(Activity activity,Runnable done){
        auth(activity).signOut();
        PremiumAccess.invalidateLease();
        // Clear Credential Manager provider state after explicit sign-out.
        CredentialManager.create(activity).clearCredentialStateAsync(
                new ClearCredentialStateRequest(),null,activity.getMainExecutor(),
                new CredentialManagerCallback<Void,ClearCredentialException>(){
                    @Override public void onResult(Void ignored){done.run();}
                    @Override public void onError(ClearCredentialException error){done.run();}
                });
    }
}
