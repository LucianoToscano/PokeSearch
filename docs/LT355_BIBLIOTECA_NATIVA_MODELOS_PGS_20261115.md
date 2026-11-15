# LT355 — biblioteca nativa de modelos PGS (contrato de publicação)

O APK PGSharp enviado foi auditado somente de forma estática. Seus bundles Unity e seus
ícones de Pokédex **não** foram copiados. A biblioteca embarcada começa vazia.
Não apresentar Metagross ou outros Pokémon como "nativos" enquanto não houver modelo
real da miniatura do feed, autorização para redistribuição e homologação em aparelho.

## Ingestão controlada
- Adicionar somente imagens PNG/WebP originais ou com permissão documentada em
  `app/src/main/assets/pgs-native/models/` (nome de arquivo minúsculo, simples).
- Registrar em `pgs-native/manifest.json`: `dex` (Pokédex), `form`, `variant`,
  `width`, `height` (16–92), `asset`, `sha256` minúsculo, `rights` =
  `redistribution-approved`, `validation` = `device-verified` e `evidence`
  (referência auditável do teste físico/autorização; mínimo 8 caracteres).
- Até 48 modelos por pacote. Hash SHA-256 dos bytes exatos e dimensões reais
  são checados localmente; arquivo fora do diretório autorizado nunca é aberto.
- Pacote de sprites é ligado à versão **exata** de `com.nianticlabs.pokemongo`,
  `providerVersion`. Quando versão do jogo não é visível/compatível, nativos
  falham fechados. Amostras pessoais continuam disponíveis.
- Modelo pendente, sem autorização, hash divergente ou inválido: ignorar. Nenhum
  template ilustrativo/de Pokédex deve ser usado para tocar automaticamente.

## Dados preservados
- `pgs_buscas_auto_models_v1` mantém modelos pessoais; modelos nativos não
  são escritos nas preferências, não podem ser excluídos nem substituem os PNGs
  do usuário. Prioridade de listagem: usuário antes do nativo.
- Restaurar amostras preserva largura/altura declaradas. Backups antigos sem
  dimensões legíveis voltam a 68×52; conteúdo nunca é apagado para migrar.
- Filtros continuam limitados a 10 espécies; desmarcar não apaga modelos.
- O app não baixa recursos do fornecedor, não injeta código no jogo, não
  contorna avisos de segurança e não dispensa a confirmação manual de passageiro.

## Aceite físico pendente
Captura autorizada do feed Metagross, fundos/estados e versões, preview ◎, dois
frames idênticos, posição real do gesto e reação do jogo num Samsung. Registrar
latência, bateria, falso positivo e permissões. Teste Java/Node/CI não comprova
teleporte, shiny ou compatibilidade física. Para atualização remota futura,
exigir assinatura criptográfica própria + anti-rollback + rollback antes de
habilitar distribuição de pacotes; não confiar apenas em HTTPS ou hash fornecido
pelo próprio servidor.
