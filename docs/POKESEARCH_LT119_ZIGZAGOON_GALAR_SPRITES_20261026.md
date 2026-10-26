# PokeSearch LT119 — Zigzagoon de Galar, sprite normal e Shiny no card

Data: 26/10/2026. Repositório: LucianoToscano/PokeSearch.

## Evidência original
Print físico Samsung fornecido pelo usuário: duas Pokébolas flutuantes com filtros visuais IV 0% e 100%; card Zigzagoon #263, forma Galarian, Shiny, PC 114, nível 8, A/D/S 15/15/15, exibindo ◇ onde deveria aparecer uma imagem. **O print é evidência de falha visual na LT118, não evidência de falha em coordenadas/notificações.** Imagem particular não republicada no repositório.

## Causa identificada no código
- `api_result_contract.js` recusa acertadamente uma imagem base quando o encontro é uma forma regional diferente.
- `sprite_offline.js` localizava arquivos offline apenas para variantes padrão verificadas, sem o mapeamento inequívoco Zigzagoon/Galar.
- O card `detail.html` e a lista `dock.html` usam o mesmo módulo, propagando a lacuna quando `image=""`.

## Correção aplicada e compartilhada
- Mapeamento exato da variedade PokeAPI `10174` para Zigzagoon `#263` Galarian/Galar, sem traje. Não atingir Zigzagoon padrão, Linoone ou outras formas não verificadas.
- `forms/zigzagoon-galar.png` e `forms/zigzagoon-galar-shiny.png` adicionados à geração do APK, **sem download em tempo de execução**. Fonte PokeAPI/sprites fixada no commit `d8c2fb78563e28ad7b3abe938cf6e79998d04e90` e restrita aos caminhos varietais `10174.png` e `shiny/10174.png`.
- Hashes SHA-256 registrados no manifesto do pacote, PNGs validados e build interrompido caso falhem.
- Resolvedor usado nos dois WebViews e, como `SecondaryOverlayService extends OverlayService`, aplicado às duas Pokébolas sem zerar preferências.
- Teste LT119 cobre variantes shiny e normal, P1/P2, mesma renderização nos dois componentes e rejeição de formas/roupas desconhecidas.
- 2.050 sprites comuns continuam intactos. Total para QA: 2.050 comuns + 2 regionais.

## Evidências verificadas
- Branch `fix/lt119-galarian-sprite-parity-20261026` fonte do binário: `b9a3e494dc63a4561b211dc052f79015e1916938`.
- GitHub Actions `#40406601954`: SUCCESS, incluindo Node, compilação Android, Gradle/R8, assinatura Android v2 e confirmação dos dois recursos no APK.
- Artefato `#12690744356`: `PokeSearch-v0.01.19-LT-Galarian-Sprites-QA.apk`.
- APK: `versionName=0.01.19`, `versionCode=54323`, `applicationId=com.lucianotoscano.pokesearch`, 41.754.630 bytes.
- SHA-256: `b649dee85e84e879ff34125d154d91d46ebd380d459ed54c0774ba30a096db66`.
- Certificado v2: `34766c15d09013ad65873f9976539c8fa2f826e917dae3af57ea628cad689e8e`.
- Sprites: normal SHA-256 `649b21a22030afdfd17c88e22224a2200dc871b16e7da21798e1bdc34ca78cbb`; Shiny `9ef64df9b5802f94056e890ba3576dac7ae74a31f85414b76da41f42122942bf`.
- PR #74 MERGED, commit `0c3ce05470c6b5857fc4d8c1aad665eb64f5e1ad`.

## QA física ainda necessária
No Samsung, abrir os resultados 0% e 100% ao mesmo tempo; exibir Zigzagoon de Galar Shiny 15/15/15, conferir PNG exato no card e na lista, depois repetir normal e verificar ausência de sprite base errado em outras formas. Avaliar Shiny ON/OFF e API/DOM e notificações separadamente. Testes Node e CI NÃO comprovam renderização no aparelho.

**Distribuição:** APK de QA apenas, nenhuma promoção automática a release oficial nem alteração de Firebase. Outros itens de auditoria LT116 ainda não foram integralmente solucionados.
