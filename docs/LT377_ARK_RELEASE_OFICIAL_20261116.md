# PokeSearch — Encerramento ARK LT377 — RELEASE OFICIAL 16/11/2026

## 1. Publicação comprovada

O proprietário autorizou explicitamente **ARK completo**: auditar/corrigir, testes, merge na main e publicação oficial, sem exigir nova autorização para a mesma solicitação, respeitando proteções. Versão confirmada pela API pública GitHub:

- **Versão:** `0.03.71`; **versionCode `54578`**; **label `51377`**, sucessora da LT376 `0.03.70/54577`.
- **Release pública:** https://github.com/LucianoToscano/PokeSearch/releases/tag/v0.03.71-54578 — `draft=false`, `prerelease=false`, publicação `2026-11-16T22:08:02Z`.
- **APK oficial:** https://github.com/LucianoToscano/PokeSearch/releases/download/v0.03.71-54578/PokeSearch-v0.03.71-LT.apk — asset `uploaded`, **61.196.251 bytes**.
- **SHA-256 (digest asset GitHub):** `5bcdb1e358e746b3038bc1b7ceb2a7f38cdd03b8063943b56cebfadc3f96cf27`. Conferência automatizada no pipeline oficial; não alegar hash recalculado localmente fora do workflow.
- **Certificado permanente SHA-256:** `34766c15d09013ad65873f9976539c8fa2f826e917dae3af57ea628cad689e8e`. Workflow verificou o assinante, assinatura Android v2, pacote, `versionName`, `versionCode`, R8, binário não-debuggable e integridade.
- **Workflow oficial protegido:** https://github.com/LucianoToscano/PokeSearch/actions/runs/43966395928, `completed/success`, HEAD `7a33a72f6033027f3a6e0a20707eac7179faf1c1`. Jobs `preflight` e `publish` success; etapas `Build signed protected release`, `Validate APK and signer`, `Release to all app users`, `Verify public release and hash` success.

## 2. Código e merge

- **PR #458**, https://github.com/LucianoToscano/PokeSearch/pull/458, HEAD `398a6be3b3be4618df9c7817d0567a1f114617fe`, **MERGED** via squash `6ae33f6401a3ec3b448287e41fac6b03f82131e1`.
- **PR #459**, https://github.com/LucianoToscano/PokeSearch/pull/459, HEAD `011c34878d23daccf6613b5178fd528b952a140d`, **MERGED** via squash `7a33a72f6033027f3a6e0a20707eac7179faf1c1`. Solicitação oficial, notas para o aplicativo e reforço de privacidade no Visitante.
- Arquivo `release/official-request.json`: `schema=1`, `enabled=true`, `version=0.03.71`, `code=54578`, `label=51377`, `previous_tag=v0.03.70-54577`, `qa_max_code=54577`. Release notes correspondentes `minVersionCode=54578`.
- A PR paralela #457 da Pokédex pessoal não foi mesclada no âmbito desta LT377.

## 3. Gates auditados

**PR de código #458 — 7/7 SUCCESS no mesmo HEAD:**

1. Node QA #43964687754
2. LT169 regressão Node completa #43964687800
3. LT211 core #43964687474
4. LT62 Android Java #43964687567
5. LT173 OTA #43964687771
6. PGS APK debug QA #43964687649
7. Secure beta/R8 #43964687751

Complementar **LT253 #43964687737 SUCCESS**.

**PR #459 — SHA final de request e privacidade:** Node QA #43965903964, LT169 #43965903968, LT211 #43965903898, LT62 Java #43965903877, LT173 OTA #43965903947, Secure beta/R8 #43965903847, preflight oficial #43965903895: **todos success**. O pipeline oficial pós-merge executou novamente testes internos e construiu/validou APK com a chave permanente, sem trocar a assinatura.

## 4. Mudanças funcionais LT377

- **Busca sem login** em P1 e P2: removido o bloqueio `Conecte a Conta 2 antes de usar esta Pokébola`. Uma Conta 1 ou 2 desconectada é visitante para as buscas públicas.
- **Seletor:** `Conta: Visitante`, `Conta 1: <nome do perfil ou Sem Login>`, `Conta 2: <nome do perfil ou Sem Login>`. Conta 1 mostra nome real somente após confirmação pelo site. Privacidade de rótulo respeitada.
- **Visitante isolado:** perfil WebView slot 0 somente quando `MULTI_PROFILE` disponível. Em Android sem esse recurso, usar uma conta desconectada para pesquisa pública P1/P2; nunca reutilizar cookies de conta autenticada como visitante separado.
- **Login oficial e fechamento:** Google/Discord apenas com controles oficiais PoGoCoordinates; leitura de link `/profile` é mera pista de navegação e não autenticação. Captura de nome/foto somente após prova de sessão; retorno ao PokeSearch quando a confirmação e leitura forem concluídas. Nenhum endpoint OAuth privado, cookies de navegador externo ou nome inferido.
- **Logout individual** mantém os dois overlays e atualiza a busca pública sem apagar filtros ou preferências. Interface do seletor não apresenta mais escolha de treinadores: vínculo deixou de ser requisito; dados históricos preservados.
- Preservados arte central da Pokébola e alinhamento óptico, overlays compactos, Localização, Favoritos, Editor Visual, Minior P/M/G, tutorial P1/P2, Busca Inteligente, Sequências/Monitor, Modo Noturno, API pública, PGSharp/Pokemod em instalações separadas, OTA e assinatura.

## 5. Limitações e testes pendentes — não inventar homologação

**Não foi realizada homologação real em celulares Android 11/12/13/14**, Samsung e densidades variadas, OAuth Google/Discord incluindo 2FA, recuperação de sessão expirada, retorno automático de WebView, foto/nome em todos os provedores, filtros em conta Visitante isolada, posição do badge, desfoque nativo, tela de 16 faixas, Favoritos, Minior Meteor/Core, TalkBack e PGSharp/Pokemod separadamente. Os testes de código e release asseguram compilação, segurança de publicação e integridade, mas **não comprovam que cada fluxo de login funciona em aparelho**. Login no Chrome externo não é importado automaticamente ao WebView.

Supervisão de UI não comprova caminhada; caminhada externa não comprova tentativa de captura; tentativa não comprova captura confirmada. A instalação exige confirmação do Android. A release anterior LT376 permanece imutável.

## 6. Documentação e continuidade

Auditoria funcional detalhada: [LT377_ARK_QA_GUEST_LOGIN_20261116.md](LT377_ARK_QA_GUEST_LOGIN_20261116.md). Política de publicação: [ARK_POLITICA_OBRIGATORIA_MERGE_PUBLICACAO.md](ARK_POLITICA_OBRIGATORIA_MERGE_PUBLICACAO.md). Continuidade: [LT378_PROMPT_CONTINUIDADE_APOS_LT377_20261116.md](LT378_PROMPT_CONTINUIDADE_APOS_LT377_20261116.md). Atualizar AGENTS.md e GUIA_MESTRE.md com esta evidência. **O ARK LT377 foi concluído em código, QA automatizado, merge e publicação; a homologação física permanece pendente e deve ser prioridade na LT378.**
