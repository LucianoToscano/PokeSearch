# LT312 — Escala corporal fixa nas 22 poses automáticas do Edu

## Relato
No vídeo do Samsung `Screen_Recording_20261108_103547_One UI Home.mp4` fornecido pelo usuário, as sprites aparentam encolher ao mudar de pose. O atlas oficial de 62 quadros tem a pose `parado` com **112 px** de altura visível do corpo dentro de células 128×128; nas quatro posições da Pokébola o corpo mede aproximadamente **84–86 px**. A célula e o ImageView têm tamanho constante, mas a margem transparente varia.

## Regra adotada
- Nas **22 poses autorizadas para o estado ocioso** (1 parado, 4 Pokébola, 4 frente, 4 esquerda, 4 direita, 1 Shiny, 2 Jogando e 2 Armadura Mewtwo), o corpo do personagem usa **112 px de altura de referência em célula 128×128**, inclusive com acessórios ou efeitos maiores.
- **Não** ampliar ou reduzir o `ImageView` quando trocar a sprite. As escolhas P/M/G 50/75/100 continuam definidas pelo jogador e aplicadas à mesma escala.
- Alinhar os pés à linha virtual Y=120. Priorizar cabelo, rosto, tronco e pernas do personagem; balões, Pokébola e brilhos não determinam a altura corporal.
- Para Pokébola lançada (#2), desenhar separadamente o efeito pequeno acima/ao lado; não diminuir o corpo para caber o objeto.
- Pixel art sem blur (`setFilterBitmap(false)` e `setAntiAlias(false)`).
- Manter atlas antigo 62 intacto (SHA-256, indices, fallback). A transformação ocorre na criação do drawable de cada quadro, é armazenada em cache e liberada com o serviço.
- Cinco poses novas 62–66 continuam adicionais e opcionais: a ausência do atlas complementar mantém as 62 antigas e suas animações operando.
- **Não representa confirmação do estado do jogo**, não muda tamanho de balões nem interfere no relógio único.

## Testes
`node app/tests/lt312-edu-fixed-idle-scale.test.js` valida lista completa, referência 112 px, alinhamento, rendering sem interpolação, respeito aos tamanhos P/M/G, fallback e preservação dos quadros existentes. Executar QA Node completa, compilação Java e testes visuais no Samsung antes de qualquer release.

## Pendente
A rotação autônoma das 22 poses não deve ser ativada sem revisão do agendamento de idle e sem incluir o atlas binário complementar no APK. Alteração da escala do código na branch LT312 **não constitui publicação oficial**.
