# PokeSearch — LT397 — ícones oficiais do usuário (Assistente, Grupo, Trocas)

**Base:** PokeSearch v0.03.81 LT / versionCode 54588.
**Data:** 17/11/2026.

## Solicitação e correspondência

Substituir três ícones da Home usando os **novos arquivos anexados pelo proprietário**:

| Módulo Home (índice 0–15) | Arte enviada | Resultado |
|---|---|---|
| Assistente (3) | `Assistente.png` (1024 × 1024, RGBA) | Novo personagem branco; somente a Home muda, o ícone flutuante do Assistente continua independente |
| Trocas (13) | `Trocas.png` (1024 × 1024, RGBA) | Setas/círculos brancos; tela e ação anterior de Trocas preservadas |
| Comunidade (15) | `icone_jogo_em_grupo.webp` (1536 × 1024, RGBA) | Símbolo Grupo de três pessoas brancas; o módulo **continua chamado Comunidade** e abre os controles anteriores da Comunidade |

**Nota:** Grupo é a nova arte do ícone de Comunidade, não um 17º módulo adicional.

## Normalização óptica

- Mantiveram-se cor, desenho, contorno e transparência dos arquivos enviados; foi removida **apenas a margem transparente excessiva** para dimensionar sem cortar nenhum traço.
- O conteúdo de cada arte foi centralizado em um tile transparente de **256×256 px**, preservando sua proporção: Assistente 137×190, Trocas 191×196 e Grupo 198×124 pixels visuais.
- Os tiles ficam em um único arquivo offline `app/src/main/assets/home-lt397-owner-icons.png` (faixa **768×256 px**, PNG RGBA) de SHA-256 **`aec9248bfab9f74e058e990fbea079840010db75afc071737fa9ddddd96928ba`**.
- `HomeUserIconAtlas.icon` substitui **somente** os índices 3, 13 e 15; lê o arquivo uma vez, utiliza cache por índice e mantém fallback de arte em caso de indisponibilidade.
- `MainActivity.addHomeGridCell` usa a mesma caixa visual 51dp e mesma linha-base de legendas da grade **4×4**. Os três novos desenhos recebem padding horizontal uniforme de 3dp, vertical 2dp e nenhum filtro/saturação adicional, preservando o branco.
- Os outros **13 módulos** e o atlas LT396 anterior permanecem inalterados: Quests reparado, Pokédex original, as duas Pokébolas brancas ao desligar sem IV, Rare Candy, Rocket, etc.

## Qualidade e compatibilidade

- Teste `app/tests/lt397-three-owner-home-icons.test.js`: SHA-256 exato, cabeçalho PNG, largura/altura e 3 bounding boxes de alpha com margens positivas, mapeamento de índices, limpeza de tintes, rótulos e ações preservadas, layout 4×4.
- Os contratos LT395 e LT396 continuam verificando o atlas anterior, os contornos restaurados e os menus, ajustados somente quanto à substituição **expressamente autorizada**.
- Necessários antes do merge: Node QA, LT169, LT211, LT62 Java Android, LT173 OTA, FastDev smoke, beta APK/R8.
- **Homologação física no Samsung Android 17 pendente**. Confirmar escala, posições, branco em fundo escuro/claro, acessibilidade e funcionamento dos 3 botões no dispositivo.
- Sem alterações em dados pessoais, filtros, buscas, ranking, login, chaves, assinatura ou fluxo de atualização. A publicação oficial usa exclusivamente certificado permanente e versionCode monotônico.

## Continuidade

Se os testes aprovarem, integrar PR, solicitar nova versão oficial, registrar evidência de release assinada e SHA-256, realizar ARK LT397 e começar LT398 a partir do APK oficial. Não afirmar validação visual física até receber captura do Samsung.
