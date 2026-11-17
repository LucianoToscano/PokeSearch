# PokeSearch — ARK LT397 — ícones enviados e Home harmonizada, versão oficial 0.03.82 LT

**Data:** 17/11/2026. **Versão anterior:** v0.03.81 LT (54588). **Versão oficial publicada:** v0.03.82 LT (54589).

## Pedido e escopo autorizado

Substituir os desenhos dos módulos **Assistente, Grupo e Trocas** com os três arquivos fornecidos nesta conversa, alinhar a grade de 16 módulos e harmonizar o tamanho óptico. Para conservar a navegação existente, **Grupo é a arte do módulo Comunidade**, sem criar nova opção ou renomear a funcionalidade.

| Módulo da Home | Imagem enviada | SHA-256 original | Índice na grade 4×4 |
|---|---|---|---|
| Assistente | `Assistente.png` (1024×1024 PNG RGBA) | `4ccc1a984f5feec7b5496478fce08b8e52d75e92e333814abb2475bbe7a1bc32` | 3 |
| Trocas | `Trocas.png` (1024×1024 PNG RGBA) | `6910b006606b23a1f66f8e3e7cda1cff066d11463c0547e0cea32ff9a0fc4a61` | 13 |
| Grupo / Comunidade | `icone_jogo_em_grupo.webp` (1536×1024 WebP RGBA) | `c9d971626e488160979e6e4b04bb6232af257f595235e509cba62e46c68967a0` | 15 |

## Implementação

- As imagens **não foram redesenhadas ou recoloridas**: apenas remoção de transparência excessiva, dimensionamento proporcional com LANCZOS e alinhamento central em tiles RGBA 256×256.
- Dimensão do conteúdo visível antes da margem final: Assistente **137×190**, Trocas **191×196**, Grupo **198×124**. Todos mantêm proporção original, centro óptico e área segura.
- Os três tiles são distribuídos em um recurso offline `app/src/main/assets/home-lt397-owner-icons.png`, resolução **768×256** e SHA-256 **`aec9248bfab9f74e058e990fbea079840010db75afc071737fa9ddddd96928ba`**.
- `HomeUserIconAtlas` lê o recurso apenas uma vez e o reutiliza por cache. Índices 3/13/15 exibem as novas imagens; o antigo atlas é preservado para os outros 13 módulos.
- `MainActivity.addHomeGridCell` alinha os 3 desenhos com padding uniforme (3dp horizontal, 2dp vertical), mesma área de ícone 51dp e mesmos títulos na grade. Nenhuma dessaturação do novo Assistente ou tint no branco.
- **Preservadas**: ação do Assistente, chat/Comunidade, entrada de Trocas em preparação, ícone flutuante do Assistente (independente), Quests recuperado, Pokédex original, Pokébolas brancas OFF sem IV, menu lateral LT395, filtros P1/P2 e demais funcionalidades.
- `app/tests/lt397-three-owner-home-icons.test.js` comprova SHA, PNG RGBA, três limites de alfa com margem segura, correspondência exata dos índices, rotas e grade 4×4. Regressões LT395/LT396 preservadas com adaptações pontuais às substituições autorizadas.

## Evidência de qualidade e lançamento

- PR de código [#503](https://github.com/LucianoToscano/PokeSearch/pull/503): **MERGED**, squash `10d5fe338a4e8db824e52550ffc849a36c98285a`.
- Todos os gates aprovados: Node QA, LT169 regressões completas, LT211 Android logic, LT62 Java Android, LT173 OTA, FastDev smoke e beta APK/R8.
- PR da solicitação [#504](https://github.com/LucianoToscano/PokeSearch/pull/504): **MERGED**, squash `097e6188e724c7d7758be499d7690e2c3d46e31e`, notas internas em `app/src/main/assets/release_notes.json`.
- [Workflow protegido oficial #44064078726](https://github.com/LucianoToscano/PokeSearch/actions/runs/44064078726): **completed/success**. Certificado permanente, compilação/assinatura e checagem do SHA-256 público aprovados.
- [Release estável v0.03.82-54589](https://github.com/LucianoToscano/PokeSearch/releases/tag/v0.03.82-54589), não-draft, não-prerelease; versionCode **54589**, label **51397**.
- APK: [PokeSearch-v0.03.82-LT.apk](https://github.com/LucianoToscano/PokeSearch/releases/download/v0.03.82-54589/PokeSearch-v0.03.82-LT.apk) — **61.442.014 bytes**, SHA-256 **`b69f00c18529ace18257fac52b19eb10b60328854cb9000250fcef06899cc250`**; asset com estado `uploaded`.
- Mantida a versão anterior para histórico. Instalação sobre v0.03.81 LT de mesma assinatura, sujeita à confirmação do Android.

## Homologação pendente — continuidade LT398

1. **Inspeção física do APK v0.03.82 no Samsung SM-S928B Android 17 permanece pendente**. Conferir posições, tamanho, visibilidade no tema escuro e claro, transparência e rótulos.
2. Conferir clique do Assistente, abertura das opções Comunidade ao tocar no ícone Grupo, e ação anterior de Trocas; garantir que os novos desenhos não ativem serviços diferentes.
3. Conferir os outros 13 módulos, fundo e menu lateral, especialmente Quests, Pokédex, P1/P2 OFF e o overlay flutuante original do Assistente.
4. Testar telas menores, diferentes densidades, fontScale e TalkBack. Ajustar proporcionalmente se necessário, sem substituir outras artes.
5. Não declarar renderização pixel-perfect no aparelho apenas com CI. Se aprovado em screenshots reais, registrar evidência e iniciar próxima LT com versionCode monotônico e fluxo ARK protegido.

**A integridade do APK e os testes de código estão confirmados; homologação física ainda não está confirmada.**
