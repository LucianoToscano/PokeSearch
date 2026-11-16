# POKESEARCH — ARK LT378 — Prompt Mestre de Continuidade

Continue o PokeSearch sem reiniciar nem substituir os componentes anteriores.

## Estado de partida

- Repositório: `LucianoToscano/PokeSearch`; branch principal `main`.
- Linha LT377 integrada por PR #458 (código Visitante/contas), PR #459 (solicitação da publicação e blindagem de cookies).
- Versão **oficial confirmada** `0.03.71`, `versionCode 54578`, label `51377`, release pública `v0.03.71-54578`, APK `PokeSearch-v0.03.71-LT.apk`, SHA-256 `5bcdb1e358e746b3038bc1b7ceb2a7f38cdd03b8063943b56cebfadc3f96cf27`, publicada em 16/11/2026 às 22:08:02 UTC. Verifique novamente `releases/latest` e workflow oficial em toda nova sessão.
- Workflow oficial LT377: https://github.com/LucianoToscano/PokeSearch/actions/runs/43966395928; SHA de publicação `7a33a72f6033027f3a6e0a20707eac7179faf1c1`. Obter a conclusão e os metadados do APK diretamente do GitHub.
- QA código LT377: PR #458 HEAD `398a6be3b3be4618df9c7817d0567a1f114617fe`, 7/7 success, extra LT253 success. QA release PR #459 HEAD `011c34878d23daccf6613b5178fd528b952a140d`, preflight e gates aprovados.
- Não misturar a PR #457 da Pokédex pessoal com os ajustes de autenticação.

## Leia antes de desenvolver

`AGENTS.md`; `docs/GUIA_MESTRE.md`; `docs/ARK_POLITICA_OBRIGATORIA_MERGE_PUBLICACAO.md`; `docs/LT377_ARK_QA_GUEST_LOGIN_20261116.md`; `docs/LT376_ARK_RELEASE_OFICIAL_20261116.md`; `release/official-request.json`; `app/src/main/assets/release_notes.json`; encerramento oficial da LT377 quando existir.

## Foco prioritário — homologação física dos logins e Visitante

1. Testar P1 e P2 em Android 11/12/13/14 e Samsung com Google, Discord, logout individual, foto/nome oficiais, expiração de cookies e recuperação de sessão. Testar o fechamento automático e os caminhos de erro/retorno do OAuth. **Não** marcar login confirmado por avatar da página pública, nem inventar OAuth, PKCE, cookies ou URLs privadas do PoGoCoordinates. Se o provedor Google recusar WebView embutida, registrar a limitação e avaliar apenas mecanismos oficiais disponibilizados pelo site.
2. Exibir opções `Conta: Visitante`, `Conta 1: <nome validado ou Sem Login>`, `Conta 2: <nome validado ou Sem Login>`. Cada Pokébola pode fazer busca pública sem login; perfil Visitante isolado requer MULTI_PROFILE. Em WebView sem essa capacidade, conta padrão desconectada pode operar em modo convidado, mas não criar isolamento falso ou mesclar as duas sessões.
3. Desativar definitivamente a escolha de treinadores na UI atual enquanto o provedor não a oferecer; preservar dados históricos. O PokeSearch é complemento do serviço, não substituto do OAuth oficial.
4. Validar layouts dos botões de escolha de conta 2 px acima do centro óptico branco das artes de Pokébolas P1/P2, sem alterar PNG.

## Revisão de regressões gerais

Conferir as 16 faixas de localização sem corte e a aplicação por toque no campo KM; popup Favoritos junto da barra; alça de seis pontos circulares 2×3; Editor Visual com medidas legíveis, fundo/desfoque e transparência 50%; Minior Meteor/Core e sprites P/M/G; tutorial apenas P1/P2; busca e filtros independentes; favorito; Busca Inteligente; Sequências, Monitor; Modo Noturno; compatibilidade PGSharp e Pokemod em instalações separadas; autenticação, OTA, preferências, assinatura permanente e dados salvos.

Distinguir estados: `supervisão`, `caminhada externa`, `tentativa de captura`, `captura confirmada`. Nunca marcar captura confirmada por um movimento, detecção ou toque.

## Gates e ARK irrevogável

Executar Node QA, LT169, LT211, LT62 Java, LT173 OTA, PGS debug QA, Secure beta/R8 e testes de regressão. Documentar separadamente testes automatizados comprovados, QA manual efetivamente realizado e pendências.

**ARK é o ciclo completo autorizado**, não apenas análise ou PR: auditar, corrigir, testar, integrar na `main`, incrementar versionCode monotonicamente, solicitar o workflow permanente oficial assinado, verificar assinatura/certificado/versão/SHA-256/digest/release pública, atualizar AGENTS e Guia Mestre, registrar evidências e gerar o próximo prompt. Não contornar falhas de CI, aprovações ou proteções. Não declarar publicação concluída enquanto o APK público não estiver comprovado. Preservar as versões antigas e a assinatura Android permanente.

A próxima LT deverá iniciar pelo estado real da release no GitHub, com prioridade para a homologação física do login, da seleção Visitante e dos overlays antes de acrescentar funcionalidades.
