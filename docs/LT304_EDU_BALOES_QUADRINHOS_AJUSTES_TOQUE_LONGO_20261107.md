# LT304 Edu — Balões brancos e ajustes escondidos por toque prolongado
**Data:** 07/11/2026. **Base:** LT304 publicada (0.03.04, versionCode 54510). **Situação:** candidata em branch/PR, sem merge, sem nova Release/OTA e sem QA físico Samsung.

## Pedido visual do proprietário
- O Edu deve conversar usando **balão branco estilo história em quadrinhos**, contorno cinza escuro fino, cantos arredondados e cauda triangular sutil orientada para o mini treinador.
- Remover o fundo glass escuro que ocupava a conversa: painel transparente, cabeçalho claro discreto com arraste e botão fechar, texto preto/cinza sobre branco; botões também claros e legíveis.
- O cabeçalho já identifica "Edu": não repetir **Edu:** em todas as falas renderizadas.
- **Ocultar o botão ⋯ e todos os controles de tamanho/animação/calendário/captura/pausa no fluxo principal.** Permanecem implementados para não perder funcionalidades, mas acessíveis **somente quando o jogador mantém a sprite pressionada por aproximadamente 900 ms**.
- Manter os gestos: **toque curto = abrir/recolher conversa**, **arraste = mover a sprite**, **segurar imóvel = abrir ajustes**. Um toque curto após fechar os ajustes sempre volta ao diálogo normal; não reabrir configurações por acidente.
- Preservar tamanho G=100 pixels físicos para quem não tinha preferência e P/M/G salvos, posições persistidas e as duas Pokébolas/Doce Raro independentes.

## Arquivo e teste
- Implementação isolada em `app/src/main/java/com/lucianotoscano/pokesearchoverlay/RaidDayAssistantOverlayService.java`; sem mudanças em JSON, GPS, backend, filtros, login ou permissão MediaProjection.
- Antirregressão em `app/tests/lt304-edu-conversation-ui.test.js` (balão branco com cauda, fundo transparente, ausência do ⋯, toque longo, toque curto e apresentação de ajustes) e `app/tests/lt304-raid-assistant-icon-guide.test.js` (opacidade legível).

## Checklist pendente no Samsung
- [ ] Toque curto abre/fecha apenas a conversa; botão × não mantém o menu ativo.
- [ ] Toque longo de ~900ms na sprite abre ajustes; não abre durante arraste.
- [ ] Testar personagem G=100px e preferências P/M/G antigas, sem mudar tamanho por engano.
- [ ] Verificar balões brancos em fundo escuro e fundo claro do Pokémon GO, cauda na direção do avatar, texto em português e legibilidade das respostas.
- [ ] Arrastar sprite e cabeçalho perto de bordas, fechar/reabrir app e conferir persistência.
- [ ] Autorizar/cancelar leitura visual e confirmar que nenhum balão impede botão Android; após autorização apenas sprite recolhida.
- [ ] Testar sessões E01–E11, simulação fictícia de hoje, reides extras E10 e coexistência P1/P2/Doce Raro.
- [x] Cinco workflows automatizados `success` no commit `8b6ac3f8783013d68379ae9278f02b8687dd56c8`: Node QA #42405060857, LT169 #42405060922, LT211 #42405060832, Java LT62 #42405060852 e OTA LT173 #42405060949; APK/QA assinada `skipped` por política.
- [ ] **Ensaio físico Samsung ainda pendente antes de homologar.** Passagem de CI não substitui Samsung.

**Governança:** Não fazer merge, criar APK pública nem incrementar versionCode sem aprovação explícita. Em futura publicação, exigir code superior a 54510 e fluxo oficial permanente com a assinatura original.
