# ESTADO CANÔNICO LT85 QA — 25/10/2026

**VERSÃO OFICIAL IMUTÁVEL:** LT83 0.00.83 / 54286, SOURCE_COMMIT 5cf9adb62efb97a185ec955cab6eb0f49fbb4e88, SHA256 451e4781581122908f014a893f693c8312b36b2c222a8579c499c6c3e2975c1c. GitHub Releases latest continua LT83, Google Drive LT79 é ponte histórica.

**Branch QA desta correção:** `fix/lt85-menu-repeat-tap-20261025`, base LT84 QA PR #59, PR [#60 Draft](https://github.com/LucianoToscano/PokeSearch/pull/60). QA versionName 0.00.85, versionCode 54288. Sem publicação oficial nem merge.

## Mudanças realizadas
1. Android nativo é fonte de verdade para abrir/fechar submenus. Segundo toque no mesmo ícone fecha, com proteção contra ACTION_OUTSIDE e clique seguinte do mesmo gesto (latch limitado por 450ms para mesmo menu). Alternância para outro menu preservada.
2. Favoritos 10x5 preservado em Dialog não modal com referência para dispensar no segundo toque; encerramento limpa a referência e estados.
3. Removida a mensagem recorrente "Usar opções observadas no site" do painel de Filtros; escolhas continuam confirmadas pelos filtros selecionados, não copiadas do DOM por um botão extra.
4. API autorizada primária em instalações sem preferência anterior, mantendo chave `authorizedApiQaOptIn` e desligamento manual para DOM. Erros HTTP de autorização/limites da conta nunca acionam fallback automático.
5. `requestFilterOptions` no modo API apresenta valores enumerados documentados de Sort, Weather, Size e Gender, e carrega Forms oficiais por GET /forms com cache existente de 300s.
6. Catálogo Pokémon é navegável mesmo sem digitar e retorna base sprite PokeAPI apenas para a espécie padrão verificada sem costume. Formas e costumes não fingem compartilhar sprite incorreto; placeholder.
7. Formas/Pokémon API podem ser consultados durante POST /search em curso, pois são catálogos independentes. DOM mantém bloqueio para evitar conflito com React.
8. Arquivos de regressão novos `app/tests/lt85-menu-repeat-tap.test.js` e `app/tests/lt85-api-native-selectors.test.js`, além de ajustes pontuais em expectativas legadas sem suprimir verificações de segurança.

## Pipeline
- Workflow: `.github/workflows/lt85-menu-repeat-tap-signed-qa.yml`.
- Verificar o último GitHub Actions antes de marcar SUCCESS (a compilação está sujeita ao CI). O artifact de QA, se aprovado, contém APK, `SHA256SUMS.txt`, `SOURCE_COMMIT.txt`, relatórios de assinatura/certificado permanente.
- `main`, applicationId `com.lucianotoscano.pokesearch`, namespace `com.lucianotoscano.pokesearchoverlay`, assinatura, atualização pública LT83, preferências, layouts de resultados e funcionalidade de API/DOM existentes não devem ser sobrescritos.
- Guia Mestre `docs/GUIA_MESTRE.md`: apendicar **arquivo completo** por workflow com tamanho mínimo, nunca usar fetch truncado.

## Validação física ainda pendente
Samsung: abrir/reabrir/fechar Modos, Filtros, Localização, Pokémon, Favoritos, Aparência, Alertas e Mais; alternância de ícones durante a consulta; imagens de espécies padrão e placeholder de variantes; Forms e opções de marcar; geofiltro 24.9407581,121.1889794 nos raios 0/215/1000 e limpar; login Google, Shiny vinculado, GL/UL e reveal de spawn exato. Nenhum desses testes físicos foi confirmado apenas pelo CI.

**Não publicar o APK como atualização oficial nem mesclar as PRs antes de revisão e consentimento expresso.**
