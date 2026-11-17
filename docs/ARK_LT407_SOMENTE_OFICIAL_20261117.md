# ARK LT407 — Exclusividade PokeSearch oficial (17/11/2026)

**RELEASE OFICIAL PUBLICADA E VERIFICADA:** PokeSearch **v0.03.92 LT / versionCode 54599 / label 51407**, [release estável](https://github.com/LucianoToscano/PokeSearch/releases/tag/v0.03.92-54599) publicada em **2026-11-17T22:50:33Z**, draft=false/prerelease=false. [APK permanente assinado](https://github.com/LucianoToscano/PokeSearch/releases/download/v0.03.92-54599/PokeSearch-v0.03.92-LT.apk) com **61.749.810 bytes**, SHA-256 público `937e2ded83797ae23df195d3435bea0b5400493652053c88ca015427e09acf06`, asset uploaded. [Workflow protegido #44193252703](https://github.com/LucianoToscano/PokeSearch/actions/runs/44193252703) **completed/success**, HEAD `8dd44e477e07fbb94f568c922f5f74bdc1277cb3`: preflight, Node/OTA, geração assets, R8, assinatura v2/certificado permanente `34766c15d09013ad65873f9976539c8fa2f826e917dae3af57ea628cad689e8e`, checksum, upload e limpeza de segredo. Os dados de hash foram verificados no workflow/API GitHub, sem recomputação independente de bytes baixados neste ambiente.

## Integração e alterações
- [PR de código #532](https://github.com/LucianoToscano/PokeSearch/pull/532), squash `eca9865d1d43565f7836de9c6b41de2d741a220d` (head testado `79b8710e1c8de75d15ac1fdc9a6aa180fcf6816a`) remove **36 arquivos** FastDev/Preview e modifica/introduz contratos em **15 arquivos**: scripts, workflows, Android sourceSet preview, manifest, buildType/assinatura DEV, pacote alternativo, bypass de integridade e OTA, Home e documentação. Nenhuma imagem, inventário ou tela principal redesenhada.
- [PR de versão #533](https://github.com/LucianoToscano/PokeSearch/pull/533), squash `8dd44e477e07fbb94f568c922f5f74bdc1277cb3`, head testado `861420b7be42a70cf9b6c4ebe76ee4b216955046`, release_notes / official-request monotônicos e QA Node/LT169/LT211/LT62/LT173/R8 aprovados.
- O QA Secure passa a ser **sem upload de APK paralelo**. Sua compilação efêmera segue existindo apenas para verificar segurança, e os arquivos são apagados ao fim do job.
- Uma varredura de árvore após o merge LT407 encontrou **0** caminhos executáveis de FastDev/Preview, nenhum workflow de FastDev/Preview e apenas a auditoria `docs/LT407_AUDITORIA_REMOCAO_FASTDEV_OFICIAL_ONLY_20261117.md` contendo FastDev no nome.
- Remoção adicional de workflow legado `lt146-signed-update-qa.yml` sugerida pela observação de execução após o lançamento: não é o canal oficial e emite APK QA histórico, portanto não deve permanecer ativo.

## O que NÃO foi excluído automaticamente (administração do GitHub)
- Foram identificadas pelo menos **42 releases antigas `fastdev-*`** na página de 100 releases mais recentes e **15 branches com "fastdev" no nome** na busca do GitHub.
- O conector disponível nesta sessão não permite **DELETE de releases/tags/branches, environments ou secrets**. O código foi removido da branch oficial, mas esses itens históricos **continuam existentes** até a exclusão administrativa no GitHub.
- Os arquivos de histórico em commits anteriores e aparelhos Android já instalados tampouco são apagados ao atualizar o repositório. Não declarar limpeza total do GitHub ou desinstalação remota.
- A credencial de assinatura **oficial** deve ser preservada. Apenas as credenciais/ambiente dedicados ao FastDev podem ser revogados na administração, depois de conferir que não são necessários ao workflow oficial protegido.

## Qualidade, segurança e continuidade
O APK novo preserva o pacote `com.lucianotoscano.pokesearch`, ícones, Home, overlays P1/P2, os dois inventários, sprites LT406, PGSStats SAF, fundos, notas e seleção. Nenhuma mutação no Pokémon GO/PGSharp.

**Sem homologação física Samsung Android 17:** não declarar que 100% das sprites funcionam, nem que o app DEV foi desinstalado do dispositivo. [LT408](LT408_PROMPT_CONTINUIDADE_APOS_LT407_20261117.md) prioriza validação física e exclusão administrativa dos resíduos legados.
