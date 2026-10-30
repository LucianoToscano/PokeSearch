# PokeSearch LT189 — entrega oficial, Get Coords sem contador e compatibilidade da API
Data: 30/10/2026 — registro posterior à publicação e à leitura de volta dos artefatos.

## Código e integração
- [PR #147](https://github.com/LucianoToscano/PokeSearch/pull/147) (correção API + contador oculto + testes + notas) integrada ao `main` em `d25d55b2ba4c3cc9b281ec34f8bb9851bf3668b0`.
- [PR #148](https://github.com/LucianoToscano/PokeSearch/pull/148) ajustou o nome do teste de pré-condição do workflow, commit `6c529940761e3c2e748d8a43c4208674864c0856`. Essa é a **SOURCE_COMMIT real do APK oficial**, diferente do commit da PR de funcionalidade.
- [GitHub Actions #41011591267](https://github.com/LucianoToscano/PokeSearch/actions/runs/41011591267) **SUCCESS**: testes Node/OTA, metadados e sprites, Gradle Android/R8, certificado v2, pacote/versionCode/SHA e releitura da release.

## Release e APK
- [Releases/latest v0.01.89-54394](https://github.com/LucianoToscano/PokeSearch/releases/tag/v0.01.89-54394) pública, não rascunho, marcada como versão mais recente.
- **APK:** `PokeSearch-v0.01.89-LT.apk`, **29.014.789 bytes** (29,01 MB), SHA-256 **`2d39132b58ae205774ad7ba2068bf14d9b95972cabe5a9e2f750da1c349fb07c`**.
- `applicationId=com.lucianotoscano.pokesearch`, `versionName=0.01.89`, `versionCode=54394`; certificado permanente SHA-256 `34766c15d09013ad65873f9976539c8fa2f826e917dae3af57ea628cad689e8e`; assinatura v2 confirmada.
- APK diretamente: https://github.com/LucianoToscano/PokeSearch/releases/download/v0.01.89-54394/PokeSearch-v0.01.89-LT.apk
- Canal do app: atualizador consulta GitHub Releases/latest, não instala silenciosamente; Android pede confirmação. Atualização OTA incremental de recursos (quando aplicável) não elimina a necessidade de instalar este APK para alterar a WebView empacotada.

## Mudanças
- Em **ambas Pokébolas**, o círculo/contador do botão **Pegar Coordenadas** foi **ocultado** (elemento `coordsQuota` permanece interno, mas tem `hidden aria-hidden` e CSS `display:none!important`), centralizando o botão e dando espaço a coordenadas completas.
- **Não removidos:** toque Get coords, segunda cópia, cooldown, proteção de quota local/provedor, indicação de limitações ou bloqueios de requisição.
- Corrigido formato de campos PvP em pesquisas não PvP; `pvp_league` e `pvp_include_pre_evolutions` voltaram ao formato tipado compatível com a LT187 mesmo quando `pvp_mode=false`. Suspeita de causa de `API: invalid-request` na LT188; **não se afirma que a API externa autenticada foi homologada**.
- QA automatizado: `lt189-get-coords-badge-hidden.test.js`, `lt189-api-default-schema.test.js`, `lt145-detail-minimal-actions.test.js`, `lt145-compact-detail-layout.test.js` e testes históricos.

## Google Drive — distribuição verificada e limitação
- **Novo ZIP público de distribuição** [PokeSearch-LT189-APK-Oficial-Assinado.zip](https://drive.google.com/file/d/1yfASG2L4aZgOLPZIMf0oMlUY-rD4zGU2/view), **26.731.088 bytes**. Contém APK bruto `PokeSearch-v0.01.89-LT.apk` de 29.014.789 bytes e `SHA256SUMS.txt`, `SIGNING-REPORT.txt`, `SOURCE_COMMIT.txt`, `PACKAGE-VERSION.txt`, inventário/entradas. ZIP reaberto: CRC válido e APK interno SHA-256 idêntico ao oficial.
- Mesmo link legado `1XXKGy3AjtDx4uMnt2N4Wd3FVNV0Qn_5P` do Drive **CONTINUA LT187** (29.013.825 bytes). Tentativa autenticada de substituir os bytes no mesmo ID foi rejeitada porque o conector não aceitou o objeto de arquivo bruto originado da área de trabalho. O link legado foi preservado. **Nunca afirmar que o link antigo está atualizado nem substituir APK por ZIP.**
- O arquivo ZIP novo herdou permissão de compartilhamento `anyone/commenter` da pasta `PokeSearch_App` e foi relido pelo conector com ID/tamanho/MIME corretos.
- APK direto sem extração: usar Releases/latest no GitHub. Para enviar pelo Drive: compartilhar **o novo ZIP**, e o destinatário precisa extrair o APK.

## Pendências de homologação física
- Testar no Samsung P1/P2, sem contador em Get coords, resultados 100%/0%, Raw 0/13/13, IV%, GL/UL com API ON e DOM OFF; verificar HTTP real do PoGoCoordinates e aviso de quota do provedor.
- Não inferir estabilidade real da API ou login a partir de testes sintéticos. Não houve instalação física por esta execução.
