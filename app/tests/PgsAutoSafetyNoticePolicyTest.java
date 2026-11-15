package com.lucianotoscano.pokesearchoverlay;

public final class PgsAutoSafetyNoticePolicyTest {
    private static void test(boolean ok,String name){if(!ok)throw new AssertionError(name);}
    public static void main(String[] args){
        test(PgsAutoSafetyNoticePolicy.accountSafetyNotice("Notificação de alerta de conta"),
            "PT-BR conta aviso");
        test(PgsAutoSafetyNoticePolicy.accountSafetyNotice("Notificação de suspensão de conta"),
            "PT-BR suspensão");
        test(PgsAutoSafetyNoticePolicy.accountSafetyNotice("Notificação de banimento de conta"),
            "PT-BR banimento");
        test(PgsAutoSafetyNoticePolicy.accountSafetyNotice("Account Warning Notice"),
            "EN account warning");
        test(PgsAutoSafetyNoticePolicy.accountSafetyNotice("Account Suspension Notice"),
            "EN account suspension");
        test(PgsAutoSafetyNoticePolicy.accountSafetyNotice("Account Ban Notice"),
            "EN account ban");
        test(PgsAutoSafetyNoticePolicy.accountSafetyNotice("Aviso de bloqueo de cuenta"),
            "ES account ban");
        test(PgsAutoSafetyNoticePolicy.accountSafetyNotice("アカウント永久停止のお知らせ"),
            "JP permanent");
        test(!PgsAutoSafetyNoticePolicy.accountSafetyNotice("Visite sua conta no menu"),
            "ordinary account menu must not stop");
        test(!PgsAutoSafetyNoticePolicy.accountSafetyNotice("20 reides concluídas"),
            "ordinary gameplay text must not stop");
        test(!PgsAutoSafetyNoticePolicy.accountSafetyNotice(""),
            "empty text must not match");
        System.out.println("LT357 game account safety notice policy: 11/11 PASS");
    }
}
