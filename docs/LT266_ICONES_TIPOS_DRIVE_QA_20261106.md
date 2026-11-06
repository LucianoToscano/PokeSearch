# PokeSearch LT266 — Auditoria inicial: 18 ícones dos tipos fornecidos no Drive
Data: 06/11/2026 · Base publicada confirmada: LT265 0.02.65 (54469).

## Evidência dos originais
- Origem: https://drive.google.com/drive/folders/1_V-_a_ShpYE_tzXERwVqAk2LRRPXd0IN
- 18 imagens: 01_fairy.png até 18_poison.png, cada uma 1024×1024 RGBA com transparência e SHA-256 registrado no teste e no workflow oficial. A arte geral da pasta é referência; não é um 19º tipo.
- Cópias *byte a byte* integradas em `app/src/main/assets/ui-icons/type-<enum>-lt266.png`; arquivo original `pokemon_type_icons.js` anterior permanece recuperável pelo histórico Git.
- A resolução original foi mantida. Nomes internos do tipo (normal/fire/etc.) não foram traduzidos; rótulos acessíveis já são PT-BR.

## Implementação limitada e reversível
- `pokemon_type_icons.js` passa a mapear os 18 tipos para recursos PNG locais, em vez de embutir longas strings Base64. Não muda semântica, tipos inferidos, HTML de captura, funções de IV, PvP/PvE, localização ou duas Pokébolas.
- `pokemon_card_presentation.js` mantém o mesmo contrato da imagem e rótulos. Os caminhos são relativos a `detail.html`, compatíveis com origem local WebView e OTA assinado.
- `lt266-types-from-drive.test.js` confere contagem, todos os tipos, SHA-256 de cada original, transparência RGBA, resolução, rótulos, cartão Pidgey (Normal/Voador), preservação do CSS e cobertura OTA.
- Workflow oficial verifica os 18 SHA-256 dentro do **APK assinado**, impedindo uma release com PNG ausente ou modificado.
- O pacote total das artes originais acrescenta aproximadamente 5,8 MB descompactados; não recodificamos nem alteramos a nitidez. Testar consumo de memória real no Samsung depois da instalação.

## Estado de validação
- Conferência de versão pública LT265: confirmada por `releases/latest` antes das alterações.
- Inspeção fonte em GitHub e PNGs do Drive: confirmadas.
- Oito gates da PR #246 no head `6f111a7f42a3c7e111af121565a15ec2f2f2a0bc`: **success**, incluindo Node completo, Node QA, core, compilação Java, visual HTML WebView P/M/G (workflow #42220354142), referência PvE (workflow #42220354125), OTA (workflow #42220354176), preflight de release. Os gates foram executados, não simulados.
- [PR #246](https://github.com/LucianoToscano/PokeSearch/pull/246) **mesclada** em `b83b3ddd346a5ca72a74e727fe125a5fe2066b6e`. Release solicitada em `release/official-request.json`; **APK assinada, publicação e SHA-256 ainda aguardam confirmação pública**.
- Teste físico no Samsung, rolagem, painéis e calculadora: **não executado remotamente**.

## Riscos e próximos testes
1. Verificar em P/M/G legibilidade no fundo escuro/claro e ícones de tipos da Pokébola 1 e 2; comparar renderização em 9–12 CSS px.
2. Testar recarga de OTA parcial com o JS e os 18 PNGs; imagens não devem ficar ausentes durante a troca.
3. Auditar o mapa PT-BR Fletchling/Talonflame/Pidgey/Pidgeot via IDs do catálogo versionado; não traduzir IDs desconhecidos.
4. Conferir scroll sem cortes, fechamento das janelas, A/B, Mega, PC/PS e limites de ligas em Samsung.
5. Nunca confundir Rank Classe IV com Rank Geral; PvE por tipo não significa counters vivos para um chefe.

## Falha e correção do primeiro workflow de publicação

O workflow oficial #42220773155 falhou no teste preexistente `lt146-update-version-notification.test.js`: as notas de release exigem ordem crescente por `minVersionCode`, mas o novo registro 54470 fora colocado no início. A correção reposicionou somente o registro LT266 ao final, sem mudar as verificações. O primeiro workflow não produziu APK oficial; verificar a repetição pelo novo commit e não declarar release antes da conclusão.

## Confirmação final pós-publicação

- [Workflow oficial #42221094365](https://github.com/LucianoToscano/PokeSearch/actions/runs/42221094365): `preflight=success`, `publish=success`; etapas `Build signed protected release`, `Validate APK and signer`, `Release to all app users` e `Verify public release and hash` concluídas com sucesso.
- [Release LT266](https://github.com/LucianoToscano/PokeSearch/releases/tag/v0.02.66-54470): estável, publicada em 2026-11-06T12:56:18Z, APK de 34.180.555 bytes, SHA-256 `218e07e37945216021724429acd9b64a971a1e108688ec15bd5d079615555abf`.
- Auditoria independente do GitHub comparou as pastas `app/src/main/assets/ui-icons` da tag LT266 e da `main`: **18 imagens presentes nos dois refs; 18 Git blob SHAs idênticos**; soma dos 18 originais 5.802.585 bytes.
- Originais mantidos sem reamostragem; atenção ao tamanho final e consumo de memória em aparelhos limitados. Sem evidência de teste físico Samsung e sem sincronização de retorno para Drive (apenas origem de leitura).
- [Auditoria extra](LT266_AUDITORIA_FINAL_POS_RELEASE_20261106.md) documenta as verificações independentes e pendências.
