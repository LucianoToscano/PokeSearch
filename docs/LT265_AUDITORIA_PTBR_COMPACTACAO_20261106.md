# PokeSearch LT265 — Auditoria PT-BR, interface compacta e fluxo intuitivo
Data: 06/11/2026 · Base pública: LT264 (0.02.64, versionCode 54468) · Estado inicial: QA em branch.

## Escopo e evidência visual

Prints do Samsung fornecidos pelo usuário: Fletchling e Pidgey. O painel **Atacantes por tipo (PvE)** abria oito rankings consecutivos, repetia "evolução/forma projetada" e a explicação do nível 50/15/15/15, e mostrava identificadores técnicos `PECK FAST + FLY`. O painel de **Golpes PvP recomendados** apresentava o glifo 💠 ilegível. Bandeiras antigas eram escuras em fundo preto, especialmente no cabeçalho das análises; as janelas Raides/PvP/Calculadora podiam se acumular. O simulador exibia IVs A/B, presets, alvo, projeções e comparação simultaneamente.

## Correções na LT265

1. **PT-BR real, sem tradução inventada.** Módulo `pve_moves_ptbr.js` usa **a mesma referência fixa** WatWowMap `pogo-data-api` commit `31a3bcdc2e412f315c4be2bb593807f45cb9bd9b` já adotada para golpes PvP: `moves.json` (moveId/proto) + `translations/pt-br/moves.json`. Mapa em cache, catálogo pequeno offline de ataques comuns, exceções/IDs desconhecidos não recebem nomes falsos (exibe "Golpe sem tradução" no ranking, preserva original no card quando falta confirmação). A captura usa o nome PT-BR quando verificado, mas **legado/Elite continua ligado ao identificador original do golpe**. Exemplos verificados: PECK_FAST → Bicada; FLY → Voar; FIRE_SPIN_FAST → Chama Furacão; FIRE_BLAST → Rajada de Fogo; QUICK_ATTACK_FAST → Ataque Rápido. A fonte PvE *não* é atualizada ao vivo em termos de metagame: dados de referência 08/2026 continuam identificados.
2. **PvE compacto:** três melhores linhas inicialmente e até mais cinco acessíveis por “Ver mais”; cabeçalho curto, nomes Ágil e Carregado em PT-BR; notas e critérios no componente recolhido **Fonte e critérios**, sem repetir contexto em cada item. Ranks, tipo, espécie atual vs. projetada e integridade da fonte permanecem. Medalha de Raid retida. Símbolo MT Elite somente quando fonte `row.elite===true`, sem confundir golpe comum com legado.
3. **Ícones exatos do usuário:** novas versões PNG transparentes com borda branca contrastante (Grande, Ultra, Mestra e bandeira extra de Copa), 64×64, para rankings e análises — sem alterar os ícones Modos nem as Pokébolas. Foram integrados `mt-agil-elite-lt265.png` e `mt-carregada-elite-lt265.png`, 64×40, para substituir 💠 *somente* em golpes com status legado/Elite confirmado, respeitando categoria Ágil/Carregado. Os demais estados pré-clique continuam MT normal e cinza conforme verificação. Assets originais LT262/LT263 preservados; 6 novos arquivos validados com SHA-256 no gate do APK assinado.
4. **Uma janela principal por vez:** abrir Raides retrai PvP, calculadora, golpes, explorer; abrir PvP retrai Raides, calculadora e golpes; abrir calculadora retrai as demais; abrir golpes ou classificação idem. Estado e dados originais preservados. Continua possível alternar a mesma janela para retrair, com redimensionamento nativo e scroll único.
5. **Calculadora sem empobrecimento:** principal mostra forma e nível, controles de nível, PC/PS previstos, faixas 500/1500/2500 e PC-alvo; comparação **IV A/B opcional**, com resultado/diferença também recolhidos, e notas ocultas em “Como funciona?”. Nenhum cálculo `psCpAt`, `psCpLeagueCeiling`, set de formas/Megas ou custo inventado foi alterado. Os presets e os campos editáveis seguem disponíveis.
6. **Outros textos:** “Liga Master” → **Liga Mestra** no cartão; clima “Boosted” → **Potencializado** na apresentação do menu, mantendo valor técnico `Boosted` da API. Prioridade de telas P/M/G, duas Pokébolas, sprites, busca de coordenadas e fonte PvP separadas.

## Auditoria pós-alterações

| Área | Situação | Risco ou observação |
|---|---|---|
| Lógica de GL/UL/ML | Mantida | Rank Classe IV #1 não implica Rank Geral da liga; não modificar rank math |
| Rankings PvE | Compactos e informativos | Ranking por tipo da fonte 08/2026, não é counter para chefe atual |
| Tradução dos golpes PvE | Fonte GO PT-BR + cache offline | Falha de rede ou novo golpe não traduzido deve ser marcado sem tradução, **jamais adivinhado** |
| Ataques do encontro | PT-BR quando identificador verificável | Nomes de cidade/espécie retornados pela API podem continuar originais |
| Elite/legado | Ícone Ágil/Carregado distinguido | Golpe `legacy` sem comprovação de MT Elite mantém nota da disponibilidade |
| UI compacta | 3 linhas PvE, restante recolhido | Testar scroll e toque nos 3 tamanhos P/M/G |
| Calculadora | Padrões acessíveis, avançados recolhidos | Teste de A/B deve preservar os campos no DOM e não recalcular com IV padrão |
| Janelas exclusivas | Raid/PvP/CP/Nível/Golpes/Classe | Testar toques rápidos, recarga assíncrona e troca de Pokémon |
| Modos e Pokébolas | Sem alterações de assets ou tipos | Testar Pokébola 1 e 2 em Samsung real |
| Linguagem geral restante | Parcial | Sort API `Despawn (longest)` e `Distance (nearest)` ficam técnicos no armazenamento; menus estão parcialmente localizados; muitos **nomes de Pokémon, cidades e nomes dos tipos de forma** são conteúdo externo e devem ter tradução específica antes de substituição, sem quebrar identidades |
| Fundo e popups | Preservados | Evitar rolagem de toda a janela quando um subpainel precisa scroll |

## Referências do código e testes

- `app/src/main/assets/detail.html`, `pokemon_card_presentation.js`, `pve_moves_ptbr.js`, `dock.html`.
- `app/src/main/java/com/lucianotoscano/pokesearchoverlay/OtaAssets.java`, `scripts/build_ota_pack.py`.
- `.github/workflows/pokesearch-official-release.yml` verifica SHA-256 das seis novas artes no APK.
- `app/tests/lt265-compact-panels-ptbr.test.js` e `app/tests/lt265-user-icons-sha.test.js`; regressões LT259 Raides, LT262 símbolos, LT253 visual e LT247/252 calculadora devem permanecer verdes.

**Importante:** QA automático não é validação física: instalação, rolagem, cliques, aparições em P1/P2 e tradução completa de todos os Pokémon ainda precisam ser testados no Samsung. Nenhuma alteração requer login, GPS preciso, interceptação do PGSharp ou credenciais.
