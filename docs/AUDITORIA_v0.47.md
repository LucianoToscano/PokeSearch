# PokeSearch — AUDITORIA incremental v0.47-beta

Data 14/10/2026; base v0.46-beta, commit d49fe74ae00d9abc3e581bb6f63620b60f9ceacb.
Pacote v0.46: SHA256SUMS.txt conferido para APK e ZIP-fonte.

## Avaliação das alegações B01–B08
- B01 NÃO PROCEDE: settings.gradle.kts já estava no pacote-fonte v0.46. Não criar duplicado.
- B02 NÃO COMPROVADO como P0 atual: targetSdk33; migração Android 14+ para tipos de foreground service exige avaliação apropriada. Não adicionar specialUse automaticamente sem permissões e política.
- B03 RISCO REPRODUZIDO: geração de ícone por Java/AWT falhou sem X11 funcional. Corrigido modo headless e incluído PNG editável no ZIP-fonte do CI; testar determinismo.
- B04 PARCIALMENTE CORRIGIDO: operações críticas de parsing/execução do JS, layout das janelas e leitura do probe geram logs somente da classe de exceção; catches opcionais restantes merecem revisão, nunca logar mensagens sensíveis.
- B05 PLANEJADO: compileSdk36/targetSdk33 é tecnicamente válido; atualização de target exige testes de foreground service/overlay e compatibilidade Play.
- B06 PENDENTE: race conditions em login/refresh, precisa executar OAuth/fluxos reais Android.
- B07 PENDENTE: ícone de notificação genérico deve ser substituído por arte monocromática legível, sem confundir com ícone launcher.
- B08 COMPATIBILIDADE: third-party cookies usados para login, revisar política e isolamento sem quebrar o OAuth.

## Novos registros
PS-065 P1 · ícone headless: gerador sem dependência de X11 e teste de hash determinístico · código corrigido, CI a validar.
PS-066 P1 · falha rede WebView: tratar onReceivedError principal, cancelar callbacks, preservar segurança dos logs · código corrigido, teste de rede Android pendente.
PS-067 P1 · exceções: registrar etapa/classe sem mensagens sensíveis na execução e janelas críticas · parcialmente corrigido; avaliar catches restantes.
PS-068 P1 · ZIP fonte editável: conter Gradle Wrapper, ícone PNG gerado, settings, Java/HTML/JS, testes e documentação · pacote CI a validar.
PS-069 P1 · proveniência: arquivo SHA do commit e checksums do APK e ZIP-fonte verificados pelo job · CI a validar.

## Validações futuras
CI: Node, JavaScript smoke 14+ UX84+, Gradle unit/assemble/lint, aapt, apksigner, hashes verificados, wrapper e fonte completo.
Físico: Samsung SM-S928B Android 16; Google/Discord; Shiny/ligas/localização site; real transparência e toque pass-through; consumo memória prolongado.
Não alterar PvPPokeGo nem registrar informações privadas.
