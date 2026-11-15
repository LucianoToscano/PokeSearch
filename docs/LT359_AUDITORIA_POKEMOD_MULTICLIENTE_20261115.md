# LT359 — Auditoria estática Pokemod 14.2.1 e suporte multicliente PokeSearch (15/11/2026)

## 1. Fonte real auditada

APK local enviado pelo usuário: `Pokemod-v14.2.1 Versao Aberta para Desenvolvedores Autorizado para PokeSearch e LucianoToscano.apk`.

- **Tamanho 48.886.418 bytes**; SHA-256 `a671a80e9454882bc456ed9d857bb6be2e0c220c34c43c119d6b98bd256851f1`.
- **1.088 entradas ZIP**, CRC integral sem erro; descompactado **63.890.455 bytes**.
- `AndroidManifest.xml` AXML binário analisado diretamente, duas DEX com índices de strings consultados, metadados de recursos PNG, certificado V1 via PKCS#7 e cabeçalhos ELF. **Não foi executado nenhum arquivo, injetor ou comando root.**
- Pacote `com.pokemod.app.public`; **versionName 14.2.1**, **versionCode 1421999**, **minSdk 28**, **targetSdk 34**.
- Certificado dentro de `META-INF/CERT.RSA`: sujeito `O=Pokemod.dev,CN=The Pokemod Group`, SHA-256 `992dfd6cbc5b3c323996b2ae702414a35db610600264192968f6d565a6a8bdd7`. **Isto é identidade de certificado presente no APK, não prova independente de autenticidade, malware-free ou validação de assinaturas v2/v3.**
- Inventário JSON: [LT359_INVENTARIO_TECNICO_POKEMOD_20261115.json](LT359_INVENTARIO_TECNICO_POKEMOD_20261115.json). 

## 2. Descobertas realmente comprovadas

| Conjunto | Evidência no APK | Consequência para PokeSearch |
|---|---|---|
| Recursos Android | **411 PNG**, 3 JPG, 2 GIF, **507 XML** | São sobretudo recursos de interface Android com nomes ofuscados; nenhuma miniatura do **feed** foi validada como reutilizável |
| Mídia | **23 OGG**, nenhuma WebP | Não importar sons próprios do Pokemod; interface PokeSearch deve usar sons licenciados do próprio projeto |
| Lógica | **classes.dex + classes2.dex** | Código de gerenciador, autenticação, UI e serviço de injeção; os recursos de jogo injetados não são fonte pública reutilizável |
| Nativo | **9 .so**, `assets/pokemod-injector` (**23.746.440 bytes**, ELF AArch64), busybox-arm64 e sqlite3-arm64 | Não executar, copiar ou integrar módulos nativos; PokeSearch deve permanecer independente de root |
| Unity | **0 arquivos .bundle** neste APK | Não pressupor que o injetor contenha atlas completos do feed |
| Imagens pequenas | **123 imagens** entre 16–92 pixels em ambos os eixos | Contagem de dimensões não é reconhecimento de espécie/forma; nomes ofuscados e imagens UI não demonstram sprites de feed |
| Visibilidade | `queries` inclui `com.nianticlabs.pokemongo` | Gerenciador Pokemod e janela de jogo são entidades diferentes; o clique deve mirar **a janela ativa do jogo**, nunca o gerenciador |
| Intent consultada | `theappninjas.gpsjoystick.TELEPORT` | Apenas evidência da intenção consultada, **não** uma API integrada ou autorização de invocação |
| Permissões | Inclui `MANAGE_EXTERNAL_STORAGE` e `QUERY_ALL_PACKAGES` | Não levar permissões amplas ou root ao PokeSearch; só adicionar consulta pontual ao gerenciador |
| Receivers | `DataReceiver` exportado | Evidência de superfície interprocessos para análise futura; **não** indica, por si só, vulnerabilidade ou canal público estável |

O site público oficial do Pokemod descreve Shiny Scanner/mapa, Virtual GO Plus, Quest Tweaks, Magic Bag, métricas PvP, controle de cooldown e outros recursos; também declara necessidade de aparelho com root e uso do Pokémon GO oficial. **Essas são descrições comerciais externas, não provas de que tais APIs estão acessíveis para o PokeSearch ou presentes neste APK em forma reutilizável.**

**Não existem 1.025 modelos individuais de feed, formas ou variantes homologadas e licenciadas disponíveis neste arquivo.** Os catálogos de miniaturas nativas do PokeSearch continuam vazios. Autorizações de engenharia informadas pelo remetente são respeitadas, porém redistribuição de código, sprite, áudio ou binário só poderá ocorrer com escopo de direitos documentado e proveniência individual.

## 3. Implementação multicliente LT359 (por código original)

1. **`PgsAutoHostPolicy`** estabelece perfis `pgsharp`, `pokemod` e `other`. Desconhecido é somente prévia; a janela `com.pokemod.app.public` é do **gerenciador** e não constitui janela do jogo.
2. **`PgsAutoHostSettings`** salva a escolha no próprio PokeSearch, separada de contas, filtros e dados de Pokébolas; consulta **pontualmente** a instalação do Pokemod, sem `QUERY_ALL_PACKAGES`.
3. **`PgsAutoTemplateStore`** vincula novas capturas pessoais ao perfil escolhido e carrega somente templates do perfil ativo. Amostras de versões anteriores, sem campo `hostProfile`, são tratadas como `pgsharp`, sem apagamento ou migração destrutiva. Catálogo nativo PGSharp permanece exclusivo de PGSharp.
4. **`PgsAutoMenus`** adiciona botão compacto `PGS / PM / OUT` na mesma fileira de Alvo/Prévia, abrindo submenu curto de três opções; identifica a origem de cada imagem no gerenciador de miniaturas.
5. **`PgsAutoClickService`** exige escolha explícita para Pokemod, presença do gerenciador, modelos capturados para o mesmo perfil, jogo visível, revisão imediata de avisos de segurança e as duas confirmações visuais existentes. Troca de perfil invalida execução em andamento. `OTHER` não despacha gesto; é só prévia.
6. **Testes:** contratos puros Java do host, contratos Node estruturais e QA Core; preservar LT357 sprite recovery SHA-pinned e sete gates. **Esses testes não homologam integração real com o Pokemod.**

## 4. Funcionalidades possíveis, sem copiar código de terceiros

- **P0:** mecanismo reutilizável de detecção/captura por layout visual: `(provedor,versão,espécie,forma,variante,dimensão,hash,licença)`, com caches segmentados, confirmação estável e abstinência em empates.
- **P1:** painel de compatibilidade por cliente para PGSharp, Pokemod e futuros overlays: permissões Android 11+, processo visível, modo de tela, disponibilidade de modelo, hora de varredura, falso positivo e causa de bloqueio.
- **P1:** Shiny/XXL/XXS e eventos **apenas se** comprovados por evidência do feed e direitos; não inferir espécie, Shiny ou teleporte de um texto estático ou de um callback Android.
- **P2:** Assistente de Reides/Quests/inventário/rotas e indicadores de desempenho com dados autorizados do PokeSearch, sem acessar bancos locais do jogo/injetor, copiar credenciais ou depender de root.
- **P2:** futura biblioteca por provedor com manifesto assinado, versão monotônica, antirrollback, revogações e homologação física individual. A assinatura de digest **não** prova licença.
- **P3:** qualquer integração de intent/protocolo entre apps dependerá de API pública e consentimento expresso; `queries` e classes DEX não autorizam chamar interfaces internas não documentadas.

## 5. Testes físicos que continuam BLOQUEADOS

- Samsung: aparelho com Pokemod instalado **e efetivamente ativo no jogo** e depois o mesmo teste com PGSharp; confirmar que selecionar PM não captura recursos nem dispara gesto no gerenciador. Verificar prova física da janela ativa e modelo de cada perfil.
- Capturar sprite real de 1, 5 e 10 espécies distintas, formas e variantes efetivamente presentes (base, regionais, sexo, trajes, normal/Shiny), construir dataset licenciado e comparar 2 capturas, scroll e densidade/rotação.
- Confirmar captura, prévia, detecção, dispatch Android e reação visual **separadamente**; teleporte só quando coordenada/movimento real for comprovado no jogo, nunca pelo callback.
- Medir CPU/RAM/bateria em modo raiz do Pokemod e demais apps, verificando compatibilidade de versão, Android 11+/13+/14+, agressividade de economia de bateria e overlay.
- Avisos `Sou passageiro`, conta, segurança, login e diálogos desconhecidos são **sempre manuais**. Avisos Unity não acessíveis exigem inspeção visual sem intervenção automática.
- Testar P1/P2, Doce Raro, Edu, contas independentes, filtros, favoritos, rotinas, permissões, transparência, menu P/M/G e persistência sem regressões.

## 6. Publicação e ARK

Base verificada no início: **LT358 oficial 0.03.54 / versionCode 54561 / label 51358**; `main` `773476d0c483d48c9c4b4968e39ca1fc4120385b`. LT359 só pode publicar uma versão monotônica **posterior** após todos os sete gates no SHA final, merge seguro, preflight do release oficial, APK R8 com assinatura permanente, asset público e digest verificado. Sem execução física, classificar aceitação real **BLOQUEADA**, mesmo que o código seja publicado.

**Nunca importar `assets/pokemod-injector`, busybox, sqlite, classes DEX, sons ou imagens de terceiros sem licenciamento e QA específicos. Não remover gate Samsung nem converter PNGs de cartões em modelos do feed. PR LT350 #385 permanece draft.**
