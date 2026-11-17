# ARK LT389 — Publicação oficial verificada

**Data:** 17/11/2026. **Release estável:** [v0.03.74-54581](https://github.com/LucianoToscano/PokeSearch/releases/tag/v0.03.74-54581).

## Provas de entrega
- APK público oficial: [PokeSearch-v0.03.74-LT.apk](https://github.com/LucianoToscano/PokeSearch/releases/download/v0.03.74-54581/PokeSearch-v0.03.74-LT.apk).
- `versionCode 54581`, label `51389`; release pública `draft=false`, `prerelease=false`, asset `uploaded`.
- Tamanho do APK publicado: **61.206.073 bytes**.
- Digest SHA-256 público: **`bc343a3600ec83392518f89af66c81f52da1ec774b16ca75a00d65ff6647d7fd`**.
- Certificado permanente esperado `34766c15d09013ad65873f9976539c8fa2f826e917dae3af57ea628cad689e8e`. Step `SDK and exact permanent signer` **SUCCESS**; `Build signed protected release`, `Validate APK and signer`, `Release to all app users` e `Verify public release and hash` **SUCCESS**.
- Workflow protegido oficial: [run #44015438314](https://github.com/LucianoToscano/PokeSearch/actions/runs/44015438314), `completed/success`.
- Desenvolvimento LT386–389: [PR #477](https://github.com/LucianoToscano/PokeSearch/pull/477), squash **`0343b14b4a4b6c34a0e5b934a5ce2e51afa1c017`**.
- Versão e notas: [PR #478](https://github.com/LucianoToscano/PokeSearch/pull/478), squash **`971ea283d24b89416058164ab122b7d4ff5e5d84`**.
- Na candidata #477 passaram Node QA, LT169, LT211, LT62 Java, LT173, FastDev, PGS QA e beta/R8. Na candidata #478 passaram preflight oficial, Node QA, LT169, LT211, LT62, LT173, FastDev, beta/R8.

## Entregas ao usuário
1. Home sem cartões gigantes de login; menu discreto via ícone PoGoCoordinates da barra superior, com contas isoladas, visitante e ações explícitas Google/Discord, perfil e logout.
2. Exibição da página real de login OAuth sem spinner cobrindo os controles quando a página carrega.
3. Sincronização de perfil que preserva nome/foto últimos verificados durante hidratação lenta, mas invalida listas e vínculos de treinador antigos em nova autenticação até confirmar a nova identidade.
4. Busca visitante por DOM público real, indicador `🔒 +5` quando o site confirma cinco resultados e permite até dez mediante login, e leitura de coordenadas no cartão correspondente (incluindo botão numérico irmão).
5. Aviso `!` clicável, diagnóstico sanitizado e acesso a Reportar problema; respeito aos bloqueios HTTP 429 do provedor.
6. Recursos visuais enviados pelo proprietário preservados; overlay P1/P2, Auto Hunt OFF, filtros, sprites, OTA, Novidades nativas e assinatura permanente mantidos.

## QA físico: pendente, não confundir com CI
- **Samsung Android 11–14**, Google + Discord, 2FA/MFA e possíveis bloqueios de OAuth no WebView, login repetido, troca de Conta 1/2, expiração da sessão, foto real Google/Discord, nome e avatar, isolamento Visitante/Conta 1/Conta 2.
- Buscar com e sem login, cinco/dez resultados reais, copiar coordenadas já reveladas, limite `Rate limited`, toque em `!`, aparência clara/escura e TalkBack.
- Nenhuma limpeza automática de cookies/cache para contornar cota de coordenadas; limites do provedor são soberanos. Abrir o site no navegador externo não transfere automaticamente a sessão ao WebView.

## Próxima etapa
Leia [LT390 — prompt de continuidade](LT390_PROMPT_CONTINUIDADE_LOGIN_QA_20261117.md) e a [auditoria de implementação](ARK_LT389_LOGIN_HOME_VISITANTE_20261117.md) para verificar bugs de dispositivo e somente então planejar a próxima release. Nunca declarar homologação física quando não executada.
