# PokeSearch LT268 — Seis ícones oficiais e RG corrigido (06/11/2026)

## Escopo autorizado
Substituir SOMENTE os ícones exibidos no cartão `detail.html` e nos painéis de Raides/PvP/Calculadora. **Não modificar** as duas Pokébolas, ícones do menu Modos, caminhos `result-icons/modes`, `dock.html`, buscas, rankings, cálculos ou ligação com a API.

## Material enviado e correspondência comprovada
- Grande Liga → triângulo azul com faixa vermelha → `ps-gl-lt268.png`.
- Ultra Liga → triângulo preto com duas faixas amarelas → `ps-ul-lt268.png`.
- Liga Mestra → triângulo roxo com faixas rosas → `ps-ml-lt268.png`.
- Copa → triângulo branco/vermelho → `ps-cup-lt268.png`.
- Rank Geral → triângulo multicolorido com Pokébola → `ps-overall-lt268.png`. **Não** usar o brasão laranja aqui.
- Raides → brasão laranja com símbolo branco → `ps-raid-lt268.png`.

Os seis arquivos vêm dos uploads do usuário. A correção de transparência seleciona apenas o maior componente sólido do canal alfa, exclui partículas/halo e preserva o conteúdo original, depois centraliza em canvas 320×320 RGBA com reamostragem LANCZOS. Sem alterar o desenho do Pokémon / Pokébola, sem fundo chapado, sem filtro de brilho CSS.

## SHA-256 estrito (build oficial)
- `ps-gl-lt268.png` — `f8e3d8c282806e4dcad90100763722c6cb1866ec253c1de600a9bbf66f91603c`
- `ps-ul-lt268.png` — `2b2dba41fa49632b035fe0debf9136dea78d79fe37a3bed56b98a3516cef9e90`
- `ps-ml-lt268.png` — `4994287c9061ecfbd3119990d7bdca7de2a0a69139c18f1216a7d8d539fcd606`
- `ps-cup-lt268.png` — `55379064c3e3646dedfd7936f85b6a109769ef910175027b4e8d67b010cf5a32`
- `ps-overall-lt268.png` — `2a7ceb2d32a345470fbd6bd763e2dd4ca65251040a4a1bbf292a161746bbcb87`
- `ps-raid-lt268.png` — `989c5530516a33e60cfad6de6ca649e35fd7a3c3a50ebbe0a54946ef4fa612fa`

## Implementação / preservação
- Alterado apenas `app/src/main/assets/detail.html` no frontend; `PS_LEAGUE_ICONS`, `PS_LEAGUE_BORDERED`, badges RG/raid, classificação alternativa, notificações, calculadora LC/GL/UL e painéis usam as novas imagens, sem mudança de tamanho/layout e sem sombreamento de liga.
- Arquivos históricos LT262/LT265/LT267 mantidos intactos e exigidos pelos testes existentes e gate oficial.
- Não tocar em `dock.html`, `result-icons/modes` ou recursos Android das Pokébolas.
- Teste dedicado `app/tests/lt268-six-clean-badges.test.js` verifica seis hashes, 320×320, alfa, ausência de glow e preservação dos controles. Regressões históricas foram atualizadas somente nas expectativas de imagens mostradas pelo cartão.
- OTA assinado já aceita `ui-icons/*.png` e `detail.html`; não ampliar permissões.
- Solicitação da versão LT268 0.02.68 / code 54472 foi preparada. **PR, CI, merge, publicação, assinatura e QA física Samsung precisam de verificação separada; não alegar conclusão antecipada.**

## Primeira execução CI da PR #255 e correção
- Os gates visual P/M/G, fonte PvE, Node QA e preflight passaram no head `958559a`.
- Regressão Node e QA core apontaram **quatro testes históricos** ainda atrelados aos filenames LT262/LT265 e regex nova com barra duplicada; os recursos históricos originais não mudaram.
- Ajuste altera somente as expectativas do cartão para os seis nomes LT268 e corrige a extração segura do script; novas execuções CI são obrigatórias antes do merge.
