# LT125 QA-R2 — Samsung: sprites vazios no card e na coluna de resultados

Data: 26/10/2026. Branch: fix/lt125-firebase-and-costume-sprites-20261026.

## Evidência do usuário

- Foto Samsung com o card Noibat #714 (IV 15/15/15, 100%), sprite representado por losango ◇.
- Coluna à esquerda alterna algumas sprites carregadas e vários círculos ◉ de fallback.
- Isso **não** demonstra que os PNG 714 normal/shiny estão ausentes: a QA LT125 anterior verificou 1.025 base + 1.025 shiny no APK.
- Sem logs do Samsung não é possível provar que **todas** as ocorrências vazias compartilham a mesma causa.

## Defeito de código comprovado e correção

- O parser DOM `app/src/main/assets/probe.js` gera `form: ""` quando não encontra forma entre parênteses no nome do card, e pode gerar `image: ""` se a imagem lazy não expôs URL.
- O resolvedor `sprite_offline.js` anterior exigia `form === NORMAL/DEFAULT/species` para recuperar PNG local sem URL; **rejeitava a forma vazia** mesmo de espécies comuns. Resultado: `resolve({name:"Noibat",number:"#714",form:"",image:""})` não fornecia sprite.
- Solução: usar os 1.025 pares Dex→nome do `pokemon_catalog.json` como prova local de identidade. Em `form == ""`, somente Dex+nome iguais e sem costume/variante/região/formId dão acesso a `pokemon-sprites/base/{dex}.png` ou `shiny/{dex}.png`.
- Mesmo com URL externa/lazy, imagem normal comprovada passa a usar o sprite local, evitando depender de outra requisição de rede dentro do segundo WebView.
- Bloqueadas confusões de imagem como Dex de Noibat com nome Pikachu e costumes/regiões explícitos. Rotas exatas `forms/` e `costumes/` anteriores têm precedência preservada. API e DOM **não** são misturadas por essa mudança.
- Em `dock.html`, imagens já completas com `naturalWidth < 8` iniciam recuperação imediata; antes podiam deixar o marcador cinza por vários segundos.
- Teste automático `lt125-samsung-empty-form-sprites.test.js`: 1.025 normais + 1.025 Shiny resolvidas com forma vazia, casos negativos de nome divergente, traje e região e verificação de Noibat, Articuno Galar e Charmander Goggles.

## Inventário de 95 fontes recebido

O levantamento do usuário permanece **referência** e não ordem de ativação de 95 integrações. Para este defeito:

1. Fontes presentes na arquitetura: PoGoCoordinates DOM/API (#001/#003), PokeAPI/sprites + assets offline/cache (#004–006) e catálogo existente.
2. PokeMiners/pogo_assets (#012) permanece restrito a imagens exatas de trajes com commit/hash conhecidos; direitos de redistribuição não são concedidos automaticamente porque o repositório é público.
3. WatWowMap/pogo-data-api (#036), UIcons/wwm-uicons (#072/#073), bancos de tradução (#071) e outros (#074/#075) ficam apenas como fontes candidatas para identificar formas ainda não cobertas. NÃO adicionar feed, endpoint, telemetria ou dependência enquanto não houver teste de identidade/licença/requisitos.
4. Fontes de eventos, mapas e scanners não corrigem o sprite de um encontro já identificado; não aumentar a superfície de rede do PokeSearch.
5. A autorização do proprietário do app não substitui as licenças nem o consentimento dos provedores, e a frase "permissão verificada para todas as fontes" não é evidência documental por si só.

## Regressão/QA

- Base preservada: LT124 + ajustes LT125 existentes (Firebase, 2 Pokébolas independentes, chat, filtros, sons, results).
- O código é comum a resultados P1/P2 e card, sem copiar implementação secundária.
- QA-R2 usa `versionName 0.01.25`, `versionCode 54330` e nome de arquivo distinto; **não** substitui o binário QA original `54329`. Mudança de versionCode evita instalar APK com mesmo código de versão por engano.
- Critérios físicos pendentes: abrir Noibat normal e Shiny no Samsung; alternar P1/P2; verificar formas regionais e trajes; reiniciar e reabrir o card; conferir a URL fonte extraída do DOM e a diferença entre fallback legítimo de forma inexistente versus falha de rede/arquivo; verificar logs de WebView.
- Firebase em produção e testes chat entre dois usuários continuam pendentes; não promover QA para estável sem tais evidências.

## Fonte

Inventário textual fornecido pelo usuário em 26/10/2026; captura Samsung Noibat e coluna de resultados. Consulta de documentação da fonte PokeMiners: https://github.com/PokeMiners/pogo_assets e https://pokeminers.com/credits/.


## LT125 QA-R2 — APK assinado com recuperação Noibat e 317 variedades offline (26/10/2026)

- **Build QA R2 comprovada:** [GitHub Actions #40437190589](https://github.com/LucianoToscano/PokeSearch/actions/runs/40437190589) SUCCESS, [artifact #12704732660](https://github.com/LucianoToscano/PokeSearch/actions/runs/40437190589/artifacts/12704732660). Commit-fonte do APK `3aabc5450aaa057417a77d6f9db3ea24a2fb7b6c`; `versionName 0.01.25` / `versionCode 54330`; APK `PokeSearch-v0.01.25-LT125-Samsung-Sprites-QA-R2.apk` de **43.289.081 bytes**, SHA-256 `f9c5beeafdb8fbd413488a5f3283f02f770a6317a9ac6aa7f091b2dc39cebea1`. Assinatura Android v2 e certificado permanente `34766c15d09013ad65873f9976539c8fa2f826e917dae3af57ea628cad689e8e` verificados pelo CI e relatório extraído do artefato.
- **Auditoria binária independente:** manifest e bytes no APK conferidos: 1.025 base, 1.025 Shiny, 716 PNGs formas (82 anteriores: 80 LT116 + 2 LT119; mais 317 variedades normais e 317 Shiny de commit PokeAPI fixado), 10 trajes. **2.776/2.776 SHA-256 corretos; zero arquivo faltante**. Os 80 sprites LT116 conferem byte a byte com o ZIP original.
- **Causa de parte dos vazios Samsung:** `probe.js` transmite `form:""` em cards comuns; `sprite_offline.js` antigo exigia form explicitamente Normal/Default/nome, impedindo recuperar o PNG já no APK de Noibat #714 e outros sem URL. Correção usa 1.025 nomes Dex canônicos com verificações de forma/traje/região e resolve normal ou Shiny localmente. Em `dock.html`, imagem já completa mas quebrada inicia o fallback verificado imediatamente.
- **Regressão:** testes Node e Java, Android compile/R8/assinatura e auditoria de pacote PASS. Os testes novo `lt125-samsung-empty-form-sprites.test.js` cobrem 2.050 formas-base normais/Shiny sem rótulo e exclusões de variantes; `lt125-all-offline-varieties.test.js` cobre 317 variedades normal/Shiny; ajustes em testes legados que esperavam imagens HTTP.
- **Limites:** screenshot não demonstra que todos os círculos vazios têm a mesma causa; formas GO sem arte exata ainda podem usar placeholder neutro. Testes físicos do Samsung, Firebase contadores em produção e chat real entre dois usuários continuam pendentes. **PR #80 continua Draft; `main` LT124 preservada, nenhum merge/publicação estável.**
- **Fontes:** inventário de 95 itens fornecido pelo usuário é referência; não ativar novos scrapers no app. Direitos de imagens de terceiros são independentes da autorização do proprietário do app. Detalhes em [relatório Samsung/Fontes](POKESEARCH_LT125_QA_R2_SPRITES_SAMSUNG_FONTES.md).

