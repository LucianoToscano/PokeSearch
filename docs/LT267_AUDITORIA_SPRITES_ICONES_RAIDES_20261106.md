# LT267 — Auditoria de sprites, símbolos e Raides (06/11/2026)

## Fonte pública comprovada
LT266, v0.02.66-54470, APK SHA-256 `218e07e37945216021724429acd9b64a971a1e108688ec15bd5d079615555abf`.

## Problemas apontados em prints físicos do usuário
- Calculadora LC 500 mostra círculo branco, e o cartão de Raides repetia "Mega" após nome da forma.
- Pikachu #25 em traje Diwali 2024 e Squawkabilly #931 Green / demais plumagens exibiam sprites ausentes ou ilegíveis.
- Novas artes Mega e Sombroso solicitadas; usuário deseja até 2 ataques carregados nas recomendações PvE.

## Implementação conservadora
- LC usa a imagem de Copa transparente já auditada da LT265. Novo símbolo Mega substitui os bytes do ícone Mega antigo em todo o cartão, mantendo path e layout; novo símbolo Sombroso só é visível com booleano de origem `isShadow`/`shadow` confirmado.
- Raides: um só prefixo Mega ("Mega Beedrill"), ícone da Mega, ícone do tipo real vindo dos 18 tipos LT266 e Rank # POR TIPO. Não é ranking PvP Rank Classe/Rank Geral nem counter vivo contra chefes específicos.
- A referência `S-Tier-Devs/pogo-db-api` fornece apenas 1 par rápido+carregado por rank. O segundo carregado é possível no jogo, mas NÃO é recomendado pelo app sem segunda fonte verificável.
- `sprite_offline.js` já indexava os 10 arquivos em `go-exact-sprites.tsv`; normalizações restritas e verificadas tratam os quatro nomes de plumagem e Diwali/Diwalli. `build_sprite_bundle.py` passa a incorporar os 10 PNGs oficiais com hash Git blob SHA1 existente e fonte PokeMiners imutável. Site verdadeiro continua prioritário. `sprite_visual_scale.js` permite zoom limitado de silhuetas com margem transparente, sem alterar qualidade das imagens ou identidade.
- Teste `app/tests/lt267-sprites-raid-icons.test.js` cobre normal/Shiny, quatro cores, costume Diwali, prioridade da URL do site, rejeição de forma falsa, hash dos novos ícones, caminhos de LC/Raides, cache offline e hash-pinning no build. O workflow oficial exige PNGs dentro do APK assinado.

## Efeitos e riscos
Troca de Mega PNG aumenta o APK e a textura decodificada; sem teste físico P1/P2 ainda. Build QA deve validar Gradle, 10 assets no APK, Java, Node, visual P/M/G, PvE, OTA e preflight antes do merge. Nenhuma alteração de IV/CP/PvP, buscas, favoritos, assinatura, tipos ou filtros internos.

## Estado de validação
Branch de QA. Não afirmar merge/release física até confirmação de CI, links e SHA-256 oficiais. LT266 deve continuar como rollback.

## Complemento — 18 tipos revisados e ícone Rank Geral
- Usuário forneceu ZIP revisado com versões 256/512/1024/2048; foram escolhidos 18 originais PNG_512 (512×512 RGBA), sem reamostragem adicional, total cerca de 2 MB.
- Originais LT266 mantidos, novos arquivos `ui-icons/type-<tipo>-lt267.png`; a API conserva os 18 enums técnicos.
- Novo ícone Rank Geral triangular do usuário recebe somente remoção do fundo preto e redimensionamento transparente 160×160; ícone utilizado nas etiquetas RG da linha e nas alternativas, nunca na classificação IV.
- Teste `lt267-revised-types-rank-general.test.js` valida SHA-256 dos 19 recursos, transparência, dimensões, trilha OTA/assinatura, acessibilidade RG e distinção de ranks.
- CI, PR, merge e APK permanecem pendentes até evidência do GitHub. Inspeção física Samsung não executada.

## Verificação CI e merge das PRs
- PR #247: https://github.com/LucianoToscano/PokeSearch/pull/247, merge `e0e96bbce1dfc9b1acb6e4990f48b2dd70de9c9d`.
- PR #248: https://github.com/LucianoToscano/PokeSearch/pull/248, merge `c9fd24498da2ecb82b7092cb2fc7f39568b64f47`, head QA `09dce8e30626682ec41c8c72722fbb01357c72e2`.
- Oito gates verdes no head final: regressões Node completas e Node QA, core, Java, visual WebView P/M/G, fonte PvE, OTA e preflight. Falhas preliminares de sintaxe no mapa de tipo e dependência de função no teste isolado RG foram corrigidas; o RG passou a pseudo-elemento CSS compacto para evitar recorte real de nome Mega no teste visual. Todas as verificações históricas mantidas.
- Release LT267 solicitada, **não afirmar APK/assinatura/publicação até retorno do workflow e digest real**. Teste físico no Samsung pendente.

## Limite de APK e preservação de rollback
- A tentativa oficial [#42238275812](https://github.com/LucianoToscano/PokeSearch/actions/runs/42238275812) não publicou release: a validação final retornou código 1 após verificar todos os PNGs e antes de gerar o artefato. O limite existente `test "$(stat -c %s "$APK")" -lt 35000000` é o bloqueio mais provável, pois 18 PNGs antigos de cerca de 5,7 MB ainda ocupavam o APK.
- Correção conservadora: mover os 18 PNGs antigos LT266 sem modificar conteúdo para `docs/legacy-assets/lt266-types/` e deixar somente os atuais LT267 no APK. SHA-256, 1024×1024 e canal alfa dos originais continuam verificados; novo gate garante que não aparecem duplicados no APK. O limite de 35 MB **não muda**.
- O rollback oficial LT266 contém os recursos LT266. Os novos PNGs LT267 permanecem hash-pinned no APK novo. Antes da conclusão da nova CI/publicação, não afirmar que o tamanho passou nem que APK foi lançada.

## Diagnóstico da segunda falha e correção conservadora (06/11/2026)
- Workflow oficial #42240094259: falha objetiva `NameError: name 'os' is not defined` na verificação Python de recursos antigos arquivados. O compilador finalizou o APK antes desse erro; não há evidência de publicação. Código corrigido para importar o módulo, mantendo o gate de 35MB e verificações de assinatura e hashes.
- QA assinado #42240094362: `Drive Pokémon type icons not packaged`. Um teste antigo procurava 18 dados Base64 no `pokemon_type_icons.js`, substituídos desde LT266 por imagens locais. O teste não foi removido: passou a validar todos os 18 enums, caminhos, dimensões, PNG RGBA e SHA-256 exigido pelo workflow oficial.
- Regressão `lt267-legacy-icons-size-budget.test.js` impede retorno do teste obsoleto.
- Confirmação CI/merge/APK LT267 ainda precisa ser atualizada após novos resultados reais.

## QA de sprites: nova contagem fundamentada
- Na [QA assinada #42254494322](https://github.com/LucianoToscano/PokeSearch/actions/runs/42254494322), o código que confere tipos locais RGBA e SHA-256 passou. O build de sprites gerou 1.025 bases e 1.025 shiny, mas a asserção fixa `len(report['costumes'])==106` falhou após o acréscimo de dez imagens LT267 verificadas por Git blob PokeMiners.
- Correção: exigir **116** costumes (106 anteriores mais 10) e validar separadamente presença, arquivo físico e SHA-256 contra o manifesto para Pikachu Diwali 2024 (normal/Shiny) e Squawkabilly BLUE/GREEN/WHITE/YELLOW (normal/Shiny). Não baixar sprites genéricos, não permitir formas falsas, não enfraquecer as verificações.
- QA assinada deve rodar novamente na `main` após o merge; testes físicos no Samsung continuam pendentes.

## Contagem corrigida pelo inventário real, sem afrouxar QA
- A execução assinada [#42255782001](https://github.com/LucianoToscano/PokeSearch/actions/runs/42255782001) confirmou que a correção intermediária de 116 ainda falhava, na linha do total de costumes. A origem não era um erro de sprites: `COSTUME_FILES` define 124 entradas distintas.
- Composição histórica verificável: 106 arquivos de trajes originais + 8 Shellos/Gastrodon Mar Leste/Oeste (LT260) + 10 Pikachu Diwali/Squawkabilly normais e Shiny (LT267) = **124**.
- Novo gate QA exige exatamente 124 registros e também valida presença e SHA-256 de cada um dos 18 sprites especiais (8 Mar + 10 LT267), sem relaxar assinatura, limite de APK nem permitir formas genéricas. Teste Node conta as 124 chaves pinadas no script construtor para impedir novas divergências.
- A APK pública LT267 é independente dessa correção de QA: já foi publicada pelo workflow oficial #42254494312 com assinatura e SHA-256 verificados. É necessário observar o próximo teste assinado antes de declarar QA concluída.

## Correção definitiva da soma: 128 sprites no manifesto
- O [workflow #42256849422](https://github.com/LucianoToscano/PokeSearch/actions/runs/42256849422) voltou a falhar na linha da contagem. A auditoria do código completo revelou que `build_sprite_bundle.py` adiciona, além dos **124** `COSTUME_FILES` PokeMiners, **4 `verified_event_pngs`** LT144 (Zubat Halloween 2026 e Gengar 2023, normais/Shiny) recuperados exclusivamente da APK assinada LT144 quando necessário. Esses arquivos são inseridos em `costume_hashes`, portanto o manifesto contém **128**, não 124.
- A QA exige **128** e valida a presença, integridade do manifesto e SHA-256 dos quatro sprites LT144, além dos oito Shellos/Gastrodon LT260 e dez Pikachu Diwali/Squawkabilly LT267. Teste Node valida a soma 124+4.
- A release pública LT267 de 33.059.748 bytes e SHA256 `a25c9a6b56408d532359b516066ff5c571d6c958ffb1e9d7be230c300f6c3250` já está publicada; este patch afeta só QA e documentação, não altera APK nem assinatura. Requer nova execução da QA assinada para confirmação final.
