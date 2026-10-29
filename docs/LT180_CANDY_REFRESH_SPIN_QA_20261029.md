# LT180 — Doce Raro: animação real do ↻ (29/10/2026)

## Diagnóstico
Na LT179 pública (0.01.79 / 54384), o botão de atualizar enviava o pedido mas o SVG não tinha nenhuma regra CSS de rotação. O menu também não recebia do Android as mudanças reais de estado (buscando/aguardando).

## Correção na branch
- O SVG de ↻ gira continuamente com CSS `@keyframes candyRefreshSpin` (volta completa em 0,8 s) **somente** quando uma busca oficial está em execução. O pequeno rótulo `1m/3m/5m` permanece estático.
- Toque curto inicia animação visual imediata; serviço Android confirma se realmente iniciou a busca. Consulta automática ou pós-cópia também ativa o giro quando o menu estiver visível.
- Com resultado, erro, expiração, timeout ou rate-limit 429, o indicador para; durante bloqueio ou espera em fila fica discreto/parado, sem simular consulta. Ao retornar a pesquisa permitida, volta a girar.
- Abrir o menu no meio de uma busca sincroniza o estado real; não há spinner infinito por temporizador arbitrário.
- Comunicação limitada ao controle local `file:///android_asset/rare_candy_controls.html`, sem expor JWT, coordenadas sensíveis ou instalar bridge no WebView remoto.
- Preserva layout compacto da Pokébola, gestos de toque/segurar, limites do PoGoCoordinates, dois overlays Pokémon e configuração anterior.

## Testes e distribuição
- Teste `lt180-candy-refresh-animation.test.js`: estados idle/busy/queued/429, clique, parada e pesquisa automática.
- `lt179-candy-refresh-gestures.test.js` adaptado ao novo atributo aria-busy; `lt175-rare-candy-overlay.test.js` preservado.
- Workflow isolado de compilação/assinatura QA `lt180-candy-refresh-spin-signed-qa.yml` em branch `fix/lt180-candy-refresh-spin-20261029`, candidato Android `0.01.80 / 54385`; validar SHA, assinatura v2 e regressões no GitHub Actions.
- **Não publicar diretamente para usuários sem a autorização da nova LT180; GitHub Releases/latest LT179 e ponte Drive inalterados até validação.** Alteração da classe Java exige APK completo assinado, não apenas OTA de HTML.
- QA físico Samsung/Moto: tocar ↻ e ver giro; retomar 1/3/5m e após copiar todos; segurar não inicia consulta; parada em sucesso, erro offline e 429; ausência de interferência em P1/P2.
