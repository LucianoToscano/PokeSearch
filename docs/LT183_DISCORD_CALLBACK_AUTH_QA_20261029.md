# LT183 QA — retorno Discord OAuth dentro da Conta 2 (29/10/2026)

## Reavaliação após LT182 oficial
O vídeo original mostra o Discord aceitando a autorização e retornando à área PoGoCoordinates, seguida da tela nativa **Preparando acesso ao PoGoCoordinates…**. A LT182 corrigiu o tratamento do perfil *após* autenticação, porém não impedia que a própria máscara nativa voltasse sobre a resposta do site e ocultasse qualquer erro do provedor. **Não afirmar que OAuth foi concluído apenas porque a Home mostra o provedor salvo.**

## Mudanças propostas
1. O WebView da Conta 1/2 identifica navegação ao domínio do provedor, e ao retornar para o domínio HTTPS oficial PoGoCoordinates **não recoloca a máscara sobre o callback**. Se a autorização falhar, o usuário poderá ver a mensagem oficial.
2. Não navegar automaticamente à rota `/profile` enquanto o retorno de Google/Discord ainda não confirmou sessão; evitar interromper o próprio callback com mudança de página ou abrir novamente o diálogo de login enquanto o site hidrata.
3. O caminho de `Gerenciar / Vincular` deixa de ignorar a confirmação de sessão no retorno do Discord. A prova de login é feita pelo mesmo `probe.js` do login comum, antes de ler os dados de treinador; vinculação oficial continua **manual**.
4. Tratamento de erro da navegação principal HTTP/rede mostra a página e registra **somente classe/código** na auditoria local. Nunca registrar URL de OAuth, cookies, `code`, `state`, JWT, perfil ou dados de treinador.
5. Continuam isoladas as contas WebView e os treinadores VIP de P1/P2; não usar cookies de navegador externo nem inventar OAuth deep link.

## Prova e limites
- `app/tests/lt183-discord-callback-return.test.js` verifica retorno visível, proteção contra navegação prematura, fluxo `manage` com sessão verificada e privacidade de logs. A regressão antiga `overlay-ux.test.js` deixa de exigir a máscara durante o callback.
- Checar Node QA, testes Java/Gradle e Android R8 em GitHub Actions. **Sem execução ao vivo do OAuth** dentro do CI.
- Teste físico obrigatório no Samsung: Conta 1 Google conectada / Conta 2 Discord deslogada; clicar Discord, autorizar, observar se o site retorna e se registra auth. Repetir com Conta 2 já vinculada ou 0/N. Testar `Gerenciar`, fechar, voltar e rede instável, sem cruzar treinadores nem perder Conta 1.
- Caso a página oficial exiba erro do Discord (redirect_uri, 403, 429, antifraude) ou continue sem criar cookie de sessão, o aplicativo **não tem como falsificar a autorização**. Aí é necessária correção no fluxo OAuth do próprio PoGoCoordinates ou callback oficial suportado pelo provedor, sem burlar segurança.
- **Não publicar LT183 para todos sem confirmação de testes e novo APK assinado.** LT182 continua última release oficial até divulgação de resultado.

## Observação de segurança
OAuth de apps nativos deve preferir navegador externo/Custom Tabs, mas **abrir o navegador sozinho não transfere a sessão para os dois perfis WebView**. Não implementar como suposta correção sem um handoff oficial entre PoGoCoordinates e PokeSearch.
