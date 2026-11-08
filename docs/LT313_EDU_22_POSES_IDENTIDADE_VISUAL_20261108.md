# PokeSearch LT313 — identidade e proporção visual das 22 sprites ociosas do Edu

## Objetivo
O usuário relatou saltos visuais de escala e de identidade ao alternar sprites: cabeça muda, corpo parece menor e movimentos não ficam fluidos. O usuário aprovou novo desenho de referência no chat em 08/11/2026. A solução substitui **somente as 22 poses ociosas** por um novo conjunto visualmente consistente, preservando as outras 45 poses contextuais do tutorial.

## Arte e regras
- Fonte: `atlas_de_sprites_pixelados_do_edu.png`, 1536×1024, 6×4 quadros de 256×256. Algumas células da folha não são usadas por não corresponderem ao pedido; as posições Shiny e Jogando reutilizam três imagens originais padronizadas da LT312. Total: **22 quadros**.
- Fundo da folha tinha fundo quase branco com alfa parcial; removido por extração dos componentes visíveis, de forma a não inserir retângulos brancos. Verificação visual em fundo xadrez escuro no pacote de auditoria.
- Cada frame do novo atlas ocupa **128×128**, personagem visualmente com **112 px da cabeça aos pés**, pés ancorados em **Y=120**, proporções de cabeça/torso/pernas consistentes, efeitos de Pokébola isolados fora da medição do corpo.
- Arte pré-quantizada para 256 cores, WebP **lossless** com transparência, sem anti-aliasing ou filtragem na exibição; atlas **8×3 = 1024×384**, 22 quadros + 2 células vazias.
- Arquivo: `app/src/main/assets/edu_avatar_idle_consistent_22.webp`, SHA-256 **`9ec3afa294d06d9d1cad9db8d4a3256e5f7230623f58cd6819e835192eee1a62`**, 59.618 bytes.
- `EduSpriteAtlas.java` mantém índices originais 0..61 e 62..66, e direciona apenas as posições ociosas para o novo atlas visual. Os quadros de teleporte, arrastado, passes, reides e eventos permanecem intactos.
- O carregamento é opcional e valida o tamanho do asset; na ausência/erro do atlas adicional volta à arte LT312 antiga, sem travar o aplicativo. Memória liberada ao encerrar o assistente.
- Movimentos ociosos existentes mantêm pausas naturais, nunca cortam a sequência por troca aleatória. Interação do jogador continua interrompendo idle. P/M/G = 50/75/100 sem aumentar ou diminuir o ImageView a cada troca.
- A aparência da roupa varia exclusivamente nas versões Shiny ou Armadura Mewtwo. A face é mantida reconhecível nos demais estados. As três poses anteriores de Shiny e Jogando preservadas visualmente como melhor correspondência disponível.

## QA
- Teste específico `node app/tests/lt313-edu-consistent-idle.test.js` confere header WebP lossless, dimensão, SHA-256, mapa exato das 22 poses, memória e fallback, preservação de P/M/G e 67 índices.
- Executar **todos** os testes Node, Android Java, OTA e proteção de assinatura em CI antes do merge.
- Conferência visual em Samsung físico pendente: caminhada esquerda/direita/frente, quatro quadros da Pokébola e especiais, nos três tamanhos.

## Escopo preservado
A LT312 é a base: relógio Edu e exemplo Mega Chandelure, 67 sprites, fala, tutorial E01–E11, botões e long-press, 2 Pokébolas, Doce Raro, API PoGoCoordinates, configurações, dados e certificado original Android. Não altera GPS nem concede passes.
