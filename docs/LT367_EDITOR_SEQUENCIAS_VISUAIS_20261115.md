# LT367 — Editor de Sequências Visuais e Pontos Numerados

## Referência e base
Base inicial comprovada em 15/11/2026: main e31dbbef44ee8aca39b9024079ae36f074c55518; PokeSearch estável 0.03.62 / code 54569 / label 51366. Três imagens do usuário mostram mapa Pokémon GO com marcadores numerados, os marcadores sobre fundo preto e um exemplo de barra com +, lista e fechar. Autorização para insumos/APKs/APIs anteriormente declarada; não solicitar novamente.

## Funcionalidades aplicadas em código candidato
- Entrada pelo ícone ≡ ao lado de Auto Hunt no menu Buscar, na mesma linha e sem sexto ícone. Usa PgsAutoMenuStyle e popup compacto com lista rolável.
- Adicionar Toque por mira confirmada, Arrastar por duas miras (origem e destino), Espera de tempo e reconhecimento por sprite do feed já carregada e selecionada no perfil.
- Cada passo recebe número na ordem; overlay de prévia transparente com círculos finos, linhas entre pontos e indicação de destino dos arrastes, usando FLAG_NOT_TOUCHABLE: nunca impede o jogo ou dispara gesto na prévia.
- Mover ↑/↓, excluir ×, limpar, copiar/colar um passo internamente no MESMO PERFIL, modificar posições e alterar duração e espera de cada ação. Máximo 12 passos e estimativa temporal até 120 segundos.
- Sequência local privada em SharedPreferences separada por PGSharp/Pokemod. Opção Autorizar execução OFF por padrão, mais botão Executar explícito. Sem compartilhar consentimento com contas P1/P2.
- Player do AccessibilityService: gestos TAP e SWIPE com callback Android, WAIT em Handler e SPRITE somente com match do ID selecionado em DUAS capturas confirmadas por PgsAutoWatchPolicy.sameSprite. Nenhum resultado em Pokémon GO é dado como comprovado por um callback.
- Parar manualmente, pela bolha e por troca de janela, aviso de segurança, diálogo humano, rotação, perda do serviço, mudança de perfil ou cancelamento. Watchdog total de 180s. Execução requer Android 11+ e janela oficial do jogo visível; não concorre com Auto Hunt.
- A mira já existente salva posições relativas à tela; orientação registrada deve coincidir ao reproduzir, evitando um toque incorreto após rotação.

## Limites e precisão
Arrastar é um gesto na tela, NÃO captura de Pokémon homologada. Copiar/Colar nesta etapa DUPLICA passos locais; não lê nem insere o clipboard de terceiros. Sprite significa MINIATURA DO FEED SALVA (nunca detecção de Pokémon 3D ou Shiny por aparência). A imagem do outro app não prova efeito real. Nenhuma permissão nova, GPS, root, injetor, execução do Pokemod/PGSharp ou rede. O app mantém os diálogos de segurança manuais.

## Ideias da próxima versão
1. Arrastar os marcadores diretamente no modo edição dedicado, com salvar ✓ e cancelar ×, desfazer e sem bloquear o jogo fora desse modo.
2. Condições IF sprite aparece/desaparece, timeout por etapa e ramo parar, sem retry ou clique cego.
3. Biblioteca de sequências nomeadas com importar/exportar JSON validado por Android SAF, sem capturas privadas.
4. Gravação opcional de recorte de sprite usando o scanner já disponível e ancoragem de pontos na imagem em vez de coordenadas fixas.
5. Status detalhado por etapa: planejada, enviada, callback Android recebido, cancelado, verificação visual inconclusiva. Não inferir captura.
6. Áreas proibidas para controles de conta, pagamento e confirmação humana; atalhos de perfil sempre independentes.
7. Presets originais de navegação e interação visual, desde que testados em PGSharp/Pokemod individualmente.

## Protocolo ARK
Candidata no branch feat/lt367-visual-sequence-editor. Antes de merge requer sete gates completed/success NO HEAD: Node QA, LT169, LT211, Java LT62, OTA, PGS APK QA, Secure beta/R8. Só publicar após request monotônico code >54569 pelo workflow permanente de assinatura R8 e hash público. Testes físicos Samsung 11/13/14, telas P/M/G, TalkBack, rotação, consentimento, precisão de pontos, toque/arraste, modelo, mudanças de app e efeito real no jogo são PENDENTES na issue #350. CI não equivale a homologação física.
