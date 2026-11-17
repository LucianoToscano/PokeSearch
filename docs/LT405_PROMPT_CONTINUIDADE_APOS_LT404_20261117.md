# POKESEARCH — Continuidade LT405 após ARK LT404

Base oficial publicada: **PokeSearch v0.03.89 LT**, versionCode **54596**, release https://github.com/LucianoToscano/PokeSearch/releases/tag/v0.03.89-54596. Branch `main`. Leia `AGENTS.md`, `docs/GUIA_MESTRE.md`, `docs/LT404_AUDITORIA_OAUTH_AUTO_SYNC_20261117.md` e `docs/ARK_LT404_LOGIN_OAUTH_OFICIAL_20261117.md`.

**Prioridade 1:** homologação física Android 17 de login Google 2FA e Discord com retorno automático da sessão, nome e foto sem tocar no avatar; reproduzir caso ainda falhe. Separar autenticação real, carregamento React e atualização da Home. Não usar captura de tokens/credenciais.

**Prioridade 2:** manter P1/P2 e Conta 1/Conta 2 independentes, perfis isolados, visitante, overlays, Pokédex, filtros, sprites, fundos, notas e captura de tela temporariamente liberada para QA.

**ARK:** somente após testes e validação, merge `main`, publicar APK oficial assinado pelo workflow protegido, verificar release/asset/hash/certificado e atualizar Guia Mestre/auditoria. Não usar FastDev como distribuição pública. Não declarar teste físico realizado sem evidência.
