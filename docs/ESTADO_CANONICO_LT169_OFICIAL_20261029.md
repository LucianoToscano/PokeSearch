# Estado canônico do PokeSearch — LT169 oficial (29/10/2026)

## Release pública verificada
- Versão: **LT169 / 0.01.69 / versionCode 54374**. Base atual obrigatória para toda LT170+.
- Tag estável latest: https://github.com/LucianoToscano/PokeSearch/releases/tag/v0.01.69-54374 (publicada 29/10/2026 às 12:47:46 UTC).
- APK oficial: https://github.com/LucianoToscano/PokeSearch/releases/download/v0.01.69-54374/PokeSearch-v0.01.69-LT.apk
- Arquivo: PokeSearch-v0.01.69-LT.apk; 49.493.674 bytes.
- SHA-256 APK: 58acf4bd0b663149e803daf411d7d0a118b7a0112da87240abda4acdb7e3f4f6. Digest igual ao asset declarado pela API do GitHub.
- SOURCE_COMMIT imutável do APK: 81503cc6e2ce7e974532503759e2d690af7aedbd.
- Certificado Android v2 permanente, SHA-256: 34766c15d09013ad65873f9976539c8fa2f826e917dae3af57ea628cad689e8e; R8 habilitado; pacote com.lucianotoscano.pokesearch.
- Pipeline oficial: https://github.com/LucianoToscano/PokeSearch/actions/runs/40875761778 — SUCCESS, inclui testes, build, assinatura, ZIP e verificação de releases/latest.
- Artifact de evidências: https://github.com/LucianoToscano/PokeSearch/actions/runs/40875761778/artifacts/12898465695 — ZIP 46.693.381 bytes; digest SHA-256 e08830597e2988fd7a062f2991443faca3c2e041b4d409ef3852d74aa5144abd; expira 27/01/2027. Contém APK QA assinado, SOURCE_COMMIT, SHA256SUMS, SIGNING-REPORT, PACKAGE-VERSION, manifesto e inventário de entradas/recursos.
- A LT168 permanece preservada como versão histórica: sua tag, APK e certificados não foram substituídos.

## Correções oficiais integradas
1. PR #113: Home com ícone pequeno de duas pessoas/setas ao lado de Treinador vinculado, visível só com 2+ treinadores distintos; com 0/1 fica GONE sem espaço. Seletor, sessão, Shiny e atualização entre duas Pokébolas mantidos. Preferências → Privacidade na Home oferece três opções independentes, ON por padrão: mostrar nome PoGoCoordinates, nome do treinador e código. Desativar mostra Anônimo, Anônimo e XXXX XXXX XXXX. Apenas máscara visual; o código verdadeiro permanece copiável e conta/credenciais não são modificados.
2. PR #114: auditoria de 1.679 ícones Pokémon GO por espécie, forma/traje, cor, Shiny e sexo quando disponível; proveniência PokeMiners commit c2a686eb08ace6e890d8fe3d2134c76988db87b5 e cache Android verificado por Git blob SHA-1. API ON resolve variante exata; DOM OFF prioriza a imagem do PoGoCoordinates quando fornecida. Flabébé cinco cores, Floette/Florges, Furfrou trims, Shellos/Gastrodon East Sea e outras variantes. Sem sprite verificada, exibe iniciais discretas em vez de círculo vazio. Resolver compartilhado em P1/P2.
3. PR #115: coordenadas reveladas completas no detalhe, sem CSS ellipsis; alinhadas à esquerda e quebram linha quando necessário; exemplo 20.9981658,105.8591672. Tocar segue copiando o valor original sem novo reveal.
4. PRs #116–#119: atualizações dos testes históricos para novas formas e coordenadas; auditoria do ZIP e tabela de recursos compilados corrigidas, preservando verificação de assinatura/R8/versão. Notas oficiais dentro do aplicativo incluídas.

## Verificações e limitações
- Suíte completa de testes Node PASS: https://github.com/LucianoToscano/PokeSearch/actions/runs/40873960256 ; o teste LT74 DEBUG obsoleto permanece intencionalmente excluído.
- O workflow oficial passou em todos os testes, compilação Android, assinatura v2, integridade do ZIP e confirmação da release latest com hash e tamanho.
- Em API ON, não se pode assegurar a URL literalmente idêntica à do PoGoCoordinates porque a API não fornece URL de imagem; exige Internet ou cache para formas ainda não baixadas.
- Teste visual real no Samsung ainda pendente: sprites normais/Shiny, API ON/OFF, P1/P2, coordenadas longas, três controles de privacidade, 0/1/2+ treinadores, Premium, chat e filtros. CI não equivale a homologação física.
- O app oferece atualização pelo feed estável GitHub Releases; instalação não é silenciosa e requer confirmação do usuário no Android. Google Drive legado não foi atualizado; Firebase Rules/tokens não foram alterados.

## Regra de continuidade
A LT169 é a base oficial atual. Antes de qualquer LT170+, conferir main HEAD e releases/latest. Não recomeçar da LT168 nem sobrescrever tag v0.01.69-54374. Preservar as duas Pokébolas, assinatura, limites da API, histórico, e o backup integral imutável do Guia Mestre. Merge e distribuição global desta versão foram expressamente autorizados pelo proprietário.
