# LT335 — Assistente Edu: corrigir gestos, revisar 68 sprites e linhas-guia (14/11/2026)

## Evidência do usuário

Duas imagens mostram o braço interrompido no sprite segurando o celular, e um vídeo vertical (411 quadros a aproximadamente 54,8 fps, 252×268) confirma que animações passam pela pose padrão e pela Pokébola em diferentes alturas. A fonte do problema da Pokébola estava em `EduPokeballStable.java`: apagava até a coluna x225 e copiava o braço apenas até limites fixos por linha (`gestureRight`), criando uma borda de corte. Os quadros do celular #63/#64 eram desenhos com proporções próprias, e não apenas variações da #42.

## Correção de arte NO APLICATIVO (sem tocar os binários-mestres)

- `EduSpritePoseComposer.java`: usa a cópia da #42 como cabeça, olhos, óculos, cabelo, roupa, pernas e calçados fixos. **Somente os braços/mãos e a Pokébola ou o celular são desenhados por polígonos fechados**, com contornos contínuos até o ombro. Não há limites `gestureRight`, escala anisotrópica nem expansão da cabeça. Modifica os quadros 0–3 e 63–64; os outros 62 índices permanecem iguais. A #42 original não sofre mutações.
- Sem interpolação bilinear, anti-alias ou filtros que apaguem olhos e óculos. Toda composição ocorre uma única vez no carregador LRU 512.
- Não confundir composição programática fiel ao corpo #42 com substituição artística dos 68 PNGs originais. A imagem final será avaliada no Samsung físico após a release.

## Modo de inspeção independente

- `EduSpriteInspector.java`: pequena barra flutuante `◀️ 👬 ▶️`, fora da área da sprite e do balão de conversa. Ao tocar em ◀️/▶️ o quadro selecionado fica **congelado** e percorre os índices 00–67, incluindo contextos e armaduras; o número `#NN` aparece discretamente.
- `👬`: exibe #42 e #NN lado a lado, com igual tamanho de célula. Se não couberem no dispositivo, ambas são reduzidas **na mesma proporção** apenas no comparador, nunca nos masters. Segurar 👬 devolve a animação automática. O comparador não intercepta toques, e a bolha pode continuar sendo arrastada.
- Nova opção no menu `Ajustes do Edu`: **Controles de inspeção** (padrão visível, pode ocultar) e **Linhas-guia** (padrão ocultas, pode mostrar). Um botão no menu retoma a animação automática.
- `EduSpriteGuideView.java`: cruz central X=256, topo do cabelo Y=41, linha dos óculos Y=185, linha das mãos Y=342, linha dos pés Y=476, retângulo de referência da cabeça (largura ~213px). Linhas desenhadas em View transparente **sobre** a arte; não modificam PNGs. O usuário pode tirar screenshot/gravar sem precisar editar imagens.
- `EduSpriteMeasurements.java`: valores auxiliares de *diferenças estimadas* entre #42 e #NN para largura da cabeça, óculos, mãos, pés e altura visível. As cores são analisadas apenas em regiões do corpo para reduzir interferência de acessórios. Efeitos de teleporte/fantasias/movimentos intencionais não devem ser interpretados como defeitos automaticamente.
- O inspetor acompanha a bolha ao arrastar, respeita P/M/G, persiste preferências, sai da tela durante pedido de permissão de captura, remove overlays em onDestroy e não altera sessão, passes, passos do tutorial ou dados Pokémon GO.

## QA e limites

- Testes estáticos: `app/tests/lt335-edu-inspecao-68-guias-gestos.test.js` e regressão antiga `lt334-edu-pokebola-corpo-fixo.test.js` atualizada.
- Exigir Node, Android Core, Java, OTA e APK beta assinado antes da PR; publicação somente pelo workflow oficial protegido, com versionCode crescente.
- **Teste físico Samsung continua pendente**: confirmar visualmente nos tamanhos P/M/G a continuidade de braços, conexão ao pescoço e mãos, legibilidade do celular, posicionamento da barra e linhas-guia em screenshots/vídeos.
- Não alegar conclusão da auditoria artística de todos os 68 masters. A issue #334 continua rastreando demais poses que ainda exigem retoque.

## Versão planejada

LT335 / 0.03.34 / versionCode 54540 / label 51338, sucessora de LT334 / 0.03.33 / 54539. Não publicar enquanto os gates de CI estiverem falhando.
