# Edu — referência visual canônica da sprite #42 (09/11/2026)

## Decisão do proprietário
A imagem enviada em 09/11/2026 e explicitamente aprovada pelo proprietário é a **referência visual definitiva do personagem Edu Parado**, índice **#42**, para toda a coleção de 68 sprites (índices 0–67). Esta decisão prevalece sobre desenhos alternativos ou versões recriadas anteriormente quando houver diferença visual. Usar a imagem como **modelo artístico**, não como licença para alterar os outros movimentos sem auditoria.

## Preservação do arquivo mestre
- Arquivo preservado na Biblioteca pessoal: `/PokeSearch/Arquivos Mestres/Edu/Edu_Parado_42_PADRAO_OFICIAL_2026-11-09.jpg`
- SHA-256 dos bytes recebidos: `dd995781c039972bd72ea22bc2d89c7c32c04cf056d1dfd96d3e94d735fec1cc`
- Dimensões reais: **1536 × 1536 px**; formato **JPEG RGB**, apesar do nome `.png` do anexo original. A cópia na Biblioteca está renomeada com extensão `.jpg` sem modificar os bytes.
- A referência tem **fundo preto**, sem canal alfa; portanto **não substituir diretamente** os quadros transparentes do atlas Android por esse arquivo. A criação de derivados transparentes exige inspeção visual antes da integração.
- Enquadramento mensurável aproximado na imagem enviada, para conferência: silhueta colorida em x=451…1085, y=123…1413, centro horizontal x=768 no quadrado 1536×1536. Essas coordenadas dizem respeito ao *arquivo de referência*, **não** às coordenadas do atlas 128×128.

## Aparência obrigatória
- **Cabeça/rosto:** cabelo castanho escuro volumoso com mechas de pixel art, formato de cabeça e orelhas preservados; óculos grandes de aro claro com ponte e olhos escuros reconhecíveis; sobrancelhas escuras; bigode discreto, sorriso leve e cavanhaque curto.
- **Roupa-base:** jaqueta vermelha com gola/capuz amarelo, alças verdes da mochila, camiseta azul-clara, calça azul-escura e tênis vermelhos e brancos.
- **Pose-base:** corpo inteiro de frente, ereto e simétrico, braços relaxados ao lado do corpo, mãos expostas e pés apoiados na mesma linha; contornos de pixels nítidos, sem brilho inventado.
- **Nas outras 67 poses:** não alterar identidade do rosto/cabelo/óculos; preservar relação cabeça–tronco–pernas, escala e posição de referência, salvo movimentos físicos explícitos. Fantasias Mewtwo, Mewtwo Shiny, Shiny e Sombria podem alterar traje/efeitos, **não a estrutura anatômica**. Objetos e efeitos não podem obrigar a reduzir o personagem.

## Geometria/animação do atlas Android
- Sprite do atlas: `#42` é a âncora. Células atuais **128×128**, ampliação de exibição **512×512**. No atlas, o projeto já define rosto x=64, pés y=119 e altura corporal de referência ~112 px (valores que **não** devem ser inferidos diretamente do JPEG de referência).
- Numa revisão futura, comparar as 68 sprites com a imagem canônica e quadro anterior/posterior. Priorizar ausência de saltos laterais e de mudanças não intencionais da cabeça ou dos pés; acessórios fora da medição do corpo. Preservar animação especial de teleporte 52–60.
- **Não afirmar** que o arquivo JPEG é um master de pixel art redesenhado em 512×512 ou que o upscale atual recupera detalhes ausentes da arte 128×128.

## Estado da integração
Este registro fixa a **referência artística oficial** e preserva o arquivo original na Biblioteca. **Não substitui automaticamente** o atlas `edu_avatar_uniform_68_lt316.b64`, não altera o comportamento do aplicativo nem inicia build/release/OTA. Para alterar efetivamente as sprites publicadas, produzir derivados coerentes, auditar 68 poses e solicitar aprovação de atualização.

**Importante para outras IAs:** consultar esta especificação e o arquivo mestre preservado antes de redesenhar, retocar ou gerar novas poses do Edu. Não trocar a referência pela imagem gerada anteriormente quando houver alguma divergência.
