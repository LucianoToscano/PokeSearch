# LT197 — Detecção visual consentida de coleta de Doce Raro

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


### LT197 QA2 — Correção da falha observada no Samsung (31/10/2026)
- As duas capturas de tela do usuário mostram o botão **A ativo** e o banner `Item encontrado! DOCE RARO +1`, mas o detector anterior não concluiu a confirmação. O teste local das regiões cromáticas encontra as faixas coloridas nas sprites do topo; o OCR do texto branco sobre painel branco é pouco confiável. As imagens não foram enviadas ao repositório.
- **Correção implementada:** critério visual independente com sprite arco-íris **esquerda e direita** sobre painel claro na faixa superior, além de OCR parcial como opção; duas leituras distintas e proteção contra reuso do banner na próxima seleção; validade da coleta pendente até o despawn do doce (teto 30 minutos), não mais 120 segundos. Exibição de estados sanitizados (nenhum texto OCR ou imagem salva) no menu de Informações quando `A` está ativo.
- **Qualidade:** suites Node e Android/OTA verdes no PR; workflow de QA2 assinado [#41182923397 SUCCESS](https://github.com/LucianoToscano/PokeSearch/actions/runs/41182923397), artifact [#13035772738](https://github.com/LucianoToscano/PokeSearch/actions/runs/41182923397/artifacts/13035772738), SOURCE_COMMIT `a20ad38cc363dec7a97c99ac4f2cea87f1e24522`.
- **APK QA2** `PokeSearch-LT197-QA2-0.01.97-54403.apk` de 29.254.823 bytes, versionCode `54403`, versionName `0.01.97`, SHA-256 `6910167b409bf8351a419b9d3a4a8fefd96f856388109ba515a4e4f6a0f92857`. APK Signature Scheme v2 **true**, certificado permanente `34766c15d09013ad65873f9976539c8fa2f826e917dae3af57ea628cad689e8e`, ZIP interno e `SHA256SUMS` conferidos.
- [Drive QA2 APK + relatórios](https://drive.google.com/file/d/1AWtzgKmoOOv4k3nX2V4vC68E1JdNzMrW/view), 26.913.421 bytes, SHA-256 `ef8ed4687d1575810105318f0dea4d417f36f6894e1b42f63e43ce151f7c0cdc` (ZIP íntegro), pasta PokeSearch_App com permissão compartilhada.
- A LT197 **não foi mesclada à main e não é atualização pública/OTA**: LT196 permanece latest. Não há confirmação em captura de tela ao vivo após a correção; precisa de novo teste no Samsung e inspeção do diagnóstico `A`.


## Publicação oficial LT197 — 31/10/2026 (estado mais recente, substitui os checkpoints QA anteriores)
- **PR #161 integrada ao main**: SOURCE_COMMIT `57cdf047676be960260603a2d91899a7cca6c8c7`.
- **Build oficial:** [Actions #41184612797 — SUCCESS](https://github.com/LucianoToscano/PokeSearch/actions/runs/41184612797). Testes Node, JVM e OTA, build R8/protegido, validação de assinatura, `aapt`, ZIP e SHA-256 do asset publicado.
- **Release latest oficial:** [`v0.01.97-54404`](https://github.com/LucianoToscano/PokeSearch/releases/tag/v0.01.97-54404); APK `PokeSearch-v0.01.97-LT.apk` **29.255.359 bytes**, SHA-256 `fdaeb01a2ecc9c18b1b9c36cbc1ad9f9ca862175b80ba7d0dcb2b24cb448c064`; app `com.lucianotoscano.pokesearch`, versionName `0.01.97`, versionCode `54404`.
- **Certificado de assinatura v2 original SHA-256:** `34766c15d09013ad65873f9976539c8fa2f826e917dae3af57ea628cad689e8e`.
- **Artifact verificado:** [#13035812746](https://github.com/LucianoToscano/PokeSearch/actions/runs/41184612797/artifacts/13035812746).
- **Drive oficial:** [ZIP APK + SHA256SUMS, signing report, package/version e SOURCE_COMMIT](https://drive.google.com/file/d/1vfZVQqwNFqF5LM56ZsdEBCZRZsFEPq0h/view), **26.913.572 bytes**, SHA-256 `45d34fd999f2c7bab12e109d67288601579ca68455dbf9245d8bc0516dd5852e`. Upload confirmado, arquivo na pasta `PokeSearch_App` compartilhada. ZIP `testzip=None`; APK interno tem o SHA-256 do GitHub, o certificado v2 correto, versionCode 54404 e versão 0.01.97. Não foi reutilizado o APK QA2 54403.
- **Entrega:** GitHub Releases `latest` é a fonte padrão de atualização pública do aplicativo, portanto **disponível para todos checarem/baixarem**. Não é evidência de que cada aparelho tenha recebido ou instalado a versão. Arquivos anteriores no Drive e Releases preservados.
- **Limitação expressa:** algoritmo experimental opcional OFF por padrão, com consentimento de captura do Android a cada sessão, sem gravação/transmissão de tela; a validação de captura ao vivo no Samsung após a correção de OCR/duas sprites **ainda não foi concluída**. Botão manual `✓ Peguei` permanece como fallback. Feedback de usuários sobre falhas deve gerar QA subsequente.
