# LT193 — Auditoria da rejeição de IV decimal da API (30/10/2026)

## Sintoma ainda presente na LT192
A captura do Samsung mostra Raw IV `0/15/15`, resultados ocultos e alerta `IV não comprovado`. As versões LT191 e LT192 não resolveram esse caso em aparelho físico. Nenhuma publicação deve ser chamada de homologação do Samsung sem teste autenticado.

## Causa reproduzível no código
- `app/src/main/assets/api_result_contract.js`, `parseIV(raw, percent)`: o parser aceitava `raw_iv="0/15/15"` e `iv_percent=66.67`, mas devolvia o percentual **decimal** `66.67` para o cartão.
- `app/src/main/java/com/lucianotoscano/pokesearchoverlay/OverlayService.java`, `verifiedTargetCriteria()`: antes da LT193, exigia `ivPercent` textual **inteiro**. Portanto, rejeitava um cartão de IV real `0/15/15` apenas porque o percentual observável era representado como `66.67`, e `applyCollectedResults()` podia mostrar `IV não comprovado`.
- O teste LT192 só checava o **modo** e a mensagem para IVs diferentes (exemplo 7/15/5); não simulava o trânsito de `66.67` pelo normalizador real até a validação nativa. O problema persistiu.
- **Este é um defeito determinístico na integração confirmado pelo código.** Não há captura do corpo autenticado da API que comprove que a consulta fotografada recebeu exatamente `66.67`; não atribuir sem ressalva todo resultado vazio a esta causa.

## Correções
1. No normalizador, só aceitar porcentagens matematicamente compatíveis com o IV A/D/S (representação inteira, 1 casa, 2 casas ou precisão completa). Internamente expor o percentual inteiro canônico dos 46 valores possíveis. Assim `0/15/15 + 66.67` vira `0/15/15 + 67`; valores contraditórios são rejeitados.
2. Validação de segurança Android agora reconhece os mesmos percentuais válidos, inclusive entradas decimais recebidas de outras fontes, e compara o IV exato. Nunca permite `7/15/5` em uma consulta `0/15/15`.
3. A análise dos cartões rejeitados também diferencia percentual decimal verificado de IV ausente ou inválido. Conserva cache por modo, bloqueios de alertas, máximo de 10 resultados, quotas e tokens protegidos.
4. Ambas Pokébolas usam `OverlayService` (a segunda por `SecondaryOverlayService`) com preferências independentes; não há alteração de UI ou movimento automático.

## Teste que faltava
`app/tests/lt193-api-decimal-iv-native.test.js`: contrato real de requisição Raw `0/15/15`; normalização do card retornado pelo provedor com `66.67` e preservação do card com `67`; `97.78` → `98`, `60` → `60`, `0`, `100`; rejeição de porcentagens incompatíveis; filtro exato e herança P1/P2. Não é uma simulação de login nem comprovação do estado dos spawns atuais.

## QA físico ainda necessário
- Instalar a futura LT193 sobre LT192 sem apagar dados, abrir P1 e P2.
- Com API ON e sessão autorizada, buscar 0/15/15 e 0/13/13 quando o site oficial mostrar um spawn comprovado com esse IV. Registrar `siteCount`, cartões válidos/rejeitados e status do app **sem JWT, cookies ou IDs pessoais**.
- Comparar API ON/OFF, IV% 0–92, 100%, GL/UL, refresh e histórico sem transferir resultados entre modos.
- Se um IV realmente não estiver disponível, mostrar zero resultados, sem inventar cards e sem usar outro IV.
- A API autenticada e a homologação física Samsung permanecem **NÃO EXECUTADAS** nesta execução.

## Publicação
Candidato incremental **LT193 `0.01.93` / versionCode `54398`**. A publicação/merge só devem ser tratados como concluídos após Node, Android/R8, verificação de assinatura, hash, GitHub Release/latest e Drive confirmados separadamente.
