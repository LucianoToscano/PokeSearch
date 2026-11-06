# PokeSearch LT265 — Auditoria final independente após a publicação oficial

Data 06/11/2026 · Código **0.02.65 / versionCode 54469** · Release `v0.02.65-54469`.

## Evidências verificadas diretamente no GitHub

- **Código:** [PR #245](https://github.com/LucianoToscano/PokeSearch/pull/245) mesclada na `main`, commit `a1408736cfec8b4a4b614a4c887b5c9dae89bb30`, head QA `bd2dc080565dda5ea30db85568e4f2ca624046ba`.
- **Qualidade:** 8 gates `success` no head da PR: Node completo (testes `lt265-compact-panels-ptbr.test.js` e `lt265-user-icons-sha.test.js` com logs PASS), Node QA, QA core, Android Java, visual P/M/G com screenshots reais do HTML/WebView, OTA assinado/origem WebView, referência Raides e preflight de release. Falhas durante a implementação foram investigadas: teste de “Liga Master”, frases históricas do simulador, legenda de legado/Elite e nota "não ranking universal" exigida pelo visual. Todas foram reconciliadas mantendo o texto crítico em `title` ou `<details>` antes do merge.
- **Publicação:** [GitHub Actions oficial #42216873644](https://github.com/LucianoToscano/PokeSearch/actions/runs/42216873644) `preflight=success`, `publish=success`. Confirmadas assinatura permanente Android v2, manifesto `0.02.65/54469`, hash e seis ícones PNG presentes dentro do pacote com SHA-256 imutável exigido pelo workflow. Chaves de assinatura apagadas pelo próprio job, sem divulgação.
- **Release:** [LT265](https://github.com/LucianoToscano/PokeSearch/releases/tag/v0.02.65-54469) `draft=false`, `prerelease=false`, `published_at=2026-11-06T12:23:13Z`; arquivo público [PokeSearch-v0.02.65-LT.apk](https://github.com/LucianoToscano/PokeSearch/releases/download/v0.02.65-54469/PokeSearch-v0.02.65-LT.apk), **28.638.433 bytes**, `state=uploaded`, digest `sha256:15e06bbdccea97c1daf98177c4862b21baa04ac8d37bd74a776b517e88d89c19`.
- **OTA:** `pve_moves_ptbr.js` registrado em `OtaAssets.java` e `scripts/build_ota_pack.py`. Atualizador existente consulta `releases/latest` e depende de confirmação de instalação pelo Android. LT264 mantida no GitHub para rollback.

## Auditoria de implementação — resultados

| Dimensão | Revisão final | Atenção na homologação |
|---|---|---|
| Raides | Top 3 inicial, “Ver mais” e “Fonte e critérios”; não duplica texto por evolução | Usar Fletchling/Pidgey com listas ≥ 4 e rolar até coordenadas |
| Traduções | Catálogo PT-BR via `moveId/proto`, cache e fallback offline limitado; código não inventa nomes sem referência | Confirmar ataques comuns na tela; `Golpe sem tradução` é comportamento seguro para nomes novos sem fonte |
| Golpes do encontro | `pokemon_card_presentation.moves` traduz quando confirmável e mantém o ID original para legado | Evitar marcar legado usando texto traduzido ou “*” da API sem evidência |
| Ícones | Quatro bandeiras brancas contrastantes e dois pergaminhos Elite por categoria, todas as seis imagens e hashes conferidos na release | Comprovar legibilidade em fundo transparente, P/M/G e Samsung |
| Indicador Elite | Tipo Ágil recebe MT Ágil Elite, carregado recebe MT Carregada Elite; status somente verificado | Não classificar ataque normal como Elite; status desconhecido deve continuar cinza |
| Janelas | `psCloseOtherPanels(keep)` fecha Raides, PvP, golpes, Rank, calculadora e alternates antes de abrir outro | Testar abertura/fechamento rápidos e resultados assíncronos ao alternar Pokémon |
| Calculadora | Forma/nível/PC alvo são principais; IV A/B e comparação ficam em detalhes opcionais; matemática GM intacta | Verificar que IVs não se perdem ao recolher e que Mega não é indicada como elegível sem fonte |
| Performance | Sem novos serviços Android, sem mudanças de API ou login; mídia compacta, fonte cacheada | O primeiro pedido de tradução PT-BR pode depender de rede; sem conexão, usa mapa parcial |
| P1/P2 | Serviços Android e assets compartilhados, preferências e busca independentes | Não existe evidência de instalação real P1/P2 desta build; user deve testar |
| Integridade do ranking | Rank Classe IV, Rank Geral, PvE por tipo e dados da captura mantidos separados | Snapshot PvP/PvE não é ranking de counters ao vivo nem atualiza metagame automaticamente |

## PT-BR — pendências identificadas (informar ao usuário)

1. **Identidades técnicas que não devem ser traduzidas na API:** `Despawn (longest)`, `Distance (nearest)`, `Boosted`, nomes de chaves `moveId`, `FAST`, `CHARGED`, Pokémon forms e ligas `gl/ul/ml`. Rótulos correspondentes no menu permanecem traduzidos, sem alterar valores transmitidos.
2. **Nomes de golpes fora do mapa offline:** fonte externa versionada pode não ter todas as novas formas e ataques quando offline; preferir “Golpe sem tradução” a uma tradução inventada. Próxima melhoria: ampliar cache local de traduções **verificadas** preservando assinatura e integridade.
3. **Localizações geográficas:** cidade/região/país retornados da API, por exemplo `Pauoa, Hawaii, United States`, seguem no formato original; traduzir somente nomes de países de fonte confiável, sem mudar coordenadas nem geocodificação. Bandeiras estão funcionando pelo mapeamento separado.
4. **Espécies e nomes oficiais dos Pokémon:** nomes próprios como Fletchling/Pidgey/Talonflame são os mesmos usados em muitos clientes PT-BR e não devem ser traduzidos por aproximação. Formas e apelidos retornados pela API devem manter identidade.
5. **Termos da fonte:** `GBL`, `ER`, `PvE` e nome da fonte `S-Tier-Devs/pogo-db-api` são termos técnicos. O texto longo explicativo foi movido para seção de ajuda. Caso substituídos, manter descrição precisa.

## Revisão extra pós-release — comparação binária da tag

- Refetch independente da **tag publicada `v0.02.65-54469`** versus `main` verificou os mesmos Git blob SHAs para nove recursos do programa: `detail.html`, `pve_moves_ptbr.js`, `pokemon_card_presentation.js`, `dock.html`, `OtaAssets.java`, workflow oficial, dois novos testes e `release/official-request.json`. Não foram encontrados desvios de código depois da assinatura.
- Comparação binária adicional de **todos os seis PNGs LT265** na tag versus `main` (Git blob SHA) também passou: GL `575eeb432789f05365a1b6a73c773bb2cdece56d`; UL `64cc2bbbdf8153c927cb17c3ff4ac286689b1e3d`; ML `446174aecb646913e80dc808aa2f5adef189e242`; Copa `f084f17a80e739c46db2f57fffecf36d3a1a3c17`; MT Carregada Elite `581889e81ff341547f08402d811c23abc4729866`; MT Ágil Elite `5a94d3b6182a177780589c52acd3bb15b2ceff1a`. Esses arquivos estão protegidos adicionalmente por hashes SHA-256 explícitos no build oficial, já aprovado.
- A segunda auditoria não exige nova build: os dois documentos de auditoria e o prompt de continuação, acrescentados ou refinados após a tag, **não alteram código nem assinatura**.

## Verificação adicional antes de novo release

- Não se encontraram novas alterações nas fórmulas `psCpAt`, `psCpLeagueCeiling` nem nos cálculos PvP/PvE; os testes históricos que falhavam por mudança de *texto* passaram sem enfraquecer suas garantias: notas de Mega, classe, no-rank universal e estado confirmado de Elite foram mantidas.
- `GLBadgeLT262.png` / `ULBadgeLT262.png` continuam exclusivos do menu Modos, sem substituir os ícones flutuantes da Pokébola. As imagens LT263 permanecem disponíveis como fallback para novos indicadores.
- Os testes Java e visual P/M/G aprovam compilação e verificações automatizadas da interface, **não substituem testes físicos reais no Samsung**. O usuário precisa confirmar rolagem até o botão de coordenadas, formato das traduções e fechamento automático dos painéis em cada Pokébola.
- **Melhorias recomendadas para LT266:** configurar um pequeno estado de "painel ativo" único em vez de flags dispersas se surgir incompatibilidade; ampliar dicionário offline de golpes com IDs da fonte verificada; tradução de país em exibição; compactação de modal de Rank Geral, auditoria de acessibilidade/contraste e teste real Android 16/15 em P/M/G; preferir não modificar menu Modos, favoritos e localização sem pedido explícito.

**Conclusão da auditoria:** integração de código, merge, CI, release estável e integridade do APK **concluídos e comprovados**. A aceitação visual/ergonômica final em aparelho físico e tradução completa de golpes sem conexão são as pendências restantes; não declarar esses itens confirmados.
