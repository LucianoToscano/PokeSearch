# LT386 — Busca pública, diagnóstico clicável e Home sem marca

Base: `main` (versão oficial preservada: PokeSearch v0.03.73 LT / versionCode 54580).
Branch: `fastdev/lt386-guest-error-home-header`.

## Correções propostas
1. **P1/P2 visitante ou Conta 1/2 desconectada:** em pesquisa comum, Shiny OFF, consultar primeiro o formulário público real de `https://pogocoordinates.com/search`, usando o perfil WebView já associado à Pokébola. Não submeter API autenticada com sessão ausente. A seleção de conta e o isolamento dos perfis não mudam. A verificação de filtros e dos resultados continua obrigatória; nenhuma busca é inventada. Filtros só existentes na API (como ordenação inversa) geram erro explícito. A janela global de HTTP 429 continua sendo respeitada.
2. **Aviso de erro `!`:** em `dock.html`, botão `#empty` de resultados volta a receber toque (antes havia `pointer-events:none!important`) e recebe descrição acessível. `Native.showStatus()` exibe diálogo com mensagem, motivo sanitizado de `lastError` e acesso a Reportar problema. Erro de carregamento principal deixa de aparecer como simples zero.
3. **Home:** remove o pequeno logotipo no alto, mantendo os atalhos de Perfil/Login e PoGoCoordinates imediatamente depois de Apoiar, com os drawables existentes, tema e estados. O gesto administrativo protegido migra para um toque longo no menu ☰, sem exposições adicionais.
4. **Assinatura FastDev:** `.github/workflows/pokesearch-fastdev.yml` já usa o environment `fastdev-signing` e os quatro segredos específicos abaixo. Não duplicar, trocar ou armazenar segredos no código.

## Segredos exigidos no GitHub Environment
`Settings → Environments → fastdev-signing → Environment secrets`:

- `POKE_FASTDEV_KEYSTORE_B64`: conteúdo **base64** do keystore PKCS12 **permanente** FastDev (sem quebras de linha).
- `POKE_FASTDEV_STORE_PASSWORD`: senha do keystore existente.
- `POKE_FASTDEV_KEY_ALIAS`: alias da chave existente.
- `POKE_FASTDEV_KEY_PASSWORD`: senha da chave existente.

Variável pública separada: `POKE_FASTDEV_CERT_SHA256` deve continuar sendo o SHA-256 do **certificado FastDev**, não o da assinatura oficial LT. O workflow faz preflight e compara certificado antes de publicar. Evidência histórica: FastDev `1000041` foi gerado e assinado no ciclo LT384. A existência atual dos segredos não é verificável pela API de código, e esta branch **não recria** o keystore.

## Testes
- `node --test app/tests/lt386-guest-diagnostic-home.test.cjs` — sete contratos estáticos de caminhos, clique, recursos e assinatura.
- QA completo da PR (Node, Java, build Preview/Beta conforme critérios FastDev).
- Android físico **pendente**: P1 visitante, P2 visitante, Conta 1/2 desconectadas, Google/Discord, acesso 403, 429, sem rede, HTTP 200 com zero real, dois overlays simultâneos, toque no `!` e relatório de erro.
- Confirmar tela em tema claro/escuro, alinhamento dos ícones e persistência dos atalhos.

**Sem merge, release oficial ou APK publicado por este documento.** Respeitar ARK apenas mediante solicitação explícita; não declarar homologação física sem evidência.
