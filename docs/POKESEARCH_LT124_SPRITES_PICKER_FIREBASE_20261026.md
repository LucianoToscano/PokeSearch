# LT124 — Regressões restantes: sprites de busca, aliases e contadores

Data: 26/10/2026. Base de código: LT123 no commit ed712bfe716257b27c7937bb3a97c8f53382f5bb.

## Correções efetivamente feitas
- Aliases de duas formas exactas: Darmanitan de Galar Standard = PokeAPI variety 10177, Zen = 10178. Não aceitar `DARMANITAN_GALARIAN` sozinho porque a forma é ambígua.
- Squawkabilly White = 10262, Yellow = 10261, Blue = 10260. A imagem White não pode usar sprite de plumagem verde.
- O picker de busca passa a reaproveitar `PokeSearchOfflineSprite.resolve` para formas oficiais, além dos resultados e do card. Baixa a fonte **exata e pinada** por commit do PokeAPI apenas quando a variante é confirmada; não usa sprite base para `COPY_2019`, `GOGGLES_2026` ou outros trajes sem imagem verificada.
- O começo de uma pesquisa reposiciona a lista de espécies em `scrollTop=0`, evitando linhas antigas cortadas.
- `FirebaseStats` reutiliza `PokeSearchStats` já inicializado e permite retry de inicialização/autenticação quando a Home é aberta após falha. **Não converte — em um valor fictício.**
- Mantidos os dois botões P1/P2 no topo com `sem_filtro.png` desligado/`personalizado.png` ligado (já integrados LT123), filtros independentes, chat em tempo real LT122 e versionamento do app.

## Evidências e limitações
- Corrigidos exemplos de alias específicos; permanecem **sem identidade/imagem verificável** trajes especiais do Pokémon GO como `CHARMANDER_GOGGLES_2026`, `VENUSAUR_COPY_2019`. Não distribuir uma arte de espécie comum como se fosse traje.
- `stats/public` exige que regras Firebase RTDB e Functions de reconciliação sejam **implantadas no projeto remoto**; versionar código de Functions não implanta o servidor. Sem permissão/acesso ao Firebase não é possível confirmar números reais.
- Inventário de FORM_VARIANTS LT123: 317 variedades oficiais, 742 aliases conhecidos, dois PNGs offline extra Zigzagoon Galar; outras formas exclusivas do GO precisam de fonte/prova.
- Testes físicos no Samsung de sprites e carregamento, duas Pokébolas, notificações e chat ainda pendentes.
- Nenhuma alteração Gradle/dependências foi necessária; JDK 17, Gradle 8.11 e assinatura devem ser verificados na QA.
- QA alvo 0.01.24 / 54328 apenas após CI, com certificate v2 igual à release anterior.
