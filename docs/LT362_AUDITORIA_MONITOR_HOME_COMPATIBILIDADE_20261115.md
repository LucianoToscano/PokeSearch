# LT362 — Auditoria do monitor passivo, identidade da janela e estado na Home (15/11/2026)

## Base comprovada antes do desenvolvimento
- Repositório: `LucianoToscano/PokeSearch`; main `270b23cce6536bbadeb521771d5e23cb692556bd`.
- Release estável conferida pelo GitHub: `v0.03.57-54564`, versão 0.03.57, code 54564, label 51361, APK público PokeSearch-v0.03.57-LT.apk. Hash oficial anterior segundo documentação e workflow: `c9e253ef6a2c3f3009e03287ea5ba1f3f388c8a97a9fb903543b571ac55efcc0`. Nesta auditoria, não foi realizado novo download físico dos bytes do APK.
- Issue [#350](https://github.com/LucianoToscano/PokeSearch/issues/350) ainda aberta e sem homologação física completa; PR LT350 #385 permanece draft.
- Biblioteca de miniaturas reais do feed `app/src/main/assets/pgs-native/manifest.json`: `entries: []`. Não converter sprites de cards em modelos de feed.

## Defeitos detectados no código LT361
1. **Persistência contraditória do opt-in (P0).** O serviço executava `stopWatchOnly(true)` em `onDestroy()`, apagando a escolha explicitamente ativada. Entretanto `onServiceConnected()` só restaura o monitor se a mesma preferência ainda estiver ativa. Corrigido para `stopWatchOnly(false)` no teardown: cancela callbacks e invalida tickets, sem reautorizar Acessibilidade nem limpar a escolha do usuário. Fechar a bolha, trocar perfil ou desligar explicitamente continua apagando o opt-in.
2. **Janela PGSharp reconhecida por substring (P0).** `isGamePackage` aceitava qualquer pacote contendo o texto `pgsharp` quando perfil PGSharp estava ativo. Isso poderia interpretar outro aplicativo como jogo. Alterado para allowlist estrita `PgsAutoHostPolicy.isGameWindow`, somente `com.nianticlabs.pokemongo` ou `com.nianticlabs.pokemongo.ares`, para PGSharp e Pokemod. O manager `com.pokemod.app.public` nunca é a janela do jogo. Possíveis variantes de package não homologadas são **bloqueadas**, nunca liberadas por substring.
3. **Confirmação de miniatura durante rotação (P1).** Duas capturas em orientações opostas poderiam corresponder se o centro normalizado fosse igual. `PgsAutoWatchPolicy.sameSprite` agora rejeita transição retrato/paisagem entre frames, mantendo redimensionamentos dentro da mesma orientação.
4. **Estado passivo pouco evidente na Home (P1).** Introduzido estado próprio e **somente informativo**, separado de `isSearchActive`, de gesto Android, de teleporte e Shiny. Apresentação compacta sem fundo cinza ao lado da fileira de atalhos. Inclui OFF, observando, favorito visual reconhecido, pausado, modelo ausente e permissão de Acessibilidade; se Android 13+ negar `POST_NOTIFICATIONS`, acrescenta alertas bloqueados. Textos TalkBack e perfil PGS/PM. A Home em primeiro plano suspende naturalmente a captura por não ser a janela do jogo.

## Arquivos da implementação LT362
- `PgsAutoClickService.java`: foreground exato, persistência segura no ciclo de serviço, getter de estado da Home.
- `PgsAutoWatchPolicy.java`: proteção contra rotação durante confirmação.
- `PgsAutoWatchUiPolicy.java`: máquina de estados informativa Java puro, sem permissão para despachar gestos.
- `MainActivity.java`: rótulo compacto independente e descrição TalkBack.
- `app/tests/PgsAutoWatchUiPolicyTest.java`, `PgsAutoWatchPolicyTest.java`, `lt362-watch-home-status-contract.test.js`, atualização do contrato de pacote `lt360-samsung-galaxy-package-contract.test.js` e do QA Core LT211.

## Compatibilidade e limites
- **PGSharp**: duas bordas do feed; somente APK/janela do jogo identificada por pacote exato.
- **Pokemod**: modelo próprio da coluna esquerda por padrão ou direita configurada; manager presente não prova módulo ativo. Não depende de PGSharp instalado.
- **Outros**: prévia apenas; nenhum toque não homologado.
- O monitor permanece **sem gesto**, sem identificação confiável de Shiny, IV ou teleporte. Modelos pessoais mantêm isolamento por cliente; não importar injetor, .so, DEX, sprites, som, token ou biblioteca de terceiros.
- Telemetria local com contagem de rejeições, duração e entrega de alertas, catálogo remoto assinado/antirrollback/revogação e adaptação de novas versões são **propostas, NÃO implementadas** nesta mudança. A nova linha de estado não é telemetria de desempenho.
- Qualquer fonte de miniaturas exige licença de distribuição, hash individual, modelo e versão de origem e prova física por forma/variante; o catálogo atual não tem imagens licenciadas de feed.

## Matriz de aceitação física Samsung — BLOQUEADO até teste real
- [ ] Reiniciar e reconectar serviço de Acessibilidade: opt-in explicitamente ativo preservado, sem autoativação quando desligado.
- [ ] Sair do jogo e abrir Home: estado pausado; testar estado OFF, falta de modelos e sem Acessibilidade.
- [ ] Pokemod realmente ativo no jogo e PGSharp em sessão separada; Google Play e Galaxy Store; sem detecção do gerenciador ou app impostor.
- [ ] 1, 5 e 10 espécies/variantes com duas capturas no feed real, duas bordas PGS, esquerda/direita PM, retrato/paisagem, rotação entre frames e falsos positivos.
- [ ] Ler avisos `Sou passageiro`/conta manualmente e certificar ausência de gestos do monitor.
- [ ] Conferir as notificações permitidas/bloqueadas, Android DND, TalkBack, bateria, CPU, RAM e tempo de detecção com logs e vídeo sem dados pessoais.
- [ ] Confirmar invariantes Pokébolas 1/2, Doce Raro, Edu, contas isoladas, OAuth, filtros, overlay P/M/G, assets Samsung LT357, assinatura permanente, OTA.

## ARK encerrado — evidências da release oficial (15/11/2026)

- **COMPROVADO:** base LT361 0.03.57/54564 e código anterior inspecionados, falhas de opt-in e pacote por substring identificadas. Na primeira rodada de CI a asserção estrutural legada LT359 falhou; teste alterado para impor allowlist exata e os sete gates foram novamente executados no SHA definitivo.
- **IMPLEMENTADO:** [PR #420](https://github.com/LucianoToscano/PokeSearch/pull/420), head `85820923d9c6eeccc4959c095cd685a22c899ae1`, merge squash `043c84356f7f8f53b7a8fc1a809ac4b919b62721`. Código de scanner, estados visuais Java/Home, contratos Java/Node e workflow LT211 integrados à main.
- **TESTADO EM CI:** sete gates no **mesmo SHA** `85820923d9c6eeccc4959c095cd685a22c899ae1`, todos `completed/success`: Node QA [#43689903080](https://github.com/LucianoToscano/PokeSearch/actions/runs/43689903080), LT169 [#43689903103](https://github.com/LucianoToscano/PokeSearch/actions/runs/43689903103), LT211 [#43689903069](https://github.com/LucianoToscano/PokeSearch/actions/runs/43689903069), Java LT62 [#43689903098](https://github.com/LucianoToscano/PokeSearch/actions/runs/43689903098), OTA LT173 [#43689903074](https://github.com/LucianoToscano/PokeSearch/actions/runs/43689903074), PGS APK QA [#43689903130](https://github.com/LucianoToscano/PokeSearch/actions/runs/43689903130) e Secure beta/R8 [#43689903035](https://github.com/LucianoToscano/PokeSearch/actions/runs/43689903035).
- **PEDIDO OFICIAL:** [PR #421](https://github.com/LucianoToscano/PokeSearch/pull/421), head `2ecc7a6375fa2cb19799d72c55a72663857f7319`, squash `4aaaaf441b6c56140edcd38122b86e2855716268`; validações de preflight do publicador, LT169 e Secure beta concluídas em sucesso. Versão solicitada `0.03.58 / code 54565 / label 51362`.
- **PUBLICADO:** release pública estável [v0.03.58-54565](https://github.com/LucianoToscano/PokeSearch/releases/tag/v0.03.58-54565), APK assinado [PokeSearch-v0.03.58-LT.apk](https://github.com/LucianoToscano/PokeSearch/releases/download/v0.03.58-54565/PokeSearch-v0.03.58-LT.apk), **61.139.515 bytes**, SHA-256 do asset publicado `19fcc7b8531509c7d258b593f9a50e7897e21b35d3ac54148fdb07f8d4221e19`. [Workflow permanente #43690440347](https://github.com/LucianoToscano/PokeSearch/actions/runs/43690440347) `completed/success` no SHA `4aaaaf441b6c56140edcd38122b86e2855716268`: preflight e publish, assets, R8, assinatura permanente, verificação APK/signer/hash público, limpeza de segredos; certificado permanente exigido SHA-256 `34766c15d09013ad65873f9976539c8fa2f826e917dae3af57ea628cad689e8e`. O SHA do APK foi lido na API GitHub e confirmado pelo workflow, **sem recálculo de download local independente**.
- **BLOQUEADO:** testes físicos Samsung com Pokemod realmente ativo e PGSharp em sessões separadas, identidade de espécie/forma, precisão/falsos positivos, entrega Android/DND, CPU/RAM/bateria, resposta real de gestos/teleporte e UX P/M/G. Issue #350 registra a matriz física pendente. Catálogo nativo de miniaturas feed ainda `entries: []`; arquitetura remota assinada, telemetria e outras ferramentas são futuros projetos, não recursos de LT362.
- **CONTINUIDADE:** `docs/LT362_PROMPT_CONTINUIDADE_LT363_20261115.md`; iniciar LT363 pela revalidação da nova release, nunca inferir instalação automática do APK no aparelho.

### Próximas áreas de valor complementar
Prioridade P1: diagnóstico local opt-in sem screenshots privados, inventário de modelos por perfil/versão/forma, controle de compatibilidade por build. P2: histórico Pokédex consentido, equipes PvP e calculadora, planejamento de reides, Rocket, Quests, Power Spots e comunidade com dados próprios/autorizados. Não confundir proposta com recurso liberado.
