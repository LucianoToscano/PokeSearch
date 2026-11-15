# LT357 — Auditoria profunda do APK PGSharp e ações ARK (15/11/2026)

## 1. Fontes e método

APK recebido neste chat:
`pgs1.277.2_0.435.2_rhGEK(arm64) Versao Aberta para Desenvolvedores Autorizado para PokeSearch e LucianoToscano.apk`.

- **SHA-256:** `ed8a7676995088bee463186f6f561f0e400ac43db9c9c1cb346a891c7542a67e`
- Tamanho físico: **211.243.984 bytes**; dados descompactados: **568.277.353 bytes**.
- **2.203 entradas ZIP; CRC validado sem erros**.
- Leitura direta de ZIP, nomes, PNGs, metadados JSON, localizações GZip, catálogo
  Addressables e fontes Java do PokeSearch. Não foi executado o APK nem usado
  dispositivo físico; o relatório NÃO representa decompilação completa do IL2CPP,
  dos bundles Unity ou análise dinâmica da interface.
- Verificação baseada em arquivos reais; propostas de produto e hipóteses
  são explicitamente diferenciadas dos fatos observados.
- Nenhum arquivo protegido, imagem, som, fonte, tradução completa ou binário
  proprietário foi transferido ao código do PokeSearch. Nome de arquivo com
  “Autorizado” não equivale a prova de licença de redistribuição.

## 2. Inventário: resultados realmente comprovados

| Área inspecionada | Dados do APK | Utilização lícita recomendada |
|---|---|---|
| Recursos PNG Android | **437** PNG em `res/` | Auditoria de escalas, densidades e estados visuais; produzir artes próprias |
| Bundles Unity | **168** arquivos `.bundle` empacotados | Identificar áreas funcionais, não pressupor sprites de feed |
| Dependências nativas | **28** `.so` arm64-v8a | Matriz de compatibilidade/arquitetura, não código reutilizável |
| DEX Android | **3** arquivos | Caracterização técnica do app, sem importar classes |
| Assets Addressables | **4.548** `m_InternalIds` | Planejar catálogo versionado, cache e dependências |
| Bundles via endereço externo | **723** referências ao endereço do serviço de assets | Exigir modo offline/fallback; não tentar baixar assets externos |
| Bundles por runtime local | **163** referências local-path | Diferenciar empacotado versus remoto |
| Traduções principais | **15** arquivos `i18n_*.jgz` | Auditoria de IDs, terminologia e acessibilidade |
| Chaves/traduções por idioma | **43.327 pares** em cada uma das 15 tabelas | Cobertura de QA, não embutir textos de terceiros |
| Nomes de espécies | **15** tabelas `pokemon_names_*.jgz` | Consistência das chaves `0000…1025` |
| Localização especializada | **66** JSONs adicionais | Revisar mensagens de segurança, permissões e dados |
| SHA + CRC | **Válidos** | Proveniência do arquivo inspecionado, não atestado de segurança |

Os 66 JSONs independentes estão agrupados em:
`DeleteAccount` (21), `AddressBookImport` (15),
`AdvsyncPermissions` (15), `ModerationEnforcement` (15).
O pacote declara `{"ZeroClientId":true}` no `featureFlag.json`;
isso não comprova disponibilidade de uma função no jogo, login ou API.

Em `assets/bin/Data/boot.config` há parâmetros específicos do motor Unity,
como `gc-max-time-slice=3`, `gfx-threading-mode=4` e flags de boost para
Samsung/Google. Não são configurações transferíveis diretamente ao PokeSearch.
O app deve usar profiling Android próprio.

As quatro tabelas principais de localização conferidas em detalhe
(pt-BR, en-US, es-ES e ja-JP) contêm **os mesmos IDs**; todos os 15 arquivos
possuem 43.327 pares. O catálogo nominal do PokeSearch preserva 1.025
espécies, e o teste LT356 anterior encontrou duas diferenças tipográficas
de apóstrofo nos nomes 83 e 865, não faltas de IDs.

### Recursos visuais: cuidado com falsas conclusões

`assets/aa/catalog.json` menciona
`pokemoninventoryui_assets_all`, `genericicons_assets_all`,
`arassets_single_assets_pokemoniconformoverridedata` e
`pokedex_icon_atlas.spriteatlas`.
**Uma referência no catálogo não comprova que a textura individual do
PGSharp esteja fisicamente no APK.** O primeiro grupo de referências aponta
a bundles remotos; a textura do inventário do jogo não é necessariamente a
miniatura da coluna de resultados do PGSharp. Não há um pacote de 1.025
modelos de feed verificados e licenciados disponível para importação nativa.
O manifesto do PokeSearch segue `entries: []`.

## 3. Oportunidades — sem inventar funcionalidades do APK

| Prioridade | Tema PokeSearch | Fundamento | Estado |
|---|---|---|---|
| P0 | Parar ao ver alerta de conta | Há títulos para warning/suspension/ban em PT/EN/ES/JA; acesso a textos pode ocorrer via Accessibility | **Implementado em LT357**, sem confirmar ações |
| P0 | Limites de CPU para leitura de feed | Detector atual podia processar todos os candidatos/refinamentos sem orçamento explícito | **Implementado LT357**, fail closed |
| P0 | Evitar milhares de modelos carregados | LT356 tem índice até 4096, sem limite secundário de variantes ativas | **Implementado LT357**, 12/espécie e 64 ativos |
| P1 | Dataset de QA de sprites por forma e build | Catálogo e IDs por espécie existentes; recursos reais do feed não validados | **BLOQUEADO** por amostras/licença/QA física |
| P1 | Painel de diagnósticos por espécie | Pode expor precisão, latência, ambiguidade e causa de recusa sem imagens privadas | Parcial; evoluir com consentimento |
| P1 | Benchmark Samsung e Android econômico | Tamanho Unity, mudanças de UI e múltiplos modelos tornam relevante medir RAM/CPU/bateria | **BLOQUEADO** sem aparelho |
| P1 | Mensagens de permissão e segurança | Localização Advsync/Moderation/DeleteAccount serve como referência de UX | Pesquisa; não copiar redação |
| P2 | Compatibilidade de idiomas | Chaves das 15 tabelas estão presentes | Pesquisar catálogo original aberto e integração i18n própria |
| P2 | Reides/Rocket/Quests/Power Spots/Rotas | IDs textuais e dependências do APK indicam módulos do jogo | Só sugerem domínios; dados atuais exigem API autorizada |
| P2 | Estados gráficos diurno/noturno e densidade | Recursos `drawable-night` e tamanhos de PNGs Android | Produzir componentes originais e comparar overlays P1/P2 |
| P2 | Cache versionado/antirrollback | Addressables distingue catálogo remoto/cache/local | Projeto futuro; só com assinatura criptográfica própria |
| P3 | Perfil de inicialização Android | APK traz `assets/dexopt/baseline.prof` e `.profm` | Usar ferramenta de baseline profile do PokeSearch, não copiar profile do jogo |

**Limite:** chaves de textos sobre Rocket, Reides ou Dynamax não fornecem
localização, lista atual de Pokémon, horários, teleporte, saldo de item,
shiny, coordenadas, IDs de contas ou APIs autorizadas. Nunca derivar
dados de jogo em tempo real a partir de um pacote de textos estáticos.

## 4. Correções concretas implementadas no PokeSearch

Arquivos:
- `PgsAutoSafetyNoticePolicy.java`: identifica famílias de alerta
  de conta em PT/EN/ES/JA na árvore textual acessível do próprio jogo,
  normalizando diacríticos; a detecção **não tenta confirmar OK nem
  contornar segurança**. Outros idiomas e telas gráficas sem nós acessíveis
  ainda precisam de suporte/QA.
- `PgsAutoClickService.java`: inspeciona alertas de conta na janela de
  aplicação ativa, sob o próprio overlay; eventos de conteúdo do Unity são
  limitados em frequência, e há **nova verificação imediatamente antes dos
  gestos**. Aviso de conta interrompe/pausa a automação até reinício humano;
  preserva aviso de passageiro com confirmação manual. Não transmite o
  conteúdo dos avisos para logs ou rede.
- `pgs_auto_accessibility_config.xml`: habilita
  `typeWindowContentChanged` para melhorar detecção de aviso sem transição
  de janela. A disponibilidade dos nós depende do jogo e da Acessibilidade.
- `PgsAutoIconDetector.java`: adiciona orçamento conservador de
  **4.500 ms por captura** e máximo de **256 candidatos**; ao atingir
  limites, o frame é rejeitado completamente, **sem qualquer toque**.
- `PgsAutoNativeModels.java` + `PgsAutoRuntimeBudgetPolicy.java`:
  global mantém até 4.096 metadados, porém limita o carregamento aprovado
  a **12 por espécie / 64 ativos**, com **20 validações por espécie /
  100 tentativas totais**. Variantes excedentes são adiadas e registradas
  no diagnóstico, em vez de processadas sem controle. Nenhum modelo pessoal
  existente é apagado.
- `app/tests/PgsAutoSafetyNoticePolicyTest.java`,
  `PgsAutoRuntimeBudgetPolicyTest.java`,
  `lt357-deep-apk-security-scanner.test.js`: testes novos.
- `.github/workflows/qa-core-contracts.yml`: integra novos testes
  puros Java aos gates gerais. Preservado todo o pipeline LT169, LT62,
  LT173, PGS QA e Secure beta/R8.

## 5. Aceite e pendências a não ocultar

1. **Não afirmar** que o APK PGSharp forneceu modelos de todas as espécies,
   que existe extração completa de texturas Unity ou que é permitido
   redistribuí-las. O catálogo de miniaturas ainda está vazio.
2. Unity pode apresentar avisos como texturas sem informações textuais
   para Acessibilidade; a defesa LT357 é apenas uma camada de segurança,
   **não garantia universal** de detectar toda tela de conta.
3. O orçamento por captura pode limitar o reconhecimento em aparelhos lentos:
   testar diferentes resoluções/fonte/densidade e quantidades de modelos,
   medir falsos negativos e tornar ajustes configuráveis somente com QA.
4. Todos os testes de CI são estáticos, puros Java ou compilação Android.
   **Não comprovam** clique efetivo, teleporte, Shiny ou ausência de
   falsos positivos em um Samsung/PGSharp real.
5. Atualização oficial não instala APK silenciosamente; requer confirmação.
   **“Sou passageiro”** nunca será confirmado automaticamente.
6. Manter a PR LT350 **#385 draft** fora da main até aceite visual;
   preservar Pokébolas 1/2, Doce Raro, Edu, contas e dados.

## 6. ARK: estado e execução

Base antes da LT357: `main` `652193e6772908b2ed0d2623790540d0b2eeb427`,
release **0.03.52 / versionCode 54559 / label 51356**.
Próxima publicação solicitada: **0.03.53 / 54560 / 51357**.

As evidências de PR, sete gates, merge, workflow protegido, tag,
assinatura do APK, tamanho e SHA-256 **serão preenchidas apenas após
confirmação efetiva**; jamais interpretar uma etapa agendada como sucesso.

## 7. Encerramento ARK e comprovação oficial (15/11/2026)

**LT357 OFICIAL — 15/11/2026:** PokeSearch **0.03.53 / versionCode 54560 / label 51357**, [release v0.03.53-54560](https://github.com/LucianoToscano/PokeSearch/releases/tag/v0.03.53-54560), [APK oficial assinado](https://github.com/LucianoToscano/PokeSearch/releases/download/v0.03.53-54560/PokeSearch-v0.03.53-LT.apk) de **61.136.587 bytes**, SHA-256 `e9febb73bdb069a735387b179e026d779d294b360ee32c103c03571df542cec7`; workflow protegido [#43678324553](https://github.com/LucianoToscano/PokeSearch/actions/runs/43678324553) **SUCCESS** (preflight, recursos, R8, assinatura e publicação). Implementação [PR #403](https://github.com/LucianoToscano/PokeSearch/pull/403), squash `17f10f1d2732584ef4461f0af042e6d737b2d1f2` após **sete gates verdes**: Node #43677258803, LT169 #43677258773, LT211 #43677258796, LT62 #43677258728, OTA #43677258908, PGS QA #43677258885 e Secure beta/R8 #43677258774. Pedido inicial [PR #404](https://github.com/LucianoToscano/PokeSearch/pull/404), squash `3ae2cbccb190d0202be361d0e603fbc3c7f22283`, falhou no workflow [#43677713095](https://github.com/LucianoToscano/PokeSearch/actions/runs/43677713095), pois dez sprites obrigatórias normais e Shiny de card, IDs 422,423,459,656,669,670,671,722,723,724, faltaram nas fontes externas; o **gate Samsung impediu publicar arte faltante**. Correção [PR #405](https://github.com/LucianoToscano/PokeSearch/pull/405), squash `0e414df5f293aafcbc42e21e4d1b73ac5d0502a8`: espelho no MESMO caminho para 404/410, fallback de apenas imagens obrigatórias **de card** do APK oficial anterior 0.03.52, verificado pelo SHA-256 fixo do APK, CRC ZIP, manifesto de sprites e hash/dimensões individuais; 401/403/429 não são contornados; **teste Python sintético obrigatório**. Gate intacto, publicação definitiva SUCCESS. Auditoria estática do APK PGSharp fonte SHA `ed8a7676995088bee463186f6f561f0e400ac43db9c9c1cb346a891c7542a67e`: 2.203 ZIP/CRC íntegro, 437 PNG Android, 168 bundles Unity, 4.548 Addressables IDs, 723 referências externas, 163 referências locais, 15 tabelas i18n com 43.327 entradas por idioma, 15 tabelas nomes de espécies 1–1025, 66 JSONs auxiliares; nenhum recurso proprietário copiado ao PokeSearch. LT357 protege avisos de alerta/suspensão/banimento de conta visíveis por Acessibilidade em PT/EN/ES/JA, interrompe gestos sem confirmar diálogos, limita scanner a 4.500ms/256 candidatos por frame, nativos a 12 por espécie e 64 simultâneos, até 100 verificações de arquivo e mantém índice de 4.096. **CATÁLOGO DE MINIATURAS NATIVAS DO FEED PGSharp CONTINUA VAZIO (`entries: []`).** Imagens de card recuperadas do PokeSearch anterior não são miniaturas do feed! **BLOQUEADO até aceite físico Samsung:** teste de espécies/formas no feed, toque/teleporte real, Shiny, Encontro, CPU/bateria, menus; texto em Unity GPU pode não surgir na Acessibilidade. Aviso "Sou passageiro" exige confirmação humana, sem bypass. LT350 PR #385 segue draft não integrada. A atualização não instala sozinha: depende do Android e consentimento.

**Incidente tratado sem burlar controles:** o requisito Samsung de sprites normais/Shiny obrigatórias foi respeitado no primeiro bloqueio e na recuperação de bytes idênticos da versão assinada anterior. Fonte externa indisponível é falha de build, não motivo para substituir por outra espécie. A recuperação não tem qualquer relação com modelos visuais de feed PGSharp. A release oficial foi conferida pelo servidor do GitHub (asset uploaded e digest registrado), mas NÃO houve instalação em aparelho nem homologação de teleporte. Este documento diferencia essas etapas.
