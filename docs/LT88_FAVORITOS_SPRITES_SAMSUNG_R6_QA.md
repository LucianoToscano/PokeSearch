# PokeSearch — LT88 Samsung R6 · Favoritos automáticos e sprites

Data: 25/10/2026. Base histórica oficial **LT87** (0.00.87 / 54290), `main` **83cf9a693a3672276e01d04e38ed14dce0071cb8**.

## Escopo e origem
- PR #63 Draft: `feature/lt88-lt93-evolution-20261025`, uma única PR do ciclo, sem merge nem Release oficial.
- Usuário informou já ter distribuído uma versão anterior aos demais usuários: **não atualizar/publish Release nem trocar assinatura sem autorização**.
- Novo candidato para QA/distribuição voluntária e instalação por cima: `0.00.93`, `versionCode 54296`, certificado LT75 mantido. **Não alegar PASS até conferir CI assinado e hash**.

## Favoritos
- Três estrelas de perfis com indicador amarelo exclusivo apenas no perfil ativo. Toque em uma estrela vazia cria perfil com a seleção atual; toque em perfil salvo ativa sua lista.
- `PokemonPicker.java` já atualiza automaticamente o slot ativo a cada alteração realizada dentro do seletor; toque longo abre a opção contextual de limpar a lista **daquele slot**, com ação explícita. Inativos ficam preservados. Nenhum dado é apagado apenas ao abrir o menu.
- `WatchAlerts.toggle()` agora salva a lista atualizada e o slot ativo **na mesma transação SharedPreferences**, inclusive quando Favoritos é alterado fora do seletor; preserva os outros perfis.
- Limpeza de perfil ativo também limpa lista atual e atualiza UI/alertas sem sobrescrever listas de outros slots.

## Sprites e performance
- `VerifiedSpriteCache.java`: aproveita cache do `PokemonPicker` e aceita pedidos do menu/resultados apenas para URLs **exatas** da PokeAPI (sprite padrão ou shiny explicitamente conhecido); guarda shiny em arquivo separado para nunca trocar aparência por forma incorreta.
- No worker do `shouldInterceptRequest` da WebView, cache ausente tenta fonte principal PokeAPI e mirror jsDelivr com timeouts; sem redirects, HTTPS, PNG verificado, limite 256 KiB por arquivo, dimensões 8–1024px e LRU no cache interno com no máximo 80 arquivos (evicção para 64), failures amortecidas por 60 s. Nunca baixa formas especiais/costumes presumidos nem toca tokens/API de pesquisa.
- `dock.html`: pool de pedidos para sprites-base no menu Pokémon agora tenta mirror mesmo quando a imagem principal carregou com dimensões inválidas. Resultados mantêm retry limitado de sua URL observada, com fallback neutro em falha; preservam URL e identidade real de cada forma.
- Falhas de rede e sprites inexistentes na origem ainda podem resultar em placeholder seguro; **não inventar sprites** e não prometer carregamento completo de todo Pokémon.

## Itens da sequência anterior preservados
- Filtros salvos Padrão + 3 perfis com toque para usar, 💾 salvar explícito, X excluir; botão circular ⊙; Localização sem slots favoritos; Colar após ação explícita com foco/clipboard Android e fallback de teclado; Copiar na linha do raio.
- Seletor de Favoritos junto à barra flutuante; Pix e escolha/prévia de som em `OverlayQuickMenus`, sem navegação de Home. Confirmar no Samsung.
- Theme visual unificado, transparência configurável (50% inicial), blur 0–16 px e fallback de contraste.

## Testes
- Automatizados: suites Node históricas (atualizar apenas verificações de implementação legada comprovadamente substituída), Gradle e R8, `apksigner` v2, não depurável, package `com.lucianotoscano.pokesearch`, certificate SHA-256 `34766c15d09013ad65873f9976539c8fa2f826e917dae3af57ea628cad689e8e`, SHA256SUMS comparado ao APK extraído.
- Samsung FÍSICO ainda pendente: adicionar/remover Favoritos e reiniciar app para conferir autosave; tocar estrela 1/2/3 sem cor dupla; segurar/confirmar limpar tudo; abrir lista no overlay sem Home; sprites base e shiny no Pokémon/Favoritos/resultados, repetição de busca, DOM/API em limites, resultados expirados. Verificar Filtros, localização, menús de som e Pix.
- Demais fases LT89–LT93 continuam sem homologação integral; não recomeçar, não reabrir PR #62.

## Guia Mestre
Fazer apenas append a `docs/GUIA_MESTRE.md` completo no checkout e verificar prefixo SHA-256; nunca substituir pelo texto parcial devolvido por conectores. 

## Validação final do APK QA R6
- Workflow assinado #40185260932: **SUCCESS**, https://github.com/LucianoToscano/PokeSearch/actions/runs/40185260932
- SOURCE_COMMIT gravado no APK: `ce71860a5266e01c7a56505b15bbc3bd7af80d76` (diferente de commits documentais posteriores).
- Arquivo: `PokeSearch-v0.00.93-LT-Favorites-Sprites-QA.apk`, 38.629.615 bytes.
- SHA-256 do APK: `5144922c0f714d77af70c0bedf596d56fb2a8f3e7e140364715502b543cf68de`; SHA256SUMS.txt **OK** após extração.
- Artifact ID GitHub Actions #12595453168, ZIP SHA-256 `f16e3fb4e11196b9b76f215c0f885871fa6e047c9e8b4d5a808833212f4783bb`, integridade ZIP OK.
- `com.lucianotoscano.pokesearch`, versionCode `54296`, versionName `0.00.93`, assinatura v2 TRUE, certificado `34766c15d09013ad65873f9976539c8fa2f826e917dae3af57ea628cad689e8e`, não depurável, R8 e shrinkResources.
- Workflow do Guia Mestre R6 #40185354654: SUCCESS, append protegido por hash do prefixo histórico.
- A main mantém LT87 oficial sem merge; PR #63 permanece Draft.
- **QA físico Samsung deste APK ainda pendente.** O fato de já existirem usuários usando outra atualização não equivale à homologação da R6.
