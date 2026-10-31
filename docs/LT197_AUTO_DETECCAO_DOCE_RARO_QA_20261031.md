# LT197 QA — Detecção visual consentida de coleta de Doce Raro

## Contexto e objetivo
O usuário forneceu imagem do topo do Pokémon GO com `Item encontrado! DOCE RARO`, sprite de Doce Raro arco-íris e indicador `+2`. O indicador expressa quantidade recebida e **não** deve criar duas coletas/duas origens.

Versão base: LT196 oficial `0.01.96 / 54401`. Alterações isoladas na branch `feature/lt197-consented-candy-screen-recognition-20261031`; **sem publicação automática nem solicitação de nova permissão sem o usuário habilitar o recurso**.

## Fluxo implementado
1. Menu Doce Raro > Informações > **Detectar coleta: OFF** (padrão). Ao ativar, abre uma Activity de informação e o **diálogo oficial de consentimento de captura de tela do Android**. Cancelar mantém o recurso desativado. Cada nova sessão precisa de nova autorização, sem inicialização no boot.
2. Serviço de primeiro plano do tipo `mediaProjection`, com notificação persistente e ação **Parar detecção**. A captura é encerrada se a projeção for revogada ou o overlay for fechado.
3. Serviço aguarda um **único Doce Raro pendente** (`selectedCandyCoords`, `pendingCandyPickup`, `selectedCandyCopyAtMs`). A seleção deve ter ocorrido nos últimos 120 segundos. Nenhum OCR é feito sem essa condição.
4. Em intervalos máximos de 1 amostra/segundo, recebe um quadro de projeção, cria bitmap apenas da faixa **superior (27% da altura)** e descarta o bitmap da tela completa. Não persiste ou transmite quadros, pixels, texto OCR, localizações nem tokens. Modelo de OCR Latin **Google Play Services** (não agrupado), requer disponibilidade/possível download inicial do modelo; o reconhecimento ocorre no dispositivo.
5. Gatilho conservador: OCR reconhece `ITEM ENCONTRADO` e `DOCE RARO` no banner superior **e** classificador identifica sequência de faixas vermelha/amarela/verde numa pequena sprite do canto superior esquerdo. Exige uma observação de banner ausente após a cópia e duas detecções separadas por pelo menos 350 ms, dentro de 3 s. O mesmo banner só pode confirmar uma vez.
6. Serviço envia evento explícito para o serviço privativo do overlay. A aceitação exige consentimento ainda ativo, detector ativo, coordenada do único pendente igual à selecionada e timestamp exato da cópia. Chama a **mesma rotina já testada** de `✓ Peguei`: grava coleta, oculta o doce, e inicia o cooldown estimado pela distância.
7. Sem tela compartilhada, sem modelo OCR, sem sprite reconhecida, sem texto exato, com captura revogada ou com seleção vencida: **não confirma**. A confirmação manual `✓ Peguei` permanece como fallback.

## Privacidade e Android
- Declarar `FOREGROUND_SERVICE_MEDIA_PROJECTION` e serviço **não exportado** com `foregroundServiceType=mediaProjection`; Activity de consentimento **não exportada**. Não adicionar acessibilidade, leitura do armazenamento, serviço externo ou proxy.
- MediaProjection exige consentimento do Android para cada sessão. Não reusar `Intent`/token de uma sessão. Uma projeção cria um único `VirtualDisplay`. A desativação zera preferência opt-in e para a captura.
- A captura integral é recebida na memória pelo subsistema Android antes do recorte; apenas a faixa superior é fornecida ao OCR. **Não prometer captura física limitada ao recorte**.
- OCR desagrupado aumenta menos o tamanho do APK, mas o modelo pode precisar ser transferido pelo Google Play Services na primeira utilização; nenhum frame é enviado ao projeto.
- No Android, o usuário pode selecionar compartilhar somente o Pokémon GO ou a tela completa. A ausência do banner/sprite devido a restrições do sistema ou desenho do jogo não deve gerar confirmação falsa.

## QA antes de publicar
- `CandyPickupEvidenceTest.java`: classificador real sem Android, casos positivos/negativos, +2, cor ausente, ordem errada, banner fora de contexto e gate temporal.
- `lt197-candy-visual-consent.test.js`: confirma consentimento, manifesto, notificação, no-save, privacidade, fluxo único de coleta e fallback.
- CI Node, compilação Java Android e OTA; testes com a captura real no Samsung **pendentes**.
- **Não publicar automaticamente** sem comprovação de compile, mediaProjection real e verificação do certificado. O recurso é experimental opt-in e deve ser marcado como tal.
