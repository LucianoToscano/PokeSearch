# PokeSearch — LT372 | Auditoria de evidências do Modo Noturno
Data: 16/11/2026 (America/Fortaleza). **Estado: branch de QA, NÃO oficial, NÃO homologada em Android físico.**
Base verificada: LT371 0.03.67 / versionCode 54574 / label 51371; release pública `v0.03.67-54574` (61.173.971 bytes), SHA-256 informado pela API GitHub `9a65eebd3b92d9973df3ce7db2a3a9d6e6fe1b9f56c9c738c1abbffdbc31be4a`. Não foi calculado hash local independente do APK nem feita instalação.

## Fonte de verdade
Inspecionados `AGENTS.md`, `docs/GUIA_MESTRE.md`, `docs/LT371_MODO_NOTURNO_SUPERVISAO_20261115.md`, `docs/LT371_PROMPT_CONTINUIDADE_LT372_20261115.md`, `docs/LT370_DRIVE_PGTOOLS_PAS_PAC_AUDITORIA_20261115.md`, política de overlays e Java/Node existentes. LT371 controla SOMENTE supervisão local; Autowalk e Virtual Go Plus ficam no PGSharp. O PokeSearch não inicia caminhada, não conecta VGP, não arremessa bolas nem confirma captura. Pokemod não possui provedor externo noturno homologado.

## Diagnóstico de bugs/gaps
- O supervisor LT371 só verificava permissão de notificações ao iniciar; a permissão podia ser revogada DURANTE a sessão sem parar a supervisão. **Correção LT372 em QA:** nova decisão `STOP_NOTIFICATIONS` na política e verificação em cada tick.
- `onInterrupt()` não encerrava a supervisão; a UI poderia continuar indicando supervisão ativa mesmo após sinal de interrupção de Acessibilidade. **Correção LT372 em QA:** parar supervisão e manter razão categórica legível.
- O estado lunar sozinho não distinguia heartbeat, movimento externo declarado/observado, tentativa de captura e captura confirmada. **Correção LT372 em QA:** `PgsNightSessionDiagnostics` em RAM com duração, leituras, jogo visível/ausente, sequências de ausência, idade da última leitura, notificações permitidas vs entrega não comprovada, motivo da última parada.
- **Lacuna deliberadamente preservada:** não existe acesso confiável à conexão real do VGP, estado de movimento, estoque de Pokébolas, tentativa nem confirmação de captura. Nunca promover confirmação manual ou tick a observação do jogo.
- PGSharp vs Pokemod: `PgsAutoHostPolicy` valida pacotes oficiais do jogo, NÃO identifica mod em execução pelo nome do manager; seleção isolada de modelos não comprova host. `pgs-native/manifest.json` ainda requer miniaturas de feed autorizadas para paridade real.

## Modelo explícito de evidência
| Dimensão | Sinal que LT372 conhece | Estado exibido | Prova que ainda falta |
|---|---|---|---|
| Supervisão PokeSearch | Serviço ativo + timer/check executado | ATIVA / INATIVA | Teste de continuidade em aparelho |
| Jogo em primeiro plano | Leitura de janela acessível do pacote oficial do jogo | Amostras visíveis / ausentes | Confirmação física tela acesa/bloqueada |
| Autowalk PGSharp | Confirmação manual na UI | Caminhada externa NÃO CONFIRMADA | Observar personagem se deslocar em sessão autorizada |
| Virtual Go Plus | Confirmação manual na UI | Tentativa de captura NÃO OBSERVADA | Observar aviso inequívoco de tentativa no jogo |
| Pokémon capturado | Nenhum comprovante automático | Captura no jogo NÃO CONFIRMADA | Evidência do inventário/registro nativo do jogo |
| Alerta Android | `areNotificationsEnabled()` | Permitidas / não confirmadas; entrega não comprovada | Ver notificação chegando no aparelho |

## Implementação QA
- Novo `PgsNightSessionDiagnostics.java` sem dependência Android, estado só em memória e contadores com limite; nenhuma screenshot, nome de conta, texto, GPS ou tokens.
- `PgsAutoClickService`: inicia, amostra e encerra diagnóstico, avisa sobre perda de notificações, pára supervisão em `onInterrupt`; não altera Autowalk/VGP.
- `PgsNightSupervisorPolicy`: `STOP_NOTIFICATIONS` e overload compatível com testes LT371 existentes.
- `PgsAutoMenus`: apresenta o diagnóstico no `ScrollView` já existente da seção noturna, sem nova bolha/toolbar, sem aumentar geometria fixa do popup.
- Regressões Java `PgsNightSessionDiagnosticsTest` e `PgsNightSupervisorPolicyTest` e Node `lt372-night-evidence-contract.test.js`, integradas ao workflow `pgs-buscas-auto-qa.yml`.
- Preservados P1/P2, Doce Raro, Central de Busca, modelos por host, sequências, filtros, contas e assinatura. Não introduz root, API privada, injetor, GPS falso ou permissões novas.

## Evidências e matriz de aceitação (não extrapolar)
| Caso | Expectativa | Estado nesta etapa |
|---|---|---|
| T01 | Relatório inicia sem alegar caminhada/captura | PASSOU em Java isolado |
| T02 | Tick não comprova captura/tentativa/movimento | PASSOU em Java isolado |
| T03 | 2 amostras sem jogo param supervisor | PASSOU por política Java isolada |
| T04 | Notificações revogadas após início param monitor | PASSOU por política Java isolada; Android BLOQUEADO |
| T05 | `onInterrupt()` encerra supervisor | Código alterado; Android BLOQUEADO |
| T06 | Texto arbitrário não é registrado no resumo | PASSOU em Java isolado |
| T07 | Alterar perfil para Pokemod interrompe supervisão PGSharp | PASSOU por política Java isolada; Android BLOQUEADO |
| T08 | PGSharp Autowalk move personagem no mapa | BLOQUEADO: sem aparelho/evidência |
| T09 | VGP realmente conectado e tenta pegar Pokémon | BLOQUEADO: sem aparelho/evidência |
| T10 | Captura confirmada pelo jogo/inventário | BLOQUEADO: sem aparelho/evidência |
| T11 | PGSharp/Pokemod isolados e modelos reais de feed | BLOQUEADO: sem aparelho/evidência |
| T12 | Android 11/13/14, tela acesa/bloqueada, bateria, DND | BLOQUEADO: sem aparelho/evidência |
| T13 | TalkBack, rotação, P/M/G e opacidade compacta | BLOQUEADO: sem captura física |
| T14 | Aviso de passageiro/segurança requer humano | Preservado em código; Android BLOQUEADO |
| T15 | 7/7 gates em um SHA e beta R8 assinado | PENDENTE após push/PR |
| T16 | Atualização pública com APK hash + signer | NÃO AUTORIZADA enquanto físico pendente |

**Teste local realizado:** `javac`/Java 17 para política pura e diagnóstico puro, ambos PASS; não é compilação Android completa, não prova UI real. O teste Java de diagnóstico inclui 13 verificações, embora o primeiro log local rotulasse 12/12; saída corrigida para 13/13 na branch.

## Bloqueios de publicação
Sem laboratório Android físico autorizado, não existem evidências de Autowalk, VGP, Shiny, captura, tela bloqueada, bateria, interação com Pokemod ou entrega de notificações. Não gerar request oficial monotônico, merge nem Release. O versionCode oficial permanece 54574; a próxima eventual publicação exige code >54574, 7/7 gates no mesmo SHA, inspeção APK e certificado permanente SHA-256 `34766c15d09013ad65873f9976539c8fa2f826e917dae3af57ea628cad689e8e` e aprovação física. 
