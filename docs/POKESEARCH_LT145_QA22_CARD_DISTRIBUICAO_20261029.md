# LT145 QA22 — Card compacto, Rank e distribuição
Data: 29/10/2026
Repositório: LucianoToscano/PokeSearch
Branch: feature/lt145-coords-quota-account-20261028
Versão: 0.01.45 (versionCode 54350) — homologação

## Escopo implementado
- Corrigido espaço desperdiçado entre nome e metadados, herdando QA20/QA21.
- Caixas IV/PC/Nv. preservam 23 px, com preenchimento da largura útil e alinhamento à esquerda; dados e 100% verificado não podem ser suprimidos.
- Rank PvP visível em selo dourado independente, sumindo quando não existe valor.
- Rolagem interna habilitada somente quando há conteúdo maior que o espaço físico disponível; evolução PvP permanece opcional.
- Ícone genérico de fallback mais adequado quando não existe arte exata, sem falsear trajes/variantes.
- Sprite de Gengar Halloween mantém escala própria e normalização de alfa quando possível.
- Botão vermelho Pegar Coordenadas, contador, duas Pokébolas, Premium, autenticação e API preservados.

## Homologação obrigatória (Samsung)
1. Pumpkaboo de forma Super/XXL: verificar nome, metadados, tipos, IV, PC, Nv., sem espaço vazio.
2. Shellos West Sea: verificar se arte exata carrega; fallback neutro quando indisponível. Não usar sprite da forma errada.
3. Tympole com Despawn crítico e PC baixo: timer e botão inteiros.
4. Hoppip, Gengar Halloween, Pokémon de nome longo e PC de 5 dígitos: sem colisão.
5. Card comum sem rolagem se conteúdo couber; PvP aberto ou tela baixa ainda permitem rolar.
6. Repetir na segunda Pokébola e verificar copiar coordenadas e alertas.

## Publicação
- QA assinado apenas; homologação visual do aparelho ainda pendente.
- CI e artefato devem ser registrados aqui com SHA/URL somente após confirmação.
- Merge e distribuição global ficam condicionados à aprovação de regressão real no Samsung.
