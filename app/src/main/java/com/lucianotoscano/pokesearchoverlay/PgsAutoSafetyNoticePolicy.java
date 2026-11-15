package com.lucianotoscano.pokesearchoverlay;

import java.text.Normalizer;
import java.util.Locale;

/**
 * LT357: pausa conservadora quando um aviso de integridade/segurança de conta
 * está visível na árvore acessível do JOGO. As famílias de aviso foram auditadas
 * no APK de referência, sem copiar os textos/arquivos de localização para o app.
 * Nunca toca em OK, consentimento, suspensão, banimento ou dirigir/passageiro.
 */
final class PgsAutoSafetyNoticePolicy {
    private PgsAutoSafetyNoticePolicy(){}
    static String normalize(String text){
        if(text==null)return "";
        String input=Normalizer.normalize(text.toLowerCase(Locale.ROOT),
            Normalizer.Form.NFD).replaceAll("\\p{M}","");
        return input.replaceAll("[\\s\\u00a0]+"," ").trim();
    }
    static boolean accountSafetyNotice(String text){
        String s=normalize(text);
        if(s.isEmpty())return false;
        return s.contains("notificacao de alerta de conta")||
            s.contains("notificacao de suspensao de conta")||
            s.contains("notificacao de banimento de conta")||
            s.contains("account warning notice")||
            s.contains("account suspension notice")||
            s.contains("account ban notice")||
            s.contains("aviso sobre la cuenta")||
            s.contains("aviso de suspension de cuenta")||
            s.contains("aviso de bloqueo de cuenta")||
            s.contains("アカウント警告のお知らせ")||
            s.contains("アカウント停止のお知らせ")||
            s.contains("アカウント永久停止のお知らせ");
    }
}
