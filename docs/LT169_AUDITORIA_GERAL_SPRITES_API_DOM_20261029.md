# PokeSearch — auditoria geral de sprites API ON vs DOM OFF

**Data:** 29/10/2026. **Baseline:** LT168 (0.01.68, 54373), PR de QA isolada #114. **Não é release.** Outra PR #113 de perfis LT169 pode coexistir; coordenar o próximo número de versão antes de publicar.

## Sintoma reproduzido em prints do Samsung

- API direta **ON**: Flabébé amarela (#669, `form=Yellow`) aparecia como um círculo ◉ nos resultados e no card.
- API **OFF**, consulta DOM do PoGoCoordinates: a própria página entrega URL da imagem e o overlay a exibia.
- Outros Pokémon com formas especiais podiam apresentar o mesmo defeito, não limitado à #669.

## Causas-raiz verificadas no código da LT168

1. `api_result_contract.js:spriteData()` tem uma escolha intencional: só gera URL de sprite PokeAPI para espécies normais, pois o endpoint `/search` não entrega URL de imagens. `form=YELLOW` resulta em `image:""`.
2. `probe.js` no modo DOM extrai `imageFromSite` a partir do `<img>` ou atributos lazy específicos daquele encontro; `sprite_offline.js:resolve()` dá prioridade a essa URL.
3. `sprite_offline.js` incluía formas regionais e um catálogo PokeAPI, mas não tinha índice de sprites GO para muitas formas nomeadas como as cinco cores de Flabébé, Floette, Florges.
4. O nome de Flabébé no catálogo local era `FLABB`, causado por perda de caracteres acentuados. A normalização do nome da espécie agora preserva as letras ao remover diacríticos e aceita sufixos de forma entre parênteses.
5. Quando não havia URL válida, `dock.html` e `detail.html` exibiam círculos genéricos, mesmo após tentativas de carregar imagens de sprites disponíveis nas fontes.

## Solução proposta nesta PR

- **Indexação geral de GO**: verificados os 1.679 arquivos de formas e trajes `pm<ID>.f<FORM>` e `pm<ID>.c<COSTUME>` (com normal/Shiny/sexo quando presente) da árvore `PokeMiners/pogo_assets` no commit imutável `c2a686eb08ace6e890d8fe3d2134c76988db87b5`, Git tree `442199955917e581ac6686084defedddee70f309`. Index estático gerado no `sprite_offline.js`; bytes nunca são escolhidos só pelo Dex.
- **Auditoria de integridade**: arquivo `app/src/main/assets/go-exact-sprites.tsv` registra filename e **SHA-1 de objeto Git** de cada ícone GO. No Android, `VerifiedSpriteCache` valida hostname, commit, nome na allowlist, PNG/dimensões e o hash dos bytes antes de guardar em cache privado. Os caches são compartilhados pelas duas Pokébolas, com limite/expiração de tentativas; nenhuma credencial é enviada aos hosts de sprites.
- **Prioridades**: em DOM, manter **exatamente a URL da imagem do próprio encontro**, com correspondência validada. Se não houver imagem de site (API), manter sprites locais da forma exata já empacotada, depois resolver imagens GO por Dex+espécie+forma/traje+sexo+Shiny, com URLs de commit imutável e espelho. Não usar uma espécie, variante, cor ou traje diferente.
- **Sem círculo vazio**: durante carregamento ou se a arte realmente for desconhecida/indisponível, o espaço do sprite mostra discretamente as primeiras letras do nome, nunca o círculo ◉. A imagem exata substitui esse fallback ao carregar.
- **Compatibilidade**: o resolvedor é o mesmo para `dock.html` e `detail.html`, e ambas Pokébolas usam os serviços herdados de `OverlayService`. O mecanismo de busca e autenticação não foi alterado.

## Limitações importantes

- O endpoint `/search` **não fornece a URL literal usada pelo PoGoCoordinates**. No modo API, os ícones GO verificáveis são uma alternativa de *mesma variante*, não há prova de serem o mesmo arquivo/URL do site. Não tentar fazer buscas DOM extras, revelar coordenadas, inspecionar JWT ou contornar limites só para obter sprites.
- Algumas formas e trajes podem não existir na árvore GO fixada, ou não possuir um nome de forma seguro; não inventar arte. Sem Internet e sem cache prévio, um ícone GO remoto nunca visto não está garantido como imagem; o fallback exibe nome curto, não o círculo.
- O APK antigo já tem mais de 2.000 sprites base/shiny e variantes selecionadas empacotadas. A PR preserva sua prioridade e acrescenta cache persistente validado para os demais. Evitar aumentar o APK arbitrariamente com 1.679 downloads extra sem avaliação de custo.
- Passar nos testes Node e Java é necessário, **mas não prova renderização física** no Samsung. Testar várias formas e identidades, API ON/OFF, sem rede após cache, 100%/GL/UL, Shiny e ambas Pokébolas.

## QA mínimo de tela

1. Em busca API ON, visualizar Flabébé Yellow/Red/Blue/Orange/White, Floette e Florges, tanto sprite da lista quanto detalhe.
2. Repetir as espécies no DOM OFF e verificar que a URL original do site é priorizada.
3. Testar Vulpix Alola/Galar, Furfrou Natural, Pumpkaboo Average/Small, Deerling Autumn/Spring, Zubat/Gengar Halloween e Pokémon Shiny; conferir que nenhuma forma empresta a imagem de outra.
4. Fechar/reabrir overlay: imagens GO baixadas antes devem aparecer a partir do cache local validado. Repetir no overlay 2.
5. Em rede indisponível com imagem inédita, não declarar falsamente "carregou"; o card preserva nome e informações e exibe iniciais no lugar de círculo.
6. Verificar desempenho, uso de rede, ausência de crash, CDN bloqueado e efeito das regras de WebView.

**Estado:** PR de auditoria e correção, aguardando revisão integral do CI e QA física antes de mesclar ou oferecer atualização geral.
