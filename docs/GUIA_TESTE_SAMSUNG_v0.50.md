# CENÁRIO DE TESTE — Samsung SM-S928B / PokeSearch v0.50-beta

Dispositivo deste cenário: Samsung SM-S928B / Android 16. **PokeSearch não é exclusivo deste fabricante ou modelo**; matriz geral em `GUIA_COMPATIBILIDADE_ANDROID_v0.50.md`. **Roteiro de teste — ainda não executado no aparelho**. Preservar `GUIA_TESTE_SAMSUNG_v0.49.md` nos documentos históricos.

## PS-081 — permissões
- [ ] Na Home, sem POST_NOTIFICATIONS concedida, tocar "🔔 Testar notificação": confirmar diálogo nativo (requestCode203).
- [ ] Conceder e verificar chegada automática da notificação de teste, sem segundo toque.
- [ ] Negar e verificar Toast explicativo, sem crash.
- [ ] Abrir Favoritos sem permissão e tocar teste: exibir orientação para Home/Configurações, sem tentar pedir permissão do serviço.

## PS-082 — mudanças de preferências sem rede
- [ ] Com overlay aberto e resultados na tela, alterar tamanho P/M/G. Largura e sprites ajustam sem nova consulta.
- [ ] Alterar ordenação Despawn/Rank/IV/Shiny: conferir ordem dos resultados existentes sem atualização externa.
- [ ] Ligar/desligar timers e avisos de novos Pokémon: efeito visual/local sem disparar Search.
- [ ] Alternar som dos favoritos; testar uma notificação com permissão. Fechar o diálogo e confirmar estado persistente.
- [ ] Realizar mudanças com menu expandido/recolhido e verificar que não cobre a engrenagem.

## PS-084/085 — diagnósticos
- [ ] Exportar relatório de teste com fragmentos fictícios `?code=exemplo12345`, `&state=xyz987`, `session_id=abc123` e `discord_token=abc123`; conferir marcadores de credencial omitida.
- [ ] Verificar sempre o TXT antes de compartilhar: a limpeza por padrões não substitui revisão humana.

## B06/OAuth e regressões v0.49
- [ ] Entrar com Google ou Discord no PoGoCoordinates; voltar pelo histórico do WebView; confirmar sessão e Shiny conforme site.
- [ ] Repetir LOGIN_BEGIN/LOGIN_END/REFRESH_LOGIN enquanto AUTO/manual aguarda; rede lenta e serviço reiniciado; verificar ausência de respostas antigas.
- [ ] Testar filtro geográfico 0, 50 e 1000 km com coordenadas públicas, menus em cantos, transparência e favoritos.
- [ ] Usar por 30 minutos e fechar serviço: sem views residuais ou travamentos.

Resultado físico: ☐ aprovado ☐ reprovado ☐ não executado. **Até teste manual, permanece não executado.**

## Verificação complementar de interface e coleta
- [ ] Testar IV100, GL#1 e UL#1 com o site realmente carregado; observar a primeira busca.
- [ ] Confirmar que a opção ✨ solicita autenticação quando necessário e funciona em cada liga após confirmação da sessão.
- [ ] Confirmar que a opção de entrada aparece após abrir o login e que os provedores Google e Discord retornam ao app.
- [ ] Conferir que engrenagem e seta são transparentes, com bom contraste, e que o menu funciona em todos os cantos.
- [ ] Confirmar distância compacta entre menu e Pokémon e ícone de localização alinhado.
- [ ] Selecionar AUTO OFF e observar ausência de atualização periódica; testar atualização manual separadamente.
- [ ] Alternar notificações: desligadas, ligadas e silenciosas; conferir seus efeitos no Android e nos favoritos.
- [ ] Exportar relatório por ⚠ após falhas dos filtros e revisar os dados antes do envio.
