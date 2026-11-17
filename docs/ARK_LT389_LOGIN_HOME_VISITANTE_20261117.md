# ARK LT389 — Login PoGoCoordinates, Home compacta e busca visitante

Data: 17/11/2026. Base oficial imutável até release: `PokeSearch v0.03.73 LT / 54580`. Branch `fastdev/lt386-guest-error-home-header`, PR [#477](https://github.com/LucianoToscano/PokeSearch/pull/477). Etapas LT386–LT389 em uma única candidata.

## Evidência real enviada pelo proprietário
- Captura do site público: sem login o PoGoCoordinates mostra até **5 resultados**, e o aviso oficial “Showing 5 results — log in to see 10”. Cartão já revelado contém `Open in Maps` e um botão irmão com latitude/longitude; outro cartão pode informar `Rate limited`.
- Captura da Home: dois cartões grandes (Conta 1 desconectada, Conta 2 autenticada) ocupam a maior parte da tela acima do chat. É prova de excesso de espaço e estados separados, **não prova de causa raiz OAuth**.
- Imagens WebP de ícones Login/Perfil e PoGoCoordinates entregues pelo usuário: preservar as artes já instaladas sob `drawable-nodpi`.

## Modificações
1. **Home/contas:** os cartões antigos são `GONE`; o botão PoGoCoordinates do cabeçalho abre um hub nativo compacto com Conta 1, Conta 2 e busca visitante. Cada conta oferece ações explícitas: entrar por Google/Discord, abrir o perfil oficial, atualizar nome/foto ou desconectar somente aquela conta. Sem duplicar cartões.
2. **Login:** no carregamento real de `pogocoordinates.com`, mostrar a página oficial para o toque humano (não ocultá-la sob spinner). O estado de sessão requer comprovação do probe; um redirecionamento Google/Discord, por si só, não autentica. Atrasos/erros são logados por classe/código sanitizado.
3. **Perfil:** preservar nome/foto **últimos verificados** durante a hidratação. Quando há OAuth novo, invalidar a lista e seleção de treinadores antigos **antes** de usar a conta, mesmo enquanto avatar e nome aguardam leitura; substituir somente quando `/profile` confirmar identidade válida. Cache do avatar novo só reaproveitado se corresponder à identidade.
4. **Visitante:** usar pesquisa pública real sem token, exibir `🔒 +5` só se o site confirmar o limite, explicar e ofertar login; copiar exclusivamente coordenadas reveladas no cartão correto. Mostrar descrição do erro ao tocar em `!`, preservando `429` e as restrições do provedor.
5. **FastDev:** os quatro segredos não são copiados, recriados ou alterados no código. O workflow continua exigindo o environment protegido `fastdev-signing`.

## Verificações antes de declarar oficial
- Contratos Node, LT169, LT211, Java LT62, LT173, FastDev smoke, PGS QA, beta/R8 e demais gates.
- Testes físicos pendentes: Android 11–14 (especialmente Samsung), Google/Discord reais + MFA, abrir/cancelar/repetir, cache e cookies de P1/P2, perfil sem treinador, troca de conta, foto Google/Discord e falha de rede, rate limit, resultados reais 5/10, copiar coordenadas reveladas, erro `!`, contraste do hub, toque em ícones.
- Merge somente depois de checks verdes; versão monotônica com `release/official-request.json`, notas internas e workflow de assinatura permanente; conferir SHA, hash, tamanho e asset público. Nunca confundir compilação com homologação física ou release publicada.

## Limite conhecido
Google pode rejeitar OAuth em Android WebView; abrir o navegador externo não transfere a sessão automaticamente. Não falsificar User-Agent, tokens ou cookies para simular login. Uma integração por navegador externo somente pode retornar ao app caso o site ofereça callback autorizado e comprovado.

## Continuidade
Se o CI passar, concluir o ARK solicitado: merge PR #477, gerar request da próxima versão, submeter nova PR de versão, passar gates, publicar via workflow protegido, verificar APK público, atualizar Guia Mestre/AGENTS e entregar link. Se algum gate falhar, registrar o erro preciso sem declarar publicação.
