# LT316 — Retoques finais e implantação segura da coleção do Edu (08/11/2026)

## Fonte e escopo

Base oficial anterior: LT315 (`0.03.15`, code 54521). O usuário identificou personagens com alturas distintas na LT315 e autorizou explicitamente retoques e nova publicação.

- 68 poses revisadas; versão QA inicial com 51 ajustes de alinhamento no atlas `edu_avatar_uniform_68_lt316.b64` (WebP interno lossless 1024×1152).
- Cinco exceções `20, 28, 30, 36, 49` retocadas diretamente no Android por `EduSpriteManualRetouch.java`, usando polígonos que isolam o corpo, `Canvas.clipOutPath` para preservar os acessórios, escala localizada 1,090–1,165×, ancoragem horizontal pela cabeça e pés em Y=119.
- Os acessórios calendário, indicadores, itens e celular mantêm suas proporções, sem escala da imagem inteira. O resultado de cada pose é cacheado por `EduSpriteAtlas.frame` e não recalculado a cada tick.
- Retoque só quando a coleção QA foi decodificada corretamente (flag `correctedAtlas`); em falta/erro do atlas QA, usa LT315 **sem** a retocagem localizada, garantindo fallback verificável.
- As 22 poses ociosas mantêm pausas e tamanho do corpo (P=50, M=75, G=100 px), Sombria índice 67 reservada aos estados ansiosos. Os nove quadros de teleporte (52–60) não são redimensionados porque o desaparecimento é parte da animação.
- Foram exportadas imagens reais de `cinco_retoques_antes_depois.png`, `cinco_retoques_PMG.png` e `68_quadros_revisados.png` para inspeção. O principal contorno é legível em P50, mas caracteres pequenos dentro de desenhos NÃO devem ser tratados como texto obrigatório — informações essenciais devem continuar no balão.

## Regras de segurança e QA

- Não alterar P1/P2, APIs de PoGoCoordinates, login, versão anterior de APK, relógio único, tutorial, notificações ou assinatura Android.
- Testes: `node app/tests/lt316-edu-uniform-68-audit.test.js`, `node app/tests/lt316-edu-manual-retouch.test.js`, regressão Node, Java Android LT62, OTA LT173, QA LT211 e workflow oficial.
- As diferenças artísticas entre desenhos, por exemplo roupas/armadura/Shiny e perspectiva da caminhada, não devem ser "corrigidas" com filtros de suavização. Preservar transparência e pixel art nearest neighbor.
- Não afirmar homologação visual **física** do Samsung até confirmar instalação e comportamento no dispositivo. O aceite para publicar foi expresso pelo usuário; essa aprovação não substitui o QA físico.
- A Release deve ser publicada somente após merge squash e sucesso de CI. Se o fluxo bloquear, manter LT315 pública e comunicar objetivamente.

## Reprodução

O atlas de 68 imagens é pré-alinhado; a correção Android só atua nos cinco índices. A prévia local da operação equivalente está no ZIP `Edu_LT316_68_Sprites_Retoque_Final_QA.zip`. O Java não depende de acesso à rede, permissão extra ou Firebase.
