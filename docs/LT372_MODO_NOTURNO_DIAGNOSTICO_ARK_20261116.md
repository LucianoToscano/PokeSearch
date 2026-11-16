# PokeSearch LT372 — auditoria e ARK de diagnóstico do Modo Noturno

**Data:** 16/11/2026 (America/Fortaleza). **Base imutável:** LT371 oficial, 0.03.67 / versionCode 54574 / label 51371, release [v0.03.67-54574](https://github.com/LucianoToscano/PokeSearch/releases/tag/v0.03.67-54574), workflow [#43786477267](https://github.com/LucianoToscano/PokeSearch/actions/runs/43786477267). A fonte atual é a branch `feature/lt372-night-diagnostics-20261116`. **Isto não constitui uma versão LT372 publicada.**

## Achados e correções no código

1. **Revogação de notificações após iniciar:** a LT371 conferia `areNotificationsEnabled()` somente no início; a LT372 também reavalia em cada tick e encerra o supervisor com `STOP_NOTIFICATIONS` se a permissão deixar de existir. O alerta pode não chegar caso notificações estejam bloqueadas; não prometer entrega.
2. **Interrupção de Acessibilidade:** `onInterrupt()` interrompe explicitamente a supervisão; antes interrompia só as sequências. Não confundir serviço ativo com capacidade contínua de observação sob tela bloqueada.
3. **Proveniência de evidência:** `PgsNightSessionDiagnostics` mantém apenas memória local de início, leituras, ausência do jogo, avisos, última leitura e motivo de parada; sinaliza amostras atrasadas. Zera as métricas a cada início. Não grava dados, coordenadas nem contagens de captura.
4. **Quatro categorias distintas:** `Supervisão` = ticker do PokeSearch; `Caminhada externa` = confirmação manual de configuração, movimento não observado; `Tentativa de captura` = não observada mesmo quando VGP foi declarado; `Captura confirmada` = nenhuma evidência observada no jogo. Nenhuma resposta de Acessibilidade, notificação habilitada, intenção de usuário ou aviso genérico converte uma categoria em outra.
5. **UI compacta e perfis:** o painel Ação mantém o Modo Noturno no modo simples e avançado, sem nova bolha nem alteração da geometria canônica das Pokébolas P1/P2. Dois ACKs permanecem manuais; são passados ao serviço e exigidos também na validação interna. Enquanto ativo não podem ser editados; após parada observada pelo menu precisam ser informados novamente. Pokemod/Outro não ganham um provedor noturno sem prova.
6. **Execução sem sobreposição:** continua proibido iniciar gestos, sequências, Auto Hunt ou Busca Inteligente ao mesmo tempo que a supervisão. Parar a supervisão **não** desliga Autowalk nem VGP no cliente externo.

## Limites de compatibilidade

- PGSharp: supervisão local somente-leitura de jogo em primeiro plano, avisos e motor concorrente. **Sem API pública verificada** para consultar conexão efetiva de Virtual Go Plus, movimento, inventário de bolas, tentativa de captura ou sucesso no Pokémon GO.
- Pokemod: seleção de perfil/modelos/telas existentes permanece preservada, porém caminhada e captura externa comparáveis **não estão homologadas**. APK do manager instalado não prova host ativo. Não copiar injetores, rotina root, API privada ou recursos de terceiros.
- Android: `onInterrupt`, tela bloqueada, economia de energia, perda de notificações, atualização de app e ausência de Acessibilidade podem interromper a observação. Se o Android suspender totalmente o processo, o PokeSearch pode não ter oportunidade de notificar a parada. Indicador atrasado é **diagnóstico quando o menu é consultado**, não vigilância ininterrupta.

## Regra de evidência e critérios de aceite

| Dimensão | Evidência admissível | NÃO basta |
| --- | --- | --- |
| Supervisão ativa | estado do serviço + leitura periódica com hora | ícone lunar isolado |
| Caminhada externa | gravação de movimento realmente visível no mapa virtual e contexto do cliente, auditada por humano | checkbox "já liguei" |
| Tentativa de captura | fluxo do cliente externo mostrando tentativa/resultado da interação | Virtual Go Plus declarado conectado |
| Captura confirmada | registro inequívoco do jogo, inventário/diário ou tela de captura, associado ao caso testado | toque, gesto, notificação genérica, Pokémon sumiu |

**O PokeSearch LT372 não cria os sensores exigidos para promover caminhada/tentativa/captura a "observada/confirmada"; os três estados são intencionalmente não verificados.** Uma homologação externa futura deve registrar evidência caso a caso, sem inferência automática.

## Matriz de homologação física (P0, ainda BLOQUEADA)

Para **cada** Android 11, 13 e 14, registrar modelo, build Android, perfil do host e versão PGSharp/Pokemod **isoladamente**, hora e resultado `PASS / FAIL / BLOQUEADO`:

| ID | Cenário | Esperado |
| --- | --- | --- |
| N01 | PGSharp, Autowalk + VGP realmente configurados, jogo aberto | supervisão pode iniciar; só execução externa move/captura |
| N02 | Tela acesa por 10 min e 2 h | leituras/avisos, bateria/temperatura e interrupções documentadas |
| N03 | Tela bloqueada, segundo plano, modo economia | estado e suspensão registrados, sem promessa de vigilância |
| N04 | Revogar permissão de notificações durante a sessão | parada segura ao próximo tick executado, sem promessa de alerta entregue |
| N05 | Interromper Acessibilidade e fechar serviço | estado noturno encerrado no callback quando entregue |
| N06 | Passageiro/segurança/conta/login/velocidade | parar e exigir intervenção humana, sem tocar nas confirmações |
| N07 | Outro motor, sequência ou perfil em andamento | sem concorrência e sem toque duplo |
| N08 | Desconectar VGP, zerar bolas, mochila cheia | exibir **não verificado** se não houver observação inequívoca |
| N09 | Caminhada observada, tentativa visível, captura no diário | registrar três evidências separadas, sem inventar total |
| N10 | Pokemod isolado, sem PGSharp | somente recurso documentado/validado; sem paridade automática |
| N11 | Rotação, P/M/G, TalkBack, janelas, contraste | geometria P1/P2 preservada e diagnóstico legível |
| N12 | Parar supervisão no overlay | PGSharp Autowalk/VGP **não** são desligados pelo PokeSearch |

**Estado N01–N12 em 16/11/2026: BLOQUEADO, sem aparelhos/sessões/capturas de tela homologados nesta execução.** Não transformar CI em teste físico.

## Testes automatizados e aprovação de release

- `app/tests/PgsNightSessionDiagnosticsTest.java`: início, reset de sessão, atraso, leitura, contagem de ausências/avisos, motivo da parada e negação de confirmação de captura.
- `app/tests/PgsNightSupervisorPolicyTest.java`: `STOP_NOTIFICATIONS` e decisões de segurança anteriores.
- `app/tests/lt372-night-diagnostics-contract.test.js`: ACKs, inclusão do modo nos dois níveis, serviço sem gestos, sem confirmação falsa e parada por interrupção.
- `app/tests/lt371-night-supervisor-contract.test.js`: contrato legado mantido com a assinatura atualizada.
- `.github/workflows/pgs-buscas-auto-qa.yml`: inclui novas classes/contratos e compila APK **debug QA**, que não substitui o APK oficial assinado.

**Gate de publicação:** antes de merge/release exigir 7/7 workflows `completed/success` no **mesmo commit**, sem exceções; homologação N01–N12 com evidências; aprovação do APK assinado com certificado permanente SHA-256 `34766c15d09013ad65873f9976539c8fa2f826e917dae3af57ea628cad689e8e`, versionCode >54574, R8 e hash SHA-256 independente. Sem esses requisitos, **não criar release nem request OTA**.

## ARK LT372 — status

- Código em branch/PR de validação, não publicado, base LT371 oficial preservada.
- Aprovação de CI e QA físico **dependem dos registros verificáveis nesta PR**; preencher URLs e SHAs somente após execução, sem presumir resultados.
- Próxima continuidade: [LT373](LT372_PROMPT_CONTINUIDADE_LT373_20261116.md).
