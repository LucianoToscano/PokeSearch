# LT198 — PGSharp: origem de eventos e diagnóstico local (31/10/2026)

## Resultado da LT197 em Samsung
O usuário habilitou o serviço de Acessibilidade da LT197 e relatou que **nenhum movimento** foi reconhecido. A LT197 não possuía contadores diagnósticos, portanto não se sabe se os eventos não foram entregues ou se o PGSharp não expõe as coordenadas em nós de interface. Não confundir ausência de resultado com prova definitiva de incompatibilidade.

## Correções experimentais da LT198
- Priorizar `AccessibilityEvent.getSource()` (origem do evento do jogo) em vez de consultar diretamente `getRootInActiveWindow()`, que pode ser a sobreposição do PokeSearch.
- Rejeitar o fallback da janela ativa quando a árvore não declara o pacote de Pokémon GO.
- Registrar **localmente** se o serviço foi conectado, quantidade limitada de eventos do jogo, idade do último evento, origem da árvore, quantidade de nós visíveis/textuais, se houve posição reconhecida e idade do último resultado.
- Nenhuma captura de imagem, OCR, GPS físico, leitura de memória do jogo, envio à rede ou armazenamento de texto de tela.
- Exibir contadores no menu Home > **PGSharp · localização (teste)**. Para atualizar, fechar e reabrir o menu.
- Manter parâmetros do provedor, filtros independentes das Pokébolas 1/2 e proteção contra pesquisas excessivas.

## Teste curto no Samsung
1. Instalar o APK **LT198 0.01.98 / 54403** assinado em QA, sem desinstalar a LT197 (mesma identidade/certificado).
2. Verificar no Android se PokeSearch continua com serviço Acessibilidade ativo; no PokeSearch abrir o menu PGSharp para confirmar `Teste solicitado: SIM` e `Serviço do Android: CONECTADO`.
3. No PGSharp, abrir o mapa ou interface principal, teleportar e mover joystick durante 20 segundos.
4. Voltar à Home > PGSharp (teste) e fotografar **apenas o painel de contadores**. Não enviar dumps integrais de tela do jogo, tokens nem logs privados.
5. **Eventos=0:** investigar filtro de eventos, ciclo do serviço, pacote e visibilidade de sobreposições; `Ativado` sozinho não prova recebimento.
6. **Eventos>0, nós/textos>0, posição nenhuma:** verificar se PGSharp de fato mostra a posição atual em texto acessível; caso contrário, mudar estratégia para integração oficial/IPC autorizada.
7. **Posição reconhecida:** testar se coordenadas realmente acompanham teleporte e movimento e se P1/P2 respeitam resultados/cap/429.

## Limitação não resolvida
A LT198 NÃO prova acesso direto à posição nativa simulada pelo PGSharp. Acessibilidade não expõe automaticamente dados internos de jogos Unity. Não publicar LT198 nem anunciar integração concluída sem teste real.

Rastreio: https://github.com/LucianoToscano/PokeSearch/issues/162
