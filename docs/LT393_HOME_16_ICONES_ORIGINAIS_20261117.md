# PokeSearch — LT393 — Home de 16 módulos (origem v0.03.77 LT)

## Requisitos do proprietário — 17/11/2026

- Recriar a Home da versão oficial 0.03.77 LT (versionCode 54584), preservando arte de fundo, cabeçalho funcional, versão, login, atualização e todos os serviços existentes.
- Exatamente **16 módulos**, sem `Extra`, distribuídos em **4 colunas × 4 linhas**. Nenhuma Pokébola é privilegiada: todas as células têm o mesmo tamanho.
- Usar os ícones enviados em `Iconehome.zip` e `Iconehome (1).zip`, sem inventar ou redesenhar substitutos. O atlas `app/src/main/assets/home-user-icons-atlas.png` usa arte derivada desses arquivos; células vazias são intencionais para as Pokébolas dinâmicas e os dois módulos cujas imagens antigas são reutilizadas.
- As Pokébolas 1 e 2 leem configurações independentes e apresentam a família de imagem dos ícones de resultado flutuantes; não desenhar os números 1 e 2 na arte.

## Grid aprovado

| Linha | Coluna 1 | Coluna 2 | Coluna 3 | Coluna 4 |
|---|---|---|---|---|
| 1 | Pokébola 1 | Pokébola 2 | Auto Hunt | Assistente |
| 2 | Raids | Power Spots | Quests | Rocket |
| 3 | Weather | Rare Candy | Batalhas PvP | Pokédex |
| 4 | Scanner | Trocas | Calculadora | Comunidade |

## Conduta das ações

As opções já funcionais reaproveitam os mesmos botões e listeners que a antiga Home: P1, P2, Auto Hunt, Edu/Assistente, Raids, Power Spots, Quests, Rocket e Rare Candy. `Weather` mantém o estado já existente (sem implementação ativa). PvP, Pokédex, Scanner, Trocas e Calculadora exibem uma indicação de preparação, sem simular operações de banco de dados. Comunidade encaminha para o chat experimental apenas se habilitado, senão informa que a ferramenta está em preparação.

A Home utiliza os mesmos recursos de tema, atualização, suporte, login/perfil, contas PoGoCoordinates e versão. Login de Pokébolas continua sendo administrado no hub PoGoCoordinates. Nenhum filtro, token, localização, conta ou configuração persistida é apagado.

## Arte e limitações de homologação

O atlas embutido é o derivado 256px por célula do pacote do proprietário. A imagem de `Assistente` reutiliza a arte do pacote de 10 ícones previamente integrada para o Assistente do Dia de Reides; a de `Rocket` reutiliza a arte antiga já integrada. As duas Pokébolas derivam suas bases de `dock.html/getResultIcon` e arquivos `result-icons`, em vez de desenhos genéricos.

**Limitação atual:** a espelhagem nativa consulta o estado de filtro salvo em cada overlay, não o ciclo visual completo do WebView: badges especiais (Shiny, rank, background) e um eventual resultado histórico exibido ainda necessitam validação de paridade visual física. Não afirmar correspondência pixel-a-pixel se esses detalhes estiverem presentes.

Testes de código não substituem testes Android reais (Samsung SM-S928B, Android 17 e outros dispositivos). Sem teste físico, estado deve permanecer **pendente**.

## Política de publicação

Origem estritamente v0.03.77 LT; preservar a release e assinatura existentes. O novo APK deve, depois de PR/QA/merge, ter versionCode estritamente maior e ser assinado exclusivamente pelo fluxo protegido oficial. Não criar FastDev ou APK de preview para distribuição. Não publicar enquanto houver falha de compilação ou gate obrigatório.
