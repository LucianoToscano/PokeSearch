# FastDev estável — OTA, Live HTML, ADB e assinatura separada (16/11/2026)

Estado: implementação da infraestrutura no repositório; publicação OTA só fica operacional depois de provisionar o keystore privado dedicado no GitHub. Não afirmar que há Preview assinado com nova chave ou instalação em Samsung sem evidência. Não modificar a release oficial em função deste trabalho.

## Verificação de ativação no Work — 16/11/2026

- Base consultada: `main` em `413e418ccf7ecadc2c7d41c1aa03bcd31d171995`, PR #467 integrada. A API de releases não retornou tags `fastdev-`; a última oficial permanece `v0.03.73-54580`.
- O environment `fastdev-signing` não existia na consulta inicial. A conexão GitHub respondeu HTTP 403 à criação do environment e à leitura de nomes de secrets/variables; o navegador do Work também não iniciou. Permissão administrativa do proprietário no repositório não implica essas permissões no token da integração. Não presumir que uma chave inexiste enquanto o inventário estiver bloqueado, nem criar uma substituta.
- A conexão Drive conseguiu gravar um arquivo de teste em Meu Drive; a leitura de permissões confirmou `shared=false` e uma única permissão de proprietário. Isso estabelece um destino durável privado para o backup, mas **nenhum keystore ou senha foi gerado ou enviado** nesta verificação. Não colocar credenciais na pasta pública de APKs; verificar permissões e restaurabilidade do backup real antes de usá-lo no CI.
- O novo preflight executa logo após o checkout, antes de Java/Gradle/SDK. Informa todos os nomes ausentes sem imprimir valores, rejeita fingerprint inválido e o certificado oficial. A restauração da chave e as verificações criptográficas do APK continuam obrigatórias. A melhoria evita todo o setup Android quando a configuração está incompleta; não houve benchmark de build com cache aquecido.
- Testes locais: 13 testes FastDev aprovados, além de 487 contratos UX, 144 probe e 14 assinatura; sintaxe Bash e ordem/YAML do pipeline verificadas. O teste de preflight cobre configurações ausentes/parciais, fingerprint inválido/oficial e ausência de valores privados na saída.
- Auditoria do atualizador: descoberta limitada a pré-releases `fastdev-NNNNNNN`, asset exato, digest/tamanho e versão superior; download HTTPS com hosts/redirects limitados; SHA-256, pacote, versionCode e certificado comparado ao instalado antes de abrir FileProvider/instalador Android. Não há limpeza de dados nem desinstalação automática. O app oficial está desabilitado como canal OTA apenas na variante Preview. Essas evidências são revisão de código e contratos, **não um teste de instalação ou atualização em Android físico**.
- Cache de tarefas Gradle e seleção de smoke por arquivos alterados já estão ativos; Live HTML e `adb install -r -t` já existem. Não habilitar runner persistente sem máquina privada, comparação de tempos e avaliação de manutenção. Nenhum dispositivo ADB foi disponibilizado nesta sessão.

Para retomar: liberar na conexão GitHub escrita de Environments/Secrets/Variables, inventariar a configuração existente, recuperar a chave se houver; só na ausência confirmada, gerar PKCS#12 e senha forte, gravar e verificar o backup privado no Drive e cadastrar os quatro secrets e o fingerprint. Uma solicitação `apk-preview` com `request_id` novo continua falhando fechada enquanto esses requisitos não forem atendidos. Não anunciar APK, certificado, pré-release ou atualização comprovados antes da execução bem-sucedida.

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

## Preparação inicial obrigatória (única vez)

**Estas ações precisam ser feitas na máquina de confiança do proprietário, pois o conector GitHub deste projeto não oferece operação para gravar GitHub Secrets:**

1. Instale Java JDK, OpenSSL e o GitHub/Android SDK necessários. Rode `bash scripts/fastdev-signing-setup.sh` no checkout local. O script cria `.fastdev-secrets/pokesearch-fastdev.p12`, `.fastdev-secrets/keystore.base64` e mostra o fingerprint **público**. O diretório é ignorado pelo Git.
2. No repositório GitHub > Settings > Environments, crie o environment `fastdev-signing`. Nesse ambiente adicione secrets `POKE_FASTDEV_KEYSTORE_B64`, `POKE_FASTDEV_STORE_PASSWORD`, `POKE_FASTDEV_KEY_ALIAS`, `POKE_FASTDEV_KEY_PASSWORD`. Se houver revisores obrigatórios, use as aprovações esperadas, sem contornar os gates.
3. No GitHub > Settings > Secrets and variables > Actions > Variables, adicione `POKE_FASTDEV_CERT_SHA256` com o certificado público exibido. Opcional: `POKE_FASTDEV_RUNNER_LABEL` para self-hosted confiável.
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
