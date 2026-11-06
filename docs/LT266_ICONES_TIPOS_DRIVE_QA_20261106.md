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
- Testes Node/Java, regressão visual P/M/G, PvE, OTA e CI da branch: **pendentes até resultados reais**.
- PR/merge, publicação LT266, assinatura e SHA-256 da futura APK: **não afirmados até evidência pública**.
- Teste físico no Samsung, rolagem, painéis e calculadora: **não executado remotamente**.

## Riscos e próximos testes
1. Verificar em P/M/G legibilidade no fundo escuro/claro e ícones de tipos da Pokébola 1 e 2; comparar renderização em 9–12 CSS px.
2. Testar recarga de OTA parcial com o JS e os 18 PNGs; imagens não devem ficar ausentes durante a troca.
3. Auditar o mapa PT-BR Fletchling/Talonflame/Pidgey/Pidgeot via IDs do catálogo versionado; não traduzir IDs desconhecidos.
4. Conferir scroll sem cortes, fechamento das janelas, A/B, Mega, PC/PS e limites de ligas em Samsung.
5. Nunca confundir Rank Classe IV com Rank Geral; PvE por tipo não significa counters vivos para um chefe.
