# PokeSearch LT356 — Auditoria global PGSharp / todas as espécies (15/11/2026)

## Referência de origem, limites e integridade
- APK externo fornecido: `pgs1.277.2_0.435.2_rhGEK(arm64) ... .apk`, 211.243.984 bytes,
  SHA-256 `ed8a7676995088bee463186f6f561f0e400ac43db9c9c1cb346a891c7542a67e`.
  **Não instalado nem executado**, inspeção estática ZIP e dados textuais autorizados para
  auditoria. O nome "autorizado" não comprova permissão legal de redistribuir o conteúdo.
- ZIP contém 2.203 entradas, 437 PNGs de interface, 168 bundles locais e catálogo
  Unity Addressables com referências a arquivos também remotos. O APK sozinho não
  fornece uma coleção confirmada de miniaturas individuais do feed lateral PGSharp.
  Não extrair nem redistribuir atlas/texturas proprietários sem licença.
- Nomes de Pokémon: 15 arquivos `assets/text/pokemon_names_<locale>.jgz`,
  cada um com 1.026 chaves (`0000` reservada + **1 a 1025**).
  Comparação por chave `pokemon_name_%04d` com o `pokemon_catalog.json`
  próprio do PokeSearch: **1025/1025 IDs presentes**, 1023 nomes textualmente
  idênticos; as duas diferenças são **apenas pontuação tipográfica**:
  83 Farfetch’d (PokeSearch) vs Farfetch'd (jogo) e
  865 Sirfetch’d vs Sirfetch'd. A normalização do app remove pontuação, então
  não é necessário reescrever nomes ou copiar textos.
- `assets/text/i18n_pt-br.jgz` possui 43.327 pares únicos de identificadores
  e textos do jogo. Usar somente como referência para detectar diferenças de
  terminologia/fluxos; não embutir traduções proprietárias sem permissão.

## Problemas demonstráveis na LT355
1. A biblioteca nativa estava limitada a apenas **48 modelos** no manifesto,
   inadequado para 1025 espécies, formas e variantes.
2. `PgsAutoTemplateStore.list()` retornava a lista vazia cedo em uma primeira
   instalação, antes de anexar modelos `builtIn`, mesmo que aprovados.
3. Uma migração de seleção baseada em `active()` introduziria recursão
   ao carregar nativos filtrados por espécies; é preciso ler os modelos pessoais
   antes dos modelos do pacote.
4. A supressão fixa de centros em 30×32 pixels podia descartar miniaturas
   vizinhas. Matching de confiança semelhante de espécies diferentes num
   mesmo slot não tinha recusa específica.
5. Falta de indicador de duração de varredura e de número de casos ambíguos
   dificulta medir gasto de CPU/latência e depurar falsos positivos.
6. PGSharp do APK declara Android 9 mínimo, mas o método
   `AccessibilityService.takeScreenshot` do PokeSearch exige Android 11/API30.
   O PGS não deve iniciar a busca como se fosse funcional em Android 9/10.

## Implementações LT356 (todas as espécies)
- `PgsAutoNativeModels`: índice global por `dex/form/variant` para **até 4096
  templates** de espécies presentes no `pokemon_catalog.json`.
  Manifest tem limite de 3 MiB, formato/sha256/rights/evidence rigorosos e
  rejeição de cópia binária idêntica entre espécies distintas. Somente imagens
  das espécies selecionadas são verificadas sob demanda (hash+dimensões, cache
  local). Não há dependência de rede, injeção ou acesso aos arquivos PGSharp.
- `PgsAutoTemplateStore.userModels()`: preserva as amostras pessoais como
  fonte própria, inicialização idempotente e nativos somente em memória;
  `PgsAutoCatalog.selected()` migra a partir de amostras pessoais sem recursão.
  Ordem pessoal > nativo; nativo não pode ser apagado/escrito nas preferências.
- `PgsAutoModelSelectionPolicy`: deduplica IDs e limita o trabalho a **até
  10 espécies filtradas** na ordem escolhida; preserva o catálogo completo.
- `PgsAutoMatchPolicy`: sameSlot por interseção mínima de 60% da caixa menor,
  não distância fixa. Se espécies distintas tiverem scores com delta até
  0,035 no mesmo slot, marcar ambíguo e **não clicar** naquele slot.
  Templates da mesma espécie podem coexistir; ícones vizinhos permanecem.
- `PgsAutoIconDetector`: registra duração e total de slots ambíguos,
  mantendo análise apenas em feed, máscaras alpha, cores, duas capturas,
  thresholds existentes e ordem dos filtros.
- Prévia ◎ informa ambiguidade e tempo sem disparar `dispatchGesture`.
  `PgsAutoMenus` identifica forma e variante de um nativo, com texto
  truncado na interface compacta e descrição completa em acessibilidade.
- `PgsAutoClickService.toggle`: mensagem clara quando SDK<30, antes
  de iniciar uma varredura impossível de confirmar.
- Nova suíte LT356 Node abrangendo 1025 IDs e integridade/segurança, testes
  puros Java de política por slots/espécie, limite de seleção e prioridade.
  Execução obrigatória nos 7 gates de implementação (Node, LT169, LT211,
  Java LT62, OTA LT173, PGS QA Android e Secure beta APK/R8).

## O que não foi feito — e continua impedido
- **Não existem 1025 miniaturas nativas prontas neste APK PokeSearch.** O
  manifesto `assets/pgs-native/manifest.json` continua `entries: []` até
  obter imagens de referência de feed, direitos auditáveis e QA real por
  espécie/forma/variante. Não substituir sprites PGS por artes da Pokédex.
- Não publicar bibliotecas remotas sem assinatura própria, rollback e política
  de revogação; não contornar verificações do jogo.
- Não homologar fisicamente Metagross ou qualquer outra espécie sem um
  aparelho, captura do feed e observação da resposta real. `dispatchGesture`
  completado e delta RGB **não são prova de teleporte**.
- Não alterar a aparência oficial P1/P2, Doce Raro, Edu, contas, filtros;
  PR LT350 #385 permanece draft e não deve ser mesclada neste trabalho.
- O aviso **"Sou passageiro" nunca será confirmado automaticamente**;
  requer ação humana somente quando seguro.

## Matriz de aceitação ainda necessária
Amostras legítimas de pelo menos diferentes gerações, tipos de forma,
oclusão, tamanho, lado do feed, retrato/paisagem e duas capturas seguidas.
Incluir pares de ícones adjacentes e formas visualmente similares para
calibrar o limiar de ambiguidade (possíveis falsos negativos). Medir
latência/RAM/CPU/bateria em Samsung e aparelho mais simples. O CI é só
regressão estática e compilação, nunca teste de interface ou teleporte.

## Estado da PR e release
PR de implementação [#400](https://github.com/LucianoToscano/PokeSearch/pull/400).
A versão oficial anterior à LT356 é `0.03.51 / 54558 / 51355`,
tag `v0.03.51-54558`. **Preencher os SHA dos gates e da release
somente após verificação no GitHub; não presumir publicação.**

## Encerramento ARK e prova de publicação — 15/11/2026

**LT356 OFICIAL — 15/11/2026:** PokeSearch **0.03.52 / versionCode 54559 / label 51356**, [release v0.03.52-54559](https://github.com/LucianoToscano/PokeSearch/releases/tag/v0.03.52-54559), [APK oficial](https://github.com/LucianoToscano/PokeSearch/releases/download/v0.03.52-54559/PokeSearch-v0.03.52-LT.apk) **61.135.783 bytes**, SHA-256 `419a91801e0ea7fd3a411b173b9b3506078952f6aa1b6bea1f911df1793051e7`; [workflow protegido #43674772112](https://github.com/LucianoToscano/PokeSearch/actions/runs/43674772112) **SUCCESS**, preflight, build R8 assinado, publicação e digest público confirmados. Implementação [PR #400](https://github.com/LucianoToscano/PokeSearch/pull/400), squash `4fd956208c26c8fb3b0f6f764c12ac0498c0da51`; publicação [PR #401](https://github.com/LucianoToscano/PokeSearch/pull/401), squash `e4a6212abd623d45612302c66a51b4f21c434739`. Sete gates de implementação **SUCCESS**: Node #43674383163, LT169 #43674383262, LT211 #43674383208, Java LT62 #43674383271, OTA #43674383187, PGS APK #43674383196 e Secure beta/R8 #43674383143. LT356 auditou os 1025 IDs de espécies do catálogo contra nomes do APK externo PGSharp (1023 nomes idênticos; Farfetch’d/Sirfetch’d diferem só no apóstrofo), com 15 idiomas e 43.327 pares pt-BR de interface; nenhum conteúdo do jogo foi redistribuído. Infraestrutura para **até 4096 modelos nativos de espécies/formas/variantes**, verificação apenas das até 10 espécies filtradas, bootstrap correto de primeira instalação, amostras pessoais intactas, matching por sobreposição em vez de distância fixa e **recusa de toques em correspondências ambíguas de espécies**, diagnóstico de tempo/ambiguidade e aviso Android 11+ para captura. **CATÁLOGO DE IMAGENS PGS NATIVAS AINDA VAZIO:** 1025 espécies cadastradas não significam 1025 modelos visuais prontos. **BLOQUEADO no Samsung físico:** amostras reais autorizadas, reconhecimento/gestos no PGSharp, teleporte, Shiny, Encontro, consumo CPU/bateria e paridade visual. O aviso "Sou passageiro" sempre manual; callback Android e delta RGB nunca comprovam teleporte. LT350 PR #385 permanece draft, não integrada. Android só instala APK com autorização do usuário.

A implementação e a publicação foram concluídas e integradas; documentação pós-release é histórica. Nenhuma instalação silenciosa, nenhum modelo de feed extraído sem licença e nenhum teste de toque/teleporte real alegado.
