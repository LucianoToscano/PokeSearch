# FastDev estável — OTA, Live HTML, ADB e assinatura separada (16/11/2026)

Estado atual: **assinatura permanente configurada e dois APKs FastDev publicados e verificados**. Último Preview: `fastdev.1000027-preview / versionCode 1000027`. A atualização física em Android ainda precisa de confirmação do proprietário; não houve acesso ao celular nesta sessão. A release oficial foi preservada.

## Entrega permanente verificada — 16/11/2026

- Keystore PKCS#12 exclusivo FastDev, RSA 3072, alias fixo `pokesearch-fastdev`; backup privado no Meu Drive enviado com autorização expressa, permissões restritas ao proprietário e restauração conferida por download. Não gerar outra chave.
- Environment `fastdev-signing` criado. Os quatro secrets `POKE_FASTDEV_KEYSTORE_B64`, `POKE_FASTDEV_STORE_PASSWORD`, `POKE_FASTDEV_KEY_ALIAS`, `POKE_FASTDEV_KEY_PASSWORD` e a variável pública `POKE_FASTDEV_CERT_SHA256` foram cadastrados pelo proprietário com o provisionador no Windows. As duas execuções CI restauraram a chave, compararam o certificado e assinaram/verificaram o APK, comprovando operacionalmente os valores sem divulgá-los. As permissões da integração Work para listar/gravar secrets continuam limitadas; o cadastro local resolveu essa dependência.
- **Certificado público SHA-256:** `e712422729f6ec3c66646f752f4cfb88c4e0d4141404a3a1c271c7a6f0aaa4ea`.
- **Pacote permanente:** `com.lucianotoscano.pokesearch.preview`, distinto do oficial.

| Evidência | Primeiro APK | Segundo APK |
|---|---|---|
| versionName | `fastdev.1000024-preview` | `fastdev.1000027-preview` |
| versionCode | `1000024` | `1000027` |
| Pré-release pública, não draft | [fastdev-1000024](https://github.com/LucianoToscano/PokeSearch/releases/tag/fastdev-1000024) | [fastdev-1000027](https://github.com/LucianoToscano/PokeSearch/releases/tag/fastdev-1000027) |
| Download APK | [PokeSearch-FastDev-Preview.apk](https://github.com/LucianoToscano/PokeSearch/releases/download/fastdev-1000024/PokeSearch-FastDev-Preview.apk) | [PokeSearch-FastDev-Preview.apk](https://github.com/LucianoToscano/PokeSearch/releases/download/fastdev-1000027/PokeSearch-FastDev-Preview.apk) |
| Workflow `success` | [#43988278555, tentativa 2](https://github.com/LucianoToscano/PokeSearch/actions/runs/43988278555) | [#43992092238](https://github.com/LucianoToscano/PokeSearch/actions/runs/43992092238) |
| SOURCE_COMMIT | `0a421b29c0d5e5b0f391adbf3e6bf50ec0e57642` | `3b716a900422b002da63114cedeaf65725895634` |
| Bytes APK | `62304544` | `62304544` |
| SHA-256 APK | `096d805a207dca1e8b0e614a427d5e4ed3e8c6e42aee78e171b4ced51740487d` | `b358f7f63f3765270fbaf566d0bb552729bb4c43eb692bfba02287dfe2c0ffbf` |
| Artifact QA | `14288740293` | `14287123413` |
| Bytes ZIP QA | `59557536` | `59557531` |
| SHA-256 ZIP QA | `8599ecb796331b16ff59f86f64e879d2292bd511b8ae1d3a4f1a5949c8417019` | `9e5e1cfc32b13133a69846611e12479945b486a77c5afe675aef0f545a6394e1` |

**Verificação independente do runner:** ambos os APKs foram baixados das URLs públicas; os hashes e tamanhos coincidem com os digests da API GitHub. ZIP/APK íntegros; `aapt` Android 36 confirmou pacote e versões; `apksigner verify --verbose --print-certs` confirmou assinatura v2 válida, um único assinante e o certificado permanente esperado em ambos. Os ZIPs dos artifacts também foram baixados, tiveram hash/tamanho/integridade verificados e contêm exatamente os mesmos APKs e os SOURCE_COMMIT da tabela. Não confundir artifacts beta/R8 de QA com os artifacts FastDev dessa tabela.

**Versionamento e atualizador:** `1000027 > 1000024`, pacote e certificado idênticos. O JSON público foi confrontado com o contrato de descoberta do Java: a instalação `1000024` tem como candidata `1000027`; a `1000027` não tem atualização mais recente. Os assets possuem nome, URL, digest e tamanho aceitos pelo atualizador. A revisão técnica confirmou HTTPS/hosts restritos, limite de tamanho, SHA-256, pacote, versão e assinante antes de abrir o instalador com FileProvider. Essa análise e o confronto de metadados **não são execução do atualizador no Android**. Instalação, abertura do instalador e preservação real das preferências no aparelho continuam pendentes de teste físico.

**Código e checks:** [PR #470](https://github.com/LucianoToscano/PokeSearch/pull/470) integrada em `3b716a900422b002da63114cedeaf65725895634`, com `request_id: fastdev-permanent-ota-sequence-20261116-02`, após [FastDev](https://github.com/LucianoToscano/PokeSearch/actions/runs/43991710961), [Node completo](https://github.com/LucianoToscano/PokeSearch/actions/runs/43991710871) e [beta/R8](https://github.com/LucianoToscano/PokeSearch/actions/runs/43991710870) passarem no HEAD `4100f423a4bcf68cb002d5cf9eb756e7b5efe32f`. Sete testes direcionados locais desta solicitação passaram; a etapa anterior já havia validado 13 FastDev + 645 contratos smoke e nove testes do provisionador.

**Tempos observados:** compilação Preview de 38s e 30s; jobs de APK de 91s e 65s. São duas medições reais, não um benchmark controlado de cache. Cache Gradle/build cache e smoke direcionado permanecem ativos. O preflight da assinatura roda antes do setup Android e interrompe configuração ausente sem compilar. Live HTML e ADB Wi-Fi/install `-r -t` permanecem disponíveis. Runner persistente não foi necessário diante dos tempos observados e exigiria manutenção/isolamento próprios.

**Oficial preservado:** a API `releases/latest` continua em `v0.03.73-54580`, APK de `61197315` bytes com digest `30a1de9982486858e7e25268f13049b0b96f2bab1a4834c8f080069f6454d0c4`. Nenhum arquivo de `app/src/main`, Gradle oficial, segredo oficial ou `release/official-request.json` foi alterado nesta ativação.

### Teste mínimo no celular

1. Para testar a sequência já publicada, instalar inicialmente o APK `1000024` pelo link acima. Para apenas começar na versão mais recente, instalar diretamente `1000027`.
2. Abrir o atalho **PokeSearch FastDev**. Para testar preservação, usar o aplicativo de testes e salvar uma preferência antes da atualização.
3. Na `1000024`, tocar **Verificar atualização FastDev**, depois **Instalar atualização encontrada**. Autorizar essa fonte de instalação se o Android solicitar e confirmar a atualização no instalador do sistema.
4. Confirmar `1000027` e a preferência salva. Não desinstalar durante o teste. O aplicativo oficial deve permanecer instalado e independente.
5. Nas próximas builds, repetir a consulta pelo painel; WorkManager também faz descoberta periódica sujeita a notificações, bateria e Doze. A confirmação do instalador Android continua necessária; não existe atualização silenciosa.

## Histórico da ativação no Work — 16/11/2026

Os registros abaixo descrevem os bloqueios anteriores à entrega. A seção de entrega acima é o estado atual comprovado.


**Retomada após cadastro no Windows:** o proprietário executou o provisionador e confirmou os quatro secrets e o fingerprint `e712422729f6ec3c66646f752f4cfb88c4e0d4141404a3a1c271c7a6f0aaa4ea` no environment `fastdev-signing`. Solicitada repetição da job que falhou por falta de configuração e preparado pedido `fastdev-permanent-ota-sequence-20261116-02` para a segunda compilação. Os registros de bloqueio abaixo descrevem a fase anterior; a assinatura real e a publicação devem ser comprovadas pelas execuções correspondentes antes de declarar conclusão.

- Base consultada: `main` em `413e418ccf7ecadc2c7d41c1aa03bcd31d171995`, PR #467 integrada. A melhoria de preflight foi integrada pela [PR #468](https://github.com/LucianoToscano/PokeSearch/pull/468), merge `0a421b29c0d5e5b0f391adbf3e6bf50ec0e57642`, após os checks executados passarem.
- A nova solicitação `fastdev-permanent-activation-20261116-01`, `mode: apk-preview`, executou na main em [#43988278555](https://github.com/LucianoToscano/PokeSearch/actions/runs/43988278555). O próprio workflow criou `fastdev-signing`. O smoke passou e o preflight de assinatura confirmou que os quatro secrets e o fingerprint estavam ausentes. A job parou em um segundo nesse passo, antes de Java/Gradle/SDK/build/publicação; a execução terminou `failure`, sem APK, artifact FastDev ou pré-release.
- Só após essa verificação, o script `scripts/fastdev-signing-setup.sh` foi executado no Work com senha forte gerada internamente, sem impressão de credenciais. Foi criado um PKCS#12 RSA 3072 exclusivo, alias fixo `pokesearch-fastdev`. **Certificado público SHA-256:** `e712422729f6ec3c66646f752f4cfb88c4e0d4141404a3a1c271c7a6f0aaa4ea`. A assinatura oficial permanece distinta e inalterada.
- **Backup durável concluído:** destino Meu Drive testado antes da geração; envio do ZIP com keystore e senha feito após autorização explícita do proprietário. Metadados do backup real confirmaram `shared=false` e uma única permissão de proprietário. O ZIP foi baixado novamente, comparado byte a byte por SHA-256 e aberto sem erro; o PKCS#12 restaurado foi desbloqueado com a senha salva e exportou o mesmo certificado público. Não divulgar o link privado nem incluir credenciais no repositório. Recomenda-se também uma cópia offline privada.
- **Bloqueador GitHub confirmado:** HTTP 403 para criação do environment pela API, listagem de secrets/variables e obtenção da chave pública de criptografia dos secrets. Uma autorização GitHub CLI foi concluída, mas as chamadas do Work continuam autenticadas pela integração sem as permissões necessárias; o login não resolveu esse limite. O navegador do Work falhou ao iniciar em duas tentativas. Nenhum secret ou variable FastDev foi cadastrado. Não contornar a autenticação gerenciada do ambiente.
- Foi preparado e testado um provisionador local, entregue privadamente ao proprietário, que lê o ZIP já validado, recusa outro certificado e segredos anteriores sem fingerprint, preserva segredos existentes e proteções do environment e cadastra somente os quatro nomes FastDev e `POKE_FASTDEV_CERT_SHA256` no environment. O script não contém chave/senha e não imprime valores privados. Seus nove testes locais passaram, incluindo erro 403, conta errada, backup alterado e proteção contra rotação. É uma alternativa para execução na máquina de confiança do proprietário com Python 3 e GitHub CLI, fora da credencial gerenciada do Work.
- Preflight antecipado e testes: 13 testes FastDev aprovados, além de 487 contratos UX, 144 probe e 14 assinatura; sintaxe Bash e ordem/YAML verificadas. CI da PR #468: [FastDev](https://github.com/LucianoToscano/PokeSearch/actions/runs/43987780129), [regressão Node completa](https://github.com/LucianoToscano/PokeSearch/actions/runs/43987780251) e [APK beta privado/R8](https://github.com/LucianoToscano/PokeSearch/actions/runs/43987780172) `success`. O APK beta de QA não é o FastDev permanente e não deve ser oferecido como tal.
- Auditoria do atualizador: descoberta limitada a pré-releases `fastdev-NNNNNNN`, asset exato, digest/tamanho e versão superior; download HTTPS com hosts/redirects limitados; SHA-256, pacote, versionCode e certificado comparado ao instalado antes de abrir FileProvider/instalador Android. Não há limpeza de dados nem desinstalação automática. O canal OTA oficial fica desabilitado somente na variante Preview. A compilação real de Preview da PR #467 já havia passado em [#43982973807](https://github.com/LucianoToscano/PokeSearch/actions/runs/43982973807). Essas evidências são revisão de código, contratos e compilação; **não houve instalação ou atualização em Android físico nem teste OTA ponta a ponta**.
- Cache de tarefas Gradle e smoke por arquivos alterados já estão ativos; Live HTML e `adb install -r -t` já existem. Runner persistente não foi habilitado: falta máquina privada e comparação de tempos que justifique manutenção. Não há dispositivo ADB disponível. Não houve benchmark de build com cache aquecido; o benefício comprovado do preflight é evitar todo o setup Android na configuração ausente.
- Última release oficial consultada: `v0.03.73-54580`, APK SHA-256 `30a1de9982486858e7e25268f13049b0b96f2bab1a4834c8f080069f6454d0c4`. Nenhuma tag `fastdev-` encontrada. `release/official-request.json`, versão oficial e secrets oficiais não foram alterados.

**Retomada histórica concluída:** o proprietário cadastrou a chave existente no Windows; as duas builds e pré-releases foram verificadas na seção de entrega. Permanece pendente somente a homologação física de atualização e preservação das configurações. Não gerar outra chave.

## O que muda

- A variante Android `preview` mantém applicationId **com.lucianotoscano.pokesearch.preview**, separada da versão oficial.
- `POKE_FASTDEV_VERSION_CODE` controla um código crescente independente. GitHub Actions calcula `1_000_000 + GITHUB_RUN_NUMBER` para cada build solicitado no workflow; toda solicitação consome um número e uma nova build tem valor maior. Não usar `versionCode=51` para OTA.
- A assinatura de Preview usa um **keystore próprio e estável** (PKCS#12) do proprietário. A configuração de preview exige quatro variáveis de assinatura e falha fechada se faltar qualquer uma. Nunca armazenar chave ou senha em commits, comentários, logs ou APK.
- A autoridade do FileProvider passa a `${applicationId}.updates`: Preview e Oficial podem coexistir, cada qual com seu provedor de instalação. O updater oficial da produção fica desabilitado **somente** na variante Preview.
- Um segundo atalho de launcher `PokeSearch FastDev` abre o painel exclusivo de testes. A Home original continua disponível pelo atalho do app e pelo botão no painel.
- Ao abrir o painel FastDev, agenda também consultas periódicas de aproximadamente 30 minutos via WorkManager; se houver versão nova e permissão de notificações, o Android pode mostrar um aviso. A instalação nunca acontece em segundo plano e a agenda real está sujeita ao gerenciamento de bateria/Doze.
- O painel procura **pré-releases** com tags `fastdev-NNNNNNN` na API de releases do repositório. Aceita somente o nome de asset `PokeSearch-FastDev-Preview.apk`, o digest SHA-256 do GitHub, tamanho limitado e versão mais alta. Depois do download valida integridade, package ID, versão e certificado comparado com o aplicativo já instalado. Abre o instalador do Android com FileProvider e confirmação; não existe instalação silenciosa.
- A fonte visual Live é um WebView de demonstração isolado, sem interface Java nativa. `dock.html`, `overlay.html` e `detail.html` são buscados por HTTPS em uma branch permitida do GitHub; tocar **Recarregar HTML atualizado** atualiza a visualização sem gerar APK. É uma aproximação visual, não substitui os overlays nativos do jogo. Somente APK/ADB valida as funções Android reais.
- O script `scripts/fastdev-adb.sh` simplifica pareamento, conexão e `adb install -r -t` para preservar os dados do Preview enquanto a chave e package ID não mudarem.
- O workflow permite um runner persistente opcional por variável `POKE_FASTDEV_RUNNER_LABEL` no GitHub. O padrão é `ubuntu-24.04`. Configurar runner próprio só com uma máquina privada e confiável, após avaliar manutenção, disco e isolamento. O cache Gradle permanece habilitado sem ativar configuration cache.

## Referência de preparação inicial (já concluída nesta ativação)

**Estas ações precisam ser feitas na máquina de confiança do proprietário, pois o conector GitHub deste projeto não oferece operação para gravar GitHub Secrets:**

1. **A chave desta ativação já existe e tem backup privado validado: não executar o gerador novamente.** Para uma primeira configuração futura em outro contexto, instale Java JDK, OpenSSL e o GitHub/Android SDK necessários e estabeleça o backup privado antes de rodar `bash scripts/fastdev-signing-setup.sh` no checkout local. O script cria `.fastdev-secrets/pokesearch-fastdev.p12`, `.fastdev-secrets/keystore.base64` e mostra o fingerprint **público**. O diretório é ignorado pelo Git.
2. No repositório GitHub > Settings > Environments, crie o environment `fastdev-signing`. Nesse ambiente adicione secrets `POKE_FASTDEV_KEYSTORE_B64`, `POKE_FASTDEV_STORE_PASSWORD`, `POKE_FASTDEV_KEY_ALIAS`, `POKE_FASTDEV_KEY_PASSWORD`. Se houver revisores obrigatórios, use as aprovações esperadas, sem contornar os gates.
3. No GitHub > Settings > Secrets and variables > Actions > Variables (ou nas variables do environment `fastdev-signing`), adicione `POKE_FASTDEV_CERT_SHA256` com o certificado público exibido. Opcional: `POKE_FASTDEV_RUNNER_LABEL` para self-hosted confiável.
4. Faça backup OFFLINE do .p12 e da senha; perder a chave ou trocá-la impedirá atualização da instalação FastDev atual. Se o antigo Preview usava o certificado efêmero de debug do runner, será necessária **uma** reinstalação inicial na transição; nunca desinstalar a produção.
5. Para solicitar primeira atualização, alterar somente `fastdev/preview-request.json` na **main** com novo `request_id` e `mode: apk-preview`. O pipeline valida os secrets, compila, assina, verifica fingerprint, package/versionCode, cria um artifact com SHA-256 e publica a pré-release `fastdev-VERSIONCODE`. Uma falha anterior à publicação NÃO produz release.
6. Instalar inicialmente APK de preview do artifact/pré-release, abrir o atalho `PokeSearch FastDev`, clicar **Verificar atualização** e, após uma próxima compilação, **Instalar atualização encontrada**. As atualizações posteriores preservam dados se mantida a assinatura e o package ID.

**Privacidade:** as pré-releases do repositório público são públicas e qualquer pessoa pode ver e baixar o APK; o app não deve incluir credenciais ou dados pessoais. O canal é separado de `releases/latest` oficial. O app não instala nada sem confirmação do Android.

## Fluxo rápido cotidiano

- **Ajuste visual:** editar HTML/CSS/JS, publicar o commit em uma branch pública do repo, abrir FastDev > Live Preview, escolher a branch, recarregar e revisar. No Live Preview, a renderização é isolada e pode diferir de um WebView com Native Android bridge.
- **Ajuste nativo:** gerar novo APK FastDev em branch main (ou compilar localmente com a chave), instalar via `bash scripts/fastdev-adb.sh install <APK>` em dispositivo já pareado. `adb pair IP:PORT` e `adb connect IP:PORT` requerem portas distintas mostradas em **Opções do desenvolvedor > Depuração sem fio** no Android 11+.
- **Sem computador conectado:** solicitar `apk-preview` na main, permitir a geração OTA e atualizar pelo painel no celular. O Android exigirá confirmação ou a autorização de fonte desconhecida.
- **Publicação oficial:** executar ARK pelo fluxo protegido existente, independente do FastDev. FastDev não substitui QA real Samsung, OAuth, PGSharp/Pokemod ou os gates da release R8.

## Restrições e pendências

- Sem secrets FastDev configurados, a job de assinatura deve **falhar**, não cair para debug efêmero nem publicar APK instável.
- Confirmação de instalação Android continua necessária fora do ADB previamente autorizado.
- Não confiar em preview para OAuth/Firebase que possam depender do applicationId e certificado da produção.
- O algoritmo de descoberta percorre até seis páginas de 30 releases públicos, interrompendo ao encontrar o Preview mais recente; em repos com mais de 180 publicações desde o último Preview, ainda pode ser necessário um índice dedicado. A API do GitHub possui rate limit e pode atrasar notificações.
- O Live Preview não injeta recursos nas janelas reais dos overlays; é um laboratório visual. Evoluir para hot-reload nativo somente com bridges isoladas e testes físicos.
- A visualização de HTML não elimina a necessidade de compilar Java/Android quando estes arquivos forem modificados.
- Runners GitHub hospedados são efêmeros; cache Gradle pode ajudar, mas runner self-hosted exige computador e manutenção. Comparar tempos de build antes e depois.

## Referências técnicas

- `.github/workflows/pokesearch-fastdev.yml`, `app/build.gradle.kts`, `app/src/preview/`
- `scripts/fastdev-signing-setup.sh`, `scripts/fastdev-adb.sh`, `scripts/fastdev-version.test.cjs`
- `docs/FASTDEV_GUIA.md`, `AGENTS.md`, `docs/PUBLICACAO_OFICIAL_PERMANENTE.md`
