# POKESEARCH — ARK LT379 — Prompt Mestre de continuidade

Continue o aplicativo Android PokeSearch sem recriar o projeto ou apagar ferramentas.

## Estado base

- GitHub `LucianoToscano/PokeSearch`, branch principal `main`.
- LT378 código integrado por PR #461 (squash `9d2e06df00033485a9ec865e04e0c367e9059a09`) e pedido de publicação por PR #462 (squash `5aa764a0f330cacc51598ada03cabdc9b65e2b7b`).
- Versão solicitada: `0.03.72`, `versionCode 54579`, label `51378`, tag esperada `v0.03.72-54579`. **Consultar GitHub releases/latest e workflow #43975405288 para confirmar publicação, certificado e SHA-256; jamais presumir sucesso com base no arquivo local.**
- QA de código PR #461 **7/7 SUCCESS** no HEAD `de9663d6859bff0788155efba3feca184001d486`; QA de publicação PR #462 também condicionado aos gates. Fonte do relatório: `docs/LT378_AUDITORIA_HOME_AUTOHUNT_20261116.md`. Preservar PR #457 da Pokédex separada se ainda não mesclada.

## Leitura mandatória antes de qualquer mudança

`AGENTS.md`, `docs/GUIA_MESTRE.md`, `docs/ARK_POLITICA_OBRIGATORIA_MERGE_PUBLICACAO.md`, `docs/LT378_AUDITORIA_HOME_AUTOHUNT_20261116.md`, `docs/LT377_ARK_RELEASE_OFICIAL_20261116.md`, `release/official-request.json`, `app/src/main/assets/release_notes.json` e encerramento oficial LT378, quando existir.

## Prioridades de homologação física

1. Home sem `PGS Monitor: desligado`, sem logo escrita PokeSearch/POKÉMON GO, sem `PoGoCoordinates /search` no rodapé, mas com emblema original, contas P1/P2, botões, relógio, menu, tema, gestos, Pix e administração preservados. Sem linha vazia.
2. Toque no número da versão abre a **release correspondente ao APK instalado**, e nunca um caminho `/search` do provedor. Verificar com rede e sem navegador padrão, TalkBack e Samsung Android 11–14.
3. Auto Hunt / Buscar Pokémon OFF ao abrir app e ao conectar/reconectar Acessibilidade. Nenhuma bolha ou monitor/varredura automática sem toque explícito; permissão recém-habilitada pode consumir token recente de 120 segundos uma única vez. Evitar reativação de `armFromHome` legado. Testar encerramento/reabertura da Home, reboot, orientação, estado no PGSharp e Pokemod em instalações separadas.
4. Perfil Visitante e Contas 1/2 podem buscar sem login; cookies isolados quando MULTI_PROFILE suportado; nome/foto apenas com autenticação comprovada. Retorno Google/Discord e expiração de sessão ainda requerem aparelho físico.
5. Revisitar 16 distâncias/cooldown, Favoritos, Editor Visual 50%/desfoque, Minior Meteor/Core P/M/G, tutorial P1/P2, Busca Inteligente, Sequências/Monitor, Modo Noturno e filtros. Não criar regressões da LT376/LT377.

## Gates e ARK

Executar Node QA, LT169 Node completo, LT211, Java LT62, OTA LT173, PGS APK debug QA, Secure beta/R8, regressões integradas e testes físicos possíveis. Documentar `PASSOU`, `FALHOU` e `PENDENTE` sem inventar evidências.

**ARK = auditar/corrigir + QA aprovado + merge na main + incremento versionCode monotônico + workflow protegido oficial + certificado permanente + SHA-256 + APK público + registro de AGENTS/Guia Mestre + próximo prompt.** Não concluir só com PR, relatório ou APK QA quando a publicação estiver autorizada, mas não contornar gates/assinatura/segredos/restrições. Android exige aceite da instalação. Distinga supervisão do PokeSearch, caminhada externa, tentativa de captura e captura comprovada.

Os próximos desenvolvimentos começam pelo estado efetivo do GitHub, não por uma versão assumida.
