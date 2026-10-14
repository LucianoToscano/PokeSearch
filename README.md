# PokeSearch — Android Overlay

Aplicativo Android independente para exibir um overlay compacto sobre Pokémon GO, com dados de busca provenientes do site PoGoCoordinates quando disponíveis. **Versão atual do código: 0.38-beta**.

## Recursos
- Overlay flutuante transparente e retrátil: engrenagem arrastável, fechar (X) e minimizar.
- Busca por IV100 (15/15/15), Grande Liga #1 e Ultra Liga #1, com verificação dos filtros da página antes de apresentar resultados.
- ✨ Shiny desativado por padrão, ligado sob confirmação do controle real do site. Primeira ativação pode exigir login Discord/Google e vinculação do código de amizade do treinador.
- Atualização manual e automática (5 minutos padrão), tempos de despawn, sprites P/M/G e fichas com CP/IV/rank/localização/coords quando disponíveis.
- Catálogo local de 1.025 espécies e até 50 favoritos; alertas gerais e de favoritos; Pix voluntário.

## Construir e testar
Código-fonte oficial: [LucianoToscano/PokeSearch](https://github.com/LucianoToscano/PokeSearch) — `main`. Java 17, Android SDK 36, Gradle 8.11.1.

O GitHub Actions `.github/workflows/build-overlay.yml` verifica sintaxe JavaScript, smoke tests de filtro, compila o APK normal e verifica a assinatura e o ZIP. A execução bem-sucedida entrega um kit contendo APK beta, checksum SHA-256, fonte e documentos de auditoria.

**Identificador Android:** `com.lucianotoscano.pokesearch` (namespace Java antigo mantido intencionalmente). **Versão:** `0.38-beta`, versionCode 38, minSdk 26/targetSdk 33.

## Atenção: distribuição
O artefato produzido automaticamente atualmente é **debug**, com chave de assinatura que pode variar entre runners. Ele é indicado para **testes controlados**, não como release estável e atualizável. Substituir por assinatura de release permanente, protegida fora do repositório, antes de distribuir publicamente. Nunca remendar/reassinar APK depois da compilação.

Os resultados dependem da página e da sessão autenticada do PoGoCoordinates e não foram testados ponta a ponta num Android autenticado nesta auditoria. O login do Google pode rejeitar WebViews; dados Shiny exigem o vínculo exigido pelo fornecedor. Os termos do serviço restringem scraping e redistribuição em massa: [pogocoordinates.com/terms](https://pogocoordinates.com/terms). Verificar autorização de integração antes de divulgação pública.

## Documentos atuais
- [Arquivo mestre v0.38](docs/ARQUIVO_MESTRE_v0.38.md)
- [Auditoria v0.38](docs/AUDITORIA_v0.38.md)
- Arquivos anteriores preservados no Google Drive do projeto.

## Próximos passos
Testar instalação/login/consulta Shiny em Android real; assinatura persistente para futuras atualizações; favoritos diretamente no overlay sem trocar de Activity; melhorar robustez da interface se o DOM do fornecedor mudar.

Este projeto não altera o APK do Pokémon GO e não é afiliado à Niantic, à The Pokémon Company ou à Nintendo.
