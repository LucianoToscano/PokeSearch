# PokeSearch — ARK LT373 | Continuidade controlada após LT372 em homologação

Leia `AGENTS.md`, `docs/GUIA_MESTRE.md`, `docs/PADRAO_OFICIAL_OVERLAYS_POKESEARCH.md`, `docs/LT371_MODO_NOTURNO_SUPERVISAO_20261115.md` e `docs/LT372_MODO_NOTURNO_DIAGNOSTICO_ARK_20261116.md` antes de qualquer alteração.

**Base pública comprovada no início da LT372:** LT371, versão 0.03.67 / versionCode 54574 (release `v0.03.67-54574`), certificado permanente, APK oficial público. **Não afirmar que LT372 foi publicada** enquanto não existir release/asset/verificação e evidência física. Branch LT372 `feature/lt372-night-diagnostics-20261116`.

## Continuidade técnica

1. Auditar a PR LT372 e confirmar status atualizado dos 7 workflows no mesmo HEAD. Corrigir falhas antes de qualquer merge. Debug APK do CI não equivale ao assinado oficial.
2. Homologar fisicamente Android 11/13/14 separadamente, com PGSharp e Pokemod nunca misturados, incluindo N01–N12 da auditoria LT372. Evidenciar hora, versão de cada app, estado de Autowalk/VGP, imagens/vídeos consentidos e resultado `PASS / FAIL / BLOQUEADO`.
3. Diferenciar **supervisão ativa**, **caminhada externa observada**, **tentativa de captura observada** e **captura confirmada no jogo**. No código vigente, apenas o primeiro é observável; ACKs manuais não provam os outros. Não criar métricas de captura a partir de gestos, sumiço de sprites ou conexão presumida.
4. Testar privação/revogação de notificações, Acessibilidade, tela bloqueada, bateria, calor, dois ticks sem jogo, avisos passageiros/segurança, rotação, P/M/G, TalkBack e motores concorrentes.
5. Validar interface real de Virtual Go Plus **somente por UI/acessibilidade autorizada**, se existir observação estável e inequívoca; ao contrário deixar `não verificado`. Não usar APIs privadas, injetores, root ou recursos não licenciados.
6. Preservar P1/P2 compactas, Busca Inteligente, modelos separados PGSharp/Pokemod, filtros, sequências, perfis e contas, Doce Raro, OAuth, OTA e assinatura. Não ampliar permissões sem análise específica.

## Regra de publicação

**Não elevar versionCode nem criar request/release/OTA até haver aprovação de testes e APK oficial validado.** Quando todos os critérios forem comprovados, construir sobre versão >54574, verificar 7/7 gates no mesmo SHA, assinatura original, APK não-debug, digest calculado, release pública e aceitação de instalação Android. Um workflow verde é somente prova de build/teste, não de movimento nem captura real. Apêndice no Guia Mestre sem apagar histórico; atualizar AGENTS e produzir novo ARK com links/evidências.

O objetivo de automação noturna só será anunciado como comprovado quando a caminhada e as capturas realmente ocorrerem e houver prova separada do resultado. A supervisão PokeSearch não comanda nem desliga os recursos externos.
