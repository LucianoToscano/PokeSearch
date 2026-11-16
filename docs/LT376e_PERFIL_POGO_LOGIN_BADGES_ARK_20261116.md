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
