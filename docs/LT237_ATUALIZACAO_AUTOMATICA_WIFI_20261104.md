# LT237 — Atualização automática segura no aplicativo (04/11/2026)

## Estado
**Código em branch de desenvolvimento / QA e publicação NÃO comprovada.** O último GitHub Release estável confirmado no início deste trabalho é LT233 / 0.02.33 / 54437. O código da main já tem as melhorias LT236 (Pokébola 2 livre e rank Mega), mas elas **não estão no APK público**. A candidata cumulativa LT237 tem notas 0.02.37 / 54441; nenhum APK LT237 foi assinado, publicado ou testado fisicamente neste registro.

## Comportamento implementado
- Fonte única dos APKs: GitHub `releases/latest`, Release estável, tag/nome/versionCode/digest válidos e acima do `BuildConfig.VERSION_CODE`.
- WorkManager com janela de 30 minutos (horário não garantido devido a Doze/bateria/rede), e consulta na abertura da Home.
- Quando há Release nova, pré-download automático **habilitado por padrão, apenas em rede não tarifada**; cancelado ao deixar essa rede. Configuração na Home: `Baixar atualizações automaticamente no Wi-Fi`.
- Transferência em executor dedicado com exclusão mútua de downloads; cache no diretório privado `updates`. Toda transferência confere tamanho e SHA-256, identidade do pacote, versão, app não depurável e certificado Android v2 permanente antes de renomear o arquivo `.partial`. Um APK já em cache é revalidado com hash e assinatura antes de reaproveitar.
- Após download validado, limpa APKs antigos no mesmo cache privado; a Home identifica a atualização **pronta para instalar**. Aviso nativo de atualização disponível / pronta, respeitando a preferência de notificações e permissão Android.
- Ao tocar em **Instalar atualização**, o APK é **revalidado** e entregue ao instalador oficial do Android com `FileProvider`. O usuário deve confirmar a instalação; não há instalação silenciosa, bypass de Play Protect, Bloqueador Automático Samsung ou permissões especiais.
- O fallback por navegador continua disponível; alterações Java exigem APK completo assinado, não apenas OTA de assets.

## Limitações e próximos gates
1. Validar `app/tests/lt237-automatic-app-updates.test.js` e compilação Java Android em CI no SHA exato da PR.
2. Auditar consumo de dados, teste de retomada após erro HTTP/sem Wi-Fi, cache corrompido, espaço baixo, app fechado, Doze, permissão de notificação negada e dupla Pokébola.
3. Com aprovação de publicação, preparar release oficial **cumulativa** contendo LT236+LT237 usando o certificado permanente, Gradle 8.11.1/JDK 17, e número de versão monotônico (candidata 0.02.37/54441, sujeita a revalidação).
4. Publicação exige runner autorizado com `official-updates`; não colocar keystore/tokens em arquivos ou chat. Verificar a nova tag/asset/SHA-256 e `releases/latest` **antes** de dizer que foi enviado ao app.
5. Instalar sobre LT233 no Samsung **sem desinstalar**, conferir preservação de dados, notificação e instalador, funções P1/P2, Megas e rede. Teste físico ainda pendente.

## Arquivos alterados
- `app/src/main/java/com/lucianotoscano/pokesearchoverlay/GitHubUpdateCenter.java`
- `app/src/main/java/com/lucianotoscano/pokesearchoverlay/MainActivity.java`
- `app/src/main/AndroidManifest.xml`
- `app/tests/lt237-automatic-app-updates.test.js`
- `app/src/main/assets/release_notes.json`

Documentos de continuidade: `AGENTS.md`, `docs/GUIA_MESTRE.md`, `docs/MANUAL_OPERACIONAL_CONTINUIDADE_CI_APK_OTA_DRIVE_20261102.md`, `docs/LT236_ATUALIZACAO_OFICIAL_P2_MEGAS_20261104.md`.
