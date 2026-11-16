# PokeSearch LT377 — Auditoria de login, Visitante e integridade da integração — 16/11/2026

## Evidência do problema

Capturas e vídeo enviados pelo proprietário: o WebView PoGoCoordinates mostra a busca do site dentro do diálogo `Conta 2 · Login`, que não fecha após login aparente; outra tela exibe o toast `Conecte a Conta 2 antes de usar esta Pokébola`; seletor de contas mostra Conta 1 e Conta 2. A página aberta, avatar e possível nome não são prova suficiente de OAuth válido. O usuário confirmou que o PoGoCoordinates não mantém a seleção antiga de treinadores, que a busca pública deve continuar sem login e que Conta 1/2 não podem compartilhar cookies.

## Causas e implementação auditadas

- `OverlayService.onCreate()` barrava Conta 2 se `sessionStatus != "autenticada"`, mesmo quando o site permite consulta pública. O gate foi removido sem contornar `AppAvailability` nem `IntegrityGuard`.
- `PogoAccountSlots` passou a aceitar o perfil separado de Visitante (slot 0), **somente com WebView MULTI_PROFILE**, nome `pokesearch_pogocoordinates_visitor`. Conta 1 mantém o perfil default histórico, Conta 2 mantém o perfil isolado `pokesearch_pogocoordinates_account_2`. Nenhuma cookie jar do perfil visitante usa fallback para uma conta autenticada.
- Em WebViews sem MULTI_PROFILE, as duas Pokébolas seguem podendo consultar como convidadas utilizando uma **Conta 1 desconectada**; a opção de Visitante independente fica indisponível. Não se alega dois logins separados nesse ambiente.
- O seletor P1/P2 apresenta `Conta: Visitante`, `Conta 1`, `Conta 2`; o nome é mostrado somente quando verificado no perfil; `Sem Login` identifica a conta desconectada, e a busca continua acessível.
- A lógica de OAuth só usa controles do site oficial. Um link de perfil visível pode redirecionar o WebView para `/profile`, mas **não autentica por si só**. Apenas o `probe.js` oficial confirma sessão e a captura `profile_summary.js` lê dados públicos autorizados. O diálogo pode ser fechado após essa confirmação; falhas/erros continuam visíveis, sem inventar OAuth nem copiar sessão do navegador.
- O logout de cada slot apaga somente sua sessão e solicita atualização de busca nas Pokébolas selecionadas, sem derrubar serviços de busca pública.
- Seleção de treinador foi retirada do seletor ativo; dados históricos de treinador permanecem persistidos, sem ressuscitar exigência de vínculo nem alterar a feature flag `SHINY_AVAILABLE=false`.

## Integração e testes automatizados (comprovados)

**PR de código #458**: https://github.com/LucianoToscano/PokeSearch/pull/458; HEAD validado `398a6be3b3be4618df9c7817d0567a1f114617fe`; squash em main `6ae33f6401a3ec3b448287e41fac6b03f82131e1`.

Gates do código, **7/7 success**:
1. Node QA #43964687754
2. LT169 Node completa #43964687800
3. LT211 core #43964687474
4. LT62 compilação Java #43964687567
5. LT173 OTA #43964687771
6. PGS APK debug QA #43964687649
7. Secure beta/R8 #43964687751

Suplementar LT253 #43964687737 **success**.

**PR de release #459**: https://github.com/LucianoToscano/PokeSearch/pull/459; HEAD `011c34878d23daccf6613b5178fd528b952a140d`; squash `7a33a72f6033027f3a6e0a20707eac7179faf1c1`. Acrescentou salvaguarda de privacidade para WebViews antigos, testes LT377 e notas versionadas. Gates dessa PR **success**: Node QA #43965903964, LT169 #43965903968, LT211 #43965903898, LT62 Java #43965903877, LT173 OTA #43965903947, Secure beta/R8 #43965903847; preflight do workflow oficial #43965903895 success. Workflows marcados `skipped` por filtros de evento não equivalem a falha.

## Limitações NÃO comprovadas em aparelho físico

Não foi realizado login real Google/Discord/2FA, captura de foto em Samsung Android 11–14, expiração de sessão, validação do fechamento automático em WebView de produção, alternância P1/P2 em cada WebView Android, modo noturno, Minior Meteor/Core, tutorial, localização 16 faixas, Favoritos, desfoque, TalkBack e testes PGSharp/Pokemod separados. Testes unitários e QA de compilação **não comprovam** autenticação funcional em aparelho. Uma sessão Google em Chrome externo não é importada automaticamente para Android WebView, porque o app não tem permissão ou protocolo oficial para copiar cookies entre aplicações.

Não confundir supervisão do app com caminhada de outro aplicativo, tentativa de captura ou captura confirmada. Não prometer instalação silenciosa do APK; Android exige confirmação.

## Estado ARK e pendências

- Integrados código e pedido oficial monotônico `0.03.71`, `versionCode 54578`, label `51377` (anterior: `0.03.70`, 54577).
- **Workflow pós-merge #43966395928** [completed/success](https://github.com/LucianoToscano/PokeSearch/actions/runs/43966395928): jobs `preflight` e `publish` success, incluindo `Build signed protected release`, `Validate APK and signer`, `Release to all app users` e `Verify public release and hash` success.
- **Release pública oficial** [v0.03.71-54578](https://github.com/LucianoToscano/PokeSearch/releases/tag/v0.03.71-54578), `draft=false`, `prerelease=false`, `published_at=2026-11-16T22:08:02Z`. APK `PokeSearch-v0.03.71-LT.apk`, 61.196.251 bytes, `uploaded`, digest GitHub SHA-256 `5bcdb1e358e746b3038bc1b7ceb2a7f38cdd03b8063943b56cebfadc3f96cf27`. O workflow oficial validou certificado permanente `34766c15d09013ad65873f9976539c8fa2f826e917dae3af57ea628cad689e8e` e assinatura v2, pacote, versão e integridade (não alegar recomputação independente local). Fonte publicada `7a33a72f6033027f3a6e0a20707eac7179faf1c1`.
- ARK concluído quanto a merge, QA automatizado e distribuição oficial, permanecendo **pendentes** os testes Android físicos / OAuth Google/Discord.
- PR #457 da Pokédex pessoal não foi integrada nestas alterações.
