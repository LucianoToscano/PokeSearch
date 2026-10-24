# LT66 — Homologação menu e PvP Samsung

Branch isolada `fix/lt66-samsung-menus-scroll-20261024`, base LT65 `aad116a3fc1ee2b863b61c9ba71629fa9d4875db`. PR #39 Draft, sem merge e sem Ready.

APK a gerar exclusivamente pelo workflow assinador: `PokeSearch-v0.00.66-LT.apk`; pacote original `com.lucianotoscano.pokesearch`, versionCode `54264`, versionName `0.00.66`. Exigir fingerprint persistente `34766c15d09013ad65873f9976539c8fa2f826e917dae3af57ea628cad689e8e` e SHA-256 do artefato. Se CI não comprovar integridade, não distribuir arquivo.

Testar 13 suítes Node, Java PopupTouchGeometry, :app:compileDebugJavaWithJavac / testDebugUnitTest / assembleDebug. Aprovação física Samsung separada: modo à esquerda/direita, Sexo, Favoritos, Notificações, Localização, PvP rolado até fim, retorno de filtros, coordenadas e dados preservados. O áudio do MP4 está presente, mas não há transcrição confiável obtida para atribuir mais instruções não escritas.

## Tentativa de build 2
A tentativa 1 falhou somente nos contratos antigos de teste de Modo que exigiam inputs sempre vazios. O comportamento LT66 agora mantém valores de IV e ranking existentes; testes UX e LT62 atualizados para a nova exigência, sem enfraquecer validações numéricas ou a confirmação explícita ✓. Repetir build e validar certificado.
