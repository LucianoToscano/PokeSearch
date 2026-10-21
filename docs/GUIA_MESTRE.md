# PokeSearch — GUIA MESTRE

## Base ZERO — 20/10/2026

Decisão: reiniciar o aplicativo do zero, sem reaproveitar lógica do overlay anterior automaticamente. Implementar por pedido do usuário.

- Branch base: `rebuild/zero-20261020`
- Backup antigo: `backup/pre-restart-20261020` no commit `3fc3e38fb5fb95034210ee907c5705946e8e471a`.
- Identidade inalterada: `com.lucianotoscano.pokesearch`.
- Assinatura de testes persistente: certificado SHA-256 `34766c15d09013ad65873f9976539c8fa2f826e917dae3af57ea628cad689e8e` (chave privada protegida no GitHub Actions).
- Ícone original: `drawable-nodpi/ic_launcher.png`, gerador `app/scripts/RoundIcon.java`.

## HOME — 20/10/2026 — etapa 1

Branch de trabalho: `feature/home-tema-20261020`.

**Backgrounds reais do Google Drive, originais e sem reinterpretações:**
- `Background PokeSearch Escuro.png` → `app/src/main/res/drawable-nodpi/ps_bg_escuro.png` (Drive ID `1wEap_p_YahHHmQaR8u8aDwhJ6VcWKrrr`).
- `Background PokeSearch Claro.png` → `app/src/main/res/drawable-nodpi/ps_bg_claro.png` (Drive ID `1nez_tpKMpgIDJ7Flb8fNVmVAT8t06sgt`).
- Ambas são PNG 941 × 1672, usados como fundo de tela inteiro com CENTER_CROP, sem alterar os arquivos. Dependendo da proporção do dispositivo, CENTER_CROP pode cortar as bordas.

**HOME visual:**
- Barra discreta no topo com botão menu, logo oficial do aplicativo, nome PokeSearch e botão Login.
- Barra de ações compacta com Doação, Reportar bug, alternância Claro/Escuro e Overlay.
- Preferência de modo salva localmente via SharedPreferences; ao primeiro uso respeita tema do sistema.
- Status bar transparente sobre a imagem; barra de navegação com contraste adequado.
- Sem menus ou conteúdo antigo importados da base anterior.

**Funções habilitadas nesta etapa:**
- Menu mostra Início, alternar tema, Sobre.
- Alternância troca imediatamente o background original e persiste.
- Doação recupera o diálogo Pix já aprovado anteriormente no código, com QR e opção copiar, acessível em `PixSupport.java`. Confirmar o destinatário exibido no banco antes de doar.
- Reportar bug pede descrição e prepara compartilhamento voluntário; nenhum diagnóstico é enviado automaticamente.
- Login e Overlay são entradas visuais com aviso explícito de que não estão configurados. Nenhum login, WebView, serviço ou permissão de overlay foi inventado.

**Próximos passos:** aguardar escolhas do usuário para implementar login e sobreposição de fato. Não executar compilação sem pedido explícito; não dar merge na main. Todos os próximos passos serão documentados neste mesmo arquivo.
