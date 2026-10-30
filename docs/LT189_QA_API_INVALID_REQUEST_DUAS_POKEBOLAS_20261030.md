# LT189 QA — Pesquisa inválida em P1 e P2 após LT188 (30/10/2026)

## Evidência relatada
Capturas do proprietário no Samsung exibem simultaneamente as duas Pokébolas sem resultados, com símbolo ! e aviso `API: invalid-request`. Ao menos uma delas usa 100%, a outra 0%. Não se vê corpo HTTP ou código específico no print.

## Rastreamento da falha
- `api_browser_transport.js` traduz **HTTP 400 ou HTTP 422** de POST `/search` em `invalid-request`. Isso não é, por si, prova de instabilidade de rede ou sessão.
- A LT188 alterou o formato de `api_result_contract.js`: com `pvp_mode=false`, `pvp_league` e `pvp_include_pre_evolutions` passaram de valores tipados (`great`, booleano) para `null`. Todos os modos não-PvP (100%, 0%, Raw, IV%) compartilham esse formato. A LT187 mantinha enum/booleano mesmo com PvP desligado.
- O Guia Mestre histórico registra filtros exportados do site com `pvp_mode=false` e `pvp_league="great"`. **Hipótese forte, mas não confirmação do esquema atual do provedor:** o servidor rejeita o `null` em campos cujo esquema exige tipo string/boolean, apesar do modo PvP desligado.

## Alteração mínima e deliberada
- Restaurar o formato compatível com LT187: `pvp_league="great"` fora de UL e `pvp_include_pre_evolutions` booleano em TODOS os modos; `pvp_mode` continua sendo a autoridade para habilitar PvP, `pvp_top_rank=null` e `pvp_min_cp=null` em 100%, 0%, Raw e IV%.
- Não mudar `OverlayService`, `SecondaryOverlayService`, `probe.js`, sprites, favoritos, autenticação, login ou critérios persistidos.
- Nova regressão `lt189-api-default-schema.test.js` simula rejeição 422 quando tipos são incorretos, para P1/P2 com 100%, 0%, Raw 0/13/13, IV%, GL e UL; **mock local não equivale à busca real no PoGoCoordinates**.
- Nenhum retry automático, bypass de limite, login ou liberação indevida de token.

## QA e publicação
- Abrir PR sobre `main` com testes obrigatórios (Node, Android compile e OTA). **Não publicar automaticamente**: teste em Samsung real com autenticação e API oficial é necessário para afirmar que o 400/422 foi resolvido.
- No aparelho, observar P1 e P2 com filtros limpos, depois 100%/0%, IV 0/13/13, IV%, GL e UL, com API ON e se possível comparação DOM OFF. Testar com mesma sessão, ambos overlays ativos; verificação de resposta HTTP sem inspecionar JWT/PII.
- **Contorno temporário:** nas opções do PokeSearch, desligar API para usar busca via site (se o modo DOM estiver disponível); não limpa dados nem obriga reinstalar.
- Registrar evidência de erro remoto/resultado real antes de marcar a correção como homologada. LT188 permanece release oficial até validação.

## Proveniência
- Base oficial: PokeSearch LT188 `v0.01.88-54393`, source APK `cd86684c032b4966a84f7013c29243d164b2ae9d`.
- Evidência do usuário: duas capturas fornecidas neste relato (30/10/2026); nenhuma credencial extraída.
