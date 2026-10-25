

## LT79 QA — 24/10/2026 — Correções de sprites, Pikachu e atualização GitHub
- A branch `fix/lt79-sprites-catalog-updates-qa-20261024` foi criada a partir de `ded06c4ab04cee2502af78e6ca6f43c9e092f02e`; main, LT76 público e PRs antigos preservados.
- A causa dos sprites API sem imagem foi confirmada em `spriteData()` que sempre retornava `""`. Agora espécie base sem traje usa fonte comunitária existente; variantes sem verificação mostram placeholder seguro.
- A causa do timeout do Pikachu foi o fluxo de sugestões ainda amarrado ao listbox React/DOM mesmo com API QA ativada. Ao selecionar API QA, o menu consulta catálogo oficial via `api_android_session.js`/`AuthorizedApiCollector.java` e sincroniza o filtro na busca.
- Os gestos da Pokébola e botão ↻ (toque curto; segurar 600ms) recebem orientação por Toast na primeira inicialização de OverlayService.
- Novo `GitHubUpdateCenter.java` foi adicionado sem remover `UpdateCenter.java`. Busca Releases estáveis aprovadas, instala via FileProvider com validação de SHA-256, pacote e certificado, solicita confirmação Android, usa WorkManager (30min sujeito a Doze). Google Drive continua caminho legado e ainda não possui fallback nativo equivalente.
- Workflow QA `.github/workflows/lt79-samsung-qa-protected.yml`: versão 0.00.78, versionCode 54281; compilação release com assinatura persistente se secrets CI válidos. Versão não publicada oficialmente.
- Workflow `.github/workflows/pokesearch-official-release-manual.yml`: SOMENTE acionamento manual e ambiente `official-updates`; exige proteção real desse ambiente nas configurações do GitHub e homologação Samsung antes de uso.
- O APK com este mecanismo precisa ser instalado pelo menos uma vez por meio da distribuição QA/atualização antiga; a versão LT76 não ganha código novo remotamente.
- Testes reais no Samsung, autorização final de publicação e disponibilidade do GitHub Release continuam PENDENTES. A última prova CI deve ser consultada em GitHub Actions. QA automatizada não equivale a homologação física.
- Documento detalhado: `docs/LT79_SPRITES_CATALOGO_ATUALIZACOES_QA.md`.
