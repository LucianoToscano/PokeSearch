# LT170 QA — taxa de coordenadas PoGoCoordinates e indicador circular
Data: 29/10/2026. Base exclusiva LT169 oficial (`0.01.69 / 54374`), sem mudar assinatura, limite do provedor ou versão pública.

## Solicitação e implementação
- Quando **Get coords** não libera coordenadas por restrição confirmada pelo **PoGoCoordinates**, renderizar uma linha curta **Taxa Limitada PoGoCoordinates ⓘ** imediatamente abaixo do botão no card; demais erros de internet, Pokémon expirado, autenticação ou botão desativado continuam com mensagens próprias.
- O **ⓘ** é botão de 22px com descrição acessível, abre/fecha uma explicação inline tipo balão, diferenciando o bloqueio temporário `rate` da cota gratuita atingida `quota`. Não aponta o PokeSearch como responsável e não oferece bypass nem reenvio automático.
- **Tempo exibido somente se o site mostrar** explicitamente `Try again in Ns` ou `Retry in Nm Ns`. Cronômetro local conta a partir da evidência visível, não inventa resets, nem faz chamadas. Quando o site não exibe prazo, o cartão não mostra contador.
- Contador de coordenadas que já existia passa a ficar em um **círculo pequeno de 22px** no canto direito do botão. Contagem numérica não muda, e `CoordsQuotaStore` continua distinguindo `observedOnDevice` de saldo oficial verificado na resposta autenticada. Nunca afirmar que usos locais representam o limite gratuito da conta.
- Modo **DOM OFF/API OFF**: detecção conservadora na mesma ficha Pokémon e em alertas/modal visíveis do site, inclusive a janela `Reveal more coords — upgrade to VIP`. O proxy Java recebe apenas `limitType=rate|quota` e `retrySeconds` (1–3600) validados. Qualquer falha de rede é separada.
- Modo **API ON**: o motivo `rate-limited` explícito no protocolo (HTTP 429) aciona `rate` sem tempo inventado; `vip-required` aciona `quota`. Demais razões não são mascaradas.
- A UI usa o mesmo `detail.html` e o `OverlayService` compartilhado, portanto a mesma correção funciona nas duas Pokébolas, com sessões e preferências anteriores preservadas.

## QA e limites
- Teste de regressão: `app/tests/lt170-coords-provider-rate-notice.test.js`: rate confirmado vs falha genérica, modal VIP, cronômetro de 8s apenas com evidência, popup acessível, círculo numérico, rotas Java e ausência de novas chamadas.
- QA completa GitHub Node e Java/Android **aprovada**; teste visual com Samsung ainda pendente, não declarar homologação física a partir de CI.
- Não alterar nenhuma quota, não tentar contorná-la, não alterar PoGoCoordinates nem criar servidor. Não distribuir APK ou fazer merge antes de aprovação expressa.

## Resultado do CI nesta revisão
- [Suíte completa de testes Node](https://github.com/LucianoToscano/PokeSearch/actions/runs/40882200272) — SUCCESS.
- [Node QA do projeto](https://github.com/LucianoToscano/PokeSearch/actions/runs/40882200326) — SUCCESS.
- [Compilação Java Android, sem APK](https://github.com/LucianoToscano/PokeSearch/actions/runs/40882200435) — SUCCESS.
- Regressões históricas de LT68/LT77/LT80 adaptadas com detector simulado **sem restrição**, sem remover checagens reais. A LT170 mantém o mesmo `applicationId`, Java 17, API oficial e duas Pokébolas.
- **Status: PR #121 Draft, QA aprovada no CI e teste físico pendente. Não mesclada, não gerado APK público. LT169 segue latest.**
