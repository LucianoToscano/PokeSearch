# PokeSearch — ARK LT368: Continuidade após Editor de Sequências LT367

Assuma desenvolvimento e auditoria sênior do projeto LucianoToscano/PokeSearch. Materiais/APKs/APIs já foram autorizados pelo proprietário; NÃO pedir reconfirmação. Ler AGENTS.md, docs/GUIA_MESTRE.md, docs/LT367_EDITOR_SEQUENCIAS_VISUAIS_20261115.md. Revalidar main, última release, PRs, todos os gates e assinador antes de editar. Base inicial antes de LT367: PokeSearch 0.03.62 / code 54569 / label 51366, main e31dbbef44ee8aca39b9024079ae36f074c55518. Próximo code obrigatoriamente >54569, atualize conforme última release real.

A LT367 implementa editor compacto dentro de Buscar (≡ ao lado de Auto Hunt), passos numerados Toque/Arrastar/Espera/Sprite de modelo carregado, pontos em overlay transparente, ordem ↑↓/excluir, copiar/colar passo interno, tempos, prévia sem gesto, execução opt-in por PGSharp/Pokemod, callback de gesto Android e confirmação de sprite em duas capturas, 12 passos/120s estimados/watchdog 180s e salvaguardas por janela/perfil/aviso/rotação. Verifique na branch/main a situação FINAL; não declare publicação sem release e APK confirmados.

P0: validar Android Samsung real com dois perfis separadamente, editor P/M/G, teclado, TalkBack, orientação, mira A/B, círculos e linhas, swipe, scanner, ação de clipboard interno, limites, parada imediata e avisos de segurança. Testar 1/5/10 modelos, CPU/RAM e efeito no jogo. Contato Android sem confirmação no jogo NÃO prova captura.

P1: editor de pontos arrastáveis em tela de edição explícita, salvar/cancelar/desfazer; condições IF sprite com timeout e fallbacks, sem execução cega; áreas de exclusão/segurança e log visual por etapa.

P2: biblioteca de múltiplas sequências e presets, importar/exportar JSON confiável via SAF; função de clipboard de texto/coordenas apenas com ação explícita e foco seguro; ancoragem relativa a sprite em vez de tela, captura autorizada de recorte de modelo. Nunca habilitar Auto Catch, Tele, zoom ou reiniciar PoGo apenas porque outras telas mostram essas opções.

Preservar P1/P2, Rare Candy, Edu, Radar PokeList, Data Hub, Auto Hunt, OAuth/contas, filtros, PGSharp/Pokemod independentes, LT357, 401/403/429, avisos humanos, OTA e certificado original. ARK: código/testes → PR → sete gates verdes no mesmo SHA → merge → release request monotônico → workflow protegido R8/signature, APK/digest público → docs e prompt LT369. Distinguir implementado, CI, publicado e físico pendente. Nunca prometer trabalho assíncrono.
