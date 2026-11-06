# PokeSearch LT256 — auditoria de carregamento da calculadora (06/11/2026)

## Sintoma (três capturas reais Samsung)
Teddiursa com IVs 0/14/15, PC 888 e nível 26: dropdown `Teddiursa` e setas não mudam a forma. A lista PvP abaixo contém Ursaring/Ursaluna. A interface capturada **não exibe** os três botões `Teddiursa | Ursaring | Ursaluna` que foram adicionados em LT255. Essa ausência é um indicador de HTML pré-LT255 ou de uma lista gerada com uma única forma; sem leitura da versão instalada e do estado da WebView, nenhuma das hipóteses pode ser afirmada como causa exclusiva.

## Diagnóstico do código publicado
- A release latest verificada no início desta auditoria é [LT255 v0.02.55-54459](https://github.com/LucianoToscano/PokeSearch/releases/tag/v0.02.55-54459), contendo `pvp_family_catalog.js` e o `detail.html` com botões por família. Portanto, não atribuir a falha à ausência dessas alterações no repositório ou na release assinada.
- Descoberto descompasso verificável: `scripts/build_ota_pack.py` permitia empacotar `pvp_family_catalog.js`, **mas** `OtaAssets.java` não o reconhecia em `PATCHABLE`. Um pacote OTA contendo esse novo arquivo seria rejeitado, sem explicação ao usuário. O canal OTA público atualmente aponta `{"packVersion":0}`, portanto essa divergência é uma falha real preventiva, **não prova** de que tenha sido a causa dos prints.
- O detalhe usa a mesma URL de origem `appassets.androidplatform.net/assets/detail.html` entre versões do APK. Em dispositivos com cache anterior, existem situações de HTML/JS antigo, embora não haja logs físicos que comprovem o cache como causa nesta captura.

## Correção candidata na [PR #235](https://github.com/LucianoToscano/PokeSearch/pull/235)
1. Adiciona `pvp_family_catalog.js` à allowlist do carregador OTA Android, mantendo criptografia, certificado e verificação SHA-256.
2. Responde `Cache-Control: no-store, no-cache, must-revalidate` nas páginas e scripts locais e usa `WebSettings.LOAD_NO_CACHE` para a WebView de detalhes, evitando reusar HTML/JS de versões anteriores do APK.
3. Evita tratar uma `region` geográfica de encontro (como "United States") como forma regional; ainda bloqueia formas explicitamente Alolan/Galarian/Hisuian/Paldean, fantasias e sombras não verificadas.
4. Exibe o número de opções verificadas no mesmo rótulo compacto da calculadora, por exemplo `Forma · 3`; o objetivo é diagnosticar sem criar novas janelas nem requisitar dados pela rede.
5. Teste `lt256-family-cache-runtime-parity.test.js`: comparação integral de arestas, allowlist de OTA, política de cache, região de encontro não regional e isolamento de variantes, mais regressões já existentes.

## Gate de publicação
O código da PR fica em rascunho. **Não publicar APK oficial LT256 nem modificar `release/official-request.json`** sem regressões, inspeção de screenshots e validação no Samsung P1/P2. A última release pública permanece LT255. Para determinar o problema especificamente no aparelho, confirmar em **Configurações do Android > Aplicativos > PokeSearch > Informações do aplicativo** se a versão instalada é `0.02.55` ou anterior, e reabrir completamente o aplicativo após instalar o APK oficial. Não desinstalar nem apagar dados; preservar contas e preferências.

## Publicação oficial confirmada

- [PR #235](https://github.com/LucianoToscano/PokeSearch/pull/235) mesclada no merge commit `087cf8d1c8682ab0234afc5956428da90281d841`.
- Código funcional validado em 6 verificações CI `success`, incluindo Node completo, Java Android, OTA e screenshots P/M/G: [Node #42156685876](https://github.com/LucianoToscano/PokeSearch/actions/runs/42156685876), [core #42156685944](https://github.com/LucianoToscano/PokeSearch/actions/runs/42156685944), [Java #42156685857](https://github.com/LucianoToscano/PokeSearch/actions/runs/42156685857), [OTA #42156685824](https://github.com/LucianoToscano/PokeSearch/actions/runs/42156685824), [visual #42156685855](https://github.com/LucianoToscano/PokeSearch/actions/runs/42156685855) e [Node QA #42156685872](https://github.com/LucianoToscano/PokeSearch/actions/runs/42156685872).
- Solicitação de release oficial `release/official-request.json` commit `9d46fa01b7d8fa8f40526a4d016d5e3b6b477bb2`, versão `0.02.56`, `versionCode 54460`, label `51260`.
- [Workflow de release permanente #42157008947](https://github.com/LucianoToscano/PokeSearch/actions/runs/42157008947) `completed/success` — assinatura permanente, versão, integridade e publicação confirmadas.
- [Release latest pública v0.02.56-54460](https://github.com/LucianoToscano/PokeSearch/releases/tag/v0.02.56-54460) publicada em `2026-11-06T03:34:10Z`. [APK assinado](https://github.com/LucianoToscano/PokeSearch/releases/download/v0.02.56-54460/PokeSearch-v0.02.56-LT.apk), 28.405.255 bytes, SHA-256 `972be8b2b02f09a412569dfe958993ddb9218a3582fef28d9f517cccc58934bc`. [Artefato interno verificado #13475132993](https://github.com/LucianoToscano/PokeSearch/actions/runs/42157008947/artifacts/13475132993).
- **Instalação NÃO observada** no Samsung. O usuário deve instalar por cima da versão presente, sem limpar dados, verificar em Android > Informações do aplicativo `0.02.56`, fechar e reabrir o PokeSearch. O rótulo `Forma · 3` e os três botões, quando disponíveis no Teddiursa padrão, discriminam interface atual de antiga. Ainda falta validação de toques reais em P1/P2.
