# LT185 — Otimização de tamanho do APK (QA, 29/10/2026)

**Base imutável:** LT184 / 0.01.84 / 54389, commit b3dd24839322029c4d6c4ce2e030ddb987625f0b; APK de 49.547.006 bytes.
**Nova proposta:** LT185 / 0.01.85 / 54390. Branch optimize/lt185-apk-size-20261029.

## Escopo implantado
- Otimização dos PNGs da Home, equipes, fundos e recursos Android mantendo caminhos, dimensões e transparência.
- Otimização de ícones de resultado (sete ícones de modos preservados nos nomes; exibição visual compacta já usa 17px) e clima V2.
- PNGQuant com qualidade mínima 92/100 e comparação visual do RGB composto em preto/branco; alterações só quando há economia maior que 3%.
- Geração de relatório por arquivo, quantidade economizada e SHA-256; alteração de binários gerada no runner QA e enviada para esta mesma branch antes dos testes.
- Preservados: PNG fonte do launcher (RoundIcon.java), nove imagens oficiais de clima com hashes imutáveis, todos os nomes dos assets, os áudios, sprites, JWT/login/API/DOM, duas Pokébolas, Doce Raro, alertas favoritos P1/P2, assinatura oficial.
- Não alterar arquivos Java, HTML, CSS, layout, AndroidManifest, filtros, limites ou comportamento do atualizador. Android R8 e shrinkResources permanecem ativados.

## Verificação / bloqueios
O workflow QA exige: testes Node (incluindo paridade P1/P2, LT184, Doce Raro e OTA), compilação Android R8, certificado v2 permanente, versionCode=54390, SHA-256, redução efetiva do APK em relação à LT184 e relatório de imagens.
**Não integrar ou distribuir** se houver regressão, queda visual evidente na Home, problemas de sprites ou alertas no Samsung. O APK QA precisa ser testado fisicamente; assinatura e testes automatizados não substituem o teste visual.
**Nenhum merge, Release pública, OTA para usuários ou substituição do Google Drive** está autorizado apenas por esta preparação de QA.

## Pendência do resultado
Os bytes finais serão determinados pelo workflow GitHub Actions. Não prometer 35 MB ou 25 MB sem medição. Uma segunda etapa de WebP e remoção de binários duplicados poderá ser proposta após verificação visual e dos testes de compatibilidade.
