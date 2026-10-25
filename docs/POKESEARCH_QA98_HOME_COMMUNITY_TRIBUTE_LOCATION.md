# QA 0.00.98 — Mural na Home, Localização, Homenagem e Missão

Data: 25/10/2026 · Nova branch derivada da PR #64 (que deriva da PR #63): `feature/pokesearch-home-scrapbook-thanks-qa98-20261025`. PR separada, sem merge ou Release.

## Home, Scrapbook e publicação
- Nenhuma Activity adicional: todo o mural é expandido/recolhido dentro da Home, com feed único, filtro de Recados/Sugestões/Bugs/Dicas e editor de recado (300 caracteres); botão do menu Home rola até o mural e expande a área.
- Preview do mural: três recados sintéticos amigáveis de exemplos, explicitamente rotulados **EXEMPLOS FICTÍCIOS**. Não são postagens reais nem atribuídas a pessoas identificáveis.
- Autenticação anônima própria do FirebaseStats, dados sem Pokémon GO, treinos, sessões de site, cookies ou coordenadas. Regras locais propostas: apenas posts de criação direta, sem edição pelo cliente, e respostas diretas em `scrapbook/replies`. Curtir 1 vez/UID, denúncias privadas, sem feed administrativo no app.
- **Chave de emergência e regras:** `scrapbook/config/allowDirectPosts` é somente administrável pelo servidor. Sem regras implantadas e flag=true, app mostra bloqueio, não finge envio. Configuração da instância no Firebase Console/Admin SDK, App Check e emulador ainda necessárias. Usuário decidiu acompanhar posts manualmente, sem aprovação prévia; risco de spam por múltiplos UIDs anônimos permanece. O contador `stats` não é modificado.

## Janela Localização
- Recuperada proporção aprox. 286dp, conteúdo e título centrais, campo largo de coordenadas, Copiar ao lado de Colar, número km e slider; botões nomeados Aplicar e Limpar visíveis na linha inferior, cortando apenas espaços vazios laterais.
- Backend Native de localização e todas preferências, limites (0–1000 km), API/DOM e demais filtros preservados.

## Homenagem
- Assets binários EXATOS do Google Drive: `PokeSearch_Agradecimento_Comunidade.webp` e `PokeSearch_Agradecimento_Miniatura.webp`, incorporados em `drawable-nodpi`, hashes SHA-256 no `app/tests/tribute-inline-qa98.test.js`.
- O PNG original permanece intacto no Drive, fora do APK para evitar aumento.
- Cartão 💙 Agradecimentos após o card de atualizações, antes das estatísticas, temas claro/escuro; menu lateral abre mesma apresentação no **overlay da Home**.
- Imagem completa offline FIT_CENTER, pinça até 4x, arrastar, botão Ajustar imagem, voltar/X e compartilhar via FileProvider (cache tribute, leitura temporária).

## Missão especial
- Primeiro lançamento genuinamente novo marca pendência da missão e oferece a missão uma única vez após dispensar o guia de início; não abre Pix e não atrapalha outras intents.
- Ciclos posteriores reduzidos de 10 aberturas e 100 minutos para **3 aberturas e 10 minutos ativos**; cooldown existente de 15 dias, pesos e histórico preservados. Usuários antigos não recebem popup como nova instalação.

## Proteção/QA
- Versão candidata **0.00.98/versionCode 54301**, workflow de QA com assinatura persistente, R8 e hash. Condicionais de mural online não se ativam em Release pública normal.
- Imagens já fazem parte do APK QA, sem exibir/alterar usuário, localização, IV, GL/UL, WebView, overlay, sons ou FirebaseStats.
- Testar no Samsung: UI e acessibilidade de Home completa, login/overlay, cada categoria, postar/responder de verdade apenas após deploy de regras e ativação da flag; janela localização, copiar/colar com Gboard, compartilhar homenagem, zoom/panorâmica, troca de tema, primeira execução limpa/upgrade e preferências mantidas.
- Passes CI não substituem Samsung nem Firebase Rules Emulator. Não publicar versão oficial, não alterar APK compartilhado no Drive, não fazer merge.

### Resultado técnico QA 0.00.98 — confirmado 25/10/2026
- [Actions #40194558819](https://github.com/LucianoToscano/PokeSearch/actions/runs/40194558819) **SUCCESS**: Node regressões, Java compilação/testes, R8/ProGuard, assembleRelease, verificação de assinatura e empacotamento.
- APK: `PokeSearch-v0.00.98-LT-Community-Home-Thanks-Location-QA.apk`, 39.202.565 bytes, versão `0.00.98/54301`, SOURCE_COMMIT `44cc6fa0cf551edb80e423b070f47cd01aa9ff0e`.
- **SHA-256:** `08b49f76550f95bc0521dce950b18abadb90034732087eceeebb33f0f1285276`, comparado com `SHA256SUMS.txt` do artifact 12598909133: OK.
- Certificado SHA-256: `34766c15d09013ad65873f9976539c8fa2f826e917dae3af57ea628cad689e8e`; v2 true, APK release não depurável, R8 mapping presente e shrinkResources.
- Teste físico Samsung e Firebase Emulator/Rules deployment **não realizados**: não declarar mural online de fato sem provas. PR #65 Draft, base #64, sem merge/Release/Drive.
