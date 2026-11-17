# LT387 — Visitante: 5 resultados, login compacto e coordenadas do cartão

Base: `PokeSearch v0.03.73 LT`, extensão da PR [#477](https://github.com/LucianoToscano/PokeSearch/pull/477), sem mudar versionName/versionCode oficial.

## Evidências do proprietário
- Navegador em `pogocoordinates.com/search`: a página sem login mostra “Showing 5 results — log in to see 10” e controles reais “Get coords”, “Open in Maps” e texto de latitude/longitude ao lado.
- O mesmo site também mostra “Rate limited · 1m 55s” em um cartão; isto é uma restrição do provedor, não uma falha de cache do PokeSearch.
- O app exibia resultados da API, e o fluxo DOM anterior tentava ler somente uma URL de mapa ou a localização, não o botão com coordenadas puras ao lado de “Open in Maps”.

## Implementações
1. `probe.js` reporta `guestLimitBanner` somente quando a página real confirma o texto público “Showing 5 results — log in to see 10”. Não tenta buscar resultados ocultos.
2. `OverlayService` propaga o sinal à lista de resultados após busca verificada. `dock.html` exibe uma única ação compacta **🔒 +5** após a última sprite quando for visitante e não houver resultado obsoleto ou busca em andamento. A altura da janela é medida incluindo a ação; nenhum botão ou espaço altera o tamanho das sprites.
3. O toque abre uma explicação do limite e permite **Entrar** ou **Agora não**. Entrar abre somente o WebView oficial do PoGoCoordinates por um Intent explícito, sem passar cookies/tokens ao app. Após login confirmado, somente a Pokébola convidante, se ainda atribuída ao visitante, é vinculada à conta autenticada. A outra Pokébola não muda.
4. Em `readCoords`, além do href/LOCATION, a extração verifica um botão irmão contendo exclusivamente um par de coordenadas válido e pertencente **ao mesmo cartão reidentificado**. Se houver dois pares diferentes, rejeita em vez de escolher arbitrariamente. A cópia ainda exige resposta real confirmada e identidade atual.
5. **Proteção:** nenhum reset automático de cookies/cache/histórico para contornar limites de Get coords. `HTTP 429`, mensagem “Rate limited”, limite de revelação e tempos fornecidos pelo site continuam prevalecendo. Limpar cache local não restaura necessariamente cota no servidor. Guardar esse limite não impede a cópia de coordenadas já liberadas pelo site.

## Validação pendente
- Executar `node --test app/tests/lt387-guest-results-coords-login.test.cjs` e as regressões CI/Java.
- QA físico em Android com 5 cartões reais: bloquear/permitir login, manter P1/P2 isolados, autenticar via Google/Discord, conferir que 10 resultados só aparecem se o provedor os entregar.
- Para Get coords, testar botão normal, botão irmão numérico, link de mapa, cartões com nomes repetidos, rate limit, cartão vencido, SPA reordenada e contador de chamadas.
- Verificar tamanhos P/M/G, tema claro/escuro, altura da lista de 5, bandeira após troca de filtro, e que não aparece CTA na busca autenticada.

O código ainda não equivale a homologação física ou publicação do APK; registrar resultado real dos checks antes de merge.
