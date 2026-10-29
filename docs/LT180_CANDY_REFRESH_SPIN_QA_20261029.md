# LT180 — Doce Raro: animação real do ↻ (29/10/2026)

## Diagnóstico
Na LT179 pública (0.01.79 / 54384), o botão de atualizar enviava o pedido mas o SVG não tinha nenhuma regra CSS de rotação. O menu também não recebia do Android as mudanças reais de estado (buscando/aguardando).

## Correção na branch
- O SVG de ↻ gira continuamente com CSS `@keyframes candyRefreshSpin` (volta completa em 0,8 s) **somente** quando uma busca oficial está em execução. O pequeno rótulo `1m/3m/5m` permanece estático.
- Toque curto inicia animação visual imediata; serviço Android confirma se realmente iniciou a busca. Consulta automática ou pós-cópia também ativa o giro quando o menu estiver visível.
- Com resultado, erro, expiração, timeout ou rate-limit 429, o indicador para; durante bloqueio ou espera em fila fica discreto/parado, sem simular consulta. Ao retornar a pesquisa permitida, volta a girar.
- Abrir o menu no meio de uma busca sincroniza o estado real; não há spinner infinito por temporizador arbitrário.
- Comunicação limitada ao controle local `file:///android_asset/rare_candy_controls.html`, sem expor JWT, coordenadas sensíveis ou instalar bridge no WebView remoto.
- Preserva layout compacto da Pokébola, gestos de toque/segurar, limites do PoGoCoordinates, dois overlays Pokémon e configuração anterior.

## Testes e distribuição
- Teste `lt180-candy-refresh-animation.test.js`: estados idle/busy/queued/429, clique, parada e pesquisa automática.
- `lt179-candy-refresh-gestures.test.js` adaptado ao novo atributo aria-busy; `lt175-rare-candy-overlay.test.js` preservado.
- Workflow isolado de compilação/assinatura QA `lt180-candy-refresh-spin-signed-qa.yml` em branch `fix/lt180-candy-refresh-spin-20261029`, candidato Android `0.01.80 / 54385`; validar SHA, assinatura v2 e regressões no GitHub Actions.
- **Não publicar diretamente para usuários sem a autorização da nova LT180; GitHub Releases/latest LT179 e ponte Drive inalterados até validação.** Alteração da classe Java exige APK completo assinado, não apenas OTA de HTML.
- QA físico Samsung/Moto: tocar ↻ e ver giro; retomar 1/3/5m e após copiar todos; segurar não inicia consulta; parada em sucesso, erro offline e 429; ausência de interferência em P1/P2.


## APK de QA assinado confirmado
- GitHub Actions: https://github.com/LucianoToscano/PokeSearch/actions/runs/40943703228 — **SUCCESS**.
- Artefato ZIP: https://github.com/LucianoToscano/PokeSearch/actions/runs/40943703228/artifacts/12929110259 — `PokeSearch-LT180-54385-RareCandy-QA-Assinado.zip` (46.599.165 bytes).
- SHA-256 ZIP calculado pelo workflow: `06293b42d17c4f4c58450d4de0e9a216c6ad96318bfbd018dcc7b8b4b8de5cfd`.
- APK dentro do ZIP: `PokeSearch-v0.01.80-LT-QA.apk` (49.542.682 bytes), versionName `0.01.80`, versionCode `54385`, source commit `6c9aa7ed8c5164f9058b6cdcb51d8ac718321d62`.
- Certificado Android v2 permanente conferido no workflow: SHA-256 `34766c15d09013ad65873f9976539c8fa2f826e917dae3af57ea628cad689e8e`. R8, metadados, assets e `sha256sum --check` do APK aprovados. O **hash SHA-256 específico do APK** consta em `SHA256SUMS.txt` dentro do artefato; não foi extraído do log neste registro, portanto não inventar esse valor nem confundi-lo com o SHA-256 do ZIP.
- Passaram os testes `lt180-candy-refresh-animation.test.js`, LT179, LT175, P1/P2 e build Android. **Homologação física do giro na WebView Samsung/Moto permanece pendente.**
- Publicação: **apenas QA**, não `releases/latest`, não Google Drive. LT179 (`v0.01.79-54384`) continua estável e disponível para usuários.


## Ampliação solicitada com os prints do Samsung — cadência e menus (29/10/2026)
- Evidência do usuário: screenshot de PokeSearch sobre Pokémon GO com Toast `Limite do site · atualizar em 7 s`, e comparativo da localização/intervalo da Pokébola com o popup excessivamente grande do Doce Raro.
- **Regra do app (nova):** períodos disponíveis idênticos à Pokébola: **OFF, 3, 5, 10, 15 e 20 minutos**; novos usuários começam em **3 minutos**. Valor antigo 1 minuto migra para 3. Preferências anteriores suportadas continuam salvas. OFF desliga apenas a atualização periódica, não o refresh manual nem o refresh ao copiar os 10 doces.
- **Regra da cópia:** uma nova busca automática ocorre exclusivamente quando há **10 doces ainda ativos** e a cópia do último doce não copiado faz **todos os 10** ficarem cinza. Não dispara com 1–9 doces nem ao tocar novamente em item já cinza; 1 solicitação por geração. Ao vencer o despawn oficial, o card desaparece mas não provoca uma busca extra: o ritmo é o intervalo escolhido ou todos os 10 copiados.
- **Limites locais removidos:** eliminado o cooldown artificial `now-lastRefresh<15000` e o refresh local após expiração condicionado a 15s. Retirado o Toast de contagem regressiva de bloqueio; só se mostra confirmação de atualização quando uma consulta pode começar.
- **Restrição do provedor que permanece:** `HTTP 429 / Retry-After` do PoGoCoordinates é respeitado — não é imposto pelo PokeSearch nem permitido contorná-lo. A API agora honra o prazo que o provedor informar, mesmo se inferior a 60s; fallback de 60s **somente** se a resposta 429 não declarar prazo. O timer factual de despawn (`expires_at`) também permanece, pois indica duração real do resultado.
- **Localização compacta**, baseada visualmente em `dock.html`: cabeçalho "Localização" com copiar/colar por ícones discretos, campo de coordenadas de uma linha, slider horizontal e número do raio em km, ações somente com ícones ✓ / lixeira; fundo vidro escuro no padrão P1/P2. O raio mantém a semântica oficial da API: `1 km` no menu equivale a `1000 metros` enviados ao serviço; admite `0,001` até `1000 km`. Popups não têm botão "1000m", frases auxiliares ou espaços vazios.
- **Atualização visual da Pokébola:** menu vertical com tiles individuais (OFF/3/5/10/15/20), sem coluna preta única; toque ↻ segue imediato, segurar abre o intervalo e somente o glifo gira durante busca. Altura da janela e largura ajustadas conforme popup; nenhum recurso da Pokébola 1/2 foi sobrescrito.
- Novo teste `app/tests/lt180-candy-cadence-location.test.js` para período 3m/OFF, condição dos 10, slider, copy/paste, conversão km→metros, 429 e ausência de cooldown local. Incluído na Action QA.
- Esta ampliação foi aplicada à **mesma PR #136 / branch QA LT180** para não disputar fontes com duas branches. O APK QA compilado anteriormente (49.542.682 bytes) **não contém estes ajustes posteriores**; exigir um novo build assinado sobre HEAD novo antes de disponibilizar arquivo para teste. Sem merge/release/latest/publicação aos usuários na ausência de autorização expressa atual.

## Autorização pública e CI atual (29/10/2026)
- Proprietário pediu **"Envie a atualização para todos"** e repetiu a autorização; publicação geral da **LT180** expressamente aprovada.
- QA recente **SUCCESS**: https://github.com/LucianoToscano/PokeSearch/actions/runs/40947947148 ; origem validada `a66807cca0106d7074acf0897f9ad1a27be5843b`, fonte funcional das correções; posterior commit de workflow/documentação não altera Java/HTML/testes.
- APK QA dentro do [artefato #12929519250](https://github.com/LucianoToscano/PokeSearch/actions/runs/40947947148/artifacts/12929519250), ZIP de 46.600.970 bytes; testes de animação, 3m, 10 doces, localização e regressão P1/P2 e assinatura permanente aprovados.
- Workflow **oficial** preparado em `.github/workflows/lt180-candy-menus-official-release.yml` e será acionado na main após merge da PR #136. **Publicação e hash final só podem ser afirmados após confirmação real da Action e de GitHub Releases/latest.**
- Pedido seguinte do proprietário: na **próxima versão, após LT180**, o aviso de nova atualização deve ficar **acima das Pokébolas, no topo da interface**. Não incluir essa alteração de layout na versão LT180 já homologada, para preservar integridade da distribuição. Novo escopo será LT181 QA.
