# LT267 — Auditoria independente final após publicação (06/11/2026)

## Conclusão e evidências públicas

**Release oficial:** [PokeSearch LT267 · v0.02.67-54471](https://github.com/LucianoToscano/PokeSearch/releases/tag/v0.02.67-54471), publicada em `2026-11-06T16:43:51Z` (`draft=false`, `prerelease=false`). **APK:** [PokeSearch-v0.02.67-LT.apk](https://github.com/LucianoToscano/PokeSearch/releases/download/v0.02.67-54471/PokeSearch-v0.02.67-LT.apk), 33.059.748 bytes, GitHub `uploaded`, **SHA-256:** `a25c9a6b56408d532359b516066ff5c571d6c958ffb1e9d7be230c300f6c3250`.

**Build público real:** [GitHub Actions #42254494312](https://github.com/LucianoToscano/PokeSearch/actions/runs/42254494312), jobs `preflight=success`, `publish=success`. Etapas confirmadas: prepare version 0.02.67/code 54471, SDK/keystore com SHA de certificado permanente, Node/OTA, recursos GO, Gradle/R8, validação APK e signer, checagem de 18 ícones revisados RGBA e dos legados arquivados com hashes, limite <35.000.000 bytes, release pública verificada e exclusão de material privado de assinatura. Não confundir APK pública com artefato QA.

**QA pós-release independente:** [GitHub Actions #42257888047](https://github.com/LucianoToscano/PokeSearch/actions/runs/42257888047) `signed-dual-parity=success`, HEAD `1d4ae1d856a1d3951e452314e7d4c05970c8d01a`. Etapas bem-sucedidas: validação OAuth/assinatura, testes Node e Java, metadados GO offline, bundle de sprites, build protegido de teste, auditoria APK (certificado/R8/versões/manifesto), upload e descarte de chave temporária. Após a publicação só testes e docs foram alterados: a APK pública mantém SHA supracitado.

## Funcionalidades e assets preservados

- **Cartão e rankings:** 18 ícones revisados de tipos (PNG 512×512 com transparência) `ui-icons/type-<tipo>-lt267.png`; emblema novo do Rank Geral (RG), preservando Rank Classe independente; ícone da Copa para LC, novo ícone Mega e Sombroso somente com flag positiva. Compactação sem recortar nome Mega na regressão visual.
- **Sprites:** Pikachu Diwali 2024 normal/Shiny e Squawkabilly Blue/Green/White/Yellow normal/Shiny; prioridade à origem verificada e fallback que não inventa forma; mantém Shellos/Gastrodon East/West, trajes de evento e cache offline.
- **Catálogo de 128 sprites de traje/evento:** 124 `COSTUME_FILES` exatos (106 do catálogo anterior, 8 LT260 Sea e 10 LT267 Diwali/Squawk), mais 4 `verified_event_pngs` do LT144 obtidos de fonte imutável com SHA-256. A QA confirma dimensões/arquivos e hashes, não apenas a contagem.
- **Raides:** rótulo `Mega Beedrill` sem duplicação, tipo e classificação por tipo; sem confundir essa fonte com Rank Geral PvP ou counters atuais. Um ataque Ágil e um Carregado por combinação fonte; não inventar outro. **Calculadora/IV/PvP:** preservados, ainda exigem inspeção visual/física.
- **APK/rollback:** 18 ícones LT266 foram preservados byte a byte em `docs/legacy-assets/lt266-types/`, evitando duplicar 5.802.585 bytes no APK. LT266 publicada permanece opção de rollback; a assinatura de produção está mantida.

## PRs e histórico de falhas resolvidas

| PR | Finalidade | Status |
|---|---|---|
| [#247](https://github.com/LucianoToscano/PokeSearch/pull/247) | Sprites Diwali/Squawk, Mega/Shadow, LC e Raides | Mesclada |
| [#248](https://github.com/LucianoToscano/PokeSearch/pull/248) | 18 tipos revisados e RG com hash | Mesclada |
| [#249](https://github.com/LucianoToscano/PokeSearch/pull/249) | Arquivo-fonte dos ícones LT266 e controle de tamanho | Mesclada |
| [#250](https://github.com/LucianoToscano/PokeSearch/pull/250) | Import Python `os`, QA local e hash | Mesclada |
| [#251](https://github.com/LucianoToscano/PokeSearch/pull/251) | Primeira conciliação da contagem de costumes | Mesclada; superada |
| [#252](https://github.com/LucianoToscano/PokeSearch/pull/252) | Ajuste para 124 ícones de `COSTUME_FILES` | Mesclada; superada |
| [#253](https://github.com/LucianoToscano/PokeSearch/pull/253) | Manifesto final 128 com 4 LT144 | Mesclada; QA aprovada |

Falhas intermediárias não foram escondidas: teste RG inicialmente cortava nome da Mega; script dos tipos teve sintaxe corrigida; duplicação de PNGs elevou o APK; verificador Python não importava `os`; QA exigia Base64 obsoleto; e o total de costumes foi reconciliado examinando o builder completo (106→116→124→128). Nenhuma asserção foi desativada para obter sucesso.

## Pendências genuínas

1. **Samsung físico não testado após LT267:** duas Pokébolas, modos P/M/G, rolagem completa, tons/contraste em fundo claro e escuro, alternância de painéis, bateria/memória e instalação OTA ainda exigem teste humano. Não chamar prints anteriores de homologação LT267.
2. **Calculadora:** confirmar Weedle/evoluções/Megas, IV A/B, PC/PS, nível e limites LC/GL/UL/ML em dispositivo; não remover controles para compactar.
3. **Traduções PT-BR:** auditar golpes de Fletchling, Talonflame, Pidgey e Pidgeot por IDs e fonte versionada; não criar equivalências sem comprovação.
4. **Sprites no uso real:** confirmar Diwali e as quatro cores Squawkabilly, normal/Shiny, e se as URLs da origem chegam e funcionam no WebView. A integração automatizada passou; não afirmar que prints físicos atuais foram checados.
5. **Distribuição:** release e SHA-256 GitHub confirmados; não há prova de APK LT267 instalada no telefone nem de sincronização com Google Drive. O app precisa da confirmação Android na instalação.

**Próximo passo recomendado:** planejar LT268 somente com bugs reproduzíveis e fontes identificáveis. [Prompt do próximo chat](PROMPT_NOVO_CHAT_LT268_20261106.md). 
