# PokeSearch — LT88 Samsung R7 · Home Compartilhar app + Espelho Drive (25/10/2026)

## Proveniência e estado
- Continuação da PR #63 Draft, branch única `feature/lt88-lt93-evolution-20261025`. Main oficial LT87 preservada no SHA `83cf9a693a3672276e01d04e38ed14dce0071cb8`. Não fazer merge nem publicar Release sem autorização.
- R6 (0.00.93 / 54296) QA assinado foi verificado em CI #40185260932, ZIP SHA256 `f16e3fb4e11196b9b76f215c0f885871fa6e047c9e8b4d5a808833212f4783bb`, APK SHA256 `5144922c0f714d77af70c0bedf596d56fb2a8f3e7e140364715502b543cf68de`, SOURCE_COMMIT `ce71860a5266e01c7a56505b15bbc3bd7af80d76`, assinatura v2 do certificado permanente `34766c15d09013ad65873f9976539c8fa2f826e917dae3af57ea628cad689e8e`.
- Pasta Drive recebida do proprietário: `https://drive.google.com/drive/folders/1fVw93qUDE0YWp6tlJZaNjRmymyhEAUbR`. Pasta identificada como PokeSearch_App.
- O MESMO APK QA R6 de 38.629.615 bytes foi transferido ao Drive conectado e a leitura de metadados confirmou ID `1XXKGy3AjtDx4uMnt2N4Wd3FVNV0Qn_5P`, nome, tamanho, parent correto, compartilhamento por link, sem mudança no APK. Link estável: `https://drive.google.com/file/d/1XXKGy3AjtDx4uMnt2N4Wd3FVNV0Qn_5P/view`. Permissão pública atual `anyone commenter` (verificar download anônimo em navegador deslogado e ajustar no Drive se necessário).
- R7 adiciona botão visível **↗ Compartilhar app** na Home e item também no menu lateral; Android `Intent.ACTION_SEND` / `Intent.createChooser` compartilha APENAS texto e endereço do arquivo Drive, sem compartilhar espaço privado/segredos, GitHub, cookies, tokens ou APK nativo como attachment.
- **Regra futura:** toda versão aprovada e enviada aos usuários deve ter o binário original verificado por SHA256, pacote/versão/assinatura e então ser enviada à mesma pasta, de preferência SUBSTITUINDO conteúdo e nome do ID de Drive acima (`update_file`, não `upload_file` novo), para preservar o link compartilhável. Publicação de versão é decisão expressa do proprietário; QA e Release não são sinônimos. Nunca substituir um APK vigente sem conferir hash, acesso e consentimento de distribuição.
- O botão aponta atualmente ao R6 experimental; avisar usuários que é QA até existir nova versão homologada/expressamente aprovada. Para fins de clareza, não apresentar o R7 como versão oficial antes de CI e teste Samsung.
- R7 pretende CI protegido `0.00.94 / versionCode 54297` apenas como número técnico de QA, NÃO conclusão de LT94 ou publicação de Release.

## Aceitação
- [ ] CI R7 Node, unit Gradle/Java, R8, apksigner v2, certificado, versão, SOURCE_COMMIT, hash e SHA256SUMS.
- [ ] Espelhar novo APK R7 aprovado para TESTES no MESMO ID do Drive, após comparar bytes/hash, tamanho e metadados.
- [ ] Samsung real: Home em tema claro/escuro com botão visível e alinhado sem cortar footer, tocar Compartilhar app abre chooser; item do menu lateral idem.
- [ ] Destinatário não logado: abrir link e baixar o APK sem usar GitHub, verificar o tamanho e SHA256.
- [ ] Fav 1/2/3 autosave, long press para limpar com confirmação, sprites padrão e shiny, Filtros Padrão/1–3, Colar, Pix, sons, Despawn e identidade dos resultados conforme checklist R6.
- [ ] Verificar dimensões pequenas do Android, tema e transparência.
- [ ] Após CI registrar somente provas reais; FAIL físico/externo deve permanecer PENDENTE, nunca PASS presumido.

## Governança
- Uma só PR Draft #63; não mexer main, PR #62, Firebase, tokens, assinatura, identidade do pacote ou prefs. 
- Guia Mestre grande: append exclusivamente em checkout íntegro, SHA256 do prefixo anterior byte a byte. Nunca substituir por texto truncado de conector.
