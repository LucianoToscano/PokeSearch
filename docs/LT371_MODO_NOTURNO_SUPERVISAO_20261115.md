# LT371 — Modo Noturno: supervisão do Autowalk + Virtual Go Plus (PGSharp)

Data: 15/11/2026. Base LT370 oficial 0.03.66 / versionCode 54573.
**Estado: LT371 OFICIAL PUBLICADA — PokeSearch 0.03.67 / versionCode 54574 / label 51371. [Release](https://github.com/LucianoToscano/PokeSearch/releases/tag/v0.03.67-54574). Código integrado e 7/7 CI green; captura própria e homologação física NÃO foram concluídas.**
Origem: [Issue #447](https://github.com/LucianoToscano/PokeSearch/issues/447), investigações #162 (PGSharp movimento) e #350 (QA Android).

## Objetivo do usuário

Deixar o telefone e dormir enquanto o personagem anda no **mapa virtual** e o cliente tenta capturar Pokémon, sem executar movimentos manuais a cada encontro. Não é caminhada física.

## Integração suportada neste PR

**PGSharp oficial documenta Autowalk e Virtual Go Plus** (https://www.pgsharp.com/features/). Autowalk executa movimento no cliente; o Virtual Go Plus oferece tentativas de capturar Pokémon e girar PokéStops quando habilitado/conectado, com bolas e espaço. VGP pode depender da edição Standard. A inspeção/ajuda pública não comprova uma API que PokeSearch possa usar para ativar, consultar ou parar esses recursos. **Não inventar API**, não simular como se tivesse capturado, não usar rotinas internas do APK.

- Aba Ação da Central de Busca LT369/370 inclui seção compacta recolhível **☾ Modo noturno · PGSharp**, com duas confirmações que NÃO persistem entre sessões de serviço: Autowalk ligado e Virtual Go Plus conectado. São declarações manuais, **não verificações automáticas**.
- Botão inicia/paralisa **somente supervisão** do PokeSearch (observação local): detecta jogo fora do primeiro plano por duas leituras, avisos humanos/safety, mudança de perfil e concorrência com outros motores; em condição inválida para e gera aviso Android.
- Serviço exige notificações permitidas, PGSharp selecionado, jogo visível e ausência de busca/monitor/sequência/cadastro ativo. Serviço executa um tick de 30s, sem tocar, rotear, mover, simular localização nem abrir outros apps.
- Ao parar a supervisão, **o Autowalk e o Virtual Go Plus NÃO são desligados pelo PokeSearch**. Isso deve aparecer em texto e no aviso; o usuário deve interrompê-los no PGSharp.
- Toque curto da bolha não pode iniciar Auto Hunt/Busca enquanto o monitor noturno estiver ativo; modos existentes podem ser iniciados somente depois de parar a supervisão.
- Pokemod/Outro ficam bloqueados neste protótipo: equivalência de movimentação + autocaptura externa **não foi verificada**, e manager instalado não prova interface ativa. Não alegar paridade.

## Limitações obrigatórias

- Se Android suspender o serviço de Acessibilidade, desligar a tela ou limitar o app, a supervisão pode deixar de funcionar sem alarme; o PokeSearch **não garante funcionamento de madrugada**.
- Sem sensores de inventário/captura, não confirmar Pokébolas disponíveis, Pokémon capturados, rota concluída, Shiny ou conexão VGP.
- Nenhum temporizador promete desligar o PGSharp. Nenhum gesto de confirmação automática em avisos de velocidade, passageiros, conta, login ou segurança.
- Há risco de aquecimento, descarga de bateria, desligamento do app e penalidades da conta do jogo. Recomendar boa ventilação; não deixar carregando coberto.
- Niantic considera aplicativos modificados e localização falsificada violações possíveis: https://niantic.helpshift.com/hc/en/6-pokemon-go/faq/525-violating-the-terms-of-service/

## Próxima fase: movimento/captura próprios

Somente com evidência legal e técnica para cada cliente: classificador de estados visuais do encontro, controle de gestos separado, acesso a movimento em mapa no cliente de forma autorizada, critérios verificáveis de captura e fallback humano. Não copiar injetores do Pokemod/PGTools nem contornar avisos.

## QA

- `PgsNightSupervisorPolicyTest.java` — testes puros da segurança de início e de monitoramento.
- `lt371-night-supervisor-contract.test.js` — valida UI, ACKs, notificações, parada segura, ausência de dispatchGesture/GPS.
- Workflows: PGS Buscas Android QA, core Node/Java, LT169/LT211, OTA, Secure/R8, todos aprovados no mesmo SHA antes de merge.
- Teste físico com **PGSharp Standard**, VGP conectado, AutoWalk andando, alertas críticos e 2h de jogo visível (não afirmar testes físicos se não executados). Verificar Android 11/13/14; Pokemod apenas auditoria futura.

**Publicação:** LT371 confirmada em 15/11/2026 horário de Fortaleza. Próxima versão oficial precisa de versionCode >54574, assinador permanente e QA. A validação física do modo real continua pendente.

## Registro do código LT371 (verificado)

- [PR #448](https://github.com/LucianoToscano/PokeSearch/pull/448) integrada; squash `f86e083b8889f7bca7f2c97abfb8956db8a34b49`; 7 gates green no head `23425a9ec1a36826199fd67ac645edf273eaadb1`: Node #43784223271, LT169 #43784223098, LT211 #43784223089, Java #43784223113, OTA #43784223158, PGS APK QA #43784223154, Secure beta/R8 #43784223188.
- [PR #449](https://github.com/LucianoToscano/PokeSearch/pull/449) integrada, squash `8d7fb07711cc5f614bdf02b68eace0567edf7aa7`, pedido `0.03.67 / 54574 / 51371`. Preflight e gates green; [workflow oficial #43786477267](https://github.com/LucianoToscano/PokeSearch/actions/runs/43786477267) **completed/success**; release pública sem draft/prerelease e APK com digest informado.
- Não existem testes físicos de PGSharp/Pokemod no repositório capazes de provar que Autowalk/VGP realmente se moveram/capturaram. Supervisão não envia comandos ao jogo.

## ARK LT371 — recibo da publicação verificada

- [Release pública v0.03.67-54574](https://github.com/LucianoToscano/PokeSearch/releases/tag/v0.03.67-54574), não draft/prerelease, publicada em **16/11/2026 às 01:33:13 UTC** (15/11/2026 às 22:33:13 em Fortaleza).
- [APK oficial PokeSearch-v0.03.67-LT.apk](https://github.com/LucianoToscano/PokeSearch/releases/download/v0.03.67-54574/PokeSearch-v0.03.67-LT.apk), **61173971 bytes**, SHA-256 `9a65eebd3b92d9973df3ce7db2a3a9d6e6fe1b9f56c9c738c1abbffdbc31be4a` apresentado pela API pública do GitHub, **não** recalculado por download independente.
- [Workflow permanente #43786477267](https://github.com/LucianoToscano/PokeSearch/actions/runs/43786477267) `completed/success`, código `8d7fb07711cc5f614bdf02b68eace0567edf7aa7`; assinador oficial conferido pelo próprio workflow.
- Código [PR #448](https://github.com/LucianoToscano/PokeSearch/pull/448), pedido [PR #449](https://github.com/LucianoToscano/PokeSearch/pull/449), 7 gates da implementação green no mesmo commit. Registro ARK [prompt de continuidade LT372](LT371_PROMPT_CONTINUIDADE_LT372_20261115.md).
- **Não comprovado:** que o aparelho do usuário recebeu a atualização, que o modo permaneceu ativo a noite toda, que VGP realmente capturou Pokémon, que o Pokemod suporte equivalência ou que a supervisão possa desligar Autowalk/VGP. O usuário precisa instalar/confirmar a versão Android e testar fisicamente.
