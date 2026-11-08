# LT315 — Atlas único de 68 sprites do Edu

Base: LT314 (0.03.14 / 54520). O usuário informou que quadros ainda mudavam de identidade, tamanho e posição no Samsung.

## Alteração no aplicativo
- Refeito atlas visual completo de 68 quadros com 8 colunas x 9 linhas e células 128x128, transparência RGBA e WebP lossless.
- Arquivo real: app/src/main/assets/edu_avatar_uniform_68.webp (221178 bytes), SHA-256 90c363203dd9c8ed7e014237b13eded699d1030a59463d7c41ae51191ce52893.
- Corrigido o recorte da última linha para não perder cabelos/cabeças dos quadros 64 a 67.
- Todas as poses usam a mesma escala nominal e são centralizadas pelo corpo/rosto (não pela Pokébola, aura ou símbolo). Pés alinhados à mesma linha-base.
- Auditoria local: 68 células válidas; centro visual mediano x=63 px, média aproximadamente 63,5px, variação-padrão ~2,7px dos quadros detectáveis.
- EduSpriteAtlas carrega o novo arquivo em prioridade para TODOS os índices 0..67, sem transformar novamente o bitmap (evita duplicação de escala e saltos).
- Mantidas fontes antigas como fallback, inclusive 62 originais, cinco especiais, atlas 22 ociosos e Sombria isolada.
- Não alterar P/M/G (50/75/100), relógio, E01–E11, P1/P2, Doce Raro, localização, login, assinatura e atualizador.

## Testes
- app/tests/lt315-edu-68-uniform-atlas.test.js verifica hash, dimensões VP8L, indices, fallback, ausência de reescala e memória.
- Requer regressões Node, compilação Java Android, OTA, assinatura v2 e integridade do APK antes de publicar.
- QA física no Samsung pendente; não interpretar sucesso de CI como confirmação de fluidez em aparelho.

## Auditoria de tamanho e preservação do fallback
- Primeira tentativa de publicar LT315: build e assinatura concluídos, mas o gate oficial Validate APK and signer falhou. O workflow exige APK com menos de 35.000.000 bytes.
- A nova arte de 68 sprites é preservada em resolução/qualidade integral: 221.178 bytes, WebP lossless.
- Para recuperar margem de espaço sem retirar o novo atlas, somente o fallback legado das 62 sprites foi recompactado em WebP lossless com 192 cores, dimensões 1024x1024, 133.078 bytes, SHA-256 69c1ea7b0f5dec4292d90cb62dae891c95835017204274cc4121ca3698f6889a.
- O arquivo original exato da LT309 foi preservado no repositório em docs/legacy-assets/lt309/edu_avatar_atlas_62-original.webp: 822.866 bytes, SHA-256 5c81ba10976328ab479bf1d04d9082203cb8c5f45ee403f23265b05f6947942f.
- Essa mudança economiza 689.788 bytes no APK sem tocar na arte uniforme de 68 quadros e sem eliminar a alternativa em caso de falha de leitura do novo atlas.
- Gates Node anteriores atualizados para conferir tanto o fallback compacto quanto a fonte histórica íntegra. Não alterar limite de APK nem controles de assinatura.
