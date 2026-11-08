# LT316 — Auditoria complementar das 68 sprites do Edu

**Base publicada em 08/11/2026:** LT315 · `0.03.15` · versionCode `54521` · APK oficial SHA-256 `deb7905814716df474e39cb12e53f0ef9a807b5ff00398b3d1254def22279f98`.

## Relato do usuário
Na LT315, determinadas sprites ainda parecem menores; a legibilidade de rostos, objetos e indicadores precisa ser revista em P=50, M=75 e G=100 px.

## Evidências técnicas
- Atlas LT315 real: `edu_avatar_uniform_68.webp`, 1024×1152, SHA-256 `90c363203dd9c8ed7e014237b13eded699d1030a59463d7c41ae51191ce52893`.
- A célula é constante (128×128), mas a altura aparente de alguns corpos é menor. O topo do cabelo aparece aproximadamente entre Y=9 e Y=26 em quadros comuns, com base dos pés próxima de Y=120.
- O efeito da Pokébola, escudos, calendário, celular e ícones externos torna o bounding-box global inadequado para medir o corpo.
- Ao renderizar P=50px, textos ou símbolos internos minúsculos não são legíveis de maneira confiável. As explicações textuais devem ficar nos balões e não ser confundidas com elementos obrigatoriamente legíveis no pixel art.

## Proposta em QA
- Atlas alternativo `edu_avatar_uniform_68_lt316.b64`, WebP lossless interno 1024×1152, 220.866 bytes decodificados, SHA-256 `cb9ffbc0886824b04977140a3c7cfc381f9c9244700a72c8e8011af204050a1c`.
- Foram inspecionados os 68 quadros, com **51 alterações controladas** de escala e alinhamento. O corpo usa como referência cabeça/cabelo e pés; acessórios não determinam escala.
- Nine frames 52–60 (teleporte) não recebem escala: mudança de tamanho/visibilidade é proposital.
- Critério de segurança visual: perda máxima de alfa de 0,8% por quadro; casos com risco de recorte mantêm o frame original ou alteração menor.
- **Exceções para retoque manual antes de alegar perfeição:** 20, 28, 30, 36, 49, com acessórios que ocupam quase a moldura. Nenhum ganho automático deve sacrificar seus objetos.
- Se a revisão falhar ao decodificar, o carregador continua usando o atlas da LT315. Todos os estados da coleção permanecem com índices 0–67.
- **NÃO** altera tamanho P/M/G, cor dos balões, relógio único, plano de reides, API, P1/P2, Doce Raro, login, assinatura ou atualizador.

## Requisitos de teste para merge ou publicação
1. Executar `node app/tests/lt316-edu-uniform-68-audit.test.js`, regressão Node completa, Java/Gradle e OTA.
2. Conferir previews `antes_68.png`, `depois_68.png`, `legibilidade_p_m_g.png` do pacote QA.
3. Inspecionar no Samsung trocas Parado/Jogando/Armaduras/Sombria, caminhadas, arrastar e transições para estados do tutorial em P/M/G; checar efeitos cortados, olhos, faces e contorno nítido.
4. Se algum quadro ainda aparentar menor ou alguma legenda/ícone essencial for ilegível, retocar o quadro antes de declarar correção completa. Não criar um texto minúsculo na imagem.
5. Não publicar como LT316 até a homologação dos casos restantes ou aceite expresso do usuário; não confundir QA automatizado com revisão visual real no dispositivo.

**Estado desta PR:** auditoria e integração opcional de QA. Não é uma release nem instalação efetiva do usuário.
