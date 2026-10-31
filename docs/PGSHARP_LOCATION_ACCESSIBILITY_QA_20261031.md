# PGSharp → PokeSearch, QA Android experimental (31/10/2026)

## Importante
**Não existe integração direta comprovada** com a posição interna do PGSharp. Este candidato implementa somente uma prova de conceito **sem root**, via acessibilidade opt-in. Se o PGSharp renderizar a posição exclusivamente pela engine Unity (sem nó textual acessível), **o recurso não consegue seguir teleporte, joystick, autowalk ou deslocamento por toque**. Nunca trocar silenciosamente pela localização física fixa do Android.

## Implementação
- Serviço de acessibilidade restrito por pacote a `com.nianticlabs.pokemongo`, opt-in em Home > menu > `PGSharp · localização (teste)`, com autorização manual inicial do sistema.
- Só aceita texto com marcador inequívoco de **posição atual do jogador** e par `lat,lng`; rejeita `selected`, `destination`, `teleport to` e coordenadas fora de faixa.
- Não armazena textos ou screenshots capturados; só coordenadas validadas, privadas na configuração do aplicativo, com timestamp recente.
- Envia coordenadas **somente às Pokébolas ativas** 1/2. Prova de filtros continua dependendo do retorno real da API/site; não declara pesquisa confirmada por recebimento de uma coordenada.
- Limite de pesquisa automática mínimo 45 s por overlay, respeitando bloqueio de buscas em andamento e rate limit pré-existente do provedor. A movimentação não dispara uma busca por frame.
- **Doce Raro ainda não integrado** nesta QA; só após prova física da fonte, para evitar regressões.
- Quando não há uma posição etiquetada atual, não há coordenada nova nem fallback do Android. A UI não deve anunciar rastreamento concluído.

## QA físico obrigatório
1. Instalar candidato assinado e conceder Acessibilidade > PokeSearch **uma vez**. Ativar teste no menu da Home.
2. PGSharp aberto: confirmar se a interface expõe textualmente a **posição atual** (não o destino selecionado); sem texto => classificação **incompatível**, não inventar.
3. Se houver texto válido, conferir teleporte, joystick 20 s, toque para caminhar e rota, comparando a posição no jogo.
4. Verificar Pokébola 1 e 2, modo IV/PvP, alternância de localização, no máximo 10 resultados e tratamento do 429.
5. Não publicar atualização a todos até passar nos testes. Manter LT196 oficial intacta.

## Riscos conhecidos
- Acessibilidade necessita autorização explícita do usuário e pode ser desligada pelo Android.
- Unity pode não fornecer nós de texto com a coordenada; o teste pode não funcionar no PGSharp atual.
- Um texto etiquetado como posição atual pode ainda ser incorreto se a interface de terceiros o renderizar incorretamente.
- O acesso permanente às coordenadas do personagem **depende de um canal interno autorizado** ainda não identificado.

Rastreamento: https://github.com/LucianoToscano/PokeSearch/issues/162
