# PokeSearch LT304 v2 — Entrega E1: código de desenvolvimento e QA (07/11/2026)

## Identidade e autorização
- Nome público padronizado: **Assistente do Dia de Reides**, subtítulo **Tutorial “Bug dos Passes”**.
- A especificação principal é `docs/LT304_ESPECIFICACAO_V2_ASSISTENTE_DIA_DE_REIDES.md`, que **substitui a v1**.
- Branch: `feature/lt304-raid-assistant-from-lt303`, PR #300, base LT303.
- **NÃO autorizado:** merge, publicação, release assinado, alteração de assinatura ou deploy OTA. Os fluxos de build genérico e beta podem aparecer como `skipped` por política de PR.
- O método é relato comunitário, não garantia; o app não modifica GPS, não clica no Pokémon GO e não promete passes gratuitos adicionais.

## Mudanças implementadas na branch (candidatas E1)
1. `roteiro_bug_passes.json`: schemaVersion 2, fonte EduhunterPlay (28/10/2026), data de conferência, confiança comunitária não verificada, regiões e coordenadas copiáveis, **11 etapas E01–E11**, pré-condições, falhas, retorno seguro, variante e transições (`repetePara`, `semPassePara`, `pularPara`).
2. `RaidDayGuidePlan.java`: valida o JSON em tempo de carga; quantidade/ordem de etapas, campos obrigatórios, coordenadas, destinos; recusa dados inválidos. Não embute datas nem arrays de textos fixos.
3. `RaidDayAssistantOverlayService.java`: ícone aprovado do usuário em alvo de toque **48dp** e arte **45dp**, janela de sobreposição não-focável com alpha `0.79`; aviso de risco **obrigatório** e versionado antes do primeiro uso do contexto configurado; botões **Entendi, continuar** / **Sair**, **Iniciar roteiro manual**, **Modo Treino**, **Confirmar**, **Voltar**, **Pausar**, **Me perdi** (ajuda simples), **Não aconteceu**, **Repetir ciclo**, **Sem passe → evento**, **Pular Kiribati**, **Encerrar** (duplo toque de confirmação). A marca “Me perdi” desta etapa é orientação curta; diagnóstico amplo pertence à E3.
4. `RaidDayEvent.java`, `RaidDayEventDao.java`, `RaidDayDatabase.java`: **Room 2.6.1** grava sessões reais localmente em ordem de inserção, preservando IDs das etapas realmente confirmadas, horário, ciclos, pausa, fim e origem manual. Ao reiniciar, a UI deriva o progresso pelo replay do log; o histórico não é apagado automaticamente. Migração conservadora de progresso persistido pela versão anterior da PR.
5. **Modo Treino** não escreve eventos reais e, ao sair, restaura a sessão real. O progresso da versão manual sobrevive ao encerramento e retorno do serviço. Não há integração de tela nesta entrega.
6. `res/values/strings_raid_day.xml` iniciou a separação de recursos públicos em português (a tradução completa e internacionalização ficam pendentes); nomes da Home normalizados para “Reides”.
7. Preservados serviços P1/P2/Doce Raro, procura sem login, limites do provedor, certificados e lógica de atualização. Nada de MediaProjection, controle de localização, teleporte ou ações dentro do jogo nesta entrega.

## Evidência automatizada (commit do código antes deste registro)
Commit `95860c81a5d256209ac08ecbfc7810f54d742c74` aprovado em cinco fluxos no GitHub Actions:
- **PokeSearch Node QA (sem APK):** completed/success.
- **PokeSearch LT169 — regressão Node completa antes da release:** completed/success. Teste novo `app/tests/lt304-raid-assistant-icon-guide.test.js` passou após corrigir validação excessiva do comprimento de título.
- **QA core LT211:** completed/success.
- **PokeSearch LT62 Android Java compile (sem APK):** completed/success.
- **LT173 OTA assinado/origem/compilação Android:** completed/success.

As duas execuções anteriores que falharam `lt304-raid-assistant-icon-guide.test.js` foram devidas somente ao teste exigir título com mais de dez caracteres, incompatível com “Preparação” (título legítimo). O teste foi corrigido, com instruções e pré-condições ainda validadas. **Esses resultados são QA automatizado, não homologação física.**

## Pendências de homologação E1
- [ ] **Samsung S24 Ultra físico:** verificar ícone 45/48dp, leitura sobre jogo, bordas do painel, arraste, sobreposição Android 12+, janelas curtas/longas e acessibilidade.
- [ ] Verificar manualmente todos os E01–E11, duas saídas em E07, ausência de loop involuntário, passo opcional E09.
- [ ] Validar tela de risco, aceite por novo evento após a E2 implementar seleção, retomada, histórico Room e Modo Treino em um dispositivo real.
- [ ] Verificar que P1, P2 e Doce Raro funcionam simultaneamente e toques externos atravessam as sobreposições como esperado.
- [ ] Teste de performance do Room em aparelhos modestos: a E1 usa consultas/escritas síncronas e deve permanecer responsiva, podendo migrar para transações assíncronas numa melhoria posterior.
- [ ] Testar desde APK beta não oficial isolada **apenas se houver autorização** e verificar versionCode superior ao instalado, sem substituir assinatura original. Não existe APK oficial desta implementação.
- [ ] Revisar a saída “Sair” e pausa/resumo em caso de serviço encerrado pelo Android; documentar quaisquer ajustes.

## Entregas seguintes (não concluídas)
- **E2:** perguntas iniciais, data do evento, fuso de Brasília e regiões IANA, aviso de relógio, horários, notificações, e aceite de risco realmente individualizado para eventos diferentes.
- **E3:** “Me perdi” completo, recuperação de reide interrompida, histórico navegável, classificação detalhada dos erros e conflitos.
- **E4:** captura opcional por sessão autorizada e detectores PT/EN com evidência; nunca salvar frames.
- **E5:** motor híbrido visão+manual, conflitos e bloqueios de avanços críticos.
- Calendário local e lembretes são preferência discutida antes e documentada na proposta de E2, **não implementados nem incluídos na aceitação de E1**.

## Governança final
A PR #300 deve permanecer **draft/open**. Não mesclar/publicar sem autorização expressa e sem teste físico Samsung; preservar LT303 como versão estável.
