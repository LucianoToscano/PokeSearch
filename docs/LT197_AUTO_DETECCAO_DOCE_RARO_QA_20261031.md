# LT197 QA — Detecção visual consentida de coleta de Doce Raro

## Contexto e objetivo
O usuário forneceu imagem do topo do Pokémon GO com `Item encontrado! DOCE RARO`, sprite de Doce Raro arco-íris e indicador `+2`. O indicador expressa quantidade recebida e **não** deve criar duas coletas/duas origens.

Versão base: LT196 oficial `0.01.96 / 54401`. Alterações isoladas na branch `feature/lt197-consented-candy-screen-recognition-20261031`; **sem publicação automática nem solicitação de nova permissão sem o usuário habilitar o recurso**.

## Fluxo implementado
1. Menu Doce Raro > Informações > **Detectar coleta: OFF** (padrão). Ao ativar, abre uma Activity de informação e o **diálogo oficial de consentimento de captura de tela do Android**. Cancelar mantém o recurso desativado. Cada nova sessão precisa de nova autorização, sem inicialização no boot.
2. Serviço de primeiro plano do tipo `mediaProjection`, com notificação persistente e ação **Parar detecção**. A captura é encerrada se a projeção for revogada ou o overlay for fechado.
3. Serviço aguarda um **único Doce Raro pendente** (`selectedCandyCoords`, `pendingCandyPickup`, `selectedCandyCopyAtMs`). A seleção fica válida até o despawn real daquele doce, com teto de 30 minutos para evitar espera infinita. Nenhum OCR é feito sem essa condição.
4. Em intervalos máximos de 1 amostra/segundo, recebe um quadro de projeção, cria bitmap apenas da faixa **superior (27% da altura)** e descarta o bitmap da tela completa. Não persiste ou transmite quadros, pixels, texto OCR, localizações nem tokens. Modelo de OCR Latin **Google Play Services** (não agrupado), requer disponibilidade/possível download inicial do modelo; o reconhecimento ocorre no dispositivo.
5. Gatilho corrigido: OCR pode reconhecer `ITEM ENCONTRADO` + sprite arco-íris esquerda, mas o texto branco `DOCE RARO` sobre banner claro tem baixo contraste. Como alternativa, duas sprites arco-íris (esquerda/direita) sobre painel claro no topo confirmam o mesmo banner **sem depender do OCR**. Exige pelo menos duas detecções separadas por 350ms dentro de 3s. O mesmo banner não pode confirmar a nova seleção enquanto não desaparecer.
6. Serviço envia evento explícito para o serviço privativo do overlay. A aceitação exige consentimento ainda ativo, detector ativo, coordenada do único pendente igual à selecionada e timestamp exato da cópia. Chama a **mesma rotina já testada** de `✓ Peguei`: grava coleta, oculta o doce, e inicia o cooldown estimado pela distância.
7. Sem tela compartilhada, sem sprite suficiente ou mensagem válida, com captura revogada ou com seleção vencida: **não confirma**. A ausência do modelo OCR não bloqueia o caminho visual de duas sprites. A confirmação manual `✓ Peguei` permanece como fallback.

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

## Checkpoint de QA — 31/10/2026
- Node QA #41180555006: SUCCESS; teste de estrutura de consentimento, OCR, sem armazenamento/captura invasiva e fallback manual.
- Node regressões completas #41180554945: SUCCESS; contratos de P1/P2 e doces mantidos.
- Android Java compile #41180554983: SUCCESS, inclusive biblioteca ML Kit Play Services.
- Android/OTA #41180554940: SUCCESS.
- Classificador real `CandyPickupEvidenceTest.java` na JVM: **20 casos aprovados**. Teste adicional com pixel sampling da imagem fornecida executado localmente, sem enviar a imagem ao repositório.
- **Não houve:** reconhecimento autenticado num Samsung, merge ou distribuição pública. O APK QA da primeira versão foi gerado e entregue pelo Drive; LT196 permanece oficial.

## APK de teste LT197 gerado em 31/10/2026
- **CI privado assinado:** [Actions #41180890363](https://github.com/LucianoToscano/PokeSearch/actions/runs/41180890363) — `SUCCESS`, usando certificado permanente original, versão `0.01.97 / 54402`.
- **Artifact QA:** [PokeSearch-LT197-QA-Signed-Verified](https://github.com/LucianoToscano/PokeSearch/actions/runs/41180890363/artifacts/13034782296). APK incluído: `PokeSearch-LT197-QA-0.01.97-54402.apk` de 29.254.623 bytes, SHA-256 `c73c8f2d7dff645944e0314eceac590486b7ca27d66be2198eee635f4cd03100`. `apksigner` v2 aprovado e certificado SHA-256 `34766c15d09013ad65873f9976539c8fa2f826e917dae3af57ea628cad689e8e`.
- **ZIP de QA:** 26.912.566 bytes, SHA-256 `3bc4da904f105e6746853b3e08c82993cb3870c1a7a6b8c34813fa54dfc5011e`. Verificação de ZIP e SHA256SUMS passou, SOURCE_COMMIT `490cf03532a59402a6967899639aa2105c76ebe3`.
- **Drive QA, sem OTA:** [ZIP com APK e relatórios](https://drive.google.com/file/d/1o5Y1_b30Gohlm0WCUdo-8sUlCgLuYHTM/view) no folder PokeSearch_App, conferido por metadados. O aviso `QA-NOT-PUBLIC.txt` foi escrito pelo CI antes do upload manual ao Drive e se refere à ausência de publicação automática no workflow.
- A PR #161 permanece **draft/aberta**, ainda sem merge. Release oficial mais recente continua `LT196 / 0.01.96`. Não houve distribuição pelo mecanismo de atualização para todos. **Teste real de reconhecimento com tela compartilhada no Samsung permanece pendente.**
