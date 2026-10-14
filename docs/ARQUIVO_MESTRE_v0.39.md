# POKESEARCH — ARQUIVO MESTRE v0.39-beta
**Revisão:** 14/10/2026 • Projeto Android independente • PokeSearch • branch main
**Repositório de referência:** https://github.com/LucianoToscano/PokeSearch

## Fonte de verdade e versões
- Versão do código: `versionCode=39`, `versionName=0.39-beta` (Android 8.0+); pacote `com.lucianotoscano.pokesearch`.
- Mestre anterior: `docs/ARQUIVO_MESTRE_v0.38.md`, e histórico v0.36 no Google Drive. Não modificar o projeto PvPPokeGo.
- A cada entrega, conferir HEAD, Actions verde, teste de JS, Android lint/compile, zip e assinatura.
- APK do CI continua assinado por chave debug temporária: **somente beta para testes privados**. Atualizações sobre instalações anteriores podem falhar por assinaturas diferentes; salvar dados antes.

## Correções v0.39 motivadas por capturas do usuário
1. Site com ✨ desligado consegue consultar normalmente IV100 e GL#1. O antigo overlay mostrava `!` sem dados — não confundir falha do parser com ausência de spawns.
2. `probe.js`: escolha preferencial de filtro de IV percentual na página, dois campos min/max ambos 100, como nas capturas reais. Fallback Raw IV com 3 ou 6 campos, somente dentro do grupo IV. Não tocar CP/Level por engano.
3. `verifyShiny`: sem opt-in não exige vínculo do treinador; aceita filtro visualmente desligado ou controle não identificado, mas nunca aceita Shiny comprovadamente ON na busca comum.
4. PvP: o site determina Top ranking 1, League (Great/Ultra) e Include previous evolutions em campos do FORM; cada cartão não necessariamente repete Rank 1. Quando os três campos são comprovados, o parser aceita os cartões e anota `rankSource=verified-site-filter` para rastreabilidade. Não infere rank1 se formulário não foi validado.
5. `collect` compara contador público "Showing N spawns" contra número de cartões identificados; se houver resultados no site mas nenhum no parser, exibe erro específico.
6. `OverlayService`: quando site retorna Pokémon fora de critério, explica divergência; não substitui por falsos resultados. Toque no ! continua mostrando o status, e botão ⚠ permite exportar registro TXT.
7. `app/tests/probe-smoke.test.js`: testes Shiny OFF com formulário de vínculo visível, IV percentual 100/100, GL#1 sem rank explícito no cartão e recusa quando liga está incorreta.
8. Mantidos os recursos do v0.38: login WebView com teclado e overlay recolhido, refresh após login, botão ⚠ reportar erro via TXT/WhatsApp fornecido, intervalos AUTO 5/10/15/20m e mínimo 60 segundos entre buscas enviadas, histórico limitado/redigido e ícone redondo.

## Estado e validações
- Testes de unidade simulam o contrato HTML; não equivalem a testar DOM real em conta autenticada.
- Teste no Samsung ainda **pendente**: IV100 com Shiny OFF, GL/UL, Shiny ON com treinador vinculado, teclado e ações do overlay.
- Consultas usam a sessão autenticada do PoGoCoordinates sem invasão nem tentativa de contornar limites. Usuário informou ter autorização para uso privado entre amigos desenvolvedores.
- Permissão de uso da API e eventuais restrições permanecem responsabilidade do operador.
- Futuros aperfeiçoamentos: assinatura persistente de distribuição, editor de favoritos dentro do próprio overlay, teste automatizado com HTML real obtido de forma autorizada.

## Procedimento de investigação no aparelho
- Instalar o APK beta. Ativar ✨ OFF e modo 100%.
- Se aparecer `!`, tocar no símbolo para ver o motivo; usar ⚠ > Exportar TXT; nunca compartilhar cookies, senhas ou código de amizade.
- Enviar trecho de erro e screenshot com dados sensíveis ocultos, para corrigir o seletor real.
- Conferir também GL#1 com ranking confirmado e ao menos dois cartões de resultados.

**Não publicar o aplicativo como produto final sem assinatura e teste real.**
