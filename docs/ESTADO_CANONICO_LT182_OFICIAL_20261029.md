# PokeSearch — LT182 oficial (Discord / perfil) — 29/10/2026

## Distribuição pública CONFIRMADA

- **Versão:** LT182, `0.01.82`, Android `versionCode=54387`.
- **Tag estável/latest:** `v0.01.82-54387`, publicada em 29/10/2026 às 22:31:51 UTC, `draft=false`, `prerelease=false`.
- **GitHub Release:** https://github.com/LucianoToscano/PokeSearch/releases/tag/v0.01.82-54387
- **APK:** https://github.com/LucianoToscano/PokeSearch/releases/download/v0.01.82-54387/PokeSearch-v0.01.82-LT.apk
- **Nome:** `PokeSearch-v0.01.82-LT.apk`; **tamanho** `49.546.482` bytes.
- **SHA-256:** `c63a42b678ef08cd402244891851b7086c143e79c5ef6d315e70b6e41a3eedc9`; verificado contra `SHA256SUMS.txt`, hash do GitHub Release e arquivo obtido novamente do Google Drive.
- **Assinatura APK:** Android Signature Scheme v2 `true`, certificado permanente SHA-256 `34766c15d09013ad65873f9976539c8fa2f826e917dae3af57ea628cad689e8e`, mesmo usado nas versões anteriores; pacote `com.lucianotoscano.pokesearch`.
- **Fonte publicada:** `466eaf2ae78e8ff2cd0675fd85885dd3572333cc` (`SOURCE_COMMIT.txt` no artifact oficial).
- **Workflow oficial GitHub Actions:** https://github.com/LucianoToscano/PokeSearch/actions/runs/40966123666 — `completed/success`, incluindo regressões Node, produção do bundle de sprites, Gradle `assembleRelease` com R8, integridade ZIP, assinatura v2, versão e digest da publicação final.
- **Artefato de CI:** `PokeSearch-LT182-54387-Oficial-Assinado`, ID `12937663149`. ZIP do artifact de CI foi extraído e a assinatura conferida.

## Google Drive — atualização no mesmo arquivo, sem trocar link

- **Arquivo público preservado:** ID `1XXKGy3AjtDx4uMnt2N4Wd3FVNV0Qn_5P`, link https://drive.google.com/file/d/1XXKGy3AjtDx4uMnt2N4Wd3FVNV0Qn_5P/view
- **Operação:** atualização dos bytes do arquivo existente por Drive `files.update`, em vez de criar outro link. Novo nome `PokeSearch-v0.01.82-LT.apk`; tamanho Drive `49.546.482` bytes.
- **Integridade de ida e volta:** arquivo baixado novamente do mesmo ID após atualização e SHA-256 conferido igual ao oficial (`c63a42b678ef08cd402244891851b7086c143e79c5ef6d315e70b6e41a3eedc9`).
- **Permissões:** compartilhamento `anyone` mantido (papel `commenter`), com acesso pelo mesmo link. Arquivo de staging temporário no Drive foi apagado após a verificação. Nenhuma alteração no ID do `atualizacao.json` legado.
- **Atualização no aplicativo:** `GitHubUpdateCenter` consulta a última release oficial estável. A LT182 é anunciada aos dispositivos elegíveis quando consultarem o feed, condicionada à rede e às preferências de atualização; o usuário confirma a instalação no Android. Não é uma instalação forçada/silenciosa.

## Merge, implementação e limites

- **PR #138 — correção de autenticação:** https://github.com/LucianoToscano/PokeSearch/pull/138, merge `c1a8849c6e349854e02e3e8598b897246b84d9be`.
- **PR #139 — criação da release LT182:** https://github.com/LucianoToscano/PokeSearch/pull/139, merge `e28c4e8d58f1ea9444cf51e06cdea56038db84b6`.
- **Workflow de release** corrigido para nome YAML com dois-pontos entre aspas no commit `466eaf2ae78e8ff2cd0675fd85885dd3572333cc`; execução anterior com sintaxe YAML inválida não publicou APK. A execução corrigida é a oficial de sucesso.
- **Mudança funcional:** aguardar hidratação do perfil após OAuth Google/Discord sem fechar a janela prematuramente, diferenciando estado não confirmado de conta realmente sem treinador; orientação `Vincular` quando o próprio PoGoCoordinates confirma ausência de vínculo.
- **Preservado:** duas contas isoladas em WebView, cookies por conta, treinadores VIP independentes, P1/P2, Shiny restrito a treinador efetivamente vinculado, Doce Raro, sprites e distribuição de versões anteriores.
- **Limite:** CI e conferência criptográfica não substituem validação de OAuth real Discord no aparelho Samsung. Teste com Conta 2 Discord vinculada e sem treinador, conta VIP, redes lentas e retorno ao PokeSearch segue necessário. O PokeSearch não cria um vínculo no site por conta própria.

## Resumo

LT182 **distribuída para o canal público**, **Google Drive mesmo link atualizado**, **PRs mescladas**, **assinatura e SHA256 idênticos**, **registro canônico atualizado**. Nenhuma necessidade de reinstalar o app para ver os avisos do atualizador se ele já estiver funcionando, mas instalar a LT182 exige aceitar a atualização.
