# PROMPT MESTRE — Continuar PokeSearch depois da LT266 (06/11/2026)

**Projeto real:** https://github.com/LucianoToscano/PokeSearch

**Leia primeiro:** docs/GUIA_MESTRE.md, docs/LT266_ICONES_TIPOS_DRIVE_QA_20261106.md, docs/LT266_AUDITORIA_FINAL_POS_RELEASE_20261106.md e docs/LT265_AUDITORIA_FINAL_POS_RELEASE_20261106.md.

## Última publicação comprovada em 06/11/2026

- LT266 · `0.02.66` · `versionCode 54470`; [release pública](https://github.com/LucianoToscano/PokeSearch/releases/tag/v0.02.66-54470), [APK assinado](https://github.com/LucianoToscano/PokeSearch/releases/download/v0.02.66-54470/PokeSearch-v0.02.66-LT.apk).
- APK: 34.180.555 bytes, SHA-256 `218e07e37945216021724429acd9b64a971a1e108688ec15bd5d079615555abf`.
- PR #246 mesclada, commit `b83b3ddd346a5ca72a74e727fe125a5fe2066b6e`, oito gates CI verdes, incluindo Node, Java, visual P/M/G, PvE, OTA, preflight.
- Solicitação oficial de release em `360e76f96d415c2c9a4c5ea1110b4b029d163386`, [workflow #42221094365](https://github.com/LucianoToscano/PokeSearch/actions/runs/42221094365) `preflight=success`, `publish=success`, assinatura Android permanente validada e hash público confirmado.
- 18 ícones PNG originais do Drive estão em `app/src/main/assets/ui-icons/type-<tipo>-lt266.png`; `pokemon_type_icons.js` usa caminhos relativos offline. 1024×1024 RGBA, 18 hashes SHA-256 fixados em `lt266-types-from-drive.test.js` e no workflow oficial. Comparação da tag vs. `main` encontrou os mesmos 18 hashes Git.
- O primeiro workflow #42220773155 falhou porque uma nota 54470 fora inserida fora de ordem; corrigida para final de `release_notes.json`, sem remover/ver enfraquecer testes.

## Requisitos imutáveis

Preservar duas Pokébolas independentes, favoritos, buscas, localização com alternância automática Distância/Despawn e escolha manual, IVs e rank Classe **separado** do rank Geral, evoluções/Mega, indicadores Elite e ataques legados, painel Raides por tipo (dados de referência 08/2026, NÃO counters universais), calculadora forma/nível/PC/PS/IV A/B, sprites, alertas, OTA assinado e visual compacto P/M/G com vidro/transparência.
Nomes técnicos da API e identificadores internos de golpes/tipos não são tradução de interface; só localizar rótulos com fonte verificável.

## Pendências reais (não declarar concluídas)

1. **Testes físicos Samsung** nas duas Pokébolas: nitidez/contraste dos novos 18 ícones (9–12px CSS), pergaminhos Elite, bandeiras GL/UL/ML/Copa sobre branco/preto, rolagem sem cortes, abrir/retrair painéis rapidamente, estados assíncronos e editor P/M/G.
2. **Golpes "sem tradução"**: investigar Fletchling, Talonflame, Pidgey e Pidgeot usando WatWowMap/pogo-data-api pt-BR no commit travado `31a3bcdc2e412f315c4be2bb593807f45cb9bd9b`. Nunca traduzir por aproximação; ampliar fallback offline apenas com moveId/proto verificado. Hoje golpes comuns PECK_FAST, FLY, FIRE_SPIN_FAST etc. têm fallback, mas não todos os golpes.
3. **Calculadora IV A/B**: conferir espécies normais, evoluções, Megas, PC/PS, nível, limites das ligas, transições entre formas, sem apagar valores ao recolher painéis e sem afirmar legalidade PvP Mega sem confirmação.
4. **Desempenho:** 18 imagens originais somam 5.802.585 bytes descompactados e acrescentam peso ao APK, mas o código JavaScript deixou de embutir strings Base64. Medir memória no Samsung antes de optar por múltiplas resoluções, sem perder fidelidade e sem alterar originais do Drive.
5. **OTA e atualização:** oferta via GitHub releases/latest comprovada, mas a instalação efetiva requer confirmação do Android; instalação física LT266 ainda não foi observada.

## Procedimento

1. Confirmar latest e `main` antes de mudanças; não presumir LT266 caso outra release já esteja publicada.
2. Revisar código, testes, prints e relatórios reais; corrigir somente falhas fundamentadas. Preservar recursos.
3. Rodar Node completo, Java, visual P/M/G, PvE e OTA; corrigir failures sem enfraquecer checks.
4. PR e merge após checks; nova versão incremental só com `release/official-request.json` e notas cronologicamente ordenadas.
5. Verificar publicação/assinatura/SHA-256 pela release e workflow, atualizar docs/GUIA_MESTRE.md, auditoria extra e próximo prompt.
6. Nunca afirmar Drive sincronizado, telefone testado ou APK publicado sem prova; não publicar segredos ou credenciais.
