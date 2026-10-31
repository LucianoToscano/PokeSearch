# LT200 QA — Localização: tabela compacta de cooldown + correção de aplicação (31/10/2026)

**Base**: LT199 oficial. **Mudanças**: apenas interface Localização, validação/recuperação de localização e testes.

## Layout
- A palavra **Localização** do cabeçalho vira botão acessível. Copiar/colar permanecem na mesma posição.
- Ao tocar, o mesmo popup mostra **somente** uma lista de 16 faixas de distância e tempo, iguais aos valores da imagem fornecida pelo usuário. O cabeçalho `‹ Localização` retorna ao editor. Nenhum ícone adicional no menu; mesma transparência, largura e vidro do editor.
- A lista longa tem rolagem própria e não altera os 4 elementos/linhas existentes; campos não aplicados de coordenadas e raio são preservados ao consultar a lista.
- **Os tempos são somente uma referência visual, não um limite oficial garantido e não significam que a coleta/teleporte esteja liberado.** Nenhuma coleta, cooldown ou movimentação é iniciada por este menu.

## Aplicar localização
- Corrigido o bloqueio do ✓ quando um filtro já tinha exatamente as mesmas coordenadas/raio, mas `nextScheduledSearchAtMs` estava no futuro por agendamento local. `refresh(true)` permite tentar novamente com a validação existente, respeitando HTTP 429/Retry-After e busca em andamento.
- Modo DOM aceita o par único de **placeholders oficiais** Coords/Radius quando a versão móvel remove os botões de aba. Nunca aprova dois campos genéricos; verifica valores, raio e confirmação do modo por prova forte.
- A UI deixa de chamar todo erro (rede, login, API etc.) de `Localização não aplicada`. Quando o erro é do filtro, mostra diagnóstico compacto de campo/mode/raio, sem expor coordenadas. Não declara sucesso apenas porque o usuário tocou em ✓.

## QA real pendente
- Testar no Samsung digitando `-23.587599,-46.655574` e raio `101`, tocar ✓, confirmar retorno atual na API PoGoCoordinates e, em modo DOM, localizar Coords/Radius do site. Se houver erro, abrir Reportar e incluir **somente estágio/resumo seguro do erro**, sem senhas, cookies ou localização privada.
- Testar ✓ repetido após erro sem mudança nos campos, durante busca em andamento e com HTTP 429.
- Testar aba Coords, ausência de aba com placeholders oficiais, presença de Area selecionada, ra io 0/1000, limpar, P1/P2, GL/UL e Shiny.
- Confirmar transparência, tamanho da linha original, toque no texto Localização, abertura da lista de 16 tempos, rolagem, retorno e rascunho preservado.
- Executar `node app/tests/location-probe.test.js`, `node app/tests/lt200-location-cooldown.test.js`, `node app/tests/overlay-ux.test.js` e todas as suítes antes de assinar.

**Atenção**: screenshot isolado comprova o aviso genérico, mas não comprova qual erro de backend/DOM ocorreu naquela execução. Os caminhos corrigidos são verificáveis no código; confirmação no dispositivo permanece obrigatória.

## Sintomas adicionais documentados (31/10/2026, Samsung)

O usuário enviou capturas com `⚠ API: invalid-request` e
`⚠ Filtro: Aguardando portal oficial do seletor P`. Elas mostram **caminhos
diferentes**, não comprovam falha específica das coordenadas.

- `invalid-request` vem do `POST /search` que retornou HTTP 400/422
  ou de validação de chamada; o status anterior não mostrava o campo.
  O transporte agora extrai, de erros de validação estruturados, **somente**
  o nome de um campo **permitido** (`species_forms`, `radius_km`, etc.)
  e somente HTTP 400/422; mensagens e valores retornados nunca entram no
  WebView→Android, log, toast ou relatório. Multiplos campos = diagnóstico
  genérico. **NÃO** reenvia um 400/422 automaticamente nem relaxa critérios.
- O seletor React agora recebe foco antes de abrir e no máximo um clique
  de abertura a cada 1,5 s. Isso evita alternar continuamente um portal ainda
  não montado; a confirmação dos chips e formas exatas continua obrigatória.
- Ao esgotar a configuração do portal, o erro visível é
  `⚠ Filtro: Seletor Pokémon não abriu no site`; lista anterior preservada.
- Para diagnóstico sem apagar seleção, testar a chave de filtro Pokémon OFF,
  pesquisar apenas IV100/0% em cada Pokébola, reativar e comparar. Testar
  tanto API quanto site/DOM; **não** prometer êxito sem resposta real.
- Verificar que as buscas não aplicam filtros inválidos em silêncio e
  que nomes de treinador, tokens, coordenadas e conteúdos completos de erros
  do provedor não aparecem nos relatórios.
- Testes: `node app/tests/lt200-api-dom-failures.test.js`, contrato de
  transporte e sessão, testes de seleção de espécies + CI Android.
