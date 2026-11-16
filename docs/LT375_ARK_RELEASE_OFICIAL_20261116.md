# PokeSearch — ARK LT375 oficial — 16/11/2026

## Identidade e autorização
Usuário autorizou explicitamente em 16/11/2026: merge da PR #454, publicação de uma nova atualização, registro no Guia Mestre e prompt para novo chat. Versão anterior: LT374 `0.03.68/54575`. Nova versão: LT375 `0.03.69/54576`, label `51375`.

## Integração e gates
PR #454 (LT375 a/b/c/d) mesclada via squash `f261baf88821f76717ae019af7a2473731c0bb23` em `main`. SHA do código/testes: `267c25f66e79e2d4b6bcd39462817b0b3443a060`.
Gates completos, mesmo SHA: Node QA #43942793354 SUCCESS, LT169 #43942793105 SUCCESS, LT211 #43942793087 SUCCESS, Java LT62 #43942793178 SUCCESS, LT173 OTA #43942793137 SUCCESS, PGS APK debug QA #43942793139 SUCCESS, Secure beta/R8 #43942795456 SUCCESS. Suplementar LT253 aprovado. **7/7**, não confundir assinaturas QA efêmeras com o certificado permanente.

## Publicação
Solicitação monotônica em `release/official-request.json`: version `0.03.69`, code `54576`, label `51375`, previous_tag `v0.03.68-54575`, qa_max_code `54575`. Commit/fonte da release `fbb04f10eb85cacc3dbb316f9c8437c0db61532a`. Workflow permanente [#43943415888](https://github.com/LucianoToscano/PokeSearch/actions/runs/43943415888) `completed/success` em preflight e publish: Node/OTA, assets, R8, build `assembleRelease`, Android package, versão, ausência de debuggable, assinatura v2 e certificado pinado. Release pública [v0.03.69-54576](https://github.com/LucianoToscano/PokeSearch/releases/tag/v0.03.69-54576), `draft=false`, `prerelease=false`, published_at `2026-11-16T19:55:05Z`, asset `PokeSearch-v0.03.69-LT.apk` com estado `uploaded`, **61.194.123 bytes**, digest SHA-256 `c8bb45f3e8d4ac26d67365452bb5748d0cd3c51f26b127ec54e6373f14ee0b47`. Certificado permanente SHA-256 esperado pelo workflow: `34766c15d09013ad65873f9976539c8fa2f826e917dae3af57ea628cad689e8e`.

## Entregas
Background, filtros, localização/cooldown/KM, favoritos, personalização `⋮⋮`, menu ⋯, guias e alinhamento sem mover sprites. Minior sem redução exclusiva, medidas legíveis e sem cobertura de resultados, transparência de menu padrão 50% e blur Android 12+ condicionado ao suporte nativo. Tutorial automático somente nas Pokébolas P1/P2, alvo mais preciso, mão redesenhada, Pular/replay; Busca Pokémon e Doce Raro sem guia automático. Sem alteração intencional da lógica funcional existente.

## Ressalvas e próximos testes
**Homologação física não executada nesta sessão:** Android 11/12/13/14, Samsung, Minior Meteor/Core, densidade P/M/G, guias, blur nativo/consumo, P1/P2 e gestos reais/↻, PGSharp/Pokemod separados, TalkBack, permissões, toque pass-through e atualização instalada. CI e release não provam captura confirmada, caminhada pelo PokeSearch nem instalação silenciosa. Rollback: preservar release anterior para auditoria; não sobrepor tag, nem oferecer downgrade Android sem estudar versionCode. Continuidade [LT376](LT376_PROMPT_CONTINUIDADE_VISUAL_20261116.md).
