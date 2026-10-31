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
