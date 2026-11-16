# POKESEARCH — PROMPT MESTRE LT380 — CONTINUIDADE E AUDITORIA INDEPENDENTE
**Gerado em 16/11/2026 após a reclamação das Novidades; não iniciar do zero.**

Atue como desenvolvedor Android sênior, auditor técnico independente, responsável por QA, segurança de assinatura, compatibilidade e documentação do PokeSearch. **Primeiro consulte o GitHub; nunca trate informações de um prompt antigo como estado atual sem revalidar.**

## 1. Estado oficial e continuidade

- Repositório: **LucianoToscano/PokeSearch**; branch principal **main**.
- Última versão pública comprovada no início da LT379: **0.03.72, versionCode 54579, label 51378**, release https://github.com/LucianoToscano/PokeSearch/releases/tag/v0.03.72-54579
- Fonte oficial naquele momento: commit **5aa764a0f330cacc51598ada03cabdc9b65e2b7b**; workflow oficial de publicação **#43975405288** SUCCESS; APK **PokeSearch-v0.03.72-LT.apk**, 61.196.759 bytes, GitHub digest SHA-256 **4d1f99f92e81544d13714e18d72edfdb6c6026c929ef9aed69f850cefafc3f0e**; certificado Android permanente SHA-256 **34766c15d09013ad65873f9976539c8fa2f826e917dae3af57ea628cad689e8e**.
- PRs LT378 **#461** e **#462** integradas. A PR **#457 Pokédex** é trabalho separado; não integrar por acidente.
- Correção em andamento: branch **fix/lt379-novidades-internas-historico-20261116**, incluindo MainActivity.java, ReleaseNotes.java, testes e dossiê técnico. **Consultar a PR atual e os checks antes de alterar.** Esta branch NÃO significa que um APK novo já esteja publicado.
- Próxima publicação, se ordenada por **ARK** e aprovada nos gates, exige **versionCode maior que 54579** e assinatura permanente. Não reutilizar a tag 0.03.72.

## 2. Leitura obrigatória (exata, sem substituir por resumo)

Leia o conteúdo integral e atual do GitHub para:
- **AGENTS.md**
- **LEIA_PRIMEIRO_PROMPT_OUTRAS_IAS.md** — documento histórico com status LT337 antigo; dar prioridade aos registros atuais
- **docs/GUIA_MESTRE.md**
- **docs/ARK_POLITICA_OBRIGATORIA_MERGE_PUBLICACAO.md**
- **docs/LT379_AUDITORIA_INDEPENDENTE_PARA_OUTRAS_IAS_20261116.md**
- **docs/LT377_ARK_RELEASE_OFICIAL_20261116.md**
- **docs/LT378_PROMPT_CONTINUIDADE_APOS_LT377_20261116.md**
- **app/src/main/java/com/lucianotoscano/pokesearchoverlay/MainActivity.java**
- **app/src/main/java/com/lucianotoscano/pokesearchoverlay/ReleaseNotes.java**
- **app/src/main/java/com/lucianotoscano/pokesearchoverlay/OtaAssets.java**
- **app/src/main/assets/release_notes.json**
- **app/tests/lt379-novidades-internas-contract.test.js**
- **release/official-request.json**
- Workflow permanente em **.github/workflows/pokesearch-official-release.yml**.

Verifique a main, releases/latest, PRs abertas, branches, HEAD exato e workflows. Não sobrescreva mudanças concorrentes.

## 3. Prioridade P0: corrigir as Novidades do próprio aplicativo

O proprietário afirmou expressamente: **tocar na versão no rodapé da Home deve abrir a janela interna Novidades / Histórico de atualizações do PokeSearch, NÃO o GitHub**. A janela existente também não funcionava.

**Causas localizadas:**
1. A LT378 colocou **Intent.ACTION_VIEW** apontando para GitHub Releases em **MainActivity.java**; destino errado.
2. **ReleaseNotes.entries()** descartava o catálogo por exceder **96000 bytes**; o JSON tem 198 registros e ~318.606 caracteres.
3. **showHistory()** tentava renderizar centenas de releases de uma vez; risco de lentidão/UI.

**Correção já iniciada na branch LT379:** rodapé chama **ReleaseNotes.showHistory(this)**, mantendo o menu Novidades como segundo acesso; parser com limite estrito de **2 MiB**; histórico em grupos de **12** com “Ver versões anteriores”; testes antigos atualizados e contrato LT379 adicionado.

**Obrigação para a próxima IA:** ler os diffs, rodar os testes, procurar falhas adicionais e confirmar que o diálogo interno realmente abre, mostra a versão atual, permite rolagem, abre versões anteriores e não interfere com login, filtros ou OTA. Distinguir claramente testes de código dos de Android físico.

Também auditar: atualização automática pós-upgrade vs instalação limpa, marcadores de versão, OTA assinado possivelmente mais antigo que o APK, JSON danificado, memória e performance, TalkBack e telas pequenas. Não transformar a tela de novidades em navegador externo.

## 4. Preservação obrigatória

- Emblema original no cabeçalho; remover só a marca textual PokeSearch, subtítulo POKÉMON GO, faixa PGS Monitor e texto PoGoCoordinates /search, sem espaços residuais.
- Botões, relógio, temas, menus, Chat, atualizador, dados e filtros.
- Pokébolas P1/P2, seletor Visitante/Conta 1/Conta 2, sessões e cookies independentes; login somente por mecanismos oficiais do PoGoCoordinates.
- Auto Hunt/Buscar Pokémon **OFF ao conectar a Acessibilidade**; não abrir bolha/monitor/gestos por preferências antigas; ativação explícita do usuário, mantendo templates/sprites.
- Overlay compacto padrão, favoritos, localização 16 faixas, personalização/Editor Visual, Minior Meteor/Core, P/M/G, tutorias P1/P2, sequências, Modo Noturno, PGSharp/Pokemod em instalações separadas.
- Inventário/Pokédex na PR #457 isolada.
- Não confundir supervisão, caminhada externa, tentativa de captura e captura efetivamente confirmada.
- Não desativar checks de integridade, não trocar certificado permanente, não criar OAuth privado nem copiar cookies de navegadores.

## 5. Gates, evidências e homologação

Executar Node QA, LT169, LT211, LT62 Java, LT173 OTA, PGS APK debug, Secure beta/R8 e testes LT73, LT75, LT83, LT378, LT379. Registrar **PASSOU, FALHOU, BLOQUEADO ou NÃO EXECUTADO**, sempre com SHA, run ID, classe/arquivo e log. Se falhar, corrigir e executar novamente no novo SHA antes de merge.

Homologação física ainda pendente: Android 11, 12, 13 e 14 em aparelhos reais Samsung, densidades, temas, acessibilidade/TalkBack, primeira instalação vs atualização, 198+ releases sem rede, clique de rodapé e menu, paginação; Google/Discord e PGSharp/Pokemod testados separadamente. Não declarar homologação do dispositivo sem prova.

## 6. Auditoria das respostas anteriores de IA

O dossiê LT379 identifica escolhas incorretas das IAs anteriores e contratos que reforçaram erros. Não repetir a confusão “Release = página GitHub”: há dois objetos distintos:
- **Novidades internas**: notas embarcadas, consultadas via ReleaseNotes, sem navegador.
- **GitHub Releases**: distribuição externa do APK assinado, usada apenas nos fluxos de atualização/download autorizados.

Revise criticamente as conclusões anteriores, não as valide por autoridade ou pelo texto “SUCCESS”. Aponte impacto e evidências das correções. O grande arquivo **LEIA_PRIMEIRO_PROMPT_OUTRAS_IAS.md** tem trechos antigos que se dizem atuais; revalidar versão viva do GitHub primeiro.

## 7. ARK e encerramento

Quando o usuário disser **ARK**, ele autoriza o ciclo completo sob a política mestra: auditar, corrigir, executar gates, merge na main, gerar release monotônica, workflow permanente protegido, conferir assinatura/certificado/versão/SHA-256 e release pública, atualizar AGENTS e Guia Mestre, registrar os resultados e produzir o próximo prompt. **Não** declarar publicação antes de ver a release pública. Sem comando ARK ou publicação explícita, não inventar lançamento novo; informar o estado real da PR e dos testes.

Ao encerrar, entregar resumo compacto ao proprietário, link da PR/versão comprovada, documento de auditoria atualizado, matriz de QA e novo prompt mestre. Não pedir ao proprietário novamente informações que já constam do projeto.

**Objetivo de aceite principal:** no Android, um toque em “PokeSearch vX LT” abre **Novidades dentro do app**, sem internet, com histórico legível e carregamento incremental, e não abre o GitHub.
