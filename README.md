# PokeSearch — Android Overlay

Aplicativo Android independente para exibir um overlay compacto sobre Pokémon GO, com dados de busca provenientes do site PoGoCoordinates quando disponíveis. **Versão atual do código: 0.40-beta**.

## Recursos
- Overlay flutuante transparente e retrátil: engrenagem arrastável, fechar (X) e minimizar.
- Busca por IV100 (15/15/15), Grande Liga #1 e Ultra Liga #1, com verificação dos filtros da página antes de apresentar resultados.
- ✨ Shiny desativado por padrão, ligado sob confirmação do controle real do site. Primeira ativação pode exigir login Discord/Google e vinculação do código de amizade do treinador.
- Atualização manual e automática (5 minutos padrão), tempos de despawn, sprites P/M/G e fichas com CP/IV/rank/localização/coords quando disponíveis.
- Catálogo local de 1.025 espécies e até 50 favoritos; alertas gerais e de favoritos; Pix voluntário.

## Construir e testar
Código-fonte oficial: [LucianoToscano/PokeSearch](https://github.com/LucianoToscano/PokeSearch) — `main`. Java 17, Android SDK 36, Gradle 8.11.1.

O GitHub Actions `.github/workflows/build-overlay.yml` verifica sintaxe JavaScript, smoke tests de filtro, compila o APK normal e verifica a assinatura e o ZIP. A execução bem-sucedida entrega um kit contendo APK beta, checksum SHA-256, fonte e documentos de auditoria.

**Identificador Android:** `com.lucianotoscano.pokesearch` (namespace Java antigo mantido intencionalmente). **Versão:** `0.38-beta`, versionCode 40, minSdk 26/targetSdk 33.

## Atenção: distribuição
O artefato produzido automaticamente atualmente é **debug**, com chave de assinatura que pode variar entre runners. Ele é indicado para **testes controlados**, não como release estável e atualizável. Substituir por assinatura de release permanente, protegida fora do repositório, antes de distribuir publicamente. Nunca remendar/reassinar APK depois da compilação.

Os resultados dependem da página e da sessão autenticada do PoGoCoordinates e não foram testados ponta a ponta num Android autenticado nesta auditoria. O login do Google pode rejeitar WebViews; dados Shiny exigem o vínculo exigido pelo fornecedor. Os termos do serviço restringem scraping e redistribuição em massa: [pogocoordinates.com/terms](https://pogocoordinates.com/terms). Verificar autorização de integração antes de divulgação pública.

## Documentos atuais
- [Arquivo mestre v0.40](docs/ARQUIVO_MESTRE_v0.40.md)
- [Auditoria v0.40](docs/AUDITORIA_v0.40.md)
- Arquivos anteriores preservados no Google Drive do projeto.

## Próximos passos
Testar instalação/login/consulta Shiny em Android real; assinatura persistente para futuras atualizações; favoritos diretamente no overlay sem trocar de Activity; melhorar robustez da interface se o DOM do fornecedor mudar.

Este projeto não altera o APK do Pokémon GO e não é afiliado à Niantic, à The Pokémon Company ou à Nintendo.

## Revisão da interface e beta para amigos (14/10/2026)
- ✨ Login é mostrado numa janela de autenticação com teclado redimensionável; enquanto o login estiver aberto, o overlay é ocultado para evitar interferência no toque/digitação.
- ⚠️ Novo botão no menu abre cadastro de bug ou sugestão, com eventos limitados/mascarados e exportação TXT; envio voluntário para contato de suporte via WhatsApp, sem transmissão automática.
- IV100 tem configuração alternativa verificável pelo filtro `% IV` de 100 a 100, além do filtro Raw IV de três/seis campos; não inventa resultados se a busca falhar.
- Consultas automáticas permitidas somente em 5/10/15/20 minutos, com intervalo mínimo de 60 segundos entre buscas efetivamente submetidas. Tentativas de login e configuração sem envio ao servidor não contam contra o intervalo.
- A versão gerada pelo CI continua **beta debug para testes privados entre amigos**, não uma release pública com assinatura persistente. O número de versão permanece 0.38-beta.

## Correção v0.40-beta — filtro Shiny desligado
- Busca normal não exige vínculo de treinador. O site pode mostrar resultados 100%/GL#1/UL#1 sem ✨ ligado.
- IV100: formulário configurado em % IV min=100/max=100, com alternativa Raw IV. Campo IV é localizado no seu próprio grupo, sem modificar CP/Level.
- PvP: ranking 1 é confirmado pelo formulário (liga, Top ranking e Include previous evolutions); os cartões de spawn podem não conter "Rank 1" individual e recebem `rankSource=verified-site-filter` quando a consulta é comprovada.
- Se o site mostra "Showing N spawns", mas o leitor acha 0, o overlay informa a divergência pelo ! e pode exportar relatório via ⚠️.
- Testes de regressão exercitam os dois casos. Teste real no dispositivo continua necessário.

## v0.40-beta — Interface simplificada e favoritos sem trocar de tela
- Dialog de login ocupa a tela disponível; o formulário oficial de Google/Discord recebe teclado. Um único `✓ Voltar` no topo substitui os botões CANCELAR/VOLTAR AO OVERLAY que obstruíam o site.
- Ao tocar ★, a lista com busca, sprites e seleções abre **na sobreposição Android**, sem trazer a Home do PokeSearch sobre o Pokémon GO.
- Controle de modo 100%/GL#1/UL#1 mostra as três opções abaixo do menu; AUTO mostra 5/10/15/20 minutos, evitando mudanças por cliques sucessivos.
- ✨ é independente do modo. Desligar apenas Shiny mantém IV100, GL#1 ou UL#1, e uma nova consulta é programada após o intervalo de segurança se necessário.
- Guia rápido aparece no primeiro uso e continua acessível pelo botão `ⓘ Guia rápido` na tela inicial.
- CI valida 13 testes do parser + 13 testes de contrato de interface, Java, lint, APK, assinatura e SHA-256.
- APK continua beta assinada por chave de debug temporária para testes entre amigos; autenticação real e campo de favoritos precisam de teste em aparelho.
