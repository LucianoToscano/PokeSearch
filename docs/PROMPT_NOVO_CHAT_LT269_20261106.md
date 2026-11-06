# CONTINUAR POKESEARCH — APÓS LT268 (preparar LT269)

Repositório real: https://github.com/LucianoToscano/PokeSearch

## Base oficial que deve ser confirmada
- LT268 `0.02.68`, `versionCode 54472` (label 51272), tag https://github.com/LucianoToscano/PokeSearch/releases/tag/v0.02.68-54472
- APK https://github.com/LucianoToscano/PokeSearch/releases/download/v0.02.68-54472/PokeSearch-v0.02.68-LT.apk, **33.603.398 bytes**, SHA-256 **3b8250e7cdc3a1227f451a2c638a477809ed83def5e897d3d6af1bdca4edd050**
- PR #255 mesclada em `f3515cdc2c4564ae6aa5b7fd5873ab809a5b5cf7`, 8 gates CI aprovados, oficial #42265706690 `preflight/publish success` e QA assinada pós-merge #42265706774 `success`.
- Teste **físico Samsung não realizado**; a instalação do APK e a entrega pelo atualizador não foram verificadas. **A sincronização da APK no Drive não foi verificada**.
- LT267 0.02.67/versionCode 54471 continua publicada para rollback.

## Arquivos obrigatórios
1. `docs/GUIA_MESTRE.md`
2. `docs/LT268_AUDITORIA_FINAL_POS_RELEASE_20261106.md`
3. `docs/LT268_SEIS_ICONES_SEM_BRILHO_20261106.md`
4. `docs/LT267_AUDITORIA_FINAL_POS_RELEASE_20261106.md`
5. `docs/LT265_AUDITORIA_PTBR_COMPACTACAO_20261106.md`

## O que preservar
Duas Pokébolas independentes; buscas, raio/localização/ordenação, favoritos, alertas, login opcional, até 10 resultados; IV/PC/nível/PvP e ranks Classe e Geral separados; evoluções, Mega, 500/1500/2500; calculadora A/B e presets/PC-alvo; Raides por tipo com uma única combinação Ágil+Carregado suportada pela fonte; sprites de forma exata normais/Shiny e 128 trajes/eventos; traduções e status Elite/legado por IDs originais; assinatura permanente, OTA e mecanismos de rollback, P/M/G.

Não alterar ícones de **menus Modos** nem das **Pokébolas**. LT268 trocou somente os ícones exibidos em `detail.html` e painéis: GL azul/vermelho, UL preto/amarelo, ML roxo/rosa, Copa vermelho/branco, RG multicolorido, Raides brasão laranja, sem `drop-shadow`. Seis PNGs `ui-icons/ps-*-lt268.png` de 320×320 RGBA, hashes no workflow oficial; ícones históricos intactos.

## Pendência com evidência objetiva — PT-BR offline
O arquivo `app/src/main/assets/pve_moves_ptbr.js` tem **cinco diferenças** frente à fonte canônica pinada `WatWowMap/pogo-data-api` commit `31a3bcdc2e412f315c4be2bb593807f45cb9bd9b`:
- `AIR_SLASH_FAST` (255) -> **Golpe de Ar**, não Golpe Aéreo
- `THUNDER_SHOCK_FAST` (205) -> **Trovoada de Choques**, não Choque do Trovão
- `DRAGON_BREATH_FAST` (204) -> **Sopro do Dragão**, não Sopro de Dragão
- `WATER_GUN_FAST` (230) -> **Revólver d'Água**, não Jato d'Água
- `DRAGON_TAIL_FAST` (253) -> **Cauda do Dragão**, não Cauda de Dragão.

Cinco equivalências confirmadas ausentes do subset offline: `GUST_FAST` (345) Lufada de Vento, `INCINERATE_FAST` (346) Incinerar, `FLAME_CHARGE` (101) Ataque de Chamas, `FEATHER_DANCE` (348) Dança das Penas, `HURRICANE` (122) Furacão. Corrigir com testes de regressão por ID contra as duas fontes versionadas; não inventar movesets ou segundo golpe carregado PvE, não mexer em `pvp_rank_moves.js` se o mapeamento online segue intacto.

## QA física e funcional ainda aberta
No Samsung, validar fundos claro/escuro, nitidez de badges de 11–13 px, toque no RG e no ícone de Raides, arraste/scroll de cada cartão, janelas exclusivas PvP/Raides/Calculadora/Golpes, P/M/G, dois overlays, favoritos, troca de formas e Mega, IV A/B e PC/PS, Shellos East/West, Pikachu Diwali, Squawkabilly nas quatro cores, nomes dos golpes comuns e elite, updater integrado. Quando houver reprodução objetiva de bug, escrever teste antes da correção.

## Procedimento
Verificar `releases/latest` e HEAD da main; ler arquivos; modificar em branch só após evidência. Rodar Node, Java, visual P/M/G, PvE, OTA, QA assinada e preflight; corrigir falhas sem afrouxar verificações. PR -> merge -> solicitação versionCode monotônico e assinatura oficial -> conferir release pública e digest -> atualizar arquivo mestre e auditoria pós-release. Não afirmar APK instalada, teste físico ou Drive sincronizado sem prova.

Meta: nunca empobrecer o PokeSearch; legibilidade compacta, acesso completo aos cálculos e dados verificáveis.
