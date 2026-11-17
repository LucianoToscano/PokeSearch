# POKESEARCH — CONTINUIDADE ARK LT404

**Base esperada:** PokeSearch **v0.03.88 LT / versionCode 54595**, após conferir que a publicação oficial LT403 foi concluída pelo workflow protegido e que o APK está público. Se ainda não estiver publicado, registrar o bloqueio real, não presumir sucesso.

Repositório `LucianoToscano/PokeSearch`, branch `main`; ler `AGENTS.md`, `docs/GUIA_MESTRE.md`, `docs/LT403_AUDITORIA_CORRECAO_SPRITES_20261117.md`, o ARK LT403 e as auditorias LT400/LT401/LT402. Canal público **exclusivamente oficial**, sem FastDev.

## Prioridades LT404

1. **Homologação física no Samsung Android 17.** Instalar a v0.03.88 **por cima** da versão anterior; importar um PGSStats real atualizado e comparar a grade com o vídeo `Screen_Recording_20261117_152256.mp4`. Verificar sprites na grade, comparação e fichas; nomes, escala, alinhamento e telas 360dp/TalkBack. Não usar testes Node como evidência visual física.
2. **Sprites de forma e Shiny:** observar Mewtwo #150 Normal/Armored, Giratina #487 Altered/Origin, Zacian #888 Hero/Crowned, Zamazenta #889 Hero/Crowned, Landorus #645 Incarnate/Therian, Magikarp #129, Ducklett #580, Dialga Origin, Charizard e trajes de evento; normal e Shiny, sexo e IDs numéricos sem `formName`. Registrar os casos sem correspondência exata e os erros HTTP/timeout. Não exibir arte errada como fallback. Sem empacotar sprites de terceiros sem autorização adequada.
3. **Rede e cache:** com e sem internet, limpar/retomar cache autorizado, verificar URL HTTPS pinned, política de WebView Android, latência da lista, consumo de dados e erros 403/404/429. Avaliar cache privado automático *somente* com consentimento do usuário para dados de arte de terceiros; nunca contornar direitos ou limites de servidor.
4. **Sincronização PGSStats:** validar o URI SAF opt-in do arquivo realmente atualizado pelo PGSharp, permissões persistentes e revogadas, reabertura, seleção de outro arquivo, checagem ao entrar e após 3 minutos com tela aberta. Não prometer leitura arbitrária de diretórios de outros apps nem sincronização em background.
5. **Inventário e restauração:** manter dois inventários isolados, adicionar/editar apelido, PC, PS, IV, golpes e segundo carregado, melhores amigos/corações, favoritos e tags, seleção longa/múltipla, limpar e desfazer lote. Verificar reimportação sem sobrescrever edições pessoais, IDs duplicados, lote perdido; ampliar backup/restauração para notas, fundos decorativos e tombstones sem perda de dados e com formato versionado.
6. **ARK obrigatório:** executar QA Node/LT169/LT211/LT62/LT173/PGS/Secure beta R8, abrir e mesclar PR na main somente com gates verdes, nova versão monotônica e release oficial assinada pelo workflow protegido. Conferir SHA-256 do asset e certificado público; registrar Guia Mestre, auditoria e prompt seguinte. QA físico pendente deve ser explicitamente declarado.

**Regra de privacidade:** inventários são privados e locais ao PokeSearch. Editar, fortalecer, excluir, trocar golpes, tags e favoritos no app **não modifica o Pokémon GO nem o PGSharp**, e a ausência em um snapshot não comprova transferência no jogo.
