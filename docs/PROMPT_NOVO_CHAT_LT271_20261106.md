# CONTINUAR POKESEARCH — APÓS LT270 (preparar LT271)

Repositório: https://github.com/LucianoToscano/PokeSearch

## Base pública exata
- **LT270 · 0.02.70 · versionCode 54474**; https://github.com/LucianoToscano/PokeSearch/releases/tag/v0.02.70-54474
- APK `PokeSearch-v0.02.70-LT.apk`, **33.606.774 bytes**, SHA-256 `3e883e605061a82e87418952978babf87418b1e5a8355016dfee6f4afa366bab`; publicada `2026-11-06T18:40:49Z`.
- PR #258 mesclada `ba2ab97eff6e7ffbc6e56ed003df07a7be454ce7`, 8+ gates de CI aprovados; oficial #42272288403 `success`, QA assinada #42272288415 `success`.
- Versão anterior LT269 `0.02.69`, code 54473, rollback disponível. **Não presumir que Samsung instalou ou Drive recebeu APK**.

## Leia primeiro
1. `docs/GUIA_MESTRE.md`
2. `docs/LT270_AUDITORIA_FINAL_POS_RELEASE_20261106.md`
3. `docs/LT270_CINCO_ATALHOS_RANK_GERAL_20261106.md`
4. `docs/LT269_AUDITORIA_PTBR_IDS_20261106.md`
5. `docs/LT268_AUDITORIA_FINAL_POS_RELEASE_20261106.md`

## Estado LT270 que deve ser preservado
- Cartão com **cinco botões**: [ícone GL #IV][ícone UL #IV][ícone ML #IV][ícone Rank Geral #meta][Ataques].
- Cada IV é Rank Classe **da forma real** naquela liga. ↳ marca que a classificação pertence à evolução e não prova que um costume evolui. Os números sem dados verificados ficam neutros/disabled, jamais inventados. Mega e projeção de traje **não são elegíveis no GBL**.
- Rank Geral abre tabela do snapshot PvPoke com **seletor GL/UL/ML**, cabeçalho contextual, forma e posição corretas; a linha resume a seleção. Os painéis se retraem mutuamente e segundo toque fecha.
- Reutiliza ícones PNG LT268 transparentes (GL azul/vermelho, UL preto/amarelo, ML roxo/rosa, RG multicolorido), sem sombras externas. **NÃO modificar ícones das duas Pokébolas nem os dos menus Modos.**
- Preservar filtros, favoritos, alertas, duas Pokébolas independentes, PGSharp localização/raio/ordenação, sprites oficiais normais/Shiny/128 eventos, PvP, Raides, recomendações de golpes versionadas, MT Elite/legado, evolução/Mega, calculadora IV A/B, nível, PC/PS, targets e limites, PT-BR corrigido LT269, OTA e assinatura permanente.

## Tarefas pendentes reais
1. Testar **Samsung físico** com os cinco botões nos tamanhos P/M/G, fundos claro/escuro, legibilidade real de ícones, touch, movimentação do overlay, scroll até a última linha e reabertura/retração de PvP, Raides, Calculadora, Golpes.
2. Confirmar que ↳ mostra a forma correta no GL/UL/ML e que o Rank Geral muda tabelas/nomes/números ao selecionar liga.
3. Instalar a LT270 pelo atualizador integrado com confirmação do Android, verificar assinatura/id, favorito e duas Pokébolas.
4. Verificar se APK LT270 está no Drive; não confundir com os PNGs.
5. Só corrigir bugs reproduzidos; criar regressões Node/Java/visual P/M/G, conservar 8+ gates e release protegida.
6. Ao preparar LT271, nova PR + CI verde + merge, solicitar APK permanente, verificar `releases/latest`, SHA, Arquivo Mestre e auditoria pós-release. Nenhuma informação de instalação, teste físico ou Drive sem evidência.

**Regra permanente:** nunca empobrecer PokeSearch, não inventar golpe/rank/counter/legado; manter design compacto, simétrico, transparente e intuitivo.
