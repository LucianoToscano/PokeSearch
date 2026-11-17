# LT403 — Captura de tela e gravação durante login PoGoCoordinates

**Data:** 17/11/2026 · **Escopo:** diagnóstico de gravação no aplicativo oficial Android · **Status:** correção preventiva na branch, aguardando CI/validação física. Não é release publicada.

## Relato do proprietário
Ao gravar um vídeo para demonstrar erros na autenticação de `pogocoordinates.com`, a gravação do aparelho é interrompida. O proprietário solicitou liberar temporariamente prints e gravações para depuração e reativar eventuais proteções somente depois.

## Auditoria de origem
- A política `ProfileScreenshotPolicy.allowsScreenshot(...)` já retorna `true` desde LT343; o bloqueio antigo de screenshots nas telas de login/Perfil **já havia sido removido**.
- `MainActivity` já executava `clearFlags(FLAG_SECURE)` na janela do login e na Activity e nas mudanças de URL do WebView.
- Não foi localizado `addFlags(FLAG_SECURE)` no fluxo de login, nem política de captura segura no manifest. Não há prova de que o próprio PokeSearch esteja encerrando a gravação.
- **Restrição externa:** Google, Discord, um navegador externo, o Android ou o aplicativo gravador podem impedir capturas fora da janela do PokeSearch. Não é possível remover flags de outra aplicação; não contornar restrições de provedores ou alterar autenticação/cookies para isso.

## Ajuste LT403
- Reaplicar `clearFlags(FLAG_SECURE)` **antes da Home** (`onCreate`), na retomada (`onResume`) e quando a Activity volta a ter foco (`onWindowFocusChanged`).
- Reaplicar ao mostrar o diálogo de login (`setOnShowListener`) e imediatamente antes/depois de `show()`, além dos pontos de navegação existentes.
- Preservar WebView, OAuth oficial, slots 1/2, cookies isolados, perfil, duas Pokébolas, inventários e política de segurança restante.
- Acrescentar verificações de regressão no teste LT343 (nenhum `addFlags` ou `setFlags` com `FLAG_SECURE`).

## Homologação pendente no aparelho Samsung Android 17
1. Iniciar gravador de tela **antes** de abrir PokeSearch e observar se a gravação continua ao abrir Home → PoGoCoordinates → Conta 1 e Conta 2.
2. Repetir com login Google e Discord, marcando o instante em que a tela muda para fora do WebView/Activity. Identificar **se** a gravação para apenas quando muda de aplicativo/provedor.
3. Voltar ao PokeSearch e verificar captura de tela normal, estado da sessão, avatar e perfil, sem perder a conta nem desligar overlays.
4. Registrar apenas domínio e tela aproximada do erro; **não compartilhar vídeos com senha, token, código de verificação/2FA, cookie, dados pessoais ou coordenadas privadas**.
5. Se persistir exclusivamente na tela de outro app, tratar como limitação externa e usar relatório TXT ou relato do erro, sem prometer remoção no aplicativo.

## Reversão futura
A decisão de bloquear novamente capturas do *próprio PokeSearch* deve ser explícita e localizada, depois da homologação. Não introduzir `FLAG_SECURE` agora e não mudar as proteções do provedor de autenticação.
