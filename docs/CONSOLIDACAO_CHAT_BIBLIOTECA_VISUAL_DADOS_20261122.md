# PokeSearch — Consolidação do chat: dados Pokémon e biblioteca visual (22/11/2026)
> Registro documental aditivo, sem perdas. **Não** comprova implementação nos aplicativos, homologação em Android ou publicação de APK. Preservar fontes e guias anteriores.
>
> Governança: consultar `AGENTS.md` e/ou arquivo mestre vigente antes de qualquer mudança. O acervo compartilhado do Drive existe para **referência**, não significa direitos de redistribuição.

## 1. Fontes novas registradas no chat
| Fonte | Finalidade / ressalva |
| --- | --- |
| [The Models Resource — Pokémon GO](https://models.spriters-resource.com/mobile/pokemongo/) | modelos 3D e objetos de mapa; licença de cada asset pendente |
| [Project Pokémon — Generation 1](https://projectpokemon.org/home/docs/spriteindex_148/3d-models-generation-1-pok%C3%A9mon-r90/) | modelos/referência, permissões e acesso a verificar |
| [RanseiLink Pokémon Models](https://ransei.link/research/game-data/pokemon-models/) | pesquisa de modelos, não fonte automaticamente distribuível |
| [Reddit HD Pokémon Sprites](https://www.reddit.com/r/pokemon/comments/1w51exr/hd_pokemon_sprites/) | descoberta comunitária, não licença |
| [Drive — GIFs Pokémon](https://drive.google.com/drive/folders/1hj-Wbkm6Qq3HPyqVu35BhID1zUQF93j4) | exemplos como `1010.gif`, `1010s.gif`, `1009.gif`; amostra não representa pasta inteira |
| [Pokéos Pokédex](https://www.pokeos.com/pokedex) e [site](https://www.pokeos.com/) | catálogo/referência de espécies, sem scraping autorizado presumido |
| [PokeMiners Game Master — JSON bruto](https://raw.githubusercontent.com/PokeMiners/game_masters/master/latest/latest.json) / [visualização GitHub](https://github.com/PokeMiners/game_masters/blob/master/latest%2Flatest.json) | o mesmo dataset em duas URLs; base técnica, não observação live |
| [VeryLongDelay Pokémon Resources](https://github.com/VeryLongDelay/pokemon-resources) | `pogo_pkm.json`, ataques, scripts de tratamento e recursos; conferir atualização/licença |
| [PokeMiners pogo_assets](https://github.com/PokeMiners/pogo_assets) | imagens/sprites distintos do Game Master |

Acervo visual central Drive já catalogado: [biblioteca compartilhada](https://drive.google.com/drive/folders/1MnVVAsDOvam1laU6Ahv-whIPpBF0gz68). O [adendo existente de PokeSearch](https://docs.google.com/document/d/1z2axYQIqxcc14-A5y_s71D21syKHXRABcKvsD_Lvhao/edit) traz categorias e links das subpastas; não criar bibliotecas duplicadas por aplicativo.

## 2. Pacotes recebidos e resultados da análise
Foram fornecidos ZIPs dos objetos **PokéStop Near/Far**, **Poké Balls**, NPCs **Mateo/Team GO Rocket Grunts**, **Gym Logos/Gym Small**, 2 pacotes de **tags brancas/transparentes (10 + 7)**, `Sprites Pokemon.zip`, além de `latest.json`, `pogo_pkm.json` e `ARQUIVO_MESTRE_POKEMON_UNICO_REVISADO_2026-11-17.zip`.

A auditoria fornecida para `Sprites Pokemon.zip` registrou ~220,5 MB, **95 entradas de topo** (40 PNG e 55 ZIP internos), atlas em células **256×256**, **916 células normais e 914 shiny** em gerações selecionadas. Células não são espécies únicas. Pendências pontuais: atlas normal G1 duplicado, 2 posições não preenchidas no atlas shiny G5, `#0113 Eevee.zip` (Eevee é #133), 3 arquivos Deflate64 que exigem outro descompactador. Não concluir corrupção ou ausência definitiva apenas por falha de extração.

O pacote mestre revisado é **índice de inventário**, não cópia de todos os binários do Drive: 44 entradas, 43 hashes de conteúdo verificados, **2.144 registros** do inventário, **290 URLs**. Ver também `PokeSearch_Validacao_Arquivo_Mestre_2026-11-17.md` (relatório do chat).

## 3. Dados: diagnóstico e proveniência
| Campo | Resultado sobre os arquivos fornecidos |
| --- | ---: |
| `pogo_pkm.json` linhas | 1.755 |
| Chaves distintas `(id, form)` | 1.451 |
| Grupos com chave repetida | 303 |
| Linhas excedentes de duplicação | 304 |
| **Grupos divergentes** | **24** (não 25) |
| Chaves **sem divergência** | 1.427 |
| `latest.json` templates únicos | 18.812 |
| Linhas de Pokémon inválidas segundo schema mínimo do importador | 0 |

Exemplo de divergência: Dugtrio (51, Normal), `baseDefense` 134 vs 136. Os 24 grupos **não** devem ser resolvidos por última ocorrência ou valor arbitrário. Arquivo Game Master do pacote indica timestamp `2026-08-28T07:35:50.208Z`; não comprova atualização até novembro.

`pogo_pkm.json` SHA-256: `8906e7941e8d9eb7f61575e38d73115d03e6c75f92edf627123351c8fe0446c0`  
`latest.json` SHA-256: `5c947ac64d1de8859bea1b3bf044609d74b6e8429d53f8cb1aa30a72a46dce84`

**Estratégia sem perdas:** nunca modificar originais; identificar snapshot/hash/data; usar chave lógica `(id,form)`; manter duplicatas iguais com rastreabilidade dos índices; gerar `pokemon_confirmados.json` com as 1.427 chaves inequívocas e `pokemon_conflitos.json` com TODAS as variantes das 24 chaves ambíguas. Registrar linhas inválidas separadamente e não usar dados ambíguos em cálculos de produção. Estabelecer catálogo de assets independente com `source_url`, `sha256`, `license_status`, `resolution`, `form`, `variant`, `costume`, `shiny`. Dados de inventários pessoais não pertencem à base de espécies. Atualização automática futura requer validação de schema, revisão das 24 chaves, comparação com fonte atual e rollback.

**Importador independente executado neste chat:** Python/stdlib, sem rede, produz arquivos de aprovados/conflitos/inválidos/manifesto. Executado com 1.755 + 18.812 linhas e conferência de oito métricas aprovada. Não rodou em CI ou APK nem integrou data layer do aplicativo.

## 4. Biblioteca Visual — Auto Hunt
Cinco módulos planejados: **Reconhecer Pokémon**, **Reconhecer PokéStops**, **Identificar telas**, **Analisar animações**, **Diagnóstico visual**. Pipeline: captura consentida → regiões de interesse (ROI) → templates/modelos/estado temporal → confiança e logs → eventos candidatos → ações opcionais e autorizadas. Perfis PGSharp, Pokemod, genérico, com fallback manual. 1–2 fps econômico; 2–4 equilibrado; 4–8 precisão **apenas valores iniciais propostos**, não benchmark.

Ordem: infraestrutura e snapshots; telas/PokéStops; Pokémon/variantes; animações; diagnóstico e otimização. Testar telas reais de diferentes versões PGSharp e Pokemod, rotações, resoluções, oclusão, cache, CPU, memória, bateria, false positives, mudanças de layout e persistência. Sprites/OBJ/FBX/DAE e GIFs não demonstram reconhecimento de frames reais por si sós. Não deduzir CP, IV, Shiny, encontro vigente ou captura concluída apenas de arte/animação. Sem licença de assets, não distribui-los no APK.

## 5. Uso específico e estado
Conectar gradualmente à Minha Pokédex, aos dois inventários e ao Auto Hunt mantendo SAF PGSStats, overlays P1/P2, histórico, fundos, tags e ícones. LT409 v0.03.94 é o último canal público documentado em AGENTS.md; nenhuma release resulta deste PR.

**Estados mantidos separados:** catalogado; proposto; importador offline validado; integrado no repositório; CI; APK; homologação física; release oficial. Este registro só comprova catalogação do chat e o teste local do importador. Preservar versões, histórico, funções, fontes, credenciais e binários proprietários. Revisar permissões atuais dos JSONs no Drive (aviso anterior de `anyone/writer` não foi revalidado).
