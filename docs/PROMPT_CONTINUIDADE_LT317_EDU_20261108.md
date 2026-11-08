# CONTINUAR POKÉSEARCH — LT317 EDU (08/11/2026)

Continue o projeto Android `LucianoToscano/PokeSearch`, em português do Brasil. **Não começar do zero, não fazer downgrade, não apagar preferências ou sobrepor assets novos com ZIP antigo.**

## Estado oficial verificado

- **Última Release:** [LT317 · 0.03.17 · versionCode 54523 · label 51321](https://github.com/LucianoToscano/PokeSearch/releases/tag/v0.03.17-54523).
- **APK:** [`PokeSearch-v0.03.17-LT.apk`](https://github.com/LucianoToscano/PokeSearch/releases/download/v0.03.17-54523/PokeSearch-v0.03.17-LT.apk), **34.708.982 bytes**, SHA-256 **`a477f8aa93c75d50ab09e6c95d14435744ec6f8d69ec1629d1494ba636026dda`**.
- **Assinatura Android v2 permanente:** cert SHA-256 `34766c15d09013ad65873f9976539c8fa2f826e917dae3af57ea628cad689e8e`.
- **PR #317:** squash `a4c4b696c94e32f3afeb01ec03d3b93d646e9a0d`. Código-fonte do APK e commit do pedido protegido `903994b905da8dd33bc4e77695af4bb18c1e28a3`.
- **Workflow oficial:** [#42523901901](https://github.com/LucianoToscano/PokeSearch/actions/runs/42523901901) **completed/success**, jobs preflight/publish e validação de hash/assinatura; published at 08/11/2026 21:15:21 UTC. APK abaixo de 35.000.000 bytes.
- O GitHub Releases é o canal de atualização que o aplicativo consulta; **o Android exige consentimento de instalação**. QA físico no Samsung não foi declarado aprovado.

Antes de alterar algo, confirmar novamente `main`, Release/latest, PRs, workflows e SHA. Ler em ordem `LEIA_PRIMEIRO_PROMPT_OUTRAS_IAS.md`, `AGENTS.md`, `docs/GUIA_MESTRE.md`, `docs/MANUAL_OPERACIONAL_CONTINUIDADE_CI_APK_OTA_DRIVE_20261102.md`, `docs/LT317_EDU_PUBLICACAO_OFICIAL_E_HOMOLOGACAO_20261108.md`, `docs/LT316_EDU_PRIMEIRO_BALAO_EVENTO_CHECKLIST_20261108.md`, `docs/LT316_EDU_RELOGIO_MOMENTOS_EVENTO_20261108.md`.

## Funcionalidades atuais do Edu

- **68 sprites** de células 128×128, inclusive Sombria (#67), 22 quadros ociosos, estados de reides/eventos, Shiny, Armaduras, Pokébola, caminhada e teleporte #52–60 com variação visual intencional. LT316 já aplicou 51 ajustes mais cinco retoques 20,28,30,36,49. Sem desfocar pixel art. P=50, M=75, G=100 px (padrão inicial).
- **Primeiro contato simplificado LT317:** o Edu flutuante abre uma fala branca de apresentação; `Bug dos Passes ⓘ` sublinhado explica o relato comunitário, sem promover como recompensa oficial. Toque no balão muda à situação do evento. Antes → sprite #38, data e hora local, contador regressivo e checklist; ativo → #37, início/fim, depois checklist; encerrado → #36 e aviso. Sem horário confirmado, não inventar evento. Links `ⓘ` explicam softban, região e passe laranja no **mesmo balão**, sem novos botões na introdução. Marcação de checklist é manual.
- **Geometria do balão:** cauda prolongada 28dp e ponta a aproximadamente 5px da cabeça estimada, com limites da tela. Validar visualmente em aparelho para evitar sobreposição de outras overlays.
- **Relógio único:** relógio da Home ao lado dos passes, automático/manual, fuso e 12/24h. `Momento do evento` nos ajustes contém 17 instantes relativos ao início/fim, com horários IANA em ordem cronológica; escolher um modifica **somente o relógio virtual interno Edu** (função `EduEventClock.setManualInstant()`). Preserva a programação do evento e não altera relógio do Android, GPS ou Pokémon GO. Não criar segundo simulador no Edu.
- **Preservar E01–E11 e todos os sistemas:** P1/P2, PoGoCoordinates, filtros, favoritos, Doce Raro, login, IV/ranks GL/UL/ML/RG/Reides, Firebase, preferências e atualização/assinatura. Não presumir concessão de passes, vitória ou captura sem confirmação do jogador.

## Próximos testes

Principal pendência: **homologação física Samsung LT317** (prints/vídeo), incluindo trocar os 68 sprites e tamanhos P/M/G, conferir balão perto da cabeça sem cobrir outras sprites, toques e sublinhados ⓘ, contagem regressiva de 10s/1min, passagem BEFORE→ACTIVE→ENDED, 17 presets e fuso diferente de Brasília. Em caso de defeito, corrigir só a causa reproduzida, acrescentar testes e conservar a identidade do app.

## Publicações futuras

Autorização expressa do proprietário é obrigatória para merge e Release. Após QA Node/LT169/LT211/Java LT62/OTA LT173 verdes, integrar via PR; publicar somente por `release/official-request.json` na `main` e fluxo permanente `.github/workflows/pokesearch-official-release.yml` com environment `official-updates`, certificado original, digest e versão monotônica. Não afirmar Release sem checagem de Releases/latest. Registrar no Guia Mestre e atualizar este prompt em cada versão.

**Preferências:** minimalista, compacto, visual intuitivo, sem botões desnecessários e desenvolvimento passo a passo solicitado pelo proprietário.
