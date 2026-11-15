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

## Estados da entrega
- **COMPROVADO:** baseline main/release, código anterior e defeitos identificados via GitHub.
- **IMPLEMENTADO EM BRANCH:** mudanças descritas; não equivalem a integração na main.
- **TESTADO EM CI:** pendente do SHA exato da PR, sete gates obrigatórios.
- **PUBLICADO:** nenhuma nova release LT362 comprovada neste relatório inicial; permanece LT361 oficial.
- **BLOQUEADO:** Samsung físico, mod efetivamente ativo, modelos de feed legítimos para todas as espécies, catálogo OTA assinado e medição prática de precisão/performance.

### Próximas áreas de valor complementar
Prioridade P1: diagnóstico local opt-in sem screenshots privados, inventário de modelos por perfil/versão/forma, controle de compatibilidade por build. P2: histórico Pokédex consentido, equipes PvP e calculadora, planejamento de reides, Rocket, Quests, Power Spots e comunidade com dados próprios/autorizados. Não confundir proposta com recurso liberado.
