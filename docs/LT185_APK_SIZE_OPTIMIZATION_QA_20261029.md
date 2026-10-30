# LT185 — Otimização de tamanho do APK (QA, 29/10/2026)

**Base imutável:** LT184 / 0.01.84 / 54389, commit b3dd24839322029c4d6c4ce2e030ddb987625f0b; APK de 49.547.006 bytes.
**Nova proposta:** LT185 / 0.01.85 / 54390. Branch optimize/lt185-apk-size-20261029.

## Escopo implantado
- Otimização dos PNGs da Home, equipes, fundos e recursos Android mantendo caminhos, dimensões e transparência.
- Otimização dos ícones sem contrato de hash fixo. Ícones StarGL, StarUL e StarIVRaw originais intactos por contrato LT57; quatro imagens SupportV2 também preservadas byte a byte; o menu continua exibindo-os em 17px. Os ícones oficiais de clima V2 permanecem intactos por contrato de integridade.
- PNGQuant com qualidade mínima 92/100 e comparação visual do RGB composto em preto/branco; alterações só quando há economia maior que 3%.
- Geração de relatório por arquivo, quantidade economizada e SHA-256; alteração de binários gerada no runner QA e enviada para esta mesma branch antes dos testes.
- Preservados: PNG fonte do launcher (RoundIcon.java), nove imagens legadas, dezoito imagens de clima V2 e StarGL/StarUL/StarIVRaw com hashes imutáveis, todos os nomes dos assets, os áudios, sprites, JWT/login/API/DOM, duas Pokébolas, Doce Raro, alertas favoritos P1/P2, assinatura oficial.
- Não alterar arquivos Java, HTML, CSS, layout, AndroidManifest, filtros, limites ou comportamento do atualizador. Android R8 e shrinkResources permanecem ativados.

## Verificação / bloqueios
O workflow QA exige: testes Node (incluindo paridade P1/P2, LT184, Doce Raro e OTA), compilação Android R8, certificado v2 permanente, versionCode=54390, SHA-256, redução efetiva do APK em relação à LT184 e relatório de imagens.
**Não integrar ou distribuir** se houver regressão, queda visual evidente na Home, problemas de sprites ou alertas no Samsung. O APK QA precisa ser testado fisicamente; assinatura e testes automatizados não substituem o teste visual.
**Nenhum merge, Release pública, OTA para usuários ou substituição do Google Drive** está autorizado apenas por esta preparação de QA.

## Resultado QA confirmado (sem distribuição)
- Branch fonte QA: `9f5206be1852b54fe65463b17eccb1b86bb652c7`.
- [Action #40986743734 — SUCCESS](https://github.com/LucianoToscano/PokeSearch/actions/runs/40986743734).
- APK oficial LT184: **49.547.006 bytes**. APK LT185 de QA **43.770.614 bytes** — **5.776.392 bytes a menos (11,66%)**.
- PNG no Git: **50 arquivos otimizados; economia cumulativa 7.123.660 bytes**.
- APK de teste `PokeSearch-v0.01.85-LT185-Size-QA.apk`, versionCode **54390**, v2 permanente e R8 verificados; ZIP `PokeSearch-LT185-54390-Size-QA-Assinado` do GitHub Actions: artefato ID **12947133511**, 41.275.319 bytes.
- A Action checou `SHA256SUMS.txt`, sem imprimir o SHA completo nos logs; o valor encontra-se dentro do artefato verificado. Não inventar digest.
- Node, compilação Java, testes completos P1/P2, Doce Raro, OTA e reconstrução dos sprites offline aprovados.
- Não foram feitos merge, Release pública, distribuição OTA ou substituição do APK no Drive. A LT184 permanece a versão pública.
- A homologação visual e de notificação real no Samsung ainda é necessária; meta de 35 MB ainda não atingida. WebP/duplicatas/áudio podem ser segunda etapa segura.

