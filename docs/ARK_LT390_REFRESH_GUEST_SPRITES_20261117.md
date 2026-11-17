# ARK LT390 — Correções de resultados, atualização e sprites (17/11/2026)

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
