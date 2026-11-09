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


## Compatibilidade de regressões históricas

- Os testes LT265/LT285 exigiam literalmente `rows.slice(0,3).map(rowHtml).join("")`; o renderizador mantém essa chamada sem perder os índices corretos das classificações adicionais.
- A regra LT316 do Edu já não reconhecia a convenção documental vigente desde LT322 em `AGENTS.md`. O teste foi atualizado para reconhecer o cabeçalho oficial `ESTADO OFICIAL VERIFICADO EM ... LT322`, preservar o limite mínimo LT318 e não confundir registros históricos LT320 com a versão atual. O código, atlas e comportamento do Edu permanecem inalterados.
- Na rodada inicial do CI, o teste específico LT323 passou. Após o ajuste, Node QA, LT211 core Android, LT62 Java, LT173 OTA e LT259 PvE passaram. LT169 e LT253 retornaram `failure` **sem jobs criados** na segunda rodada; esse status não comprova falha de teste nem sucesso. Uma nova execução é necessária e seus resultados devem ser registrados para o SHA final.
