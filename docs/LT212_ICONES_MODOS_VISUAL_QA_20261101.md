# LT212 — Revisão visual dos ícones e regressões de menu (QA)

**Base:** LT211 `0.02.11`, versionCode `54418`; branch `feature/lt212-icon-visual-qa-20261101`.
**Escopo aprovado:** ícone do modo IV e verificação estática dos menus/Favoritos. **Chat não incluído.**

## Correção implementada

- `app/src/main/assets/result-icons/modes/StarIVRaw.png`: substituída a versão RGB 1254×1254 com bordas pretas incorporadas por PNG indexado 128×128 com transparência real (tRNS), bordas suavizadas e centro original preservado.
- Antes: **1.198.192 bytes**. Novo: **3.221 bytes** (redução de aproximadamente 99,7% neste arquivo). SHA do blob Git: `c38aad8b538765838cb1374243c6498771dee93f`.
- **Comportamento preservado:** ícone aponta para `StarIVRaw.png` no seletor de IV personalizado e em IV% que abrange múltiplas faixas de estrelas. Os resultados, cabeçalhos, bolha recolhida e as duas Pokébolas preservam os caminhos existentes.
- **Não modificados:** `StarGL.png`, `StarUL.png`, `3Star.png`, `0Star.png`, PNGs de fallback, captura ou lógica de busca, Firebase/chat, permissões ou GPS.

## QA automatizado

- `app/tests/lt212-mode-icons-alpha.test.js`: decodifica o PNG sem dependências externas, verifica pixel transparente nos quatro cantos, centro opaco, antialias, mapeamento IV/IV% e presença de superfícies de ícone.
- Reexecutar `app/tests/lt211-menu-reset-background.test.js`, `app/tests/lt208-menu-drag-visibility.test.js`, `app/tests/lt209-favorites-position-drag.test.js`, `app/tests/overlay-ux.test.js` e o workflow geral `qa-core-contracts.yml`.
- Testar sobre fundos escuro/claro e na densidade real do aparelho. A ausência de preto do próprio PNG é verificável por arquivo; aparência física em Samsung ainda é um critério distinto.

## Checklist Samsung (manual, obrigatório antes da release)

1. Instalar build QA devidamente assinada com certificado de teste conhecido, **sem sobrescrever release pública não validada**.
2. Abrir Pokébola 1 e 2, alternar IV bruto, IV% misto, 100%, 0%, GL e UL; conferir ausência de fundo preto, escala nítida e sem bordas serrilhadas.
3. Em Menu > Personalização, confirmar 13 itens; somente Personalização não pode ser ocultada. Shiny e Background ficam ocultos na primeira instalação; aparecerão ao ativar no organizador. Reset ↺ restaura apenas a organização, **não** altera filtros.
4. Abrir Favoritos com barra no topo, meio e rodapé; mover livremente pelo cabeçalho/superfície vazia; conferir que a janela não cobre a barra após abrir, não sai da tela após rotação e não bloqueia toques no Pokémon GO.
5. Conferir janela pequena e grande, escala de fonte Android, modo claro/escuro, teclado aberto e A14 de 4 GB, se disponível.
6. Regressão de login, espécies e resultados PoGoCoordinates com sessão real, preservando proteção 429. Não substituir evidência física por teste estático.

## Estado da versão

Esta branch identifica a **etapa LT212 QA**, mas **não** altera `versionCode` ou `versionName` e **não publica APK**. Publicação requer testes em Android, geração de build assinado com a chave permanente, incremento monotônico de versão, hash/assinatura verificáveis e aprovação. Mantenha a LT211 oficial no atualizador até isso acontecer.
