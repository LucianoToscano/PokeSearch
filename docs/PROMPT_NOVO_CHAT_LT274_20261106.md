# CONTINUAR POKESEARCH — APÓS LT273 (preparar LT274)

Repositório: https://github.com/LucianoToscano/PokeSearch

## Estado oficial comprovado
- **LT273 · 0.02.73 · versionCode 54477**, APK assinada pública: https://github.com/LucianoToscano/PokeSearch/releases/tag/v0.02.73-54477
- Asset `PokeSearch-v0.02.73-LT.apk`, **33.612.358 bytes**, SHA-256 `a2e92d2ee73acafd831d10607159a6e481eb1b75131ae7f1e8fde3feb77c6e37`. Publicado em `2026-11-06T21:41:42Z`.
- PR #263 merge `3f6aea55cd1020046911dd6a566e791d1fca46cc`; todos os testes Node/Java/PvE/OTA/P/M/G/Beta verde, oficial #42298287130, QA assinada #42298287129 success.
- PR #262 duplicada foi fechada sem merge após #263 já mesclada; não aplicar novamente os mesmos patches.
- **Testes físicos Samsung, instalação/OTA no telefone e APK Drive continuam não comprovados**.

## Documentos primeiro
1. `docs/GUIA_MESTRE.md`
2. `docs/LT273_AUDITORIA_FINAL_POS_RELEASE_20261106.md`
3. `docs/LT273_AUDITORIA_UI_RANKS_PAINELS_20261106.md`
4. `docs/LT272_MARCADOR_EVOLUCAO_CANTO_20261106.md`

## Estado de interface que deve ser preservado
- Faixa com cinco ícones [Raides][GL][UL][ML][RG], `#rank` acima, bandeira centralizada, símbolo de evolução discreto ao canto, sem colidir.
- Raides, GL, UL, ML e Rank Geral abrem painéis próprios e se retraem, e segundo toque fecha. Botão Ataques Recomendados **dentro da avaliação da liga**, espécie/evolução e fonte corretas.
- Rank Geral tem seletor GL/UL/ML acessível com menus WebView próprios e Top/Minha posição/filtro compactos; Rank Classe continua independente por 4096 IVs.
- Sem botões redundantes Copiar/Compartilhar/CSV visíveis, sem grandes parágrafos de proveniência na tela; origens e cálculos continuam internamente.
- Cabeçalho da liga: ícone + nome colorido + Ataques + X, sem linha duplicada. Golpes capturados e Local após os painéis, antes de Pegar Coordenadas. MT Elite ligado ao seu golpe.

## Pendências e próxima etapa
1. Testar Samsung P1/P2 real em P/M/G, claro/escuro, toque, scroll, conteúdo até a última linha e fechamento de painel.
2. Testar Rank Geral GL/UL/ML com espécies diferentes, filtros Top e Minha posição, Rank Classe por IV e evolução/Mega.
3. Testar atalhos Raides, golpes normais/Elite, localização, favoritos, alertas, duas Pokébolas e atualizador OTA real. Não inferir resultados físicos com base em CI.
4. Confirmar ou solicitar cópia da APK LT273 para Drive; não confundir APK com PNGs de ícones.
5. Somente novos bugs reproduzidos: corrigir com testes de regressão sem empobrecer funções, PR, CI verde, merge, APK com assinatura permanente, `releases/latest` e SHA-256, Arquivo Mestre e auditoria final. Rollback LT272.
