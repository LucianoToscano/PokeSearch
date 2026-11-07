# PokeSearch LT304 — Assistente do Dia de Reides (v2)
**Subtítulo:** Tutorial “Bug dos Passes”  
**Situação:** especificação de implementação — substitui o prompt LT304 v1  
**Idioma:** Português do Brasil em código público, interface e documentação.

## 0. Regras da implementação
1. Leitura obrigatória: `LEIA_PRIMEIRO_PROMPT_OUTRAS_IAS.md`, `AGENTS.md`, `docs/GUIA_MESTRE.md`.
2. Base LT303; continuar sobre PR #300, não recomeçar nem fazer downgrade.
3. Não fazer merge, release, atualizar APK ou assinatura sem autorização expressa; preservar certificado original.
4. Preservar P1/P2, Doce Raro, pesquisas sem login, cap 10 e HTTP 429/Retry-After.
5. Cada entrega E1–E5 exige CI e teste físico Samsung antes de entrar na versão oficial.
6. Não chamar recurso planejado de implementado até existir evidência de código e teste.

## 1. Modificações em relação à v1
- Nome público e termos: **Assistente do Dia de Reides** (não “Raides”); partes do tutorial **Etapas E01–E11**, ciclos de desenvolvimento **Entregas E1–E5**.
- Datas/horas são **D-1/D**, calculadas por evento e fuso, nunca hardcoded no fluxo atual. 30/10 22h Brasília e 31/10 são apenas exemplo passado.
- Roteiro é JSON versionado com fonte, data de verificação, variantes e coordenadas; não arrays de texto Java.
- Aviso de risco obrigatório e versionado; não ocultar que o método pressupõe falsificação de localização e exploração de comportamento do servidor.
- Perguntas de preparação mais completas; event log ordenado; detalhes de Android, QA e escopo proibido.

## 2. Princípios, ética e evidência
Guia/manual de anotações, **não** motor de teleporte, toque ou automação. O método comunitário depende de localização falsificada e resposta não garantida do servidor, pode violar Termos do Pokémon GO e provocar avisos, softban ou banimento. Exibir a cada novo evento uma tela curta, com **“Entendi, continuar”** / **“Sair”**, e registrar texto-versão e data do aceite. Separar `VERIFICADO` (por exemplo, horário corretamente calculado), `RELATO_COMUNIDADE` e `INFORMADO_USUARIO`. Estimativas “15–40” só se explicitamente identificadas como relato de autor; nunca previsão. Não culpar jogador sem evidência.

## 3. Identidade visual
Nome **Assistente do Dia de Reides**; subtítulo *Tutorial “Bug dos Passes”*. Ícone provisório de Passe de Reide laranja/azul informado pelo usuário, mantendo independência de P1/P2/Doce Raro. Arte visual 45 dp; **alvo de toque >=48dp**. Toque abre/recolhe, arraste move, posição salva, janela glass compacta, texto legível. `TYPE_APPLICATION_OVERLAY` não-focável, com opacidade e comportamento de toques que não violem bloqueio Android 12+. Botões por etapa: ✓ Confirmar, Não aconteceu, Voltar, Pausar, Me perdi, Repetir ciclo quando cabível e Encerrar. Verificar no Samsung.

## 4. Roteiro como dados
Arquivo `app/src/main/assets/roteiro_bug_passes.json` (ou equivalente) com id, nome, versão, fonte, URL, data da verificação, confiança, pré-condições, confirmação, saída para falha, retorno seguro e coordenadas de referência.
Variante inicial: **EduhunterPlay — vídeo 28/10/2026**, fonte https://youtu.be/S0cTvtaMim0. Outras fontes (Reddit e tutoriais ingleses) são variantes distintas, não mesclar regras.
- Havaí: `21.2709423,-157.818172`
- Nova Zelândia: `-41.282491,174.769132`
- Kiribati: `1.987149,-157.477137`.

**Etapas da variante inicial:**
- **E01 — Preparação:** verificar evento, horários, passes, condições iniciais, aviso de risco.
- **E02 — Havaí:** tutorial relata fechar e reabrir o jogo na região e caminhar ~1 minuto.
- **E03 — Nova Zelândia:** tutorial relata ir à região e realizar uma reide com Passe Diário gratuito realmente disponível.
- **E04 — Resultado da reide:** distinguir iniciada/vencida/perdida/abandonada; o autor alerta que perdas ou interações diferentes podem invalidar o método.
- **E05 — Retorno ao Havaí:** fechar/reabrir e conferir o mapa, sem automação pelo PokeSearch.
- **E06 — Conferência do passe:** registro do jogador ou sugestão visual da presença de novo passe.
- **E07 — Decisão do ciclo:** **Repetir ciclo** retorna a E02 e soma ciclo; **Sem passe → evento** vai a E08. Nunca laço infinito.
- **E08 — Dia do evento:** conferir janela oficial e passes, jogar normalmente no local selecionado (Central Park, Parque Ibirapuera, Pier 39, Honolulu ou outro).
- **E09 — Kiribati (opcional):** etapa comunitária de fuso adiantado, fechar/abrir e caminhar ~1 minuto.
- **E10 — Retorno ao evento:** voltar ao local do jogo e registrar passes e reides existentes.
- **E11 — Encerramento:** resumo da sessão.
Todas com pré-condições, texto curto, evidências aceitas, ação “Não aconteceu” e retorno seguro. Descrições são **relato comunitário**, não instrução validada pelo servidor.

## 5. Preparação inteligente
Uma pergunta por tela com opções tocáveis, sem solicitar dado que a aplicação já saiba com confiabilidade:
1. Data do evento (evento com programação verificada ou entrada manual **não verificada**).
2. Local onde pretende jogar no dia do evento (vídeo ou outro).
3. Passe diário guardado do dia anterior? Sim / Não / Não sei.
4. Passe gratuito de hoje já coletado? Separado da pergunta anterior.
5. Já fez uma reide hoje?
6. Já começou ou esteve em regiões do roteiro?
7. Algum aviso, restrição ou softban ativo? Registrar apenas resposta, não orientar evasão.
8. Quer modo híbrido (autorização de tela + confirmação manual)? Recomendado, opcional.
Se “não sei” sobre passe, orientar verificar mochila; OCR pode observar presença, não provar sua origem. Resumo antes de iniciar, hora Brasília, etapa correspondente e pendências. **Iniciar roteiro** ou **Modo Treino** sem histórico real.

## 6. Horários e zonas
`java.time.ZoneId` com zonas IANA: `America/Sao_Paulo`, `Pacific/Honolulu`, `Pacific/Auckland`, `Pacific/Kiritimati`. Nunca offsets fixos (NZ tem horário de verão). Data/hora atuais em todas as regiões. Teste de referência: **2026-10-30 22:00 Brasília → 2026-10-30 15:00 Havaí / 2026-10-31 14:00 NZ / 2026-10-31 15:00 Kiritimati**. Janelas por evento: início/fim/fuso/fonte/data de verificação. Estados: antes (quanto falta), dentro (não garante resultado), depois (revisar), não verificado, passado. Alerta se relógio automático do Android desligado. Notificação antes da preparação e da janela com fallback para alarme aproximado sem permissão de exato; sem prometer despertar cronometrado em Doze.

## 7. Confirmações e provas
Níveis `VISUAL_CONFIRMED`, `USER_ATTESTED`, `SUSPECTED`, `UNKNOWN`, com fonte, instante, confiança. ✓ Confirmar registra o evento verificado/atestado e avança conforme pré-condição, não por timer. Discordância visão/jogador mostra pergunta e não substitui silenciosamente. Debounce de duplo toque; persistir cada evento.

## 8. Máquina de estados da reide
Diferenciar lobby, batalha iniciada, vitória, derrota, abandono/interrupção, recompensas, encontro com chefe, captura, fuga e não identificado. Entrar ≠ começar ≠ vencer ≠ capturar. Fuga não é derrota da reide. Após falha/interrupção, orientar revisão; perguntar se venceu/perdeu/saiu quando não houver detecção.

## 9. Leitura de tela (E4/E5)
Opt-in, captura nativa Android `MediaProjection`, compartilhamento de janela Pokémon GO se disponível, **frames processados 100% localmente e nunca salvos/transmitidos**. Reaproveitar infraestrutura do Doce Raro com coordenação única da sessão. Detectores PT-BR/EN: carregamento, mapa, mochila/passe, ginásio, lobby, batalha, vitória/derrota, saída, recompensa, encontro, captura/fuga. Múltiplos quadros concordantes; análise com taxa reduzida apenas com jogo visível. Uma tela jamais prova o estado remoto do servidor. Android 14+: consentimento por sessão e foregroundServiceType mediaProjection; se interromper, voltar ao manual e mostrar aviso. Mudança visual de mapa não garante teleporte reconhecido pelo servidor.

## 10. Registro de eventos e retomada
Armazenamento local com **Room ou DataStore**. Registro ordenado e reexecutável: etapa confirmada, não aconteceu, reide, pausa, retomada, alerta, correção, retorno etc. Estado atual derivado do histórico. Guardar etapa, última confirmação, hora, ciclos, passes (com certeza), modo visual, configurações, posição. Fechar Pokémon GO **não reinicia** roteiro; ao retornar: “Você estava na etapa X de 11. Deseja continuar?”; checar janela, reide interrompida e estados pendentes. Apagar apenas após confirmação explícita.

## 11. Diagnóstico e botão “Me perdi”
Exibir etapa anterior confirmada, pendências, horário e retorno seguro. Permitir Voltar, revisar checkpoint, manter modo manual. Frases neutras: horário não chegou, passe não confirmado, batalha não identificada, tela inesperada, região não confirmada, captura pausada, método pode não estar funcionando. Nunca confundir “erro meu” com “falha do método”.

## 12. Histórico e resumo
Início, evento, etapas confirmadas/pendentes, ciclos, passes observados/informados, reides iniciadas/vencidas/perdidas/interrompidas, capturas, alertas e retomadas. Rotular visual vs declaração do usuário. Exportação opcional como texto simples.

## 13. Requisitos Android
Overlay e foreground service seguindo arquitetura atual. **Room ou DataStore** para o log. Textos em recursos pt-BR (arquitetura extensível a inglês), dados em JSON versionado validado no início. Eficiente em bateria, reconhecimento só em sessão autorizada e com jogo visível. Sem telemetria de frames ou dados privados, nenhum dado sai do aparelho sem ação do usuário. Checar política de loja para recursos relacionados a trapaça; APK direto sujeito a regras do projeto.

## 14. Entregas e critérios de aceite
**E1 — Guia manual:** ícone, JSON de 11 etapas, confirmações, repetição, aviso obrigatório, salvamento, Modo Treino sem gravar histórico. Fechar/abrir app ou jogo preserva etapa, ciclo e posição; clique duplo não duplica.
**E2 — Preparação inteligente:** perguntas, data/evento, fusos, janelas e notificações. Testes com relógio simulado (fuso Brasília/NZ DST), alerta relógio automático desativado.
**E3 — Diagnóstico:** Me perdi, Não aconteceu, Voltar, event log e histórico, sem perda de dados sem confirmação; retomada em reide interrompida.
**E4 — Acompanhamento visual:** captura autorizada, detectores, classificação de evidência; testes com imagens referência, falsos positivos medidos, interrupção volta ao manual.
**E5 — Híbrido:** integração guia+visão, sem avanço crítico automático por OCR, conflitos visão/jogador geram pergunta. 
**Todas:** CI verde, QA físico Samsung e relatório de pendências. **Não mesclar/publicar sem autorização explícita.**

## 15. Fora do escopo
Nada de mudar/simular localização, integrar PGSharp, clicar/automatizar reides ou Pokémon GO, ler memória/servidor do jogo, evitar detecção, contornar restrições, prometer passes/recompensas, modificar Pokébolas/Doce Raro/filtros/ranks/PvP.

## 16. Princípio fundamental
O jogador não precisa memorizar um tutorial complicado. O assistente mostra próxima etapa com base no evento e hora Brasília, acompanha somente com permissão, pergunta quando há dúvida, retoma após interrupções e é transparente sobre incertezas e risco.

## 17. Situação verificada ao receber esta v2
A PR #300 contém o protótipo manual e documentação anterior. O módulo atual **ainda não implementa** E1 v2 integralmente (até que os testes o comprovem), nem E2–E5. Não anunciar como concluídos antes de código, CI e Samsung.
