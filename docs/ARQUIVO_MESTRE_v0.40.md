# PokeSearch — Arquivo mestre v0.40-beta
**Data:** 14/10/2026 (Brasil)  
**Repositório principal:** https://github.com/LucianoToscano/PokeSearch — branch `main`  
**Código Android:** `com.lucianotoscano.pokesearch` (namespace `com.lucianotoscano.pokesearchoverlay`), versionCode 40, versionName `0.40-beta`, minSdk 26, compileSdk 36.

## Continuidade
- Consultar arquivos históricos `docs/ARQUIVO_MESTRE_v0.39.md`, `docs/ARQUIVO_MESTRE_v0.38.md` e arquivo mestre antigo v0.36 no Drive. Preservar o repositório PvPPokeGo intocado.
- O PokeSearch é APK separado e overlay compacto sobre Pokémon GO, sem alteração do APK do jogo. Só dados obtidos a partir de pesquisas reais no PoGoCoordinates com a conta e a autorização do usuário.
- UI do overlay: ⚙ arrastável, × encerrar, recolher tudo deixando ⚙, sprites P/M/G, IV100/GL#1/UL#1, ✨ Shiny opcional, AUTO 5/10/15/20m, ↻, temporizador, sino geral, ★ favoritos, ⚠ relato de bug, ♡ Pix, detalhes de Pokémon e coordenadas quando disponíveis.

## Mudanças solicitadas e implementadas v0.40
1. **Login:** substituída caixa AlertDialog grande e seus dois botões inferiores por uma tela de autenticação em WebView, fundo escuro, barra superior compacta com `✓ Voltar`. O site oficial ocupa a área útil inteira e recebe foco/teclado, incluindo login e eventual vinculação do treinador. Enquanto o login estiver aberto, overlay permanece oculto. Ao concluir, a sessão é atualizada automaticamente.
2. **Favoritos dentro do overlay:** `PokemonPicker` trabalha com `Context` de Activity **ou** Service; serviço abre diálogo `TYPE_APPLICATION_OVERLAY` focável, ocultando painel de fundo temporariamente. Selecionar, pesquisar e remover favoritos mantém Pokémon GO em primeiro plano; retorno ao overlay ao concluir. Limite de 50 favoritos e sprites locais/remotos preservados.
3. **Seletores de modos/intervalo:** toque em `100%`, `GL#1` ou `UL#1` abre lista imediatamente abaixo com escolha explícita de IV100, GL#1 ou UL#1, em vez de alternar silenciosamente. Botão AUTO abre lista 5, 10, 15, 20 minutos. Janela nativa ajusta a altura para o menu flutuante não cortar itens.
4. **✨ independente:** ligar/desligar não muda o modo selecionado. Ao desligar, a mesma busca IV100/GL#1/UL#1 será refeita sem filtro Shiny, sem exigir vínculo de treinador. Respeita limite mínimo de 60 segundos entre pesquisas submetidas; caso esteja no tempo de espera, uma busca fica programada e a interface informa o tempo restante.
5. **Guia rápido:** apresentado uma vez no início e acessível na Home pelo botão `ⓘ Guia rápido`. Explica controles, cores, Shiny, modo, atualização, favoritos e ações.
6. **Documentação/Testes:** novo `app/tests/overlay-ux.test.js` com contrato para botões, picker em overlay, login e throttling; manter `app/tests/probe-smoke.test.js` (13 testes do leitor).

## Registro de bugs corrigidos nesta versão
- PS-017: footer nativo da janela de login ocupava espaço e cobria o formulário do site.
- PS-018: botão ★ favorito trazia MainActivity à frente de Pokémon GO.
- PS-019: alternar modos e AUTO por sucessivos cliques era confuso; precisava selecionar numa lista.
- PS-020: Shiny desligado podia deixar resultados vazios por controle de intervalo; inclui agendamento da busca após espera.
- PS-021: falta de legenda/tutorial das funções; agora há guia inicial reutilizável.

## Cuidados
- APK gerado é compilação **beta de teste privado** pelo GitHub Actions, com assinatura de debug que pode mudar. Não garantir upgrade por cima de APK de certificado diferente.
- Acessos do Google/Discord, teclado, modal de favorito com permissão de overlay, consultas GL/UL e Shiny real **ainda exigem teste físico**.
- Não armazenar ou publicar senha, cookies, tokens ou código de amizade. Relatórios ⚠ não transmitem dados sem ação explícita.
- Garantir uso permitido do serviço terceiro e respeitar intervalos; throttling não dá garantia de inexistência de bloqueio.
- Falhas de site: tocar no `!` para ver status, exportar log TXT via ⚠ e encaminhar screenshot sem dados sensíveis.

## Compilação/entrega
- GitHub Actions: `.github/workflows/build-overlay.yml` deve executar `node --check`, smoke do site, testes UI, `:app:testDebugUnitTest`, `:app:assembleDebug`, lint, ZIP, verificação `apksigner` v2, versão real do APK e SHA256SUMS.
- Só declarar APK pronto após HEAD vigente e CI verde; gerar kit com APK, código-fonte, mestre, auditoria e hash.
- Google Drive do projeto: `00_Documentacao_Atual`, `01_APKs_Teste`, `02_Relatorios_Bugs`, histórico preservado.
