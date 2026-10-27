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

## Resultado final confirmado no GitHub e artefato
- PR #79 [MERGED](https://github.com/LucianoToscano/PokeSearch/pull/79), commit `bc4b1883f6744f738c83a44c6103e2fe40423234`; fonte binária `2e92c07266ebf0bce1dcbde53948e2e467993c39`.
- [Workflow de APK #40426146549](https://github.com/LucianoToscano/PokeSearch/actions/runs/40426146549) **SUCCESS**; [artefato #12700590080](https://github.com/LucianoToscano/PokeSearch/actions/runs/40426146549/artifacts/12700590080).
- `PokeSearch-v0.01.24-LT-Sprite-Picker-Stats-QA.apk`, 41.838.110 bytes, SHA-256 `4f8c11ce6558acc87f295f4ec3776de46a9a2d1ead9df7c8645e3d3e0e3c98a5` verificado após extração contra `SHA256SUMS.txt`. `0.01.24/54328`, Android v2 assinado com certificado inalterado `34766c15d09013ad65873f9976539c8fa2f826e917dae3af57ea628cad689e8e`.
- Manifesto extraído: 1025 sprites-base, 1025 Shiny, 2 regionais exatas, nenhum arquivo desses ausente. Formas eventuais GO e contadores de Firebase em produção **não comprovados/corrigidos integralmente**.
