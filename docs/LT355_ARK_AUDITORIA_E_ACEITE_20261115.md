# LT355 — ARK: biblioteca nativa de modelos PGSharp e auditoria de reconhecimento (15/11/2026)

## Base verificada e escopo
Base `main`: `8af12a687a6a2eeae562b36a022a7c6f47204bd1`, versão oficial anterior
**0.03.50 / 54557 / 51354**. PR de implementação
[#397](https://github.com/LucianoToscano/PokeSearch/pull/397), branch
`lt355-native-feed-templates-audit`. LT350 [#385](https://github.com/LucianoToscano/PokeSearch/pull/385)
segue draft; não alterar sem aceite explícito e físico. Ler AGENTS, Guia Mestre,
padrão dos overlays e documentação LT354 antes de continuar.

### Fonte entregue e auditoria exata
APK externo recebido `pgs1.277.2_0.435.2_rhGEK(arm64) ...apk`;
SHA-256 `ed8a7676995088bee463186f6f561f0e400ac43db9c9c1cb346a891c7542a67e`,
211.243.984 bytes. ZIP com 2.203 entradas, 437 PNG, 168 .bundle e
Unity Addressables com referências a conteúdos externos. Manifest
`com.nianticlabs.pokemongo`, versão `0.435.2`, Android 9 mínimo, arm64-v8a.
**Nenhuma coleção individual de miniaturas reais de Metagross/feed foi verificada
como extraível, compatível e livre para redistribuição.** Arquivo recebido com
nome "Autorizado" não constitui prova de licença. Nenhum recurso de terceiros
foi copiado para o PokeSearch.

## Implementação entregue
1. `PgsAutoNativeModels.java` lê `pgs-native/manifest.json` do próprio APK.
   Exige provider/schema, versão exata do pacote instalado, espécie existente,
   forma/variante, arquivo em pasta restrita, digest SHA-256, dimensões da
   imagem, declaração de redistribuição e evidência de teste físico. Itens não
   homologados e arquivo ausente retornam lista vazia, nunca toque.
2. Manifest inicial **entries: []**. Infraestrutura pronta, **zero templates
   Metagross nativos**. Não usar desenho de Pokédex como template do feed.
3. `PgsAutoTemplateStore` anexa modelos nativos somente em memória, atrás
   dos modelos pessoais existentes; não persiste nativos e não permite excluir.
   `restoreSample` suporta largura/altura explícitas e inferência segura do
   bitmap; o legado com imagens grandes mantém fallback 68×52.
4. `PgsAutoMenus` identifica "minha/nativa/capturar", distingue miniaturas,
   mostra detalhes sem botão de lixeira para modelo nativo e preserva menus
   compactos/P1/P2/Doce Raro, sem ampliar estrutura ou mudar ícones centrais.
5. `PgsAutoIconDetector` mantém correlação/alpha/cor/2 capturas da LT353,
   reconhece origem do modelo e amplia ROI lateral apenas em paisagem
   (0,34 vs 0,28 em retrato).
6. `PgsAutoScreenGeometry` calcula coordenadas com proporção verificada;
   ambiguidade >6% bloqueia gesto ao invés de clicar em pixel incorreto.
   A prévia ◎ nunca dispara gesto; `BugReport.log` informa estágio e origem
   do modelo. Os avisos "Sou passageiro" continuam de confirmação humana.
7. Manifest Android declara visibilidade **apenas** do pacote do jogo, para
   validar versão sem permissão de visibilidade total de apps.
8. Testes `lt355-pgs-native-library-contract.test.js` e
   `PgsAutoScreenGeometryTest.java`; compilação pura LT211 inclui geometria.

## Gates da implementação
- Node QA #43671495266 **SUCCESS**
- LT169 Node completo #43671495370 **SUCCESS**
- LT211 (Java puro + Node) #43671495257 **SUCCESS**
- LT62 Java Android #43671495284 **SUCCESS**
- OTA LT173 #43671495290 **SUCCESS**
- PGS Android QA #43671495226 **SUCCESS**
- Secure beta/R8 (último HEAD) #43671835430 **SUCCESS**.
Os dois primeiros testes LT355 falharam por **contrato novo incorreto**
(`/selected?speciesModels/`, expressão não existente), corrigido sem
alterar a lógica implementada; o HEAD com fix é `40a3abbea8af352814244e1d718ae8ec333e2ea2`.

## Pendências bloqueadas (não alegar sucesso físico)
- Obter miniaturas reais de Metagross, outras espécies e formas, com direitos
  de redistribuição auditáveis e testes de falsa correspondência.
- Prévia e toque no aparelho Samsung: 2 frames, posição correta, callback
  Android, evidência humana de reação do jogo; delta visual não prova teleporte.
- Benchmark CPU/RAM/bateria com dezenas de modelos, calibração dinâmica
  em diferentes densidades e rotações, fontes grandes, menus e halo reais.
- Verificar efeitos de atualização do PGSharp, tema claro/escuro e Android 9/10:
  PGS `AccessibilityService.takeScreenshot` requer Android 11/API 30+.
- Atualização remota de pacotes exige assinatura do produtor, proteção contra
  rollback e critérios de revogação; **não implementada** sem infraestrutura
  própria e revisão de segurança. Nenhum download automático de assets.
- OAuth Google/Discord, Shiny, Encontro, teleporte, alertas externos e segurança
  "Sou passageiro": continuam sujeitos a aceite humano/integração real.

## Conclusão de produto
LT355 entrega **a infraestrutura segura**, não uma coleção preenchida de
sprites nativas. Só anunciar "modelo nativo pronto" quando o APK contiver
uma entrada com PNG/WebP autorizado, digest correto, dimensões e aceite no feed.
Nenhum CI substitui a homologação no Samsung. Atualização nunca é instalada
silenciosamente. Após sete gates verdes, o processo protegido de release pode
publicar estas correções conservadoras, com as limitações acima explícitas.

## Publicação oficial verificada — 15/11/2026

**LT355 OFICIAL — 15/11/2026:** PokeSearch **0.03.51 / versionCode 54558 / label 51355** publicado em [v0.03.51-54558](https://github.com/LucianoToscano/PokeSearch/releases/tag/v0.03.51-54558). [APK oficial assinado](https://github.com/LucianoToscano/PokeSearch/releases/download/v0.03.51-54558/PokeSearch-v0.03.51-LT.apk): **61.135.091 bytes**, SHA-256 `236b65d4cd5132f75a368150b17f6bad02156cc3b6eb66b029a029690731110a`; [workflow protegido #43672361588](https://github.com/LucianoToscano/PokeSearch/actions/runs/43672361588) **SUCCESS** (preflight, compilação R8, assinatura permanente, publicação pública e digest). Implementação [PR #397](https://github.com/LucianoToscano/PokeSearch/pull/397), squash `88a774dfce43896d32e70e0b31fb7ce48591ae70`; pedido oficial [PR #398](https://github.com/LucianoToscano/PokeSearch/pull/398), squash `492fdffa137b2bdef03e54c1b20a7db1bd50a69d`. Sete gates da implementação **SUCCESS**: Node QA #43671835493, LT169 #43671835470, LT211 #43671835588, Java LT62 #43671835565, OTA #43671835439, PGS QA APK #43671835422, Secure beta/R8 #43671835430. A LT355 criou o catálogo de templates PGS nativos somente-leitura e seguros (verificação de direitos, evidência, SHA-256, dimensões e versão), preservou amostras pessoais e suas proporções no restore, expôs estados minha/nativa/capturar no menu compacto, separou fonte/confiança na prévia sem gesto e bloqueou gestos quando captura/display são incompatíveis. **CATÁLOGO INICIAL VAZIO**: o APK PGSharp enviado não forneceu miniaturas individuais de Metagross homologadas e com direitos de redistribuição; NÃO afirmar que existem sprites PGSharp nativas prontas. **BLOQUEADO para aceite físico Samsung:** Metagross no feed, gesto recebido pelo PGSharp, teleporte, Shiny, Encontro, fidelidade visual de menus e latência/bateria; qualquer callback Android ou delta de cor não prova reação do jogo. Aviso "Sou passageiro" só humano. LT350 PR #385 permanece draft. Instalação não é automática: Android exige confirmação.

**Nota:** publicação de infraestrutura segura não constitui fornecimento de modelos de Metagross nem homologação do clique físico no jogo. O pacote oficial passa a ser referência; LT350 continua em draft.
