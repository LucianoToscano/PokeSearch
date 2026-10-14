# GUIA DE TESTE NO SAMSUNG — PokeSearch 0.49-beta

Dispositivo-alvo: Samsung SM-S928B, Android 16. **Checklist ainda não executado em aparelho físico.** Guia v0.48 preservado.

## Preparação
- [ ] Fazer backup antes de substituir APK debug; diferentes chaves de assinatura podem exigir reinstalação.
- [ ] Conceder "Aparecer sobre outros apps" e, para notificações, permitir notificações nas configurações do Android.
- [ ] Nunca compartilhar tokens, cookies, códigos de amizade ou coordenadas pessoais em relatório/captura.

## PS-075 — notificações
- [ ] Favoritos → selecionar Pokemon → alternar opção de som → tocar "🔔 Testar notificação". Verificar ícone monocromático e som.
- [ ] Preferências → alternar "Notificar novos Pokémon encontrados" → alternar "Alertar com som ao encontrar favorito" → tocar "🔔 Testar notificação".
- [ ] Retirar permissão de notificações nas configurações do Android e repetir: deve aparecer Toast informando permissão pendente/bloqueada, sem crash.

## PS-076/077 — OAuth e B06
- [ ] Entrar/vincular → navegar entre páginas Google/Discord/PoGoCoordinates → pressionar Voltar do Android. Havendo histórico, navegar para trás sem fechar a janela.
- [ ] Voltar sem histórico disponível: fechar diálogo normalmente.
- [ ] Repetir LOGIN_BEGIN durante busca AUTO ou manual em andamento, depois LOGIN_END e REFRESH_LOGIN em sequência. Não deve surgir busca de cookies/sessão antigos.
- [ ] Repetir com rede lenta, retornar à Home, carregar novamente; página deve esperar flush dos cookies e novo resultado deve refletir somente a sessão atual.
- [ ] Observar buscas após espera 350ms, 1600ms e 2500ms. LoginEnd não pode disparar pesquisa paralela ao reload onPageFinished.

## PS-078/079/080
- [ ] Aplicar coordenadas de **teste públicas** com sinal explícito +, por exemplo +23.5505, -46.6333 e verificar aceitação, valor e raio correto. Testar latitudes >90 ou longitudes >180 (rejeitadas).
- [ ] Gerar relatório com coordenada de teste positiva; confirmar que aparece '[coordenadas omitidas]' no TXT. **Revisar conteúdo** antes do envio.
- [ ] Abrir menu nos quatro cantos e nos dois lados; ordem deve ajustar sem piscar primeiro para outro lado.
- [ ] Testar IV100 com Raw IV incompleto; aplicativo não deve aceitar como válido.
- [ ] Abrir reportar bug; confirmar aviso "O relatório filtra formatos comuns...".

## onDestroy e estabilidade
- [ ] Ativar/desativar overlay repetidamente com menus e detalhes abertos. Não deve travar nem permanecer janela sobre o jogo após encerrar.
- [ ] Testar 30 minutos de uso com AUTO 5/10/15/20 e favoritos, anotando lentidão, anomalias e eventuais crashes.

Resultado (preencher **após** teste real): ☐ Aprovado ☐ Reprovado ☐ Não testado. Capturas e relatórios devem ser revisados manualmente antes de compartilhar.
