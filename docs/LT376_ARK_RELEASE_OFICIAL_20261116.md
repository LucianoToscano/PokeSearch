# PokeSearch — ARK LT376 OFICIAL — 16/11/2026

## 1. Publicação comprovada

Por autorização explícita do proprietário em 16/11/2026, o comando **ARK** passou a obrigar a conclusão do ciclo de entrega incluindo merge e **publicação oficial**, sem encerrar apenas em PR/relatório quando os gates permitem. A regra canônica consta em [ARK_POLITICA_OBRIGATORIA_MERGE_PUBLICACAO.md](ARK_POLITICA_OBRIGATORIA_MERGE_PUBLICACAO.md), no [AGENTS.md](../AGENTS.md) e no [GUIA_MESTRE.md](GUIA_MESTRE.md). Restrições antigas "sem merge" da fase QA LT376/LT376e são históricas e não prevalecem sobre essa autorização atual.

**Versão publicada:** PokeSearch **0.03.70**, Android **versionCode 54577**, label **51376**. Release pública não-draft e não-prerelease:
- https://github.com/LucianoToscano/PokeSearch/releases/tag/v0.03.70-54577
- APK oficial: https://github.com/LucianoToscano/PokeSearch/releases/download/v0.03.70-54577/PokeSearch-v0.03.70-LT.apk
- Asset `PokeSearch-v0.03.70-LT.apk`: **61.195.487 bytes**, estado GitHub `uploaded`, digest **SHA-256 `d5177cb7739cb9295ffeb692bb5ec82de2ba35e7fe5a21899e0e0ceb628c747a`**; digest verificado pelo workflow oficial (não alegar recomputação local independente).
- `published_at` pela API GitHub: **2026-11-16T21:14:14Z**.
- SHA de fonte/publicação na `main`: **`e7ddc20c52e43e36c98ce350f5729761c4d02f51`**.
- Certificado permanente esperado **SHA-256 `34766c15d09013ad65873f9976539c8fa2f826e917dae3af57ea628cad689e8e`**. O workflow oficial conferiu o certificado, scheme v2, pacote, `versionCode`, `versionName`, R8, APK não debuggable e digest do asset. A assinatura NÃO foi rotacionada.
- Workflow oficial protegido **#43957285282** [completed/success](https://github.com/LucianoToscano/PokeSearch/actions/runs/43957285282): jobs `preflight` e `publish` SUCCESS; etapas `Prepare approved version and notes`, `SDK and exact permanent signer`, `Run Node and OTA regressions`, `Generate complete official assets`, `Build signed protected release`, `Validate APK and signer`, `Release to all app users` e `Verify public release and hash` SUCCESS.

## 2. Integração do código e do pedido oficial

**PR #455** (LT376/LT376e e regra ARK) [MERGED](https://github.com/LucianoToscano/PokeSearch/pull/455) via squash **`f674ee47d5290dc9aa163ab9d0a903494d1c7583`**. Head validado: **`f42f06701abfe60e53abce34423eb4ba499ef80a`**.

QA anterior ao merge no mesmo SHA **7/7 SUCCESS**:
1. Node QA [#43956125665](https://github.com/LucianoToscano/PokeSearch/actions/runs/43956125665).
2. LT169 Node completa [#43956125797](https://github.com/LucianoToscano/PokeSearch/actions/runs/43956125797).
3. LT211 core [#43956125657](https://github.com/LucianoToscano/PokeSearch/actions/runs/43956125657).
4. LT62 Java [#43956125482](https://github.com/LucianoToscano/PokeSearch/actions/runs/43956125482).
5. LT173 OTA [#43956126050](https://github.com/LucianoToscano/PokeSearch/actions/runs/43956126050).
6. PGS APK debug QA [#43956125709](https://github.com/LucianoToscano/PokeSearch/actions/runs/43956125709).
7. Secure beta/R8 [#43956125790](https://github.com/LucianoToscano/PokeSearch/actions/runs/43956125790).
Extra LT253 [#43956125480](https://github.com/LucianoToscano/PokeSearch/actions/runs/43956125480) SUCCESS.

**PR #456** [MERGED](https://github.com/LucianoToscano/PokeSearch/pull/456) via squash **`e7ddc20c52e43e36c98ce350f5729761c4d02f51`**, baseada na PR #455 integrada. O pedido em `release/official-request.json`: `0.03.70`, code `54577`, label `51376`, `previous_tag=v0.03.69-54576`, `qa_max_code=54576`; entrada correspondente embutida em `app/src/main/assets/release_notes.json`. Preflight oficial e gates de Node, LT169, LT211, LT62, LT173, Secure beta/R8 na PR #456 aprovados no SHA `968aabca6168b5403b7cd914d75762e1550745b3`. A publicação é outra execução oficial, não o APK de QA.

## 3. Funcionalidades da LT376/LT376e

- **Localização:** elimina rolagem interna/corte na referência de 16 faixas de cooldown, preservando aplicação ao KM.
- **Favoritos:** calcula posição relativa à barra flutuante e corrige a posição usando coordenadas reais, evitando sobrepor barra/resultados no caso relatado.
- **Personalização:** alça de arraste 2×3 com seis pontos circulares reais, sem trocar por glifos grossos, mantendo teclado e persistência.
- **Editor Visual:** o desfoque nativo é aplicado também na janela de popup quando `WindowManager.isCrossWindowBlurEnabled()` permitir, sem prometer efeito se Android bloquear; preserva transparência semitransparente.
- **PoGoCoordinates:** reconhecimento de nome e foto do perfil `/profile` pela combinação `Linked accounts` + `Member since` sem depender da seção opcional de treinador Pokémon GO; avatar limitado a fontes HTTPS públicas permitidas.
- **Contas P1/P2:** cartões com linha separada `Atualizar perfil` / `Sair site`, sem comprimir nome; sincronização manual a partir do perfil oficial, WebViews/cookies isolados, sem importar sessão de navegador externo nem forçar vínculo de treinador.
- **Seletores de conta:** posição horizontal pela arte central visível da Pokébola, com fallback óptico; vertical 2 pixels acima da arte.
- Preservados Minior/sprites P/M/G, contas independentes, filtros, Favoritos, tutorial P1/P2, Busca Inteligente, Sequências, Modo Noturno, notificações, PGSharp e Pokemod utilizados separadamente.

## 4. Limitações e QA físico NÃO realizado

Não houve homologação física certificada dos itens a seguir: Samsung/Android 11–14, duas WebViews com OAuth Google/Discord real e 2FA, recuperação de nome/foto, centro geométrico dos seletores, 16 faixas sem corte em tela pequena, Favoritos sem sobreposição em aparelhos diferentes, desfoque quando ativo/bloqueado pelo sistema, Minior Meteor/Core, P/M/G, toque real, tutorial, TalkBack, desempenho, PGSharp e Pokemod separados. Os testes automatizados e a assinatura comprovam a compilação e integridade publicada, não o resultado físico.

Não alegar teleporte, caminhada executada pelo PokeSearch ou captura confirmada sem evidência direta; supervisão, caminhada externa, tentativa e captura efetiva são estados distintos. A instalação do APK depende de consentimento do Android. A release LT375 permanece preservada como referência; downgrade não é garantido por `versionCode`.

## 5. Regra de continuidade

**ARK = merge e publicação obrigatórios** quando solicitado pelo proprietário, respeitando gates, assinatura e bloqueios reais. Em futuras etapas, nunca terminar apenas com PR aberta ou ARK documental se o usuário solicitou ARK e não vetou publicação. Se o CI/assinatura/permissões impedirem a publicação, declarar ARK incompleto com evidência em vez de inventar sucesso.

**Próximo prompt:** [LT377_PROMPT_CONTINUIDADE_APOS_LT376_OFICIAL_20261116.md](LT377_PROMPT_CONTINUIDADE_APOS_LT376_OFICIAL_20261116.md). Última versão oficial no encerramento do release: **v0.03.70-54577**.
