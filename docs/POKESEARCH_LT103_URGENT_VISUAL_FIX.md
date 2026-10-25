# PokeSearch LT103 — Correção visual urgente 25/10/2026
Base: `main` commit 6ed49120c3575097b17c2d2dba4001fc867733ba; nova branch `fix/lt103-compact-location-home-20261025`.
## Relato confirmado por screenshots Samsung
O painel de Localização ocupava largura excessiva (aprox. 286 dp) enquanto o menu principal usa botões estreitos. O Android fixava também a largura do popup independente em 286 dp, anulando qualquer simples redução cosmética no CSS. A cápsula Agradecimentos aparecia isolada acima dos contadores.
## Correção
1. `OverlayService.java`: `resizeIndependentPopup` usa máximo **148 dp somente para Localização**, preservando menus restantes, prefs, touch region e ancoragem da janela independente.
2. `dock.html`: `fit()` chama `Native.resizePopup` com largura 148 dp para Localização; CSS final com seletor de panel estreita conteúdo, fonte, gaps e quatro linhas. A coluna completa mantém título + Colar ↓ / Copiar, input com 30 chars, slider da mesma largura, campo 0-1000 km, Aplicar ✓ / Limpar. Fonte de entrada reduz para longas coordenadas (sem truncar o valor).
3. `MainActivity.java`: retira cápsula de Agradecimentos isolada; integra-a como ação irmã de **Compartilhar app** na mesma linha de 48 dp. As imagens originais WebP, viewer offline, zoom, compartilhamento Android e drawer permanecem inalterados. Os contadores e Mural continuam no fluxo normal da Home.
4. `app/tests/lt103-compact-location-home.test.js` verifica dimensões nativas e CSS e preservação do contrato JS.
## Proteção e entrega
Candidato QA assinado `0.00.103/54306`. Preservar applicationId, namespace, certificado de assinatura, R8/ProGuard, Firebase existente, API autorizada, filtros, sprites e dados do usuário. Não confundir CI com homologação física Samsung. Só promover oficialmente quando o APK, SHA e GitHub Release forem verificados, mantendo uma versão de código monotônica. O Mural online pode continuar bloqueado por regras Firebase não implantadas.
