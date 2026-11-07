# PokeSearch LT283 — Painéis inteligentes, confiabilidade e desempenho
Data: 07/11/2026. **Estado final:** release oficial publicada e verificada; homologação física Samsung ainda pendente. O estágio inicial foi branch QA.

## Base verificada
- Estável anterior LT282 `0.02.82`, versionCode `54486`, release [v0.02.82-54486](https://github.com/LucianoToscano/PokeSearch/releases/tag/v0.02.82-54486).
- LT265 já introduziu recolhimento exclusivo de Raides, PvP, calculadora, golpes e rankings; LT282 já corrigiu a expansão da lista de Raides. Preservar, não reconstruir.
- Ranking Raid é por **espécie/tipo de ataque**, não pela distribuição A/D/S do encontro. Classificação sem fonte não pode parecer "ruim".

## LT283 — mudanças concretas
1. `detail.html`: agrupar solicitações de altura de múltiplas seções em um único `requestAnimationFrame`, sem perder a medição final. Manter `Native.resizeDetail`, rechecagem assíncrona de `needsScroll`, e zerar rolagem fantasma ao recolher.
2. Recalcular o overlay ao abrir/fechar qualquer `<details>` do cartão, exceto `.psRaidMore`, cujo listener próprio já existe desde LT282. Evitar registrar listeners em cada re-render.
3. Ao trocar o painel principal, fechar também o popover de ajuda PvP. Preservar todos os controles e estados separados das Pokébolas.
4. Raides: sinal verde discreto **✓** apenas na lista efetivamente verificada, sem fundo colorido em golpes nem nova linha. Expor `data-ps-confidence=confirmed|unconfirmed` e tooltip explicando que rank da espécie não é rank do IV. Falta de informação continua não confirmada.
5. `dock.html`: criar índice canônico PvP `ivSpeciesCanonicalByName` único por identidade verificada, recusando identidades duplicadas e sem transformar formas conflitantes em forma base. Pré-indexar nomes de famílias PvP uma vez em `pvpVerifiedNames`, eliminando filtro completo do Game Master em cada clique. Os cálculos/4096 IVs e rank permanecem inalterados.
6. Notas de atualização LT283 embutidas, inicialmente apenas como candidato, sem alterar a solicitação pública `release/official-request.json`.

## Testes e critérios de aceite
- `node app/tests/lt283-smart-panels-pvp-confidence.test.js`: eventos `toggle`, coalescência da janela, status confirmado/incerto e identidade exata/duplicada.
- Preservar regressões LT148 (sem scroll fantasma), LT265 (exclusividade, golpes, calculadora), LT280 (formas/níveis), LT282 (raides, tradução, cores, expansão). Rodar Node completo, QA core Android/Java/OTA e screenshots P/M/G no **mesmo SHA**.
- **Físico ainda pendente**: instalar no Samsung e conferir P1 e P2 separadamente; abrir Raides, expandir 3 ou mais classificações, rolar até o último item, fechar; abrir PvP, Rank Classe/Geral, calculadora, golpes e referências; alternar dezenas de vezes sem painel preso ou janela fora da tela.
- Validar Burmy 412 três capas, Wormadam 413 três formas, Shadow/regional não herdar base, Rank Classe das 3 ligas; tipos Psíquico/Lutador em Medicham com cor somente do texto. Verificar modo normal/desempenho antes/depois em telefone, sem presumir ganhos de ms que ainda não foram medidos.
- Conferir duas contas, filtros independentes, favoritos, localização, sprites, Raid, Shiny suspenso e OTA. Resultados em CI não equivalem a QA Samsung.

## Roteiro incremental das dez sugestões, sem alegar implementação antecipada
- **Etapa 1 (LT283 candidata):** janelas/rolagem, lookup eficiente de PvP, etiquetas de confiança e proteção de formas já existentes.
- **Etapa 2:** comparador avançado IV/custo e recomendação de uso (precisa dados verificados por liga; há comparador básico na calculadora); melhorias de golpes PvP/Raides com origem/legado/Elite confirmado.
- **Etapa 3:** presets de favoritos e modo Eventos; preservar e restaurar filtros por Pokébola e nunca enviar novas buscas automaticamente sem permissão.
- **Etapa 4:** diagnóstico de rede/API (429/Retry-After, erro/sem resultados/sessão), cache e telemetria não sensíveis, checagem de atualização e recuperação segura sem substituir a assinatura.
- Priorizar somente itens que possam receber testes reais; não inferir informações ausentes do provedor, não presumir acesso ao PGSharp nem prometer captura automática.

## Publicação
Exige PR, CI do SHA, merge autorizado e workflow oficial `release/official-request.json`, hash, certificado e release verificáveis. A LT282 permanece opção de rollback até que LT283 seja oficialmente distribuída.

## Evidência final de integração e publicação
- PR [#276](https://github.com/LucianoToscano/PokeSearch/pull/276), squash merge `be6b29aee55e8b534454bc5555b46b3f9380540f`, testes no head `3fc82f21b5ff277ad3d95ec725eee93587aabb49`: oito QA `success` incluindo beta privado; alteração feita sem tocar a chave de assinatura.
- [Workflow permanente #42339368036](https://github.com/LucianoToscano/PokeSearch/actions/runs/42339368036) `completed/success` com `preflight` e `publish` aprovados, pacote ZIP válido, R8, apksigner, certificado SHA-256 `34766c15d09013ad65873f9976539c8fa2f826e917dae3af57ea628cad689e8e` e hash verificados.
- [Release LT283](https://github.com/LucianoToscano/PokeSearch/releases/tag/v0.02.83-54487) `v0.02.83-54487`, 07/11/2026 04:42:53 UTC, `draft=false`, `prerelease=false`. Asset `PokeSearch-v0.02.83-LT.apk` `uploaded`, **33.816.856 bytes**, SHA-256 `1ebbdcb1844f842c4f33516af34da6f5de5f78c69951ec00aeb4feeb1f21ac14`, [download direto](https://github.com/LucianoToscano/PokeSearch/releases/download/v0.02.83-54487/PokeSearch-v0.02.83-LT.apk).
- **Não comprovado:** instalação/uso real no Samsung, comparação cronometrada de performance nem conclusão das etapas posteriores do [roadmap #277](https://github.com/LucianoToscano/PokeSearch/issues/277).
