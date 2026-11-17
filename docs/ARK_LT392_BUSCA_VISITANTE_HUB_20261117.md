# ARK LT392 OFICIAL — PokeSearch v0.03.77 LT publicado (17/11/2026)

**STATUS FINAL — CÓDIGO INTEGRADO, APK OFICIAL ASSINADO E RELEASE VERIFICADA.**
- Versão: `0.03.77 LT`; `versionCode 54584`; `label 51392`; tag estável [v0.03.77-54584](https://github.com/LucianoToscano/PokeSearch/releases/tag/v0.03.77-54584).
- [APK público PokeSearch-v0.03.77-LT.apk](https://github.com/LucianoToscano/PokeSearch/releases/download/v0.03.77-54584/PokeSearch-v0.03.77-LT.apk): **61.209.357 bytes**, asset `uploaded`, SHA-256 publicado pelo GitHub `d08289bab23e9fc7536955b0d00c0071e8cb5276d226c9483ca2c182a381f3e3`. Não foi feito download independente nem novo hash local neste chat.
- [Workflow protegido permanente #44036551146](https://github.com/LucianoToscano/PokeSearch/actions/runs/44036551146): `completed/success` sobre commit `fb235a5cde7079937a845b1e08118d11a6301cfc`; confirmação dos passos Node/OTA, recursos, R8/compilação, certificado permanente, validação do APK, publicação do asset e verificação de hash público. Certificado esperado e verificado pela etapa assinadora: SHA-256 `34766c15d09013ad65873f9976539c8fa2f826e917dae3af57ea628cad689e8e`.
- PR de código [#488](https://github.com/LucianoToscano/PokeSearch/pull/488): HEAD validado `db01103a9f6ad94f9f158de6f16c489b1ff9c097`, merge squash `c428db970040c254ebe55b2bbd892b0008bf52e9`; PR de versão e notas embutidas [#489](https://github.com/LucianoToscano/PokeSearch/pull/489): HEAD validado `9120cf2aae9ff6200225203d4bab6b8a737a2523`, squash `fb235a5cde7079937a845b1e08118d11a6301cfc`. `main` preservada com histórico; nenhum canal DEV/FastDev utilizado para distribuição.

## Evidência inicial: relatório da v0.03.76
Relatório do PokeSearch criado **17/11/2026 03:23:57**, Samsung SM-S928B / Android 17 (API 37), busca sem login, Shiny=false e AUTO 3m.
- **03:12:53 — SEARCH_RESULT:** site forneceu 5 cartões identificados em modo raw, validação `live-form`.
- **03:13:18 — FILTER:** cinco cartões vistos, mas cinco não tinham IV individual verificável para a filtragem do app; a existência de cinco cartões não comprova IV100.
- **03:14:18, 03:16:14, 03:20:46, 03:23:46 — FILTER:** atualização do site não comprovada após Search; lista anterior preservada, sem disparar falsos alertas.
- **03:13–03:22 — API:** coleções independentes de 10 e 9 resultados elegíveis em outras buscas, não equiparáveis automaticamente aos cinco visitantes. Consulta de login retornou `login necessário` como rótulo de sessão, embora a rota pública de pesquisa estivesse acessível.
- Captura comparativa anterior mostrava percentuais de IV **67%, 76%, 44%** no PoGoCoordinates enquanto a Pokébola filtrava **100%**. Esses encontros não podem virar IV100 por decisão do formulário.

## Hipótese/causa técnica corrigida
O coletor `app/src/main/assets/probe.js` buscava cartões com rótulos que incluíam `LOCATION`. Layout móvel/visitante podia mostrar localização sem esse rótulo, fazendo o seletor parar no ancestral errado e perder a badge do IV. A evidência da falha era indireta (relatório + captura), não um snapshot do DOM real autenticado ou visitante.

### Modificações efetivas no código
1. `cardRoots()` agora procura o maior ancestral seguro de um encontro com Pokédex, CP e estatísticas/percentual, sem exigir a palavra `LOCATION`, e limita ascensão quando surgem várias identidades/ações. Mantido fallback do elemento já conhecido para layouts antigos.
2. Leitura do percentual aceita um valor numérico único dentro do cartão e compatível com a grade IV (0–45 pontos). Continua a validação estrita da filtragem selecionada, rejeitando IVs diferentes do filtro. Nenhum valor é inferido de controles globais ou dado como 100% sem evidência.
3. O coletor de submissão reconhece o ciclo real de `Searching/loading` e conclusão como indício de refresh mesmo com resultados iguais. Resultados de busca anterior continuam pendentes sem nova evidência, evitando notificações falsas; tempo decorrido isoladamente não confirma atualização.
4. Home deixa as duas Pokébolas sem o badge superior de login. O menu compacto PoGoCoordinates passa a conter **dois ícones de Pokébola** para vincular independentemente P1 e P2 a **Visitante, Conta 1 ou Conta 2**. Mantidas contas OAuth isoladas, troca explícita e reinício apenas do overlay associado.
5. Adicionado teste `app/tests/lt392-mobile-guest-account-hub.test.js` cobrindo 5 cartões móveis sem `LOCATION`, percentuais 67/76/44/100/0, prevenção de ambiguidade, vínculo de conta e proteção de atualização, além de atualização dos contratos legados LT170, LT341–345, LT376e, LT390 e UX.

## CI verificado
**PR #488, SHA db01103a9... — todos os gates necessários aprovados:**
- Node QA [#44035120300](https://github.com/LucianoToscano/PokeSearch/actions/runs/44035120300) SUCCESS
- Regressão Node LT169 [#44035120475](https://github.com/LucianoToscano/PokeSearch/actions/runs/44035120475) SUCCESS
- QA logic LT211 [#44035120287](https://github.com/LucianoToscano/PokeSearch/actions/runs/44035120287) SUCCESS
- Java LT62 [#44035120294](https://github.com/LucianoToscano/PokeSearch/actions/runs/44035120294) SUCCESS
- OTA LT173 [#44035120285](https://github.com/LucianoToscano/PokeSearch/actions/runs/44035120285) SUCCESS
- PGS APK QA [#44035120302](https://github.com/LucianoToscano/PokeSearch/actions/runs/44035120302) SUCCESS
- FastDev smoke (apenas teste, não distribuição) [#44035120342](https://github.com/LucianoToscano/PokeSearch/actions/runs/44035120342) SUCCESS
- Secure beta/R8 [#44035120361](https://github.com/LucianoToscano/PokeSearch/actions/runs/44035120361) SUCCESS

**PR #489, SHA 9120cf2... — testes de versão:**
Node [#44036212208](https://github.com/LucianoToscano/PokeSearch/actions/runs/44036212208), LT169 [#44036212344](https://github.com/LucianoToscano/PokeSearch/actions/runs/44036212344), LT211 [#44036212358](https://github.com/LucianoToscano/PokeSearch/actions/runs/44036212358), LT62 [#44036212241](https://github.com/LucianoToscano/PokeSearch/actions/runs/44036212241), LT173 [#44036212128](https://github.com/LucianoToscano/PokeSearch/actions/runs/44036212128), FastDev smoke [#44036212209](https://github.com/LucianoToscano/PokeSearch/actions/runs/44036212209), Secure beta/R8 [#44036212165](https://github.com/LucianoToscano/PokeSearch/actions/runs/44036212165) e preflight de release protegida [#44036212206](https://github.com/LucianoToscano/PokeSearch/actions/runs/44036212206) SUCCESS. Workflows de release opcionais/skipped não foram computados como aprovados.

## Limites honestos e QA físico pendente
Não foi controlado ou instalado o APK em telefone Samsung neste chat; nenhum teste real de Google/Discord/MFA ou DOM ao vivo do PoGoCoordinates foi executado. CI não prova que exatamente cinco cartões reais serão retornados ou que o site aceita todos os filtros. O visitante recebe **até** cinco resultados quando o próprio site os fornece, inclusive zero ou um; um resultado com IV 67/76/44 não atende à busca de IV 100. HTTP 429, cota oficial de coordenadas e autenticação devem ser respeitados, nunca burlados limpando cookies ou reautenticando de forma abusiva. Para atualização instalada, o Android exige confirmação do usuário.

**Próxima tarefa:** [ARK LT393 — continuidade](LT393_PROMPT_CONTINUIDADE_APOS_LT392_20261117.md). Preservar P1/P2, busca visitante/IV, as assinaturas, o guia mestre e a obrigação de ARK concluir com publicação estável oficial após gates reais.
