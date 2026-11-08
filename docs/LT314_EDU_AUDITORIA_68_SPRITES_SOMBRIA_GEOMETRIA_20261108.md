# LT314 — Auditoria integral e estabilização das 68 sprites do Edu

Data: 08/11/2026. Base oficial: LT313 0.03.13, versionCode 54519.

## Evidência

Vídeo Samsung `Screen_Recording_20261108_132224_One UI Home.mp4` e relato de saltos laterais, encolhimento nas poses Jogando e inconsistência de rosto, corpo e proporções entre sprites. Nova arte Sombria enviada em `1794155856086.png` (1536×1536, fundo preto, aura roxa).

## Inventário auditado

- **62 sprites originais LT309**: `edu_avatar_atlas_62.webp`, 1024×1024, 8×8; SHA original preservado. Incluir quadros de emoção, passes, reides, carregamento, arraste e teleporte.
- **5 sprites especiais LT312**: `edu_avatar_extra_5.webp`, 640×128.
- **22 poses consistentes LT313**: `edu_avatar_idle_consistent_22.webp`, 1024×384 (substituem visualmente índices já existentes, não aumentam contagem).
- **1 nova Sombria**: índice **67** (68º quadro), PNG paletizado 128×128, transparência real, armazenado em `edu_sombria_68.b64` (PNG em Base64 UTF-8) para preservar tamanho do APK. Hash binário esperado **fe3f7a29464148e8e1e032c6770aefa542b7a70caf7a1fe6264254a2d0b5ca3c**.
- **Total único de estados visuais: 68**; sem renumerar nenhum índice 0–66.

## Medições e correção de geometria

Na auditoria local, a coleção LT313 de 22 poses apresentava posição horizontal da face variando aproximadamente de **54,96 a 69,04 px**, mesmo quando o retângulo externo era 128×128. Após alinhar o rosto ao eixo de referência `X=64`, a amplitude simulada caiu para aproximadamente **61,3 a 64,3 px**. O usuário percebia essas mudanças como movimentos bruscos laterais.

A classe `EduSpriteGeometry` analisa uma única vez os pixels opacos do quadro e localiza a região de pele do rosto, excluindo acessórios e brilhos; aplica translação inteira para o eixo X=64 e pés Y=119, em tela RGBA 128×128, sem filtro nem antialiasing. O corpo tem referência de 112 px, mas as 22 poses consistentes não recebem novo redimensionamento. As demais são limitadas por faixa de escala para evitar distorções; a transformação é armazenada no cache das sprites e não roda a cada frame.

Os **9 quadros de teleporte, índices 52–60, preservam o desaparecimento e a alteração proposital da silhueta**: forçar tamanho constante neles destruiria a animação. Algumas poses com ícones e passes muito extensos também limitam a translação para não cortar o acessório (especialmente índice 49). Isso não constitui promessa de identidade artística absolutamente idêntica: ajustes desenhados à mão nas fontes individuais poderiam melhorar ainda mais expressões, ângulos e figurinos.

## Sombria

- A sprite Sombria não recebe fundo preto; os pixels escuros internos da roupa/cabelo são preservados, o exterior é transparente. A aura roxa é semitransparente.
- `EduSpriteAtlas.indexForState("edu_sombria")` e `indexForState("ansioso")` apontam ao índice 67.
- Somente estados de espera real (evento, conferência de passe, chegada, mapa/reide e Kiribati quando aplicável) acionam a Sombria pelo estado de diálogo. **Não é adicionada à rotação ociosa**.
- Se o asset opcional Sombria estiver ausente ou inválido, o Edu usa `parado` sem travar.

## Preservar

Manter relógio único, Mega Chandelure por fuso IANA, roteiro E01–E11, 22 poses ociosas com pausas naturais, as 67 anteriores, P/M/G (50/75/100, G inicial), overlay P1/P2, Doce Raro, PvP, APIs, favoritos, dados e certificado Android. Não alterar GPS, data do Android, passes reais, mensagens ou autorização de captura.

## Auditoria e QA

- Arquivo técnico: `auditoria_68_geometria.csv` (inventário e antes/depois dos 68 quadros, produzido localmente).
- `app/tests/lt314-edu-68-geometry-shadow.test.js`: valida índices 0–67, PNG real 128×128 e SHA, âncoras, suavização desativada, fallback, auditoria de cache e gatilhos da Sombria.
- Executar QA Node completo, Java Android, OTA e build oficial protegido para LT314. Não publicar se houver falha.
- **QA física Samsung permanece pendente**; só o usuário pode confirmar a percepção de fluidez visual após instalar. Não afirmar homologação sem vídeo/print.
