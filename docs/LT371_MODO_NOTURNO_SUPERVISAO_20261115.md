# LT371 — Modo Noturno: supervisão do Autowalk + Virtual Go Plus (PGSharp)

Data: 15/11/2026. Base LT370 oficial 0.03.66 / versionCode 54573.
**Estado: implementação candidata em branch, NÃO release nem captura própria homologada.**
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

**Publicação:** branch experimental. Próxima versão oficial exige versionCode >54573, certificado original e release pública com hash, além de validação do modo real.
