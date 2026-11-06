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
