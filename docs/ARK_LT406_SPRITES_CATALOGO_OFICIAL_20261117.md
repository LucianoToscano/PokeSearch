# ARK LT406 OFICIAL — Restaurar catálogo de sprites na Minha Pokédex

**Data:** 17/11/2026. **Origem:** LT405 v0.03.90 LT / 54597. **Destino:** **PokeSearch v0.03.91 LT / versionCode 54598 / label 51406**.

## Estado confirmado: release publicada
- [Release estável pública](https://github.com/LucianoToscano/PokeSearch/releases/tag/v0.03.91-54598), publicada em **17/11/2026 às 22:26:34 UTC**, `draft=false`, `prerelease=false`.
- [APK oficial permanente](https://github.com/LucianoToscano/PokeSearch/releases/download/v0.03.91-54598/PokeSearch-v0.03.91-LT.apk) `uploaded`, tamanho **61.749.310 bytes**, SHA-256 público `9624f5bc0b0f7a63a9c194aa230390e0f1ba3945e63c3e9b043009c74e8a80a8`.
- [Workflow oficial protegido #44189493629](https://github.com/LucianoToscano/PokeSearch/actions/runs/44189493629) **completed/success**: preflight, validação do pedido, preparação da versão e chave permanente, Node/OTA, geração de recursos, R8, assinatura Android, `apksigner`, SHA256SUMS, asset, release pública, validação final e limpeza de segredos. Certificado permanente SHA-256 `34766c15d09013ad65873f9976539c8fa2f826e917dae3af57ea628cad689e8e` conferido pelo workflow. SHA público obtido do GitHub/workflow, sem recálculo independente do APK baixado.

## PRs e evidências
- Código PR [#530](https://github.com/LucianoToscano/PokeSearch/pull/530) squash `3d2b04b371554f4b86f1c368242438cf9bf42d48`; head final testado `a138527dd4a09569da8a28517ae69b4a231b9326`.
- Release PR [#531](https://github.com/LucianoToscano/PokeSearch/pull/531) squash `7ed386c698cf28ff5fb45106edfa8e054563b6c1`; testes Node QA/LT169/LT211/LT62/LT173/Secure beta/R8 aprovados nas duas PRs.
- Corrigido em `PokedexSpriteStore.java` o `PINNED_COMMIT` truncado de 33 para 40 caracteres; a verificação errada descartava o manifesto inteiro `{}` e inutilizava os 3.850 índices GO + 2.213 legados. Testes de contrato LT400/LT405 agora exigem que o Java, o JS e o manifesto carregado tenham o mesmo pin. Não foi necessário alterar imagens, arquivos de terceiros ou identidade visual.
- Comparada com a LT398/0.03.83 (vídeo do proprietário com sprites anteriormente visíveis); explicação de código na [auditoria LT406](LT406_AUDITORIA_POKEDEX_MANIFESTO_CATALOGO_20261117.md).

## O que não foi homologado
**Não houve teste em Samsung Android 17 após a publicação.** O sucesso de build/CI não demonstra que nenhuma sprite aparecerá como losango no aparelho. É indispensável validar rede, cache, importação PGSStats e identidade exata das variantes. Pokémon sem PNG disponível ou sem acesso à fonte podem continuar sem imagem. Não prometer 100%.

Os dois inventários e os recursos existentes (editar, tags, filtros, fundos/notas, exclusão reversível, sincronização SAF e overlays P1/P2) foram preservados no código, sem alteração no Pokémon GO/PGSharp. Não compartilhar PNGs de terceiros no APK. **FastDev nunca é a distribuição pública.**

## Próxima continuidade
Seguir [LT407](LT407_PROMPT_CONTINUIDADE_APOS_LT406_20261117.md) para homologação física comparativa com 0.03.83, telemetria local de erros e correção de qualquer lacuna real. A validação visual permanece pendente, embora o ARK de publicação oficial LT406 tenha sido concluído.
