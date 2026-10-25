# PokeSearch LT113 — Get coords stale-or-ambiguous-selection nas duas Pokébolas

Data: 25/10/2026. Contexto: screenshot Samsung mostrando Audino shiny #531, PC 1538, IV 15/15/15, e o texto `Get coords API: stale-or-ambiguous-selection`.

## Checkpoint e governança
- main oficial até este trabalho: PokeSearch LT111 v0.01.11 / 54315, sem alteração da release pública nesta etapa.
- Continuação na branch `fix/lt112-two-pokeballs-parity-20261025`, PR #73 Draft, preservando sprites/favoritos/alertas das duas instâncias.
- Backup exato antes da correção de coords: `backup/lt112-before-get-coords-fix-20261025` → `c8e1c2eb7c394b4aec516a7013a1d919dee9b5ad`.
- Regra permanente em `AGENTS.md` e Guia Mestre: todas as correções se aplicam às duas Pokébolas e têm teste 100%/0%. Não exibir novamente o controle oculto da segunda na Home.

## Auditoria da causa
- `api_result_contract.js` normaliza `cp` como número, convertendo inclusive o formato texto JSON `"1538"`, e envia `card.cp="1538"` ao Android.
- `OverlayService.revealAuthorizedCoords` envia `cp=1538` do card como número inteiro.
- `api_browser_transport.js` anteriormente armazenava `q.cp=raw.cp` **sem normalizar**, de modo que a comparação JavaScript estrita `requested.cp!==q.cp` rejeitava indevidamente `1538 !== "1538"` como `stale-or-ambiguous-selection` mesmo para a mesma linha de API. O código permitia esse formato no parser; é causa tecnicamente reproduzível, mas sem logs do aparelho não há como garantir que foi a única causa daquele print.
- Uma segunda possibilidade real é o refresh periódico: `transport.search()` invalida `reveals` no começo da próxima consulta, quando os cartões antigos ainda são visíveis. Ao clicar no intervalo, o código anterior tentava um reveal já inválido.
- Mantidas restrições: Get coords nunca pode copiar coordenadas de outro encontro, usar código expirado, burlar rate-limit ou guardar/revelar `reveal_code`/JWT fora do WebView autenticado.

## Correção implementada em código compartilhado por ambos os overlays
1. `api_browser_transport.js`: `positiveInteger` normaliza números e representações decimais canônicas de CP; compara ID/CP da resposta bruta com o card sanitizado da **mesma** linha `sourceIndex` antes de armazenar o código efêmero. Não admite formatação ambígua, booleanos, CP/espécie divergentes ou timestamps vencidos.
2. Em `reveal`, mantém verificações de `searchId`, `sourceIndex`, espécie e PC (agora normalizado estritamente), geração atual, TTL e consulta única. Não expõe nem persiste códigos de revelação.
3. `OverlayService.requestCoordinates`: enquanto `searchInProgress`, não envia reveal de cartões antigos; informa que a busca está sendo atualizada.
4. `OverlayService.revealAuthorizedCoords`: apresenta ao usuário textos úteis para pesquisa supersedida, Pokémon expirado ou consulta já em andamento, em vez de erro cru. Sem falso sucesso.
5. `app/tests/lt113-get-coords-canonical-dual.test.js`: reproduz Audino 531/PC "1538" em duas instâncias 100% e 0%; valida também CP numérico, IDs/PC/índices incompatíveis, busca antiga supersedida e strings ambíguas, sem GET de código errado. Obrigatório no `pokesearch-node-qa.yml`.

## Testes de aceitação no Samsung
- Com Pokébola 1 em 100% e Pokébola 2 em 0%, abrir cards ativos e tocar Get coords / Obter e copiar. O comportamento esperado é recuperar e copiar apenas o encontro exato, quando API fornecer o código.
- Fazer refresh automático/manual enquanto card antigo está visível: bloquear a consulta obsoleta, explicar a atualização e permitir nova seleção após confirmação; não copiar coordenadas velhas.
- Quando Pokémon despawn expirou ou resposta não tem `reveal_code` válido, manter indisponível (nunca inventar coordenadas). Validar permissão de favoritos, sprites e notificações em ambas.
- Candidato QA assinado v0.01.13 / versionCode 54317; execução Android/Node e certificado serão registrados após verificar o workflow. Não promover como estável sem homologação e aprovação explícita.

## LT114 — auditoria pós-GET, separação simultânea P1/P2
- Encontrado um caso adicional em `api_browser_transport.js`: a validação de `despawn_at` ocorria antes de `await request(GET)`, mas uma resposta tardia podia chegar após a expiração. Agora o TTL é revalidado imediatamente após o GET, antes de retornar as coordenadas; se vencido, elimina a seleção e retorna `expired-spawn`, sem coordenadas.
- Testes adicionados à suíte LT113: P1 atualizada enquanto P2 conserva seleção 0% válida, sem cruzamento de estado; GET iniciado vivo e concluído após despawn deve falhar fechado.
- Novo candidato QA reservado: `0.01.14 / versionCode 54318`, workflow protegido LT114. O APK anterior `0.01.13/54317` mantém SHA-256 `e69fec269ba5613d71d1b55abd7705742553ed97edbd1a1ab671564dc7cf9614`, origem `141ec637e60565591f6fe445da661b2a26eb6a79`, certificado `34766c15d09013ad65873f9976539c8fa2f826e917dae3af57ea628cad689e8e`.
- Auditoria independente do APK LT113: 2.050 PNGs com SHA-256 igual ao manifesto embarcado, sem erros ZIP; `applicationId com.lucianotoscano.pokesearch`, versão e certificado v2 confirmados.
- Não publicar como versão estável nem mesclar PR #73 sem validação Samsung nas duas Pokébolas. A PR está divergente de `main` por três commits no checkpoint de 25/10; resolver de modo não destrutivo antes de qualquer merge.
