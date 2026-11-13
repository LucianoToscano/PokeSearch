# LT330 — Correção da publicação oficial dos masters Edu 512px (13/11/2026)

## Diagnóstico real

A branch `main` já contém a coleção LT330 com 68 imagens transparentes em 512×512 (reconstituídas a partir dos arquivos `Sprites_Edu.zip`, preservando 42.png byte a byte). O carregador `EduSpriteMasters.java` emprega 13 fragmentos de 10.372.393 bytes e valida SHA-256, com fallback seguro de 128 px.

O workflow protegido [#43370030541](https://github.com/LucianoToscano/PokeSearch/actions/runs/43370030541) compilou o APK assinado, verificou integridade dos recursos anteriores e validou o certificado, porém o passo **Validate APK and signer** encerrou com falha **apenas no orçamento de tamanho**: APK produzido com **46.621.576 bytes** contra limite anterior **37.000.000 bytes** (aplicável às versões anteriores à LT330). Nenhuma Release LT330 foi publicada nessa execução. Última Release pública confirmada antes da correção: LT329 `v0.03.28-54534`.

## Correção

- Aumentado somente o **limite superior de tamanho** do APK para **49.000.000 bytes**, com margem de ~2,4 MB sobre a saída observada e sem remover nenhum recurso nem desativar testes.
- Adicionada auditoria binária no próprio APK já assinado: presença das **13 partes** `assets/edu_avatar_masters_512_lt330.part00..12`, remontagem do ZIP e verificação de **tamanho/SHA-256 do ZIP**, **68 nomes 00.png–67.png**, **512×512 RGBA** e **hash exato da sprite #42 canônica**.
- Mantidos `unzip -t`, R8 mapping, validações costume/sprite/ícones, `aapt` de versão e pacote, certificado Android v2 permanente, SHA-256 do APK, exclusão de chave temporária e todas as demais portas de segurança.
- Novo teste `app/tests/lt330-official-edu-release-guard.test.js` impede regressão acidental do orçamento e confere as âncoras da auditoria.

## Integridade visual e limitações

A LT330 já normaliza frames 00–03, caminhada frontal/lateral, Shiny, Mewtwo e Sombria na origem 512 px. Os efeitos intencionais de teleporte e acessórios independentes são preservados. A referência #42 não é modificada. O novo guard serve para **comprovar que exatamente esses arquivos foram empacotados**, não para afirmar aprovação artística de todas as expressões.

**Pendente até comprovação:** CI da branch e da main, publicação `v0.03.29-54535`, assinatura/asset no Release e inspeção real das transições e olhos/óculos no Samsung. Não afirmar instalação automática.
