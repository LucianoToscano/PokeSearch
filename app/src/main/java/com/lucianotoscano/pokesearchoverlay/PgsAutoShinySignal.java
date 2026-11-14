package com.lucianotoscano.pokesearchoverlay;

import java.text.Normalizer;
import java.util.Locale;

/**
 * Classificacao conservadora de avisos Shiny.
 * Um emoji isolado, "shiny:" sem valor ou texto promocional nao sao prova
 * de encontro. Formatos novos exigem homologacao antes de habilitar pausas.
 */
final class PgsAutoShinySignal {
    private PgsAutoShinySignal() {}

    static boolean isPositive(String message) {
        if(message==null || message.trim().isEmpty())return false;
        String plain=Normalizer.normalize(message.toLowerCase(Locale.ROOT),Normalizer.Form.NFD)
            .replaceAll("\\p{M}","");
        String words=" "+plain.replaceAll("[^a-z0-9]+"," ").trim()
            .replaceAll("\\s+"," ")+" ";

        // Negacoes vencem qualquer outra palavra-chave na mesma notificacao.
        for(String negative:new String[]{
            " no shiny "," not shiny "," not a shiny "," sem shiny ",
            " nao e brilhante "," shiny not found "," shiny nao encontrado ",
            " shiny false "," shiny no "," shiny nao "," shiny 0 "
        })if(words.contains(negative))return false;

        for(String confirmed:new String[]{
            " shiny found "," found a shiny "," found shiny ",
            " shiny detected "," shiny pokemon found ",
            " brilhante encontrado "," pokemon brilhante encontrado ",
            " encontrou um brilhante "
        })if(words.contains(confirmed))return true;

        // So aceitar "shiny: true/yes/sim/1", nunca "shiny:" sozinho.
        return plain.matches("(?s).*\\bshiny\\s*[:=]\\s*(?:true|yes|sim|1)\\b.*");
    }
}
