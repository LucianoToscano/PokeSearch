# ARK LT390 — Publicação oficial encerrada e verificada (17/11/2026)

**STATUS FINAL — OFICIAL, INTEGRADO E PUBLICADO.** Versão **PokeSearch v0.03.75 LT / versionCode 54582 / label 51390**. Release pública [v0.03.75-54582](https://github.com/LucianoToscano/PokeSearch/releases/tag/v0.03.75-54582), [APK assinado](https://github.com/LucianoToscano/PokeSearch/releases/download/v0.03.75-54582/PokeSearch-v0.03.75-LT.apk), **61.207.501 bytes**, digest GitHub SHA-256 `bdc5cafa28d0ab4d61e3c096385037441d9fc800fd630bf2da02098e64b88de8`. Certificado permanente verificado pelo workflow: `34766c15d09013ad65873f9976539c8fa2f826e917dae3af57ea628cad689e8e`. [Workflow de publicação #44024185582](https://github.com/LucianoToscano/PokeSearch/actions/runs/44024185582): **completed/success**, preflight, R8, recursos, APK, assinatura, upload público, hash e limpeza de material privado **SUCCESS**. Hash conforme GitHub e verificações do workflow; sem alegar recálculo local independente a partir dos bytes baixados.

**Merge de código:** [PR #483](https://github.com/LucianoToscano/PokeSearch/pull/483) squash `e120e7a6e4f44ebd689e8cd5074c986e77356fb2`, head testado `a89cbfa4dec26c09e3c00f1b9c290e2ee1f994e7`. Gates completos nessa revisão: Node [#44023233864](https://github.com/LucianoToscano/PokeSearch/actions/runs/44023233864), LT169 [#44023233803](https://github.com/LucianoToscano/PokeSearch/actions/runs/44023233803), LT211 [#44023233829](https://github.com/LucianoToscano/PokeSearch/actions/runs/44023233829), Java LT62 [#44023233986](https://github.com/LucianoToscano/PokeSearch/actions/runs/44023233986), OTA LT173 [#44023233782](https://github.com/LucianoToscano/PokeSearch/actions/runs/44023233782), PGS APK QA [#44023233775](https://github.com/LucianoToscano/PokeSearch/actions/runs/44023233775), LT253 [#44023233780](https://github.com/LucianoToscano/PokeSearch/actions/runs/44023233780), FastDev [#44023233881](https://github.com/LucianoToscano/PokeSearch/actions/runs/44023233881), Secure Beta/R8 [#44023233826](https://github.com/LucianoToscano/PokeSearch/actions/runs/44023233826), **todos SUCCESS**. O Secure Beta havia sido SKIPPED apenas enquanto PR era draft; foi executado depois de marcar ready e sincronizar a revisão. A antiga documentação de QA abaixo é histórico, não o estado final.

**Merge de versão:** [PR #484](https://github.com/LucianoToscano/PokeSearch/pull/484) squash `e13a061f2e51e5a948a999e3b4c9af2df7350716`, pedido monotônico 0.03.75/54582/label 51390; checagens de preflight oficial, Node, LT169, LT211, Java, OTA, FastDev, Secure Beta/R8 passaram. Uma alteração concorrente preservada no manifesto FastDev `fastdev/latest.json` não modificou os artefatos oficiais nem trouxe conflito de conteúdo.

**Entregas:** AUTO padrão 3 minutos, sem 3s e com migração de preferências; atualização manual imediata fora do temporizador (429 do site e concorrência preservados); cards de resultados sem parágrafos técnicos repetitivos; identificação #129 Magikarp/#580 Ducklett por Dex local com proteção de forma e identidade; extração do visitante reconhecendo `Showing N results` e separando cartões; CTA 🔒+5 transparente e compacto, sem inventar cinco Pokémon adicionais. `release_notes.json` registra Novidades internas LT390.

**Pendente físico (não bloqueia registro de publicação verificada):** Samsung real Android 11–14, P1/P2, visitante/autenticado, OAuth Google/Discord, nome/foto, sprites/variantes, até cinco resultados reais do provedor, filtro IV 100%, botões de coordenadas, HTTP 429, telas e acessibilidade. Nenhum teste automatizado prova captura ou caminhada real. Instalação no aparelho exige aprovação do Android.

**Próximo prompt:** [LT391](LT391_PROMPT_CONTINUIDADE_APOS_LT390_OFICIAL_20261117.md). Versão anterior v0.03.74 preservada.

---

## Histórico de QA anterior à publicação (superado pela conclusão acima)

# ARK LT390 — Correções de resultados, atualização e sprites (17/11/2026)

## Reabertura após autorização ARK
A PR #483 foi marcada pronta para revisão, deixando de ser rascunho. A ausência anterior do Secure beta/R8 foi causada pela regra do workflow de ignorar draft PR; essa verificação deve ser executada por novo evento `synchronize` no HEAD atualizado. A autorização do proprietário para concluir o ARK supera a condição QA histórica deste documento, mas não dispensa qualquer gate de segurança, assinatura ou publicação.

## Estado verificado
- Base oficial: v0.03.74 LT, versionCode 54581, release v0.03.74-54581.
- PR de desenvolvimento [#483](https://github.com/LucianoToscano/PokeSearch/pull/483), branch `fix/lt390-refresh-guest-sprites-card-20261117`, HEAD de QA `bb330bd171aab96c08827edcbfb631387e8fe694`.
- Testes PASS no HEAD: Node QA [44022516987](https://github.com/LucianoToscano/PokeSearch/actions/runs/44022516987), LT169 completo [44022516663](https://github.com/LucianoToscano/PokeSearch/actions/runs/44022516663), LT211 [44022516687](https://github.com/LucianoToscano/PokeSearch/actions/runs/44022516687), Java LT62 [44022516713](https://github.com/LucianoToscano/PokeSearch/actions/runs/44022516713), OTA LT173 [44022517075](https://github.com/LucianoToscano/PokeSearch/actions/runs/44022517075), PGS APK debug QA [44022516841](https://github.com/LucianoToscano/PokeSearch/actions/runs/44022516841), LT253 visual [44022516635](https://github.com/LucianoToscano/PokeSearch/actions/runs/44022516635), FastDev [44022516697](https://github.com/LucianoToscano/PokeSearch/actions/runs/44022516697).
- **Gate pendente:** Secure beta APK (private test) [44022516680](https://github.com/LucianoToscano/PokeSearch/actions/runs/44022516680) foi **SKIPPED**, não SUCCESS. O workflow de APK oficial também foi SKIPPED. Não afirmar que o ciclo de publicação foi concluído.
- **Merge/release:** PR #483 permanece aberta, sem merge; não há nova versão oficial nesta etapa. Regra ARK exige concluir integração/publicação após satisfazer gates, sem contorná-los.

## Correções preparadas
1. Intervalo automático padrão 3 minutos, remoção do preset 3 segundos e migração de preferências legadas. Atualização manual independente do temporizador; HTTP 429 do provedor continua respeitado.
2. Cards sem diagnósticos repetitivos de proveniência (API confirmada, IV, km, rank, Shiny), mantendo verificações internas.
3. Resolução de identidade pelo Dex para rótulos genéricos: #129 Magikarp e #580 Ducklett; descarta imagem remota de espécie incerta, não inventa forma.
4. Extração DOM dos cards visitantes individualizada; cabeçalho `Showing N results` reconhecido. O limite 5 de visitantes não significa cinco encontros garantidos, especialmente com filtro IV 100%.
5. Indicador transparente e compacto de cadeado +5, sem fundo cinza e sem perder a ação de login.
6. Teste novo `app/tests/lt390-refresh-guest-sprites.test.js` incorporado à regressão Node obrigatória.

## Pendente para encerrar ARK
- Executar/validar Secure beta/R8 no SHA exato da PR (workflow skipped não é aprovação).
- Com gate verde, fazer squash merge na main, preparar versionCode monotônico >54581, release_notes e official-request, submeter e testar PR de versão, publicar exclusivamente pelo workflow protegido `PokeSearch permanent official release`, validar assinatura/hash/asset público.
- Registrar no Guia Mestre e AGENTS.md os SHAs, runs e tag oficial após publicação.
- Homologação física Samsung P1/P2: refresh manual, AUTO 3m, cinco cards quando realmente presentes no site, login visitante/autenticado, #129/#580, HTTP 429, retrato/paisagem, filtros e coordenadas. QA automatizado não substitui validação física.

## Prompt de continuidade LT391
Continue o ARK LT390 a partir da PR #483 e do documento `docs/ARK_LT390_REFRESH_GUEST_SPRITES_20261117.md`. Leia AGENTS.md e política obrigatória de merge/publicação. Verifique o HEAD da PR e o estado da main, execute o Secure beta/R8 obrigatório que foi skipped e não confunda skip com sucesso. Se todos os gates estiverem verdes, integre por squash, crie a próxima versão monotônica, publique pelo workflow oficial protegido e comprove release pública, APK, assinatura e digest. Registre o ARK completo no Guia Mestre, atualize AGENTS.md e entregue o próximo prompt. Não invente cinco encontros: compare a quantidade real fornecida pelo PoGoCoordinates e a leitura do PokeSearch. Marque homologação física como pendente se não realizada.
