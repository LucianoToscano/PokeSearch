# PokeSearch — LT88 Samsung R8 · Filtro, Áudio e Localização (25/10/2026)

## Continuidade e governança
- Continuação estrita da única PR #63 Draft, branch `feature/lt88-lt93-evolution-20261025`, sobre `main` oficial LT87 `83cf9a693a3672276e01d04e38ed14dce0071cb8`; sem merge, Release ou reinício do projeto.
- Binário anterior R7 0.00.94/54297 foi QA assinado, e a pasta Drive PokeSearch_App contém ao menos a cópia QA R6 previamente verificada. Somente atualizar arquivo compartilhável quando a nova candidata passar integridade, e não presumir teste Samsung.
- R8 candidato para QA assinado: `0.00.95` / `versionCode 54298`. O número é técnico; não significa LT95 concluída nem publicação oficial.

## Mudanças solicitadas
1. **Filtro (menu geral):** título `Filtro` é botão que abre/fecha os perfis. Ícone redondo `⊙` removido do DOM. Popup compacto contém apenas `Padrão`, `Filtro 1` [salvar SVG branco fino] [lixeira SVG branca fina], `Filtro 2` idem. Sem título/descrição repetida no rodapé. Toque aplica perfil salvo e recolhe painel; Padrão repõe gerais sem mudar Shiny/localização; disquete salva explicitamente; lixeira apaga só o slot. O terceiro slot permanece no armazenamento legado, apenas oculto, para não apagar dados existentes.
2. **Sons personalizados:** ao abrir, lê preferência atual de Novos/Favoritos; marca a linha salva com ✓, contraste/corno visível e centraliza a rolagem nela. Ao tocar outro som, imediatamente muda a marcação e toca prévia; somente `✓ Usar áudio` persiste, fechamento sem confirmação preserva preferência anterior.
3. **Localização:** painel estreitado verticalmente para três linhas (título, coordenadas e linha operacional com colar/copiar/raio-slider/aplicar/limpar) + status somente quando necessário. Mantidos campo completo de coordenadas, raio 0–1000 km, clipboard Android, resposta sem GPS físico e confirmação real dos filtros.

## Testes automatizados
- Teste novo `app/tests/lt88-r8-compact-controls-sound.test.js`.
- Contratos antigos de `lt88-floating-menus-r5.test.js` e `lt62-menu-visual-states.test.js` foram adaptados apenas onde passaram a descrever a disposição substituída, sem desligar testes de comportamento da API.
- [ ] CI Node completo, Java compilação, Gradle, R8, assinatura persistente v2, SHA256SUMS, certificate, SOURCE_COMMIT e versionCode R8; preencher evidência após execução.
- [ ] Samsung físico: verificar tela pequena, tema claro/escuro, abertura da palavra Filtro, background transparente sem atravessar, perfis 1/2 salvos e independentes, confirmação de som marcado antes e depois da prévia, scroll até opção ativa, coordenadas/Gboard Maps e compactação real sem cortar.
- [ ] Manter os demais pontos do checklist R6/R7 (sprites/favoritos 3 slots/notificações/despawn/IV/GL/UL/Pix).
- [ ] Link Drive para o APK do R8 somente após artifact real + upload verificado. Substituir conteúdo do mesmo arquivo ID `1XXKGy3AjtDx4uMnt2N4Wd3FVNV0Qn_5P` quando apropriado; preservar acesso/ID. Nunca afirmar publicação estável.
