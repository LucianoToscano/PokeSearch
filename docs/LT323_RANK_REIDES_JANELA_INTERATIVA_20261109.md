# LT323 candidata — Rank Reides compacto e interativo

**Data:** 09/11/2026 · **Base:** release oficial LT322 `0.03.22`, code `54528` · **Estado:** branch/PR de melhoria, sem merge, APK ou publicação.

## Objetivo

Aprimorar **somente a janela de Rank Reides existente** na ficha do Pokémon. Não criar novos ícones, abas Max ou janelas grandes, não alterar rankings PvE, PvP ou forma de pesquisar.

## Implementação

- **Toque no nome ou número # da Pokédex:** a linha mantém nome, tipo, rank de Reide e golpes atuais. O nome e o número # exibido ao lado tornam-se uma única área clicável com semântica `button`, `aria-expanded` e `aria-controls`. Outro toque recolhe; tocar em outra linha fecha a anterior.
- **ER, DPS e TDO sob demanda:** valores vêm dos campos `score` (ER), `dps` e `tdo` da resposta já validada de `pve_raid_rank.js`; sem requisição extra. Não usar IV do encontro nem recalcular o ranking. Campo ausente, zero, negativo ou não numérico recebe `—`. Formato brasileiro com uma casa decimal.
- **Sprite compacta de 26×26:** `PokeSearchOfflineSprite.rankSprite(nome)` obtém apenas espécies/formas verificadas, reaproveitando pacote offline. Se a origem não for confirmada ou a imagem falhar, a linha mantém nome e número sem círculo branco/arte inventada. Não associar sprites de espécies base a variantes Shadow sem confirmação. Mega somente quando a identidade exata for validada.
- **Rank e # da Pokédex são diferentes:** a posição `#12 Fantasma` continua à direita, enquanto `#0094` da Pokédex aparece discreto ao lado do nome.
- **Sem poluição:** três linhas de métricas ficam ocultas até o toque; aviso de métricas explica que a fonte classifica espécies por tipo, nível 50/15-15-15 de referência e que evoluções/formas podem ser projeções, não elegibilidade do espécime atual.
- **Rolagem/resize:** atualiza dimensão da janela depois de abrir/fechar métricas, `Ver mais classificações` e `MT nos golpes de Reides`. Um controlador delegado no painel evita vários listeners; mantém as três linhas iniciais e as demais em `details`.
- **Paridade P1/P2:** alterações unicamente em `app/src/main/assets/detail.html`, compartilhado pela implementação do overlay secundário. Dados, sessão e filtros continuam independentes entre as Pokébolas.

## Dados, segurança e limitações

- Dados do ranking existente: `pve_raid_rank.js` / S-Tier-Devs pogo-db-api (snapshot referencial de agosto/2026), **não Dittobase**; as três páginas do Dittobase não foram integradas nem misturadas ao Rank Reides. Não se promete atualização em tempo real do meta, nem posicionamento contra chefe específico.
- `ER` é o campo fornecido pela fonte, não um cálculo novo. `DPS` e `TDO` são métricas da espécie/formato da fonte; não representam IV, CP, nível, golpes ou desempenho real do exemplar capturado.
- Não modificar `pve_raid_rank.js`, contrato da API PoGoCoordinates, PvP, golpes, tamanho dos cinco atalhos, assets de Edu, assinaturas, autenticação ou atualizador.
- Imagens Shadow/Mega não confirmadas são deliberadamente omitidas, sem forçar um sprite base diferente.

## QA e aceite

- `app/tests/lt323-raid-interactive-window.test.js`: cobre HTML real, sprite Normal/Mega, guarda Shadow, número #, ER/DPS/TDO e valores sem dados, toque para abrir/recolher, troca de linha, um listener, resize e paridade P1/P2.
- Executar regressão Node completa, compilação Android e gates de PvE/visual no SHA da PR. Conferir que os testes históricos LT259 e LT282 permanecem passando.
- **Pendente QA Samsung físico** em P/M/G e ambas as Pokébolas: toques no número pequeno, ícones 26px, contraste do texto, rolagem após expandir métricas e voltar, troca de espécie, Mega e Shadow.
- **Não publicar / fazer merge antes de autorização específica.** LT322 continua oficial.


## Segunda auditoria: renderização real P/M/G

- Acrescentado `app/tests/lt323-raid-real-ui-visual.cjs`, executado pelo gate visual oficial LT253 após instalar o Chromium pinado do projeto, com o **HTML/CSS/JS de produção** (`detail.html`). Usa linhas PvE sintéticas **somente para reproduzir o layout**, não afirma novos rankings reais. Viewports: P 200×590, M 240×740 e G 320×860.
- O teste valida: apenas três linhas iniciais, `Ver mais` realmente recolhido, nome/Dex tocável, ER/DPS/TDO em três colunas sem estouro, troca da classificação ativa, sprite Shadow ausente quando não é verificável, fonte marcada e expansão das linhas adicionais. Gera capturas de tela no artefato `PokeSearch-LT253-visual-PMG`.
- **Bug real detectado na primeira execução:** o CSS `#raidPanel .psRaidRow{display:grid}` estava sobrepondo a regra de exibição do navegador para linhas dentro de `<details>` fechado, de modo que as classificações extras ainda ocupavam espaço. Corrigido com `#raidPanel .psRaidMore:not([open]) > .psRaidRow{display:none!important}`. Incluído teste Node para impedir regressão.
- **Limite:** o Chromium lê o HTML real, mas `file:///android_asset` não representa o Android no runner. Falhas de carregamento de sprite devem manter fallback sem círculo; ainda requer inspeção em Samsung real para avaliar definição/contraste/toques.

## Verificação final do protótipo visual (09/11/2026)

- **7/7 gates SUCCESS** no SHA `cc448997447425164450535826949284f860840e`: [LT169 Node integral](https://github.com/LucianoToscano/PokeSearch/actions/runs/42682600862), [Node QA](https://github.com/LucianoToscano/PokeSearch/actions/runs/42682600906), [LT211 core Android](https://github.com/LucianoToscano/PokeSearch/actions/runs/42682601000), [LT62 compilação Java](https://github.com/LucianoToscano/PokeSearch/actions/runs/42682600988), [LT173 OTA](https://github.com/LucianoToscano/PokeSearch/actions/runs/42682600827), [LT259 ranking PvE](https://github.com/LucianoToscano/PokeSearch/actions/runs/42682601276) e [LT253 visual real](https://github.com/LucianoToscano/PokeSearch/actions/runs/42682601465).
- O gate visual LT253 executou **LT323 visual P/M/G PASS** nas três larguras, com toques de abrir/recolher, alternância entre linhas, clique em `Ver mais`, três métricas numéricas, controles dentro da largura do painel e ausência de erros JavaScript. Gerou nove screenshots LT323, três por tamanho, no [artefato visual #13703372282](https://github.com/LucianoToscano/PokeSearch/actions/runs/42682601465/artifacts/13703372282) junto às demais capturas do gate.
- O problema das linhas extras visíveis foi corrigido e validado **após** a detecção; não confundir o primeiro gate vermelho (teste antes do ajuste) com a execução final verde.
- **Homologação física Samsung ainda pendente**, incluindo o carregamento de sprites `file:///android_asset` no APK instalado, contraste em painel translúcido, dimensão dos toques e rolagem nas duas Pokébolas. Browser não prova instalação no Android.
- PR #323 é candidata; **sem merge, publicação, APK ou alteração da release LT322**.

## Compatibilidade de regressões históricas

- Os testes LT265/LT285 exigiam literalmente `rows.slice(0,3).map(rowHtml).join("")`; o renderizador mantém essa chamada sem perder os índices corretos das classificações adicionais.
- A regra LT316 do Edu já não reconhecia a convenção documental vigente desde LT322 em `AGENTS.md`. O teste foi atualizado para reconhecer o cabeçalho oficial `ESTADO OFICIAL VERIFICADO EM ... LT322`, preservar o limite mínimo LT318 e não confundir registros históricos LT320 com a versão atual. O código, atlas e comportamento do Edu permanecem inalterados.
- Na rodada inicial do CI, o teste específico LT323 passou. Após o ajuste, Node QA, LT211 core Android, LT62 Java, LT173 OTA e LT259 PvE passaram. LT169 e LT253 retornaram `failure` **sem jobs criados** na segunda rodada; esse status não comprova falha de teste nem sucesso. Uma nova execução é necessária e seus resultados devem ser registrados para o SHA final.
