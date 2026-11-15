# LT363 — Auditoria de PokeList, Data Hub, PGTools e Pokemod Aegis/Atlas (15/11/2026)

## Base oficial no início da sessão
- `main`: `1b0600a3ed885c08935a8bc7e1160d802ff58012`.
- Última release pública comprovada antes deste trabalho: `v0.03.58-54565`, versionName **0.03.58**, versionCode **54565**, label **51362**, digest GitHub do APK `19fcc7b8531509c7d258b593f9a50e7897e21b35d3ac54148fdb07f8d4221e19`.
- PokeSearch é complemento independente; P1/P2, Doce Raro, Edu, OAuth, contas, filtros e modelos pessoais não podem ser alterados por esta auditoria.

## Origem e método
Todos os arquivos abaixo foram enviados pelo proprietário do projeto. Foram abertos diretamente em armazenamento local, inspecionados como ZIP/APK estáticos, listados os assets, extraídas **somente para análise** strings de DEX e da tabela de strings do AndroidManifest binário, comparadas descrições presentes nos relatórios e computados SHA-256 locais. Nenhum APK/binário/ELF/DEX foi executado, nenhum endpoint foi consultado, nenhuma credencial foi usada e nenhum arquivo de terceiro foi transferido para o APK do PokeSearch.

| Arquivo de entrada | SHA-256 local |
|---|---|
| `API_PokeList_spec.md` | `1213e553cee84f614be5d130373180144fd91daa8059e2265de49871baa74e4d` |
| `PokeList_Recriacao_Completa.zip` | `32a6b117fcd3df40a1b52d522154083b312dfc5ffd16cb78479f3981ee3002e7` |
| `PokeList_Auditoria_Completa.zip` | `7345d0190565a63d9b75d238db6a54e8c93f655ea00965a3b550724755d5dd26` |
| `PokeList_Auditoria_Completa_Recriacao.zip` | `e17d57d98e744c09ddcb6f38e1e04e6f7d53b2b0dc66f572a6057cfbd53dc205` |
| `PokeList_API_Audit_Completa.zip` | `469c057263b2f7fdad67c7baeee7289309ac3c192c6bbce4529268f6fb3f2929` |
| APK PokeList 1.3.18 | `9592895ad32169338097535e362185869d86912367f3f9244f85aa8c6f4a912e` |
| APK Data Hub 2.5.3 | `ce7f587fa9d2506049726fb122fb74ef0c209430fc943e6346207c54eea8f9e8` |
| APK PGTools 6.1.1 | `78dd12648c7d2983f3242f25bd8e1656f211bfed818805e879593e207d8fe56f` |
| APK Pokemod Aegis v26073101 | `35e5bdca193fd01fd126c165931e3ecb678ef2b4d93c57c3acde69ce794ffbae` |
| APK Pokemod Atlas v25101101 | `b3331a5b48ec4f870f64084ce0fcc84dacfb78e944f4d0b11cb296e4219ba3bd` |

Nomes de arquivos que dizem “autorizado” são **alegações de autorização de análise**, não evidência de cessão de direitos sobre backend, bibliotecas, imagens e código de fornecedores. Os ZIPs incluem código decompilado e um projeto Kotlin de recriação; não são a implementação original homologada nem contrato de API.

## Resultado da inspeção por aplicativo
### PokeList (`com.antvn.pokelist`)
- APK com 861 entradas, 8 `classes*.dex`, catálogo estático `assets/pokemons.json`, `rocket.json`, `rocketleader.json` e som MP3. Os ZIPs contêm projetos Kotlin de referência, Java decompilado, relatórios e exemplos ilustrativos.
- A documentação descreve filtros Pokémon/IV/nível/stats/forma/tamanho, categorias Raid/Quest/Rocket/Rocket Leader, deduplicação e expiração, perfis e listas; a API relatada é `https://moonani.com/PokeList/api.v2.php` e Firebase `poke-a3aa9`, ambos **terceiros**.
- **Contradição a não assumir:** um documento aponta `distance` sem unidade comprovada, outro o descreve como km; não foram feitas requisições nem validado servidor atual, tipos de payload, quotas ou licença.
- Manifest binário contém nomes de permissões amplas como `QUERY_ALL_PACKAGES`, `ACCESS_BACKGROUND_LOCATION`, `ACCESS_SUPERUSER`, `REQUEST_INSTALL_PACKAGES`. A auditoria anterior indica `debuggable=true`; não reproduzir essa arquitetura. **Nenhum endpoint, Firebase ou recurso do PokeList foi incorporado ao PokeSearch.**

### Data Hub (`net.pgtools.data_hub`)
- APK com 1.045 entradas. `assets/pokemons.json`: **1.025** registros com `id,name,forms`; `raidRatings.json` tem **20** categorias, `maxBattleRatings.json` **9** e `gym_team.json` **4**.
- Isso documenta um **modelo de dados** útil para projetar catálogo original de formas, PvP/Reides/Power Spots; não são 1.025 modelos de **miniaturas do feed** e não há prova de licença redistribuível. Nenhum JSON foi copiado para o PokeSearch.
- O APK usa permissões de overlay/notificação e serviços próprios; nenhuma API pública autorizada foi identificada nesta inspeção.

### PGTools (`net.pgtools.auto`)
- APK com 705 entradas, DEX e `assets/web.zip`. Manifest declara permissões de visibilidade ampla, instalação e notificações; **não** portadas.
- `web.zip` contém conteúdo de interface do fornecedor, não um contrato de exportação para o PokeSearch. Não houve execução de scripts desse pacote, nem uso de API/bridge.

### Pokemod Aegis e Atlas
- Pacotes exatos observados no manifest: `com.pokemod.aegis` e `com.pokemod.atlas`, distintos de `com.pokemod.app.public` (gerenciador da auditoria LT359–361) e de Pokémon GO.
- Aegis e Atlas têm `MappingService`, `BootReceiver` e receivers próprios. Strings citam arquivos de configuração `/data/local/tmp` e mapeamento interno; **não há contrato público de IPC/serviço identificado**. Instalação não comprova execução, mod injetado, compatibilidade de versões nem permissão de usar WebSocket/rotas internas.
- Nenhum root, shell, websocket, injetor, token ou arquivo de configuração privado foi integrado.

## Defeito de compatibilidade real encontrado no PokeSearch LT362
O `PgsAutoClickService.toggle()` e `startWatchOnly()` impediam o perfil **Pokemod** quando não encontravam `com.pokemod.app.public` instalado. Entretanto o usuário pode ter um ambiente com Aegis ou Atlas, e nem mesmo a presença do gerenciador comprova que o mod está realmente ativo. Isso contradiz a independência de clientes definida no projeto. **LT363 removeu essa exigência** preservando as salvaguardas anteriores: seleção explícita de Pokemod, pacote real exato Pokémon GO Play/Galaxy em primeiro plano, modelos exclusivos, segurança manual, Android 11+ e limite/dupla confirmação. `other` segue apenas prévia; nenhum gesto automático liberado por detecção de pacote auxiliar.

## Implementação LT363 em escopo e sob direitos controlados
1. `PgsCompanionPolicy`: inventário original de **oito identificadores exatos** (Play, Galaxy, gerenciador Pokemod, Aegis, Atlas, PokeList, Data Hub, PGTools), sem gerar permissão de API, gesto, root ou prova de cliente ativo.
2. `PgsCompanionDiagnostics`: consulta local de versão/instalação **sob demanda**, com `getPackageInfo` exato, retornando “não detectado”/“consulta indisponível” quando apropriado; versão sanitizada. Manifest adiciona **cinco** `<queries><package .../>` específicos, sem `QUERY_ALL_PACKAGES`.
3. `PgsAutoMenus`: botão pequeno `ⓘ Compatibilidade · diagnóstico` no seletor de cliente já existente, com painel compacto do mesmo estilo oficial, lista rolável, quantidade de favoritos selecionados e modelos **ativos** (não “validados”), status de monitor e botão voltar. Nenhuma ação de outro aplicativo é executada.
4. `PgsWatchSessionDiagnostics`: contagem de leituras, duração, candidatos, confirmações visuais, não confirmados, interrupções e **pedidos** de notificação, somente RAM do serviço e sem guardar screenshots/contas/GPS/tokens. Pedido de notificação nunca é rotulado “entregue”.
5. Corrigidos os dois gates falsos de `com.pokemod.app.public`; o monitor continua separado do Auto Click e as restrições para `other` não mudam.
6. Testes Java de isolamento e temporização, contrato Node sem API privada/root/broad queries, adaptação do contrato LT359, inclusão das políticas puras no gate LT211.

## Não implementado/não comprovado
- Integração ao endpoint PokeList/Firebase/PGTools ou APIs de Aegis/Atlas; requer autorização do titular **específica para serviço**, contrato publicado, quota, 401/403/429, proveniência e monitoramento de compliance.
- Integração de Pokédex/forma proveniente de `Data Hub` no catálogo do PokeSearch; requer direitos e comparação de IDs; `pgs-native/manifest.json` ainda `entries: []` para miniaturas reais de feed.
- Teleporte, GPS falso, injetor, root, WebSocket privado, parsing de notificações privadas de terceiros e automação de `Sou passageiro`; não introduzidos.
- Verificação em aparelho Samsung: Aegis/Atlas efetivamente ativos, versões, observação 1/5/10 espécies, retrato/paisagem, precisão, falsos positivos, TalkBack, CPU/RAM/bateria, notificações reais ou entrega de gesto. **BLOQUEADO até ensaio.**
- Monitor temporário não oferece relatório persistente nem exportação; reiniciar o serviço zera métricas e protege a privacidade.

## ARK e critérios
**Entrada:** LT362 oficial verificada. **IMPLEMENTADO EM BRANCH:** código local e testes; após CI/merge atualizar abaixo com os SHAs efetivos. **TESTADO EM CI:** exige Node, LT169, LT211, LT62, OTA LT173, PGS APK QA e Secure beta/R8 `completed/success` no mesmo SHA. **PUBLICADO:** não alegar LT363 antes de workflow permanente, R8, certificado original e digest público. **BLOQUEADO:** aparelho físico/contrato de APIs/licenças de assets.

Novas ferramentas complementares viáveis para LT364: planejador original de Reides/Max Battles, perfis de busca e histórico local opt-in com expiração/dedup, catálogo de formas com dados legitimamente licenciados, diagnóstico de falhas e banco remoto assinado com revogação. Não confundir design com implementação.
