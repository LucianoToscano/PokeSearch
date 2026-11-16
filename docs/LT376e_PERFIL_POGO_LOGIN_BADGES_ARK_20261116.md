# ARK LT376e — Perfil PoGoCoordinates, sessão dual e seletor central
Data: 16/11/2026. Branch de QA `fix/lt376-popup-location-favorites-dots-blur`; PR #455 existente, ainda sem merge. Versão oficial LT375 `0.03.69 (54576)`, inalterada.

## Evidências recebidas
- Site oficial `pogocoordinates.com/profile` em navegador mostra foto e nome de perfil com **Member since**, **Linked accounts**, e provedor Google vinculado.
- PokeSearch Home mostra `Nome indisponível · abri...` em ambos cartões, ícone neutro apesar de sessões rotuladas como conectadas.
- Dois vídeos fornecidos evidenciam navegação OAuth do Google, senha/verificação e as telas `Preparando acesso...` / `Sincronizando perfil...`; não provam sessão final compartilhada entre navegador e os WebViews P1/P2.
- Screenshot ampliada assinala desalinhamento horizontal do badge de escolha de conta em relação ao centro visível da Pokébola.

## Diagnóstico de código confirmado
1. `profile_summary.js` **e** `probe.js` exigiam `Linked accounts` E `Pokemon GO accounts` para reconhecer perfil/sessão em `/profile`. O cartão de treinador Pokémon GO pode estar ausente sem invalidar o perfil da conta PoGoCoordinates. A identificação do perfil deve aceitar `Member since` + `Linked accounts`, mantendo a detecção de treinador como **unknown** até prova específica.
2. Home tinha botão `Sair site` na mesma linha do nome, comprimindo texto. Também faltava ação de sincronizar perfil já autenticado sem desconectar.
3. Os badges usavam `Gravity.TOP|CENTER_HORIZONTAL` no contêiner de cada Pokébola, não a posição óptica calculada na matriz do PNG real.
4. Navegador padrão e WebView interno não compartilham cookies automaticamente. O armazenamento P1 e P2 é intencionalmente isolado (`PogoAccountSlots`); não inventar login nem importar credenciais.

## Correções na PR #455
- Aceitar perfil oficial `Member since` + `Linked accounts` em `/profile` como prova de sessão e origem para `displayName` e `avatarUrl`, **sem** inferir Pokémon GO trainer nem VIP; manter validação de host HTTPS Google/Discord e restrição a DOM visível.
- Home P1/P2: linha principal com avatar/nome sem botão lateral competindo por largura; ações `↻ Atualizar perfil` e `Sair site` em linha separada. Texto `Perfil não sincronizado` quando identidade ainda não foi recuperada. Preferências de privacidade continuam prevalecendo.
- Novo caminho de `loginPurpose="sync"`: abrir diretamente `https://pogocoordinates.com/profile` usando a sessão selecionada, verificar autenticação, capturar apenas perfil visível e fechar somente após nome verificado; sessão expirada revela o site real, sem loop opaco de 24 tentativas. Não vincular treinador automaticamente, não transferir cookies, não buscar APIs privadas de terceiros.
- Centralizar seletor de conta com `HomeMenuIconPack.opticalPokeballButtonXInParentPx`: tenta localizar, entre bordas escuras do anel, o botão central claro da Pokébola; converte pela matriz real do PNG e usa `opticalCenterXInParentPx` por fallback em arte sem anel confiável. Mantém topo 2px acima da arte, acessibilidade e escolha P1/P2 por clique sem realizar login. QA visual físico ainda pendente.
- Testes: `lt376e-profile-login-selector.test.js` simula cartão oficial de perfil **sem** área treinador Pokémon GO, com nome e foto públicos; verifica erro visitante e imagem de host não autorizado. Contratos LT169, LT183 e overlay-ux ajustados às novas regras.

## Gate de QA e limitações
- Exigir os sete workflows Node, LT169, LT211, Java, OTA, APK debug QA e Secure beta/R8 no MESMO SHA final; suplementar LT253.
- **Pendente físico:** entrar via Google e Discord separadamente; Conta 1 e 2 com cookies distintos; perfil com e sem treinador Pokémon GO; retrato carregado/rede lenta; login expirado; validação de 2FA pelo próprio provedor; posicionamento dos badges reais em telas Samsung/densidades/tema; privacidade e atualização/restauração de dados.
- Os vídeos demonstram a tentativa de OAuth, não certificam conclusão nem disponibilizam tokens. Nenhuma senha, cookie, e-mail ou avatar pessoal é registrado neste ARK.
- Nenhum release, merge ou alteração em `release/official-request.json`; mesma assinatura permanente exigida para qualquer futura publicação com versionCode maior que 54576.

## Encerramento ARK LT376e — auditoria QA verificada (16/11/2026)

**Resultado automático: 7/7 gates obrigatórios SUCCESS no commit de código QA `5a3cec4665e2b3f9fc26f854764ba78961b7db1b`.** Complementar LT253 SUCCESS em https://github.com/LucianoToscano/PokeSearch/actions/runs/43953597974.

- **Node QA: SUCCESS** — https://github.com/LucianoToscano/PokeSearch/actions/runs/43953598487
- **LT169 Node completa: SUCCESS** — https://github.com/LucianoToscano/PokeSearch/actions/runs/43953598016
- **LT211 Core: SUCCESS** — https://github.com/LucianoToscano/PokeSearch/actions/runs/43953598301
- **LT62 Java Android: SUCCESS** — https://github.com/LucianoToscano/PokeSearch/actions/runs/43953597958
- **LT173 OTA/Android: SUCCESS** — https://github.com/LucianoToscano/PokeSearch/actions/runs/43953598183
- **PGS APK Debug QA: SUCCESS** — https://github.com/LucianoToscano/PokeSearch/actions/runs/43953598209
- **Secure beta/R8: SUCCESS** — https://github.com/LucianoToscano/PokeSearch/actions/runs/43953598072

Dois workflows legados (LT304 e Build PokeSearch Android APK) foram **SKIPPED**: não contam como reprovação dos sete gates, tampouco demonstram publicação. O APK debug QA e o Secure beta utilizam assinatura de teste, não são release oficial nem devem ser instalados sobre a versão permanente. `main` confirmada em `ef99e39c7c1c4d33ba59c0351f2fc20924a60391`; última release `v0.03.69-54576`; PR #455 aberta e **não integrada**.

**O que está validado:** verificações estáticas de perfil/DOM visível, conta P1/P2, prova de sessão desacoplada do treinador, avatar HTTPS allowlist, alça central óptica com fallback, localização/cooldown, ancoragem de popups e blur condicional, além dos respectivos testes de regressão e builds acima. **O que NÃO está validado:** login Google/Discord real com MFA em WebView Samsung, carregamento de nome e foto reais nas duas contas, centro e altura dos badges na tela física, 16 linhas sem corte em todos os tamanhos, Favorites sem sobreposição em Samsung, blur quando o SO permitir, Minior P/M/G, tutorial e integração física PGSharp/Pokemod. Nenhuma captura/caminhada foi inferida.

**Nota de rastreabilidade:** este registro documental é posterior ao commit `5a3cec4665e2b3f9fc26f854764ba78961b7db1b`. O resultado 7/7 refere-se precisamente a esse SHA de código; um novo HEAD documental precisa ser identificado separadamente, e qualquer mudança de código requer nova bateria no SHA atualizado antes de merge/publicação.

**Regra de saída:** sem autorização nova, não mesclar PR #455, não alterar `versionCode`, assinatura permanente, `release/official-request.json` ou publicar APK. Ao homologar fisicamente, anexar capturas/vídeos e confirmar pessoalmente as sessões independentes P1/P2. Continuidade: `docs/LT377_PROMPT_CONTINUIDADE_QA_VISUAL_20261116.md`.
