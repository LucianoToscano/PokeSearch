# CONTINUAR POKESEARCH — LT343 / ARK — 14/11/2026

Este arquivo é o prompt mestre de continuidade da implementação LT343, em português do Brasil. **Trabalhar a partir da `main` atualizada**, sem recomeçar, sem apagar contas, filtros, Pokémon, 68 sprites do Edu, sons, imagens, modelos, assinatura permanente ou proteções R8/ZIP/SHA. ARK autoriza corrigir, testar, mesclar e publicar oficialmente quando CI passar; nunca declarar homologação física sem prova.

## Leitura obrigatória (ordem)
1. `LEIA_PRIMEIRO_PROMPT_OUTRAS_IAS.md`
2. `docs/GUIA_MESTRE.md`
3. Este `docs/PROMPT_CONTINUIDADE_LT343_ARK_20261114.md`
4. `AGENTS.md`
5. GitHub `main`, Release estável, PRs, Actions e issue #350

## Base e publicação
- **Última release oficial antes da LT343:** LT342 / `0.03.40` / `versionCode 54547` / `label 51344`. Release https://github.com/LucianoToscano/PokeSearch/releases/tag/v0.03.40-54547
- Branch funcional LT343: `fix/lt343-pgs-overlay-capture-ui-20261114`; PR #365 https://github.com/LucianoToscano/PokeSearch/pull/365
- Próxima versão monotônica candidata: **0.03.41 / versionCode 54548 / label 51345**. Confirmar novamente no GitHub antes de publicar; não assumir que LT343 está pública até o fluxo de assinatura e publicação oficial concluir.
- APK oficial deve ser assinado com certificado permanente, R8 ativo, recursos originais, ZIP válido, SHA-256 público e URL em `releases/latest`. Nenhuma instalação sem confirmação do Android.

## Implementação LT343 na PR #365
1. **Menu e Home:** dez ícones originais 512×512 PNG (24 variações Normal/Hover/Ativo) carregados diretamente dos cinco ZIPs originais `app/src/main/assets/menu_icons_512_1..5.zip` sem recomprimir/desenhar. Fallback preserva layout e funções existentes. Logo, relógio e ações no mesmo eixo horizontal; badges de login **1–2 px acima** das Pokébolas, não afastados.
2. **Fundo preto Buscar Pokémon:** `busca_pokemon_overlay_on.webp` com transparência RGBA corrigido sem alterar dimensão 1254×1254; WebP RGB anterior arquivado em `assets/ui-originals`; `PgsHomeArtwork` também tem limpeza defensiva em memória, preservando anel preto interno. Mapeamento: HOME `Busca_Pokemon_Overlay_Off/On`; bolha PGS `Busca_Pokemon_Off/On`. Pulso só verde aguardando mapa/vermelho erro, branco natural ocioso.
3. **Menus PGS:** mesma geometria visual e comportamento das Pokébolas 1/2 e Doce Raro. Toque na bolha com menu ABERTO apenas retrai, sem desligar a busca. Com menu retraído ativa/desativa. Barra com engrenagem+lápis ao lado do sino e opções Contadores visíveis, P/M/G e transparência do painel. Dois grupos de alertas: Novos Pokémon e Shiny monitorado (sem alerta redundante de toque comum).
4. **Reconhecimento e captura:** ao ligar novamente, aproveitar todas as amostras persistidas, sem exigir nova sprite. Recorte da imagem com arrastar/redimensionar, prévia, Confirmar/Cancelar. Não salvar até confirmação. Foco/multijanela/popup não podem destruir o serviço; suspender gestos fora do jogo.
5. **Segurança de avisos do jogo:** detectar localmente via Acessibilidade opt-in frases `Sou passageiro`, `Estou seguro`, e equivalentes do inglês, **apenas na janela do PGSharp**, pausar gesto e cronômetro, exibir `CONFIRME MANUALMENTE`, retomar após confirmação humana. **Nunca programar clique automático para declarar segurança ou condição de passageiro.**
6. **Prints:** PokeSearch não aplica mais `FLAG_SECURE` no próprio diálogo de login nem em suas outras telas. `ProfileScreenshotPolicy` é compatibilidade antiga que agora permite capturas sem restrição. Capturas de terceiros/Android podem ainda ser bloqueadas por eles; não alegar que o app removeu proteções externas.
7. **Login Conta 1/2:** tocar no badge de login abre mini popup compacto com duas linhas **clicáveis**, `Conta 1: nome › Entrar/Perfil` e `Conta 2: nome › Entrar/Perfil`; cada um usa seu `PogoAccountSlots` e perfil WebView/cookies isolados, sem atravessar sessões.
8. **OAuth PoGoCoordinates:** `login_entry.js` NÃO efetua clique sintético em Google/Discord, apenas expõe os botões oficiais para toque humano; máscara inicial é liberada em até 2,8 s para mostrar erro do próprio site. Botão `↗ Site` abre o PoGoCoordinates no navegador Android com aviso explícito de que **login externo não sincroniza automaticamente com a WebView do PokeSearch**. Google bloqueia OAuth em WebView (`disallowed_useragent`) e a solução integrada com Chrome Custom Tabs exige redirect/callback oficialmente autorizado pelo PoGoCoordinates. Não inventar endpoints privados, não copiar tokens/cookies, não trocar user-agent para burlar bloqueio, não marcar sessão como autenticada sem probe oficial.
9. **Edu:** X fecha assistente inteiro, mantendo 68 sprites e ferramentas de auditoria.

## Testes necessários
- PR #365: todos os gates Node LT169, Core LT211, Java LT62, OTA LT173, PGS Android QA, Node QA e beta seguro devem estar verdes no SHA final. Testes LT343 novos e legados reajustados, inclusive screenshot, login, menu, PNG originais e estados.
- Samsung: revisar os dois temas, alinhamento de topo, fundo de todos ícones, tamanhos, popup de login, prints em todas as telas, comportamento de minimização e multiwindow, recorte guiado, modelos salvos reativando busca, ciclo 60s/2s/3s, pausa de aviso de segurança e confirmação humana.
- OAuth: testar Google e Discord em **Conta 1 e Conta 2**, sem logout cruzado; confirmar nome/foto, persistência do perfil e retorno de sessão. Se Google der `403 disallowed_useragent`, a solução definitiva exige integração OAuth autorizada pelo domínio externo; anotar bloqueio na issue #350, não fabricar êxito.
- PGSharp: gesto real → callback Android → teleporte real são três verificações distintas; Shiny da MESMA espécie depende de sinal real. Issue #350 permanece aberta até prova física.

## Passos ARK para concluir
Verificar CI da PR #365; corrigir regressões reais (não excluir verificações úteis). Fazer merge protegido com HEAD exato aprovado. Criar PR separada de release com `release/official-request.json` monotônico e `app/src/main/assets/release_notes.json` mínimo 54548. Registrar Guia Mestre e AGENTS. Rodar preflight, assinatura permanente, R8, ZIP, APK, SHA-256 e confirmar `releases/latest`, sem alegar instalação física. Gerar prompt novo com estado real e pendências.

**Nunca reduzir resolução/nitidez nem burlar confirmação de segurança do jogo ou Google OAuth.**
