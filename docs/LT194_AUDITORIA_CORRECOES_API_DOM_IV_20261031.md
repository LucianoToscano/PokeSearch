# LT194 — correções da auditoria LT193 (31/10/2026)

**Status:** branch QA `fix/lt194-iv-evidence-api-dom-parity-20261031`. Não é uma Release pública. A LT193 permanece oficial enquanto testes e homologação física não concluírem.

## Escopo aplicado sobre HEAD LT193

1. **API sem falsos resultados vazios:** `api_result_contract.js` separa `siteCount`, `found`, `rejected`, `filtered`, `expired` e os motivos de rejeição. `api_browser_transport.js` retorna `unverified-results` quando a API retornou ocorrências, mas nenhuma sobreviveu à validação. `api_android_session.js` só afirma vazio explícito quando `siteCount===0`. Resultados antigos válidos são preservados quando a resposta foi inconclusiva.
2. **DOM com provas coerentes:** `probe.js:parseCard` prioriza o percentual IV fornecido explicitamente em vez de substituí-lo silenciosamente pelo cálculo A/D/S. O card `IV: 99% + 0/15/15` é rejeitado, sem inventar Pokémon.
3. **Paridade decimal:** API aceita número JSON e string localizada com vírgula, até 8 casas; DOM, `iv_display.js`, `dock.html` e Java usam a mesma política matemática: inteiro canônico, 1/2 casas, ou precisão suficientemente próxima do valor exato. Os três atributos continuam obrigatórios em modo Raw; percentual isolado não fabrica A/D/S.
4. **Limite máximo 10:** normalização API, validação nativa, resultados/alertas, `dock.html` e `overlay.html` limitam a exibição a 10 cartões **por Pokébola**. Respeitar limites menores do provedor.
5. **Diagnóstico sem dados pessoais:** `OverlayService` registra apenas o identificador P1/P2, modo, totais e motivos enumerados de descarte. Não registra JWT, cookies, códigos de treinador, coordenadas, reveal codes ou payload bruto.

## QA automatizado e lacunas
- `app/tests/lt194-api-dom-iv-evidence-parity.test.js`: transporte HTTP simulado, diferença entre vazio confirmado/rejeição, fonte DOM separada, localidade e precisão, limite 10.
- `VerifiedIvMath.java`: classe **de produção** usada pelo `OverlayService`, compartilhada pela segunda Pokébola por herança.
- `app/tests/VerifiedIvMathTest.java`: compila e **executa** a política Java real em JVM com todas as 46 somas IV, incluindo 0/15/15 e 0/13/13. O workflow Node QA inclui a nova suíte e o teste JVM.
- Testes históricos ajustados para limite máximo 10; as capturas de DOM podem inspecionar até 100 linhas internas para confirmar corretamente filtros e frescor, mas não mostram 100 ao usuário.
- **Ainda pendente:** integração autenticada com o PoGoCoordinates, teste em Samsung com P1/P2, liberação e assinatura de APK de produção. Nenhuma dessas etapas deve ser declarada executada sem evidência.

## Proteções preservadas
- 100%, 0%, Raw IV, IV%, GL/UL, separação de estados P1/P2, login, Shiny, 429/Retry-After, limite/cota de reveal, sprites, notificações/favoritos, expiração, OTA, assinatura original.
- A correção **não** tenta contornar cotas ou produzir spawns sintéticos.
