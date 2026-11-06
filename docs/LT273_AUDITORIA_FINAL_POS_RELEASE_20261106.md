# LT273 — Auditoria final independente pós-release

Data: 06/11/2026 · Fonte: GitHub `main`, release pública, PR, execuções oficiais e QA assinada.

## Artefato oficial
- Versão: **LT273** · `0.02.73` · `versionCode 54477`.
- Tag: https://github.com/LucianoToscano/PokeSearch/releases/tag/v0.02.73-54477
- Publicação: `2026-11-06T21:41:42Z` (**18:41 Brasília**); `draft=false`, `prerelease=false`.
- APK: https://github.com/LucianoToscano/PokeSearch/releases/download/v0.02.73-54477/PokeSearch-v0.02.73-LT.apk
- Nome: `PokeSearch-v0.02.73-LT.apk` · **33.612.358 bytes** · asset `uploaded`; limite 35.000.000 bytes aprovado.
- SHA-256: **`a2e92d2ee73acafd831d10607159a6e481eb1b75131ae7f1e8fde3feb77c6e37`**.
- Merge: [PR #263](https://github.com/LucianoToscano/PokeSearch/pull/263) → commit `3f6aea55cd1020046911dd6a566e791d1fca46cc`.

## Gate de regressões
| Gate | Execução | Resultado |
| --- | --- | --- |
| Node completo | [#42297909912](https://github.com/LucianoToscano/PokeSearch/actions/runs/42297909912) | success |
| Node QA | [#42297909978](https://github.com/LucianoToscano/PokeSearch/actions/runs/42297909978) | success |
| QA core | [#42297909955](https://github.com/LucianoToscano/PokeSearch/actions/runs/42297909955) | success |
| Java | [#42297910038](https://github.com/LucianoToscano/PokeSearch/actions/runs/42297910038) | success |
| PvE | [#42297909930](https://github.com/LucianoToscano/PokeSearch/actions/runs/42297909930) | success |
| OTA | [#42297909948](https://github.com/LucianoToscano/PokeSearch/actions/runs/42297909948) | success |
| P/M/G visual | [#42297909949](https://github.com/LucianoToscano/PokeSearch/actions/runs/42297909949) | success |
| APK privada com signer isolado | [#42297909894](https://github.com/LucianoToscano/PokeSearch/actions/runs/42297909894) | success |
| Oficial preflight + publish | [#42298287130](https://github.com/LucianoToscano/PokeSearch/actions/runs/42298287130) | success + success |
| QA assinada pós-merge | [#42298287129](https://github.com/LucianoToscano/PokeSearch/actions/runs/42298287129) | success |

## Alterações realmente mescladas
- Filtros Topo/Minha posição/Top alinhados em grade compacta, e opções de Top e de liga por menus próprios WebView para não depender de popover nativo Android.
- Rank Geral seletor GL/UL/ML troca tabela, posição e espécie conforme fonte; Rank Classe continua avaliação de 4096 IVs separada do RG.
- Cabeçalho PvP uma única linha com bandeira GL/UL/ML, texto da liga colorido e ações Ataques/X. Ícone Elite na linha do ataque correspondente; ataques versionados específicos da liga.
- Raides sem bloco extenso Fonte e critérios, dados de origem ainda preservados; não inventa segundo Carregado nem counters específicos.
- Seção capturada Golpes/Local movida para depois dos painéis e antes do botão Coordenadas.
- Marcador de evolução LT272 branco/verde reduzido e reservado na área inferior direita, com bandeiras centrais preservadas e geometria P/M/G testada.
- Cinco atalhos de Raides/GL/UL/ML/Rank Geral, Pokébolas P1/P2, Modos, alertas, favoritos, localização, sprites, calculadora A/B PC/PS, fontes PvP/PvE, OTA e assinatura preservados.

## Controle de mudanças simultâneas
A PR #262 tratava a mesma tarefa e foi encerrada **sem merge**, após a PR #263 mesclada com todos os gates de CI aprovados. A branch original permanece no histórico, mas não compõe o APK LT273. Não misturar os dois conjuntos de patches ou publicar `54477` duas vezes.

## Pendências
- Testes em **Samsung físico P1/P2**: seis ações de abertura/retração, clique GL/UL/ML, filtros/Top/Meu IV, leitura de símbolos em fundos variados, rolagem até o fim, ausência de corte, estabilidade da janela e atualização integrada Android.
- Confirmar instalação real e permissões do atualizador, sem presumir instalação silenciosa.
- **Sincronização da APK com Drive** não comprovada.
- Rollback oficial LT272 `v0.02.72-54476` disponível.

## Continuação
Usar `docs/PROMPT_NOVO_CHAT_LT274_20261106.md`. Não declarar teste físico nem Drive realizado sem evidência; preservar as funcionalidades completas.
