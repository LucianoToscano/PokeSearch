# PokeSearch LT192 — publicação oficial e correção IV% / Raw IV (30/10/2026)

## Estado verificado
- Versão pública: **LT192 `0.01.92 / 54397`**, `applicationId=com.lucianotoscano.pokesearch`.
- [GitHub Releases/latest](https://github.com/LucianoToscano/PokeSearch/releases/tag/v0.01.92-54397) pública (não draft ou prerelease).
- APK `PokeSearch-v0.01.92-LT.apk`: **29.016.253 bytes**, SHA-256 **`7e44dc13ef79410467cd4521c296c965e68e61435def5d7622a7449f63db9194`**.
- SOURCE_COMMIT do instalador: `aca295f65a988bf1c572c13fe1bec3a8b7691ea0`.
- [GitHub Actions #41022787967](https://github.com/LucianoToscano/PokeSearch/actions/runs/41022787967): **SUCCESS**. Node/OTA, Gradle/R8, integridade, certificado v2 e SHA de release verificados. Assinatura permanente certificada SHA-256 `34766c15d09013ad65873f9976539c8fa2f826e917dae3af57ea628cad689e8e`.
- PR [#153](https://github.com/LucianoToscano/PokeSearch/pull/153) mesclada, commit acima. Alterações descritas em [LT192_IV_92_RAW_MODE_SAMSUNG_20261030.md](LT192_IV_92_RAW_MODE_SAMSUNG_20261030.md).

## Mudanças reais
- Capturas Samsung: Noibat #714 7/15/5, 60%, aparece corretamente em IV% 0–92. Mudar para IV 0/15/15 não significa que 7/15/5 tenha IV desconhecido.
- DOM `probe.js` agora separa `verifiedNonmatchingIv` de `unverifiedIv` e envia informação sanitizada sobre contagem, não IDs/contas.
- `OverlayService.java` aguarda a conclusão do site e diferencia IV verificado, mas não correspondente, de falta real de prova. Lista de novo modo vazia mostra ausência de correspondência confirmada sem relabelar Pokémon antigos. Resultados anteriores do mesmo filtro não são apagados por consulta ambígua.
- Defesa nativa mantém rejeição de entradas inválidas e nunca permite alerta/cópia de resultados de outro filtro. `SecondaryOverlayService extends OverlayService`; P1/P2 continuam isoladas nos respectivos prefs. Não alterados login, limites de quota, JWT ou assinatura.
- Teste `app/tests/lt192-iv-evidence-mode-transition.test.js`; suíte histórica `overlay-ux.test.js` atualizada sem afrouxar a verificação.

## Google Drive — novo arquivo compartilhável
- [LT192 ZIP com APK assinado + relatórios](https://drive.google.com/file/d/1d-nWvh_uycbBARm6frfdepEDthNMsGlD/view), **26.719.608 bytes**, tipo `application/zip`, arquivo confirmado com CRC válido. APK interno 29.016.253 bytes, SHA-256 idêntico à release.
- **Link antigo de APK direto `1XXKGy3AjtDx4uMnt2N4Wd3FVNV0Qn_5P` continua LT187** (nome `PokeSearch-v0.01.87-LT.apk`, tamanho 29.013.825 bytes); não afirmar que foi atualizado. Para APK direto usar o [GitHub Release oficial](https://github.com/LucianoToscano/PokeSearch/releases/download/v0.01.92-54397/PokeSearch-v0.01.92-LT.apk). Compartilhar o ZIP novo via Drive com extração do APK.
- PokeSearch consulta `Releases/latest` para oferecer atualização; Android requer confirmação de instalação.

## Limitações e QA pendente
- **Samsung real com API autenticada: não homologado nesta execução.** Testes automatizados não são evidência de que o PoGoCoordinates retornou spawns 0/15/15 naquela hora.
- Repetir em Samsung: P1 100%, P2 0%, IV% 0–92, Raw 0/15/15 e 0/13/13, GL/UL, rolagem, movimento independente dos overlays, filtros PC/Nível e erros HTTP. Conferir que nenhuma lista de filtros anteriores é rotulada como atual.
- Não mover os overlays deliberadamente nem refatorar `dock.html` nesta correção específica: preservar layout até QA físico.
- Não há mudança de assinatura ou remoção de credenciais. Os arquivos de assinatura nunca entram no ZIP do usuário.
