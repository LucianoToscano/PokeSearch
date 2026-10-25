# PokeSearch LT88 — R5: perfis, local, Favoritos, som e Pix (QA)

Data: 25/10/2026.
Branch `feature/lt88-lt93-evolution-20261025`, PR #63 Draft.
A main oficial permanece LT87 0.00.87/versionCode 54290; não mesclar nem publicar automaticamente.

## Evidência de usuário Samsung
- Filtros salvos ainda exibiam Perfil 1–3 com estrela e X. Pedido: botão ⊙ no lugar de ▣, Padrão sem ícone e sem X na primeira posição, e em cada Perfil 1–3 um botão explícito 💾 Salvar + × Excluir. Toque no título do perfil aplica imediatamente e recolhe apenas a lista de perfis. Nenhuma funcionalidade no toque longo.
- Favoritos devem abrir em painel independente perto da barra flutuante, acima ou abaixo segundo o espaço.
- Localização: remover do layout a área "Nome do local", as estrelas 1–3 e botão ?, sem deletar preferências anteriores; manter o campo de coordenadas, Colar, Copiar, raio e Aplicar/Limpar.
- Personalizar som em Notificações não deve navegar à Home: usar lista flutuante, ouvir prévia ao tocar, confirmar explicitamente. Preservar os 36 áudios da PokeSoundLibrary e padrão Android.
- Pix abre diálogo flutuante compacto com o mesmo fundo/transparência/desfoque dos demais menus, reutilizando a imagem QR original e código Pix já existente, sem nova chave ou alteração dos dados de pagamento.

## Implementação R5
- `dock.html`: lista de perfis Padrão, Perfil 1–3; controle ⊙ e salvar/excluir separados. A interface não expõe ações nos slots Padrão. Recolhe lista imediatamente após Uso/Padrão, mantém menu principal. Remove visualmente favoritos e ajuda da Localização (dados legados preservados).
- `OverlayService.java`: clearGeneralFilterPreset constrói estado neutro (IV% 0–100, opções e multi-seleções vazias) e envia para setSearchConfig existente. Preserva localização, Shiny e preferências fora de pesquisa. Removido fechamento completo do popup ao usar slot.
- `OverlayQuickMenus.java`: componente reutilizável Dialog TYPE_APPLICATION_OVERLAY para Pix e lista de sons; background e desfoque derivados de visualPrefsJson, janela não modal e posicionada perto do menu flutuante; ao escolher um som, apenas depois de pressionar ✓ grava WatchAlerts.PREF_GENERAL_TONE/PREF_FAVORITE_TONE. Preview via MediaPlayer, áudio interrompido ao fechar. Pix original via PixSupport, com cópia explícita.
- `OverlayService.java`: openPix e pickAlertTone general/favorites abrem componente overlay sem iniciar MainActivity; window cleanup garantido no onDestroy. Favoritos nativo usa posição da barra quando não é fornecida âncora.
- A opção de upload de áudio personalizado do sistema continua implementada no fluxo legado da Home, mas **não** é exibida nesta primeira lista flutuante. Importação sem passar pela Home depende de um fluxo de seleção com retorno seguro ainda não homologado. Não eliminar o recurso existente.
- Clipboard de localização: tentativa focada de leitura após toque; caso Android não permita leitura do overlay, feedback indica usar "Colar" pelo teclado, sem afirmar coordenadas inválidas e sem leitura de dados em segundo plano.

## Segurança e QA
- Preservar login Google, JWT, tokens, credenciais, R8, assinatura, limites 401/403/429, resultados ≤10.
- Novo candidato QA: `0.00.92` / versionCode `54295` (numeração de build, **não** LT92 funcional completa).
- Testes Node e Java, regressões históricas, R8, assinatura v2, mesmo certificado e SHA-256 obrigatório antes de enviar APK.
- Samsung físico ainda precisa provar toque, exclusão/salvamento/uso, Padrão sem interferir em Shiny/localização, PokeSoundLibrary (som não continua tocando quando fechar), Pixel/QR e copiar, posição de Favoritos e clique fora.
- Os controles de localização antigos foram apenas ocultados do layout; nenhum valor armazenado foi apagado.
- Guia Mestre somente append com verificação SHA-256 de prefixo, nunca sobrescrever ou aceitar resposta truncada do conector.
