# PokeSearch LT374 — candidata a atualização oficial 0.03.68 (54575)

**Solicitação do usuário (16/11/2026):** tutorial da Pokébola uma única vez entre P1/P2; botão **Pular**; na versão atual de teste, exibir uma última vez para instalações existentes; enviar atualização quando os testes e a assinatura permitirem.

## Regras implementadas
- Os serviços P1 e P2 leem o **mesmo** arquivo `overlay_tutorial_install` e a chave estável `gestureCoachV3PokeballCompleted`. Não renomear nas próximas versões.
- A primeira Pokébola que abrir ensina os gestos reais; a outra não poderá roubar, reiniciar ou duplicar o tutorial ativo. Pular ou concluir marca a preferência compartilhada.
- A chave V3 é nova mesmo para instalações existentes, por decisão expressa para teste; quando concluída, sobrevive a futuras atualizações.
- `Rever tutorial interativo` é manual em Home > Preferências; escolhe apenas um overlay ativo por vez. Doce Raro e Busca Pokémon conservam seus tutoriais independentes de primeiro uso.
- A dica do botão ↻ só avança quando o botão verdadeiro recebe long press, sem mudar intervalo automaticamente, e não altera contas, filtros, modelos ou sequências.

## Matriz de homologação
| Caso | Esperado | Status |
| --- | --- | --- |
| P1 aberta primeiro | Um tutorial, clique para expandir/retrair, long press e ↻ | Contrato automatizado aprovado; aparelho pendente |
| P2 aberta primeiro | Mesmo tutorial, sem P1 simultânea | Contrato automatizado aprovado; aparelho pendente |
| P1+P2 simultâneas | Um único tutorial visível | Teste Java/Node por código; aparelho pendente |
| Pular | Concluir para P1/P2, inclusive na próxima execução | Contrato de persistência por código; aparelho pendente |
| Atualização de instalação existente | Reaparecer uma única vez por chave V3 e não repetir após conclusão | Pendente de teste de instalação |
| Atualização seguinte | Manter chave V3 e não repetir | Pendente de teste de atualização |
| Rever | Replay só após toque explícito do usuário | Contrato por código; aparelho pendente |
| Doce Raro e Busca | Guias independentes mantidos | Contratos existentes; aparelho pendente |
| Segurança | Overlay visual não rouba toque, não simula click | Contratos automatizados; Android 11/13/14 pendente |

**Publicação:** versão solicitada `0.03.68 / 54575`, label 51374, base pública LT371 `0.03.67 / 54574`. O fluxo oficial é disparado somente por pedido validado em `release/official-request.json` após merge à `main`, com keystore permanente, R8, verificação de assinatura, APK e digest SHA-256. Nenhum APK é considerado oficial antes de um Release público verificado. Registrar conclusão dos gates em mesmo SHA, e declarar explicitamente que teste físico no aparelho ainda não ocorreu. Não chamar artefato DEBUG de atualização instalável sobre o APK oficial.
