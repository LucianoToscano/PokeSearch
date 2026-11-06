# PROMPT — Continuar PokeSearch após auditoria LT266

Repositório https://github.com/LucianoToscano/PokeSearch
Leia primeiro docs/GUIA_MESTRE.md, docs/LT265_AUDITORIA_FINAL_POS_RELEASE_20261106.md e docs/LT266_ICONES_TIPOS_DRIVE_QA_20261106.md.
Consulte releases/latest antes de qualquer edição; não presuma que a LT266 foi publicada.

A LT265 (0.02.65, code 54469) era a última release comprovada antes da solicitação LT266; verificar a release atual.
PR #246 mesclada em b83b3ddd346a5ca72a74e727fe125a5fe2066b6e, após oito verificações CI verdes. Release oficial LT266 (0.02.66/code 54470) solicitada, não presumir publicada antes de confirmar latest e SHA-256.
Os 18 PNGs 1024×1024 RGBA originais do Drive estão em app/src/main/assets/ui-icons/type-<enum>-lt266.png.
pokemon_type_icons.js usa caminhos locais no lugar de Base64; API enums e cálculos não mudaram.
O teste lt266-types-from-drive.test.js e o workflow oficial exigem SHA-256 exato.

No próximo passo, verificar status do CI/PR/merge e eventual release LT266 com URL e SHA-256 reais. Não inventar resultados.
Conferir a tradução dos golpes de Fletchling/Talonflame/Pidgey/Pidgeot contra a fonte WatWowMap (pinned); se não houver fonte, manter Golpe sem tradução.
Auditar legibilidade em Android Samsung nas duas Pokébolas, P/M/G, rolagem, painéis exclusivos e calculadora IV A/B, PC, PS, evolução/Mega. Sem teste físico, registrar pendência.
Preservar Rank Classe vs Rank Geral, base PvE agosto/2026 como referência por tipo, favoritos, Shiny, localização com ordenação automática, cache, alertas, assinatura permanente e OTA. Publicar somente após testes completos e aprovações.
Atualizar Guia Mestre, auditoria pós-release e prompt com links reais.
