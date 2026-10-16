# PokeSearch v0.54-beta — arquivo mestre
A evolução mantém código anterior integral no backup `backup/v0.53-before-independent-overlays-20261016`, criado a partir de SHA `162d6340f4bda7f30c27c6054399ca35ad11a0c8`. Desenvolvimento em `feature/v0.54-independent-layers-20261016`. Não alterar a branch main sem revisão.
## Escopo
- Até 3 pesquisas separadas por perfil (100% IV, 0% IV, Grande Liga rank configurável 1–200, Ultra Liga rank configurável 1–200, Raw IV A/D/HP 0–15).
- Cada busca ativa tem sua janela Android do tipo TYPE_APPLICATION_OVERLAY, independente da janela do menu e das outras listas, com alça ⠿ de arraste, posição X/Y persistente e recolhimento próprio.
- O menu principal inicia por padrão em orientação vertical com rótulos (somente em novas preferências), permitindo orientação horizontal e somente ícones. A configuração da Home permanece.
- Botão de olho abre opções de exibir/ocultar quantidade de spawns, tempo até desaparecer, nível, PC, IV, rank PvP.
- As consultas ao PoGoCoordinates permanecem sequenciais e respeitam MIN_SEARCH_GAP_MS (60s); janela e atualização de dados são independentes, mas o site e a sessão são compartilhados.
- Acesso ao brilho Shiny usa o controle real do site. Nenhum rank de IV é fabricado: GL/UL ≤N pode ser mostrado quando só a faixa é comprovada.
## Atenção
APK compilado só é candidato de testes. Validação física Android, integração dos filtros e coordenadas de grupos que não sejam a última busca precisam de testes. Recursos VIP respeitam autorização. Nunca gravar ou publicar credenciais. Assinatura de CI é temporária e pode exigir desinstalação para instalar sobre APK anterior; exportar dados relevantes antes.
