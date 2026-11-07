# LT306 — Edu: balão solto conectado ao treinador, sem painel duplo
Data: 07/11/2026 · Base oficial: LT305 `0.03.05` / versionCode `54511`
Estado inicial: alteração em branch de QA, publicação solicitada explicitamente pelo proprietário.

## Evidência física que motivou a mudança
Captura enviada do smartphone mostra uma caixa retangular escura imensa, com "Edu", hora, botão X, balão branco dentro e botões presos ao mesmo painel. A cauda antiga apontava para baixo, mas a sprite do Edu estava isolada à direita e acima da janela. Foi considerada confusa, não intuitiva e com fundo desnecessário.

## Comportamento solicitado e implementado
1. **Sem caixa externa na conversa:** `panel.setBackgroundColor(Color.TRANSPARENT)`; o próprio balão branco ocupa o espaço da fala, e o restante deixa o Pokémon GO/fundo do celular visível. Configurações e entrada de data podem usar fundo apenas durante sua exibição, nunca na conversa normal.
2. **Um só balão de quadrinhos:** `EduSpeechDrawable` desenha fundo branco, borda fina e cauda horizontal no mesmo `Path`. Não há mais `speechTail` separado abaixo da fala. O sentido esquerdo/direito da cauda é calculado conforme a posição atual da sprite.
3. **Posição integrada:** a janela de fala se ancora ao lado do personagem Edu, com preferência pelo lado esquerdo quando couber; segue seu movimento. Arrastar o identificador compacto move também a sprite, em vez de deixá-los desconectados. A posição antiga do painel gigante não determina a nova ancoragem.
4. **Botões independentes:** as ações ficam abaixo, com espaçamento real, fundo branco e bordas arredondadas em pílula. Não pertencem ao balão nem ficam cercadas por outro painel.
5. **Identificação discreta:** cabeçalho reduzido a pequeno chip Edu/horário e X de recolher.
6. **Sem texto supérfluo inicial:** a saudação faz uma pergunta, sem legenda padrão "Uma resposta por vez" que apenas ocupava a tela.
7. **Preservar os ajustes ocultos:** segurar a sprite 1,2 segundo mantém o menu técnico existente; tamanho G padrão 100 pixels físicos, P/M e escolhas antigas persistem. MediaProjection/OCR continua protegida e nunca avança o jogo automaticamente.

## Provas e limites
- Testes estruturais em `app/tests/lt304-edu-conversation-ui.test.js` verificam remoção da moldura, cauda como parte do próprio contorno, orientação ligada à sprite, botões separados e arraste conjunto.
- Antes de integrar, verificar em CI Node QA, LT169, LT211, Android Java LT62 e LT173 OTA no último commit exato.
- Depois do merge, solicitar Release via `release/official-request.json` e workflow oficial protegido; nunca publicar build não assinado ou trocar a chave.
- **Pendente teste físico Samsung:** imagem real no jogo em dois lados da tela, fonte ampliada, gesto de 1,2 s, deslizamento/recorte, abertura de configurações, autorização de compartilhamento Android, coexistência P1/P2 e Doce Raro.
- Não inventar homologação física, instalação silenciosa ou passes efetivamente obtidos. Método comunitário permanece não garantido e pode violar Termos de Pokémon GO.

Versão candidata: LT306 `0.03.06` / `54512`, label interno `51310`. Somente se Release/latest e versão QA permitirem monotonicidade.
