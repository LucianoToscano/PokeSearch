# PokeSearch — Auditoria de organização e preservação segura — 21/11/2026

**Natureza:** auditoria documental e de inventário **sem remoção de arquivos**. Repositório: [LucianoToscano/PokeSearch](https://github.com/LucianoToscano/PokeSearch), branch `main`. Base consultada: `3e210192d40d36d4c5b2c9c20cecaa29bd2c9fea`. Dados obtidos do GitHub Tree `recursive=1`, `truncated=false`, diretórios, Guia Mestre, AGENTS, README, GitHub Releases/latest e registro de auditoria do Google Drive de 17/11/2026.

## 1. Resumo executivo e decisão

A fonte central **é** `docs/GUIA_MESTRE.md` (854.300 bytes na base), complementada por `AGENTS.md` (120.402 bytes na base). O backup `docs/GUIA_MESTRE_BACKUP_INTEGRAL_2026-10-25.md` (1.459.814 bytes) preserva o histórico. Há documentação extensa, mas a navegação inicial e a sinalização de conteúdo histórico estão fragmentadas. A ação segura é **adicionar estrutura e evidência, não reduzir o acervo**.

**Release externa verificada:** [v0.03.94-54601 / LT409](https://github.com/LucianoToscano/PokeSearch/releases/tag/v0.03.94-54601), publicada em 20/11/2026, não prerelease e não draft, com APK `uploaded` de 61.767.162 bytes e digest `sha256:9fb65f1e3f747355b7dfaed2e6318b889713c71bf42aa71b5c0f715e9854f505`. A auditoria **não baixou ou recalculou o digest do APK**, não executou build, não observou instalação física e não criou release nova.

## 2. Inventário objetivo do GitHub

| Indicador | Evidência na base `main` |
| --- | ---: |
| Objetos no tree GitHub | 1.841 |
| Arquivos versionados (blobs) | 1.796 |
| Diretórios no tree | 45 |
| Soma dos tamanhos dos blobs | 80.868.385 bytes |
| Arquivos diretamente em `docs/` | 486 |
| Workflows YAML em `.github/workflows/` | 261 |
| Markdown no repositório (extensão `.md`) | 478 |
| JavaScript `.js` | 444 |
| Java `.java` | 206 |
| PNG `.png` | 198 |
| Grupos de arquivos com SHA de blob idêntico | 6 (12 caminhos) |

O tamanho é a **soma dos blobs do tree**, não tamanho do clone, APK, artefatos LFS ou espaço necessário em disco. O inventário foi completo quanto à listagem do tree, **não** uma revisão semântica integral dos 1.796 arquivos.

## 3. Duplicidade exata: classificar, não eliminar

| Arquivo A | Arquivo B | Decisão |
| --- | --- | --- |
| `app/src/main/assets/pgs-crop/icone_background_on.png` | `app/src/main/assets/ui-icons/Icone_Background_On.png` | Preservar: referências de assets distintas |
| `app/src/main/assets/result-icons/none.png` | `app/src/main/res/drawable-nodpi/sem_filtro.png` | Preservar: origens assets e Android res |
| `app/src/main/assets/ui-icons/lixeira_branca.png` | `app/src/main/res/drawable-nodpi/lixeira_branca.png` | Preservar: nomes iguais, locais de resolução distintos |
| `app/src/main/assets/ui-icons/lixeira_preta.png` | `app/src/main/res/drawable-nodpi/lixeira_preta.png` | Preservar: uso potencial por WebView e recursos nativos |
| `app/src/main/res/drawable-nodpi/home_quests.png` | `app/src/main/res/drawable-nodpi/support_home_new.png` | **Candidata a estudo**, sem remover: verificar referências e intenção visual |
| `app/src/main/res/mipmap-anydpi-v26/ic_launcher.xml` | `app/src/main/res/mipmap-anydpi-v26/ic_launcher_round.xml` | Preservar: Android pode exigir os dois nomes |

Os SHAs mostram conteúdo idêntico **na base verificada**, não provam que um nome/arquivo seja dispensável. A operação segura foi **zero exclusões**.

## 4. Achados de governança e usabilidade

**A1 — Prioridade alta: entrada desatualizada.** `README.md` inicia com “Versão oficial publicada — LT227 / 0.02.27”, enquanto o Guia e Releases/latest estão na LT409. Não apagar as informações da LT227: reclassificar como **histórico** e acrescentar uma seção de estado corrente com link ao Guia/Release.

**A2 — Prioridade alta: leitura obrigatória pouco visível.** O Guia Mestre atual é longo e possui múltiplas seções de datas diferentes; versões antigas descrevem estados “atuais” apenas em seu contexto. Criar índice permanente apontando para os registros recentes, AGENTS, manual, histórico e áreas técnicas. Nenhum resumo substitui o Guia.

**A3 — Prioridade média: grande volume de workflows históricos.** Foram listados 261 arquivos YAML. **Não foi comprovado** que estejam ativos, disparando automaticamente ou sem uso; alguns podem ser exclusivamente manuais, QA ou necessários para rastrear releases. Próxima fase deve levantar gatilhos, permissões, dependências, uso recente e segurança antes de qualquer desativação. Preservar workflow oficial protegido de assinatura e publicação.

**A4 — Prioridade média: imagem e fontes.** Ativos originais, sprites, ilustrações e partes multipartidas do Edu podem ser necessários à execução/reconstrução. Referências a FastDev/DEV/Preview devem continuar como histórico auditável, **não** como canal autorizado atual (LT407).

**A5 — Prioridade alta de acompanhamento: compartilhamento do Drive.** O relatório [AUDITORIA_DRIVE_POKESEARCH_2026-11-17](https://docs.google.com/document/d/1Wj6QCuuJfjrPte1_8y9NVWe6OGXd24X1Ma5uegohjNU/edit?usp=drivesdk) registrou na data uma permissão `anyone:writer` na pasta principal. **Não houve nova leitura de permissões nesta auditoria**; revalidar o risco e as necessidades de colaboradores antes de alterar permissões. O mesmo relatório registra quarentena reversível de duplicatas e ZIPs ainda sem hashes completos. Não excluir sem validação.

**A6 — Prioridade média: links internos.** O Guia apresenta referências relativas `docs/...` em texto situado dentro da própria pasta `docs/`; podem falhar ao clicar. Uma varredura somente-leitura pode fornecer a lista; alterar apenas referências verificadas sem tocar em trechos históricos ou URLs externas.

## 5. Ações executadas nesta etapa

- Consultados Guia Mestre e AGENTS antes da preparação de alterações.
- Conferidos arquivo central, backup, README, prompt de continuidade, estrutura e GitHub Releases/latest.
- Criado índice navegável `docs/INDICE_CENTRAL_POKESEARCH.md`, **sem mover arquivos**.
- Acrescentada sinalização da situação oficial e precedência dos documentos nas entradas principais, **preservando o corpo histórico**.
- Adicionada ferramenta `scripts/audit_repository_safely.py` de inspeção local sem escrita, com testes unitários em `scripts/test_audit_repository_safely.py`.
- **Sem alterações em** Android, Gradle, resources, Firebase, `release/`, `ota/`, workflows, assinatura, versionCode, APK ou dados do usuário.

## 6. Limites e próximos passos com segurança

1. Executar em checkout: `python3 scripts/audit_repository_safely.py --json`; conferir os links suspeitos, duplicatas por bytes e caminhos sensíveis **sem expor seus conteúdos**. Contagem local pode diferir do tree GitHub por arquivos ignorados/gerados.
2. Revisar consumidores de cada duplicata (Android resources, WebView, Java, Gradle e scripts) e provar ausência de dependências antes de propor remoção; sem remoção automática.
3. Catalogar gatilhos reais dos 261 workflows; somente depois criar PR específica para arquivamento/desativação de candidatos com QA, rollback e revisão de segurança.
4. Revisar links Markdown confirmados como quebrados, limitando a alterações de referência, não de conteúdo.
5. Validar em aparelho Android 17 Home, P1/P2, PGSStats, sprites, sincronização e Auto Hunt — **não executado nesta auditoria**.
6. Revisitar Drive e sua quarentena; confirmar permissões atuais, integridade dos ZIPs e dependências de scripts após migrações históricas.
7. Registrar cada futura limpeza com manifesto antes/depois, motivação, hashes quando relevante, teste real, link de PR, reversão e entrada no Guia.

## 7. Critério de aceite permanente

**Prioridade = informação comprovada + rastreabilidade + reversibilidade.** Documentação deve crescer em precisão e navegabilidade, jamais perder conhecimento. Arquivos só podem ser removidos quando **não** houver dependências demonstradas e o responsável autorizar a limpeza; em caso de dúvida, manter e classificar como histórico/candidato. CI aprovado não equivale a teste físico; auditoria documental não equivale a release.

**Resultado:** inventário e diagnóstico confirmados; reorganização exclusivamente documental, com histórico e fontes intactos. **Sem exclusão, sem APK novo, sem publicação de atualização do aplicativo.**
