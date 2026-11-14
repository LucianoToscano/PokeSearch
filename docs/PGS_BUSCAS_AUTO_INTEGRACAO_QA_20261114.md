# PGS Buscas Auto — integração nativa no PokeSearch (QA 14/11/2026)

## Origem auditada e arquitetura
- Repositório principal: `LucianoToscano/PokeSearch`; integração na branch `feature/pgs-buscas-auto-integracao-20261114`, PR #348, derivada da Home LT337 (PR #347).
- Referência de automação: `LucianoToscano/PGSharp-Privado`, branch `feature/auto-favoritos-0.7-pokesearch`, commit `2221bdddab85c01110cc8c8bf380f4810edc881a`.
- Componentes inspecionados: `OverlayService`, `OverlayQuickMenus`, `RareCandyOverlayService`, `PokemonPicker`, `WatchAlerts`, `PokeSoundLibrary`, `PixSupport`, `VerifiedSpriteCache`; da referência: `AutoClickService`, `IconDetector`, `MapReadiness`, `TemplateStore`, `PokeSearchCatalog`, `PokeSearchMenus`, `ShinyListener`.
- APK é o PokeSearch original com mesmo `applicationId`; NÃO há aplicativo PGS independente.

## Código integrado
- Home: botão Buscar Pokémon abre `PgsBuscasPanel` com Buscas/Tempo/Alertas/Mais.
- Catálogo e sprites offline do PokeSearch: busca por nome/número, 50 espécies selecionadas, chips superiores, ordenação de prioridade, remover/limpar e persistência em `pgs_buscas_auto_v1`. Ativação de templates sincronizada com `PgsAutoCatalog`.
- Modelos de ícones pequenos do feed: cadastro pelo usuário via screenshot local, mantendo-os em `pgs_buscas_auto_models_v1`; sem modelo não há clique presumido.
- `PgsAutoClickService`: um serviço novo de Acessibilidade (outros overlays P1/P2/Doce Raro são `Service` comuns); mão OFF/ON/✨/pausa, toque curto, longo, arraste e posição salva. Ícones da mão nesta branch são vetoriais e não cópias binárias exatas do projeto auxiliar (transferência das PNGs originais pendente).
- `PgsAutoIconDetector`: templates em três escalas, correlação local, refinamento e supressão de duplicatas, trabalhando com capturas locais; tenta confirmar mesmo alvo em duas capturas antes de `dispatchGesture`.
- `PgsAutoMapReadiness`: sinais combinados de objetos, bordas, cores e estabilidade; NÃO prova encontro da espécie 3D. Espera por padrão 5 s após evidência, timeout padrão 60 s. Captura pela Acessibilidade exige Android 11+.
- `PgsAutoRetryPolicy`: primeira revarredura após 60 s, segunda ao redor de 120 s desde primeira falha, ciclos configuráveis; lista vazia não gera pausa. Execução continua até desligamento, Shiny ou erro técnico; modo repetição e limite de visitas configuráveis.
- `PgsAutoShinyListener`: intercepta notificações originadas de pacotes PoGo/PGSharp somente após permissão Android, exige indício positivo de Shiny; interrompe a sequência, exibe ✨, notifica, toca som e vibra conforme preferência. Não há classificação visual Shiny; formatos de notificações reais ainda precisam ser validados.
- Menus flutuantes em `PgsAutoMenus`: 44 dp de toque, painel com `OverlayQuickMenus.panelColor`, radius 10 dp, borda 1 dp, controles 6 dp, transparência e tema da preferência real PokeSearch. Som personalizado usa `PokeSoundLibrary`; Doar reutiliza `PixSupport.PAYLOAD` e QR original, Reportar usa `BugReport.export` e sanitização. Nenhuma imagem da tela é enviada.
- Preferências de tempo e áudio isoladas; nenhum favorito, filtro, Pix, conta ou dado das Pokébolas é apagado.

## QA realizado e limites
- Teste puro Java `PgsAutoRetryPolicyTest.java`: atrasos 60/120/120 e ciclos configuráveis.
- Testes de contrato `app/tests/pgs-buscas-contracts.test.js` para manifesto, dados locais, visão e opções.
- Workflow `pgs-buscas-auto-qa.yml`: compilação Android + `testDebugUnitTest`, APK debug, `apksigner`, `aapt`, SHA256 e artefato GitHub.
- Workflow `pgs-buscas-signed-qa.yml`: usa secret privado de assinatura original em ambiente protegido, verifica SHA-256 do certificado, versionCode 54542, não publica release.
- Evidências de QA iniciais: compilações anteriores ao último retoque passaram nos runs GitHub Actions #43568625531 (debug) e #43568619607 (QA assinado). A suíte `QA core LT211` passou no commit `8f8c6297`. Reexecutar para o HEAD final.
- **NÃO TESTADO EM DISPOSITIVO REAL:** identificação dos ícones em diversas colunas, precisão com muitas espécies, teleporte real, mapa com e sem PokéStops/ginásios, permissões Samsung, estabilidade e consumo de CPU, retorno ao jogo, formatos exatos de notificação do PGSharp, áudio e vibração reais, gestos em diferentes DPI. Testes no aparelho são obrigatórios antes de uma versão oficial.
- **Não reivindicar** que artefato QA equivale a instalação, detecção de Shiny visual validada ou publicação oficial. Continuar somente após evidências reais.
- PNGs da mão fornecidas no projeto auxiliar ainda não foram copiadas por limitação de transferência binária do conector; os vetores atuais são substitutos provisórios. Verificar fidelidade antes da homologação final.

## Regras de segurança
- Apenas o aparelho processa screenshots; sem upload, Telemetry ou API para imagens.
- Android pede acesso explícito a Acessibilidade e notificações; falha segura quando screenshot/gesto não funciona.
- Não apagar dados privados do usuário ou instalar outro pacote.
- Não integrar na main nem publicar OTA/release automática antes de validação física e aprovação do APK assinado.

## Publicação verificada — LT337 (14/11/2026)

As observações de “pendente de merge/release” acima eram o estado da branch no momento da integração. **PR #347 e PR #348 foram integradas.** Release oficial estável [0.03.36-54543](https://github.com/LucianoToscano/PokeSearch/releases/tag/v0.03.36-54543), APK de 49.755.526 bytes, SHA-256 `07aa53ed7258826a4b6ba28bdbcc424f648cfa34ceca2729427a9de4fe5e8c1f`, [workflow oficial #43572689788](https://github.com/LucianoToscano/PokeSearch/actions/runs/43572689788) sucesso, fonte exata `82f85f4a68fa2fe2ed9ddfe9f4b868df31a604d0`. A Home verifica a release mais recente do GitHub e pode oferecer a atualização, sujeito a rede, preferências e consentimento Android. Não declarar instalação silenciosa nem homologação do PGS em Samsung; issue [#350](https://github.com/LucianoToscano/PokeSearch/issues/350) permanece aberta para QA funcional e arte da mão.
