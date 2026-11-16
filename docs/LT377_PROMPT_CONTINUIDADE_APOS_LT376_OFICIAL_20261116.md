# POKESEARCH — ARK LT377 — Continuidade após a publicação oficial LT376

## Referência de produção — NÃO redefinir versão histórica
A release oficial verificada em 16/11/2026 é **PokeSearch 0.03.70 (versionCode 54577; label 51376)**, [tag v0.03.70-54577](https://github.com/LucianoToscano/PokeSearch/releases/tag/v0.03.70-54577). APK permanente `PokeSearch-v0.03.70-LT.apk`, SHA-256 `d5177cb7739cb9295ffeb692bb5ec82de2ba35e7fe5a21899e0e0ceb628c747a`. Workflow oficial #43957285282 `completed/success` no source commit `e7ddc20c52e43e36c98ce350f5729761c4d02f51`. PR #455 e #456 integradas. Qualquer nova versão deverá ser monotônica, com **versionCode > 54577**, mantendo o certificado permanente.

## Leituras obrigatórias no GitHub
1. `AGENTS.md`, `docs/GUIA_MESTRE.md`, `docs/ARK_POLITICA_OBRIGATORIA_MERGE_PUBLICACAO.md`.
2. `docs/LT376_ARK_RELEASE_OFICIAL_20261116.md`.
3. `docs/LT376_ARK_QA_CORRECOES_PENDENTES_20261116.md` e `docs/LT376e_PERFIL_POGO_LOGIN_BADGES_ARK_20261116.md` (histórico QA, já integrado/publicado, não confundir textos "sem merge" com estado atual).
4. `release/official-request.json`, `app/src/main/assets/release_notes.json` e os workflows de build/publicação.

## Missão técnica LT377
- Priorizar **homologação física Samsung** do login de Conta 1 e 2: Google/Discord, perfil com e sem treinador Pokémon GO, 2FA realizado pelo usuário, nome e avatar reais, sessão expirada, preferências de privacidade, logout de uma conta sem afetar a outra, `Atualizar perfil` e cookies isolados.
- Verificar a posição dos seletores de conta exatamente no centro do botão branco das Pokébolas P1/P2 em telas/densidades diferentes, com 2 pixels acima da arte. Corrigir o algoritmo óptico somente se fotos/vídeos comprovarem erro.
- Auditar menus compactos: lista de Localização com 16 distâncias sem rolagem/corte, Favoritos junto da barra sem cobrir resultados, seis pontos circulares de arraste e persistência, desfoque efetivo em Android 12+ quando suportado e fallback no Android 11/sistema sem suporte, transparência padrão 50% e medidas legíveis.
- Testar Minior Meteor/Core e sprites P/M/G, tutorial uma vez nas Pokébolas com círculo/dedo/Pular, opções Filtros/Background/Ordenar, resultados/guia roxa, notificação, acessibilidade/TalkBack, rotação e toque-through.
- Preservar contas P1/P2, Busca Inteligente, Sequências, Monitor, Modo Noturno e PGSharp/Pokemod em instalações separadas. Diferenciar supervisão, caminhada externa, tentativa e captura efetiva confirmada.
- Garantir testes Node, Java, LT169, LT211, LT173 OTA, PGS debug QA, Secure beta/R8 e complementares em um mesmo SHA antes da integração. Registrar o que foi efetivamente observado em dispositivo, sem inventar homologação.

## Significado obrigatório do comando ARK
O proprietário estabeleceu explicitamente em 16/11/2026: **"ARK" inclui merge na `main` e publicação oficial de atualização com APK assinado e verificado**, não apenas criar PR/relatório. Não pedir nova autorização após o comando ARK. A exceção é veto explícito atual do proprietário ou bloqueador real de testes/assinatura/permissões. Se bloqueado, registrar claramente que ARK não terminou, com evidência e passos necessários; jamais burlar o workflow ou declarar publicação sem verificar.

Ao completar LT377, atualizar Guia Mestre e AGENTS, registrar QA, versões/SHAs, links e artifact digest no novo ARK, gerar prompt LT378 e confirmar que a release pública foi realmente publicada antes de declarar a entrega concluída.
