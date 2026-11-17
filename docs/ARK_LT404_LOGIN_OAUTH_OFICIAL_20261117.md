# ARK LT404 — Login PoGoCoordinates automático, APK oficial

**Estado:** PUBLICADO E VERIFICADO em 17/11/2026. Versão PokeSearch **v0.03.89 LT**, `versionCode 54596`, `label 51404`.

- Release estável: https://github.com/LucianoToscano/PokeSearch/releases/tag/v0.03.89-54596
- APK oficial: https://github.com/LucianoToscano/PokeSearch/releases/download/v0.03.89-54596/PokeSearch-v0.03.89-LT.apk
- Asset: `PokeSearch-v0.03.89-LT.apk`, **61.748.014 bytes**, SHA-256 `7fa01d8ac6ccf7d3b06901c9591ec260ca7e910dc8f8d9b86bcaddb528fc89f1` (digest da API GitHub, confirmado pelo workflow; não recalculado após download nesta sessão).
- Publicação UTC: **2026-11-17T20:01:35Z**, draft=false, prerelease=false, asset uploaded.
- Workflow oficial protegido: https://github.com/LucianoToscano/PokeSearch/actions/runs/44164009538 — preflight e publish **completed/success**; Node/OTA, R8, assinatura permanente, publicação, verificação de asset/hash e limpeza de material privado aprovados.
- Certificado permanente esperado e verificado no CI: SHA-256 `34766c15d09013ad65873f9976539c8fa2f826e917dae3af57ea628cad689e8e`.
- PR de código #524 squash `caca47a448101c78ddbc2c7af2c4f1a631f2cefb`; PR de versão #525 squash `5e29f509b24d7405fd25210950c4c4f6b11c23f8`.

## Correção
A página React /search após retorno OAuth Google/Discord podia não expor imediatamente o estado de autenticação. O fluxo anterior proibia a descoberta de /profile quando o provedor havia sido observado; por isso o toque manual no avatar às vezes era necessário. LT404 habilita verificação de /profile após retorno OAuth ambíguo, observa mudanças SPA por progresso/histórico e limita probes por geração de página. O login só é confirmado pelo probe oficial. Não captura tokens, não altera OAuth nem reutiliza a identidade entre contas.

## Gates e pendências
Implementação e versionamento passaram Node QA, LT169, LT211, LT62, LT173, Secure beta/R8 e smoke advisory. O APK público usa exclusivamente o workflow oficial, não FastDev. A gravação fornecida pelo usuário foi inspecionada, mas **não foi executada homologação física** Samsung Android 17 com Google 2FA, Discord, expiração de sessão, contas P1/P2 e overlays. Confirmar que nome/foto aparecem sem toque manual no avatar após instalar; se ainda falhar, coletar relatório sanitizado, sem senha, e-mail, token, cookie ou código 2FA.

[Auditoria de origem](LT404_AUDITORIA_OAUTH_AUTO_SYNC_20261117.md).
