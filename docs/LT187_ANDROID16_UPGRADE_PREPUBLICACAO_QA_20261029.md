# LT187 — Homologação incremental e preparação de integração (QA)

## Situação de partida
- **APK público:** LT184 `0.01.84 / 54389`, **49.547.006 bytes**, SHA-256 `e7679eafd1b43ca4f770a0939195603846e0cd6ed07881a217c078a2f09ac183`, certificado v2 permanente `34766c15d09013ad65873f9976539c8fa2f826e917dae3af57ea628cad689e8e`.
- **Candidato otimizado:** LT187 `0.01.87 / 54392`, **29.013.661 bytes**, [GitHub Actions anterior #40990477785](https://github.com/LucianoToscano/PokeSearch/actions/runs/40990477785) SUCCESS; APK `PokeSearch-v0.01.87-LT187-Size-QA.apk`, artefato `PokeSearch-LT187-54392-Size-QA-Assinado` ID `12949211220`, `SOURCE_COMMIT.txt` da compilação = `9a9b301666c1f24ee747a9966684690e7fc31152`.
- **Economia comprovada:** 20.533.345 bytes (41,44%) em relação à LT184 pública; 36 sons mantidos; 2 Pokébolas, Doce Raro e sprites offline preservados.
- **Cadeia de PRs ainda em draft:** [#143](https://github.com/LucianoToscano/PokeSearch/pull/143) sobre `main`, [#144](https://github.com/LucianoToscano/PokeSearch/pull/144) sobre #143, [#145](https://github.com/LucianoToscano/PokeSearch/pull/145) sobre #144. A `main` contém quatro commits documentais adicionais após a tag LT184; não substituí-los nem perder a documentação ao integrar.

## QA adicional automatizado
- Novo workflow [LT187 — Android 16 upgrade smoke](https://github.com/LucianoToscano/PokeSearch/actions/workflows/lt187-upgrade-emulator-qa.yml), [execução #40992803200](https://github.com/LucianoToscano/PokeSearch/actions/runs/40992803200).
- Baixa APK LT184 **real da Release oficial** e LT187 **real do artefato QA**, valida bytes, SHA-256 e certificado dos dois.
- No Android 16 virtual: instala a LT184, abre a Home, aplica `adb install -r` da LT187 sem desinstalar, verifica `versionCode=54392`, `userId` e `firstInstallTime` preservados, abre a Home, captura screenshots e logs. O teste é apenas de instalação e inicialização, não se confunde com validação de login, interface do overlay ou notificações reais.
- Saída prevista: `PokeSearch-LT187-Android16-Upgrade-Smoke-QA`, com `RESULT.txt`, duas imagens da Home, logs relevantes e relatório do aparelho.
- **RESULTADO FINAL — SUCCESS:** [GitHub Actions #40993150452](https://github.com/LucianoToscano/PokeSearch/actions/runs/40993150452). Artefato `PokeSearch-LT187-Android16-Upgrade-Smoke-QA`, ID `12950247083`, ZIP **2.170.008 bytes**, com screenshots da Home LT184/LT187, logs, verificação de assinatura e `RESULT.txt`. [Abrir artefato](https://github.com/LucianoToscano/PokeSearch/actions/runs/40993150452/artifacts/12950247083).
- Android 16 / API 36 confirmou instalação LT184 -> upgrade in-place LT187 via `adb install -r` com **Success**. O mesmo pacote permaneceu com **UID 10216** e `firstInstallTime=2026-10-30 02:43:51`, versionCode 54389 -> 54392. A Home abriu nas duas etapas (Activity status OK), o processo permaneceu ativo e não houve crash fatal registrado na verificação.
- A primeira tentativa [#40992803200](https://github.com/LucianoToscano/PokeSearch/actions/runs/40992803200) falhou por falso negativo do teste: o Android 16 não apresentou `userId=` no formato legado do `dumpsys`. Foi corrigido para `cmd package list packages -U` no script, sem modificar APK nem lógica Android. A segunda execução passou completamente.
- **Limite:** upgrade foi testado num emulador recém-preparado, portanto mesmo UID e data de instalação não são evidência de persistência dos favoritos e sessões reais. Não foram testados no Samsung físico o login Discord/Google, telas de overlay simultâneas, sons no alto-falante ou notificações de encontros reais.

## Checklist físico obrigatório (Samsung Android 16)
- Sem apagar dados, instalar `PokeSearch-v0.01.87-LT187-Size-QA.apk` sobre a versão pública. Verificar se favoritos, localização, filtros e sessão continuam persistidos.
- Conferir Home claro/escuro, arte/PNG-WebP e menus compactos, sem cortes nas duas Pokébolas e no Doce Raro.
- Login Google/Discord, perfis separados, seleção de treinador VIP se disponível; Shiny e busca API ON/OFF.
- Pokébola 1 100% e Pokébola 2 0%: sprites normal/shiny em formas, filtros independentes, favoritos compartilhados conforme LT184; testar sons, sem som, avisos reais, duplicados/expirados e tons personalizados; testar 36 opções em pré-escuta.
- Atualização manual com toque curto, configuração por toque longo, despawn, revelar/copiar coordenadas, Doce Raro, desempenho e ausência de travamentos.
- Guardar capturas/logs e aprovar antes de mudar `main` e distribuição.

## Critério de publicação
- Até essa homologação, **sem merge, Release/latest, alteração do APK compartilhado do Drive, modificação de `atualizacao.json` ou OTA pública**. A LT184 permanece estável e disponível.
- Depois de autorização expressa e homologação: integrar as PRs **na ordem 143 → 144 → 145**, resolver conflitos documentais mantendo a versão oficial, executar CI assinado novamente na `main`, confirmar SHA, versionCode, assinatura e redução final, publicar Release oficial e atualizar o **mesmo ID** público do Drive, baixar ambos e comparar bytes. Não prometer atualização silenciosa em celulares: o atualizador mostra a opção após consulta com aceite Android.
