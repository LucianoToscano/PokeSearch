# PokeSearch — Estado canônico LT173 oficial — 29/10/2026

## Versão distribuída
- **Última versão estável:** LT173 `0.01.73`, Android `versionCode=54378`.
- **Release oficial:** https://github.com/LucianoToscano/PokeSearch/releases/tag/v0.01.73-54378
- **APK público verificado:** https://github.com/LucianoToscano/PokeSearch/releases/download/v0.01.73-54378/PokeSearch-v0.01.73-LT.apk
- **Arquivo:** `PokeSearch-v0.01.73-LT.apk` — **49.514.961 bytes**.
- **SHA-256 oficial:** `5d330bafeabe3a24fdfb5ef8864c7ae463743ae4cda362d014fc9c08ef34ade9`.
- **Certificado APK permanente, Android v2:** `34766c15d09013ad65873f9976539c8fa2f826e917dae3af57ea628cad689e8e`; assinatura, R8, versão, ZIP, SHA-256 e asset verificados por CI.
- **SOURCE_COMMIT do APK oficial:** `7d3f7497539af826de491cc6daac2e16e4411758`.
- **Merge PR #132:** `fd89a175568ef00d5323f0d6459c1f0c02d6fff1`.
- **GitHub Actions oficial SUCCESS:** https://github.com/LucianoToscano/PokeSearch/actions/runs/40921988685
- **Publicação confirmada pela API GitHub Releases/latest:** `tag_name=v0.01.73-54378`, `draft=false`, `prerelease=false`, asset `uploaded`, 49.514.961 bytes, digest `sha256:5d330bafeabe3a24fdfb5ef8864c7ae463743ae4cda362d014fc9c08ef34ade9`.
- **LT172 preservada:** https://github.com/LucianoToscano/PokeSearch/releases/tag/v0.01.72-54377.

## Atualização para usuários
`GitHubUpdateCenter` já consulta o endpoint oficial de último release estável e exige nome/versionCode/digest e certificado de assinatura idêntico ao anterior. A LT173 passa a ser oferecida ao abrir o app ou na checagem periódica, conforme rede, preferências de adiamento/ignorar e permissão de notificação. Android exige consentimento de instalação; **não existe instalação silenciosa**. Disponível a usuários antigos e atuais com instalador que reconheça a nova release e assinatura. Publicação não é prova de que todos instalaram.

## Sistema OTA inteligente instalado
- O APK LT173 é a **instalação-base necessária** do novo gerenciador; esta primeira mudança ainda exige download completo.
- Uma vez instalado, pacotes futuros podem conter apenas HTML/JS/dados/PNGs modificados, dentro da allowlist, limite por arquivo e por pacote, todos com manifesto assinado por chave do APK e hashes individuais, staging atômico e rollback/fallback para assets locais.
- Dois overlays usam o mesmo carregador seguro `WebViewAssetLoader`; seleção de Conta 1/2 e Treinador VIP 1/2 permanece independente por Pokébola.
- `ota/channel.json` **continua em `{"packVersion":0}`**. Portanto **nenhum pacote OTA de recursos está ativo na data da release**. Para ativar um futuro pacote, exigir publicação manual assinado, validação e aprovação. Patch binário de APK nativo não está implementado.

## Homologação e ressalvas
- Testes automatizados Node/Java, paridade, geração do bundle de sprites, assinatura de manifestos e compilação Android/R8: aprovados.
- **QA real Samsung/Moto G15 com duas contas e treinadores VIP, API ON/OFF, sprites e rollback segue pendente**. O pedido do proprietário autorizou explicitamente a publicação pública apesar dessa limitação; não chamar CI de homologação física.
- Canal GitHub Releases/latest atualizado. **Ponte legada Google Drive sincronizada**, preservando o mesmo ID `1XXKGy3AjtDx4uMnt2N4Wd3FVNV0Qn_5P` e link `https://drive.google.com/file/d/1XXKGy3AjtDx4uMnt2N4Wd3FVNV0Qn_5P/view`. Nome atual `PokeSearch-v0.01.73-LT.apk`, 49.514.961 bytes; novo download do Drive comparado por SHA-256 com o APK oficial `5d330bafeabe3a24fdfb5ef8864c7ae463743ae4cda362d014fc9c08ef34ade9`. Permissão pública do arquivo preservada. Arquivo temporário de transferência removido.
- Não sobrescrever histórico, backup mestre, certificados, contas, tokens, Firebase nem releases antigos.
