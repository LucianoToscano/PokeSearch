# LT326 — Destaques ocultos por padrão e fora das sprites

**Solicitação do usuário (11/11/2026):** os losangos da LT325 aparecem sobre as sprites e geram ruído. **Nova regra oficial:** ocultar todos os marcadores do resultado por padrão e permitir exibí-los **somente** após ativar `◆ Destaques` em `Personalização → Info Pokémon`.

## Mudanças aplicadas em branch, sem release
- **Android:** chave `resultShowHighlights`, default `false`, persistida individualmente via `overlayPrefs()` nas duas Pokébolas (`prefs` e `prefs_secondary`). Não forçar ON para usuários que atualizaram da LT325.
- **WebView:** `resultDisplayOptions.highlights` vem exclusivamente do estado nativo e inicia em `false`; se não houver configuração legada, continua OFF. Tanto `◆` de valor quanto alertas de evidência da lista só são renderizados ao habilitar.
- **Menu existente:** botão `◆ Destaques` dentro de `Info Pokémon` ao lado de Shiny e distância. O comando `Mostrar todas as informações` também ativa a opção explicitamente, enquanto `Ocultar` desativa. Nenhum novo menu.
- **Geometria:** ícones deixam de ser elementos de `.spriteStage`, passam para uma faixa `.resultMarkerRail` de **12px** após a caixa da sprite. Nos tamanhos P/M/G, a caixa da sprite continua **24/32/40px**. Com os demais metadados ocultos, a faixa só aumenta a largura quando ON; com a coluna de informações ativa, ocupa 12px dentro dos 96px já reservados. OFF preserva largura/hitbox e não cria faixa invisível.
- **Transparência:** `ⓘ Fonte/qualidade` no detalhe continua disponível independentemente da opção visual; nenhuma mudança nos critérios de IV/rank, Pokémon valiosos, Reides ou alertas. Sem novas consultas de rede, permissões ou localização.
- **P1/P2:** código compartilhado, preferências independentes. Alterar a opção da primeira Pokébola não modifica a segunda.

## Auditoria
- `app/tests/lt326-highlights-optin-outside-sprite.test.js`: testes de defaults, persistência, opção do menu, opção Mostrar/Ocultar todas, ausência de trabalho/render quando OFF e geometria CSS.
- `app/tests/lt325-real-results-visual.cjs`: ampliação dos testes Playwright de P/M/G para **OFF → ON → OFF**, posição das marcas **fora da sprite**, largura original restituída e sem regressão em qualidade/rank.
- Testes Node integrais, Java/Android, visual, OTA e APK beta isolado: exigir resultados verdes no mesmo HEAD antes de propor merge/release.
- **QA físico Samsung P1/P2 ainda necessário**: visão real de losangos em P/M/G, com e sem coluna de informações e nas orientações horizontal/vertical.

**Estado:** a implementação inicial está isolada em PR de correção, sem alteração da Release LT325. Não declarar distribuição ou instalação da correção enquanto não houver solicitação de publicação e fluxo oficial protegido concluído.
