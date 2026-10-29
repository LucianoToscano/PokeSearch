# PokeSearch — LT151 — Home reconstruída integralmente (29/10/2026)

## Estado e base
- Base de código: `main`, LT148 pública, sem misturar as alterações experimentais LT149/LT150.
- Branch: `feature/lt151-home-rebuild-full-20261029`
- PR de teste: https://github.com/LucianoToscano/PokeSearch/pull/103
- Commit **exato** do APK assinado: `d2fcde509bb26408e9ae448beebd6009223b23d7`.
- Compilação: https://github.com/LucianoToscano/PokeSearch/actions/runs/40824754204 — SUCCESS.
- Artefato QA: https://github.com/LucianoToscano/PokeSearch/actions/runs/40824754204/artifacts/12876326748
- APK `PokeSearch-v0.01.51-LT-QA.apk` — 49.407.107 bytes, SHA-256 `79dcff4f34c7756d9aa5d4898c67dfeea276b2dc91551172aa72c6e13ec142c1`.
- ZIP do artefato SHA-256 `b75a4276234719aa9d6d5f928cd0a9aa69955fd4ce4d73cb05834fa283215faa`.
- Android: `applicationId=com.lucianotoscano.pokesearch`, `versionName=0.01.51`, `versionCode=54356`; assinatura permanente v2, certificado SHA-256 `34766c15d09013ad65873f9976539c8fa2f826e917dae3af57ea628cad689e8e`.

## Implementado
- Reconstrução da hierarquia nativa de `MainActivity.buildHome()` através de `HomeDashboardV2`, não mera recoloração: topo; hero editorial ilustrado por arte local; duas Pokébolas em cartões maiores com status ligado/desligado; ações Favoritos/Configurar/Comunidade; faixa Premium; conta/treinador; atualização; estatísticas vinculadas; comunidade/chat; compartilhar/agradecimento; versão.
- Textura de vidro quente/neutral, background Pokémon GO do usuário e identidade PokeSearch já existentes.
- Preservados handlers e instâncias de login PoGoCoordinates, conta Premium, FirebaseStats, chat, menu lateral, alertas, recursos P1/P2, `prefs` e `prefs_secondary`, atualizações e acesso Premium **exclusivamente** validado no servidor.
- Transparência da Home atualiza as novas superfícies sem reiniciar serviços/WebViews.

## QA
- Workflow assinada LT151 SUCCESS com a suíte de testes JS/Android e regressões existentes; `app/tests/lt151-home-rebuild-full.test.js` valida composição, dois overlays e atalhos. `overlay-ux.test.js` substituiu contrato obsoleto que exigia o centro antigo vazio por um contrato de nova Home preservando conta PoGoCoordinates.
- ZIP, SHA do APK, versão, assinatura v2 e commit verificados.
- **PENDENTE:** avaliação visual e funcional no Samsung, resolução por tamanho de tela, contraste e fluxo de P1/P2 com contas Premium; esse CI não é evidência de validação física.
- **NÃO EXECUTADO:** merge, publicação de Release oficial, ativação Firebase `globalEnabled`, mudança no banco, site Premium ou versão pública LT148. O servidor pode exigir habilitação específica da versão QA para testar os fluxos protegidos.
- Protocolo de entrega: preferir o link real do artefato GitHub; ZIP contém APK, checksums, relatório da assinatura e commit. Anexo sandbox é secundário, pode retornar Library file not found no cliente.
