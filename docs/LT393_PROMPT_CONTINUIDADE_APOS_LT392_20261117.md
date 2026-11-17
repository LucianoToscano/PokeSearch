# POKESEARCH — ARK LT393 — Continuidade após LT392

**Origem obrigatória:** código oficial integrado em main via PR [#488](https://github.com/LucianoToscano/PokeSearch/pull/488) squash `c428db970040c254ebe55b2bbd892b0008bf52e9`; versão oficial solicitada em [#489](https://github.com/LucianoToscano/PokeSearch/pull/489), squash `fb235a5cde7079937a845b1e08118d11a6301cfc`, PokeSearch **0.03.77 LT / versionCode 54584 / label 51392**. Antes de qualquer alteração, verificar status efetivo da release estável e consultar `AGENTS.md`, `docs/GUIA_MESTRE.md`, `docs/ARK_LT392_BUSCA_VISITANTE_HUB_20261117.md`, `docs/ARK_POLITICA_OBRIGATORIA_MERGE_PUBLICACAO.md`.

## Contexto da evidência Android
Em 17/11/2026, Samsung SM-S928B Android 17, relatório 03:23:57 da v0.03.76: busca pública sem login recebeu 5 cartões às 03:12:53; em outra etapa 5 cartões foram descartados da filtragem por IV individual não verificável; novas consultas não tinham alteração de lista comprovável. Pesquisas da API retornaram 10/9 registros válidos mas não devem ser confundidas com os 5 cartões visitantes. Capturas do site mostravam percentuais 67%, 76%, 44% enquanto filtro P1 estava 100%; esses resultados **não são** hundo.

## LT392 implementado
- Removido indicador de login sobre cada Pokébola na Home; adicionado vínculo P1 e P2 dentro do menu PoGoCoordinates com seleção Visitante, Conta 1 e Conta 2, isoladas.
- Leitor de DOM do site agora identifica o cartão completo por encontro e reconhece percentuais únicos no cartão mesmo sem a palavra LOCATION; percentuais precisos continuam submetidos à verificação do filtro.
- Resultados idênticos podem ser marcados como nova pesquisa apenas se o site demonstrar explicitamente ciclo de loading/Searching e conclusão; preservar rejeição de listas antigas.
- Testes estáticos Node e contratos de prevenção de regressão do app estendidos. Testes automáticos **não** são validação real de uma pesquisa física no PoGoCoordinates ou autenticação OAuth.

## Prioridades LT393
1. Homologar em aparelho Samsung os cenários P1/P2 visitantes independentes, 5 cartões visíveis com ID/IV/coordenadas corretos e filtro 100% sem promover IV 67/76/44 indevidamente. Coletar amostras do DOM ou relatório sem credenciais e comparar com site real, nos modos raw/IV%/GL/UL e após botão atualizar.
2. Testar o vínculo dentro do hub em claro/escuro, clique nas Pokébolas P1/P2, alternância por conta e atualização visual, sessão visitante sem login e ausência do ícone superior antigo.
3. Validar Google/Discord/MFA reais, sincronização de foto/nome, isolamento WebView/CookieManager por conta, logout sem afetar outro overlay.
4. Garantir que o status interno não cause a impressão de login obrigatório nas buscas públicas não-Shiny; diferenciar login necessário para recursos privados e modo visitante normal.
5. Auditar spinner/load do provedor, polling e contagem de cartões: manter 0–5 visitantes como limite, nunca garantia de 5; não forçar HTTP 429, não limpar cookies para burlar cota, evitar falsos alertas ou stale-results.
6. Testar screenshots de resultados, sprites, coordenadas e UI compacta, TalkBack, orientação retrato/paisagem, Android 11–17 e PGSharp/Pokemod, sem alegar QA físico inexistente.

**Regra ARK:** após alterações, executar testes, mesclar PR aprovado, preparar versão pública monotônica, publicar **exclusivamente** pelo workflow protegido de release estável com assinante permanente, verificar APK/tag/hash/asset e registrar no Guia Mestre e auditoria. FastDev não é canal de distribuição. Se faltar evidência ou um gate falhar, não afirmar publicação.
