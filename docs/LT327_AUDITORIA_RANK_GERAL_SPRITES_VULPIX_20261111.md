# LT327 — Auditoria Rank Geral: nomes, sprites, organização e Vulpix (11/11/2026)

## Dados auditados
Snapshots imutáveis PvPoke locais:
- Grande Liga (GL): 1.153 posições.
- Ultra Liga (UL): 850 posições.
- Liga Mestra (ML): 409 posições.
- Copa Pequena (LC): 528 posições.
- 1.522 nomes brutos distintos nas quatro listas.
- 1.526 nomes de exibição auditados ao unir os nomes de origem com as quatro normalizações de apresentação.

Auditoria estática de `rankSpriteMeta` sobre os 1.526 nomes: **zero sem candidato de imagem com identidade validada**. Isso demonstra resolução de caminhos, não disponibilidade real da rede nem presença de todos os PNGs em cada APK. A ordem dos fallbacks é controlada, não troca espécie, costume, sexo, cor ou forma.

## Correções
1. O parser antigo aceitava apenas oito sufixos e rejeitava **Shadow**, formas de Gourgeist, Aegislash, Castform, Zacian/Zamazenta, Mewtwo Armored e muitas outras. O novo `rankSpriteMeta` valida Dex+espécie, usa o mapa oficial de variedades da PokeAPI e o índice fixado de sprites Pokémon GO (PokeMiners); nunca cria URL de forma não registrada. Os arquivos locais existentes têm prioridade quando representam a variedade exata.
2. Versões **Shadow** reutilizam a arte comprovada da espécie e forma correspondentes, com indicação visual discreta; o app não inventa uma imagem alternativa. Nidoran Fêmea e Macho são desambiguados pelos números Dex #29/#32, e Mime Jr. usa Dex #439.
3. O painel passa a mostrar **[sprite] [nome (forma)] [#número da Pokédex; RG #posição]**. Na última coluna, o número principal é o número da Pokédex e a linha menor é a posição no Rank Geral. Esses valores não são confundidos. Texto pode quebrar linha; sprites permanecem alinhadas. Falhas de imagem tentam somente URLs alternativas verificadas da **mesma forma** e, se todas falharem, exibem o número da Pokédex ao invés de um círculo vazio.
4. Três conflitos presentes entre nome e ID do snapshot foram normalizados **somente na apresentação**: `aegislash_shield` → **Aegislash (Shield)**, `morpeko_full_belly` → **Morpeko (Full Belly)**, `mimikyu` → **Mimikyu**. `mime_jr` → **Mime Jr.** corrige nomenclatura. Identificadores, posições, regras PvP e arquivos de dados permanecem intactos.
5. **Vulpix** tem stats no Game Master e 4.096 combinações de IV calculáveis para GL. Não aparece no snapshot de posições do Rank Geral GL/UL/ML; por isso a tela informa **"não possui posição neste snapshot"** e mostra classificações de outras ligas quando disponíveis. Copa Pequena: Vulpix #31, Vulpix (Shadow) #32, Vulpix (Alolan) #41 e Vulpix (Alolan) (Shadow) #60.

## Testes e limites
- Novo teste `app/tests/lt327-rank-geral-sprites-vulpix.test.js` cobre todos os nomes das quatro ligas, nomes corrigidos, forms, Shadow, Vulpix, UI e URLs apenas de fontes permitidas.
- Teste LT296 atualizado porque a forma Shadow agora usa o sprite da espécie com sinalização em vez de sumir.
- Nenhuma alteração na API PoGoCoordinates, no contrato de busca, em localização, em IVs ou no histórico do snapshot.
- **Atualização do status após integração (12/11/2026):** [PR #329](https://github.com/LucianoToscano/PokeSearch/pull/329) integrada em 11/11/2026 (squash `79575b2ba5fe60ded9b18412d73f7d2a13f9b72d`); regressões Node, Java/Android, OTA e APK privado foram aprovados segundo a PR e notas da [release estável `v0.03.27-54533`](https://github.com/LucianoToscano/PokeSearch/releases/tag/v0.03.27-54533), publicada em 11/11/2026. Esta versão agora é histórica, pois a LT329 a substituiu. **Pendências reais:** verificação física Samsung P1/P2, carregamento de sprites na WebView com e sem internet e inspeção de listas estreitas/longas. A auditoria estática não comprova todas as imagens carregadas.
