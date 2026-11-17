# LT399 — Pokédex pessoal: fundos visuais, comparação e histórico
**Data:** 17/11/2026 · **Base:** v0.03.83 LT / versionCode 54590 · **Status:** implementação e QA, ainda sem homologação física.

## Fonte e auditoria visual
1. ZIP usuário `Sprites Pokemon.zip`: **220.484.254 bytes**, **107 entradas principais**, entre elas **55 ZIPs internos** com modelos/texturas OBJ, FBX, DAE, etc., spritesheets GO e outros jogos. O material não possui um diretório completo de `LocationCards` com correspondência numérica de fundos e, sem extração de sprite-atlas/rights/links, não deve ser incorporado integralmente ao APK.
2. ZIP usuário `ARQUIVO_MESTRE_POKEMON_UNICO_REVISADO_2026-11-17.zip`: **44 entradas** incluindo `latest.json` e `pogo_pkm.json`; base de Game Master é versão datada, não substitui fontes atualizadas sem resolver inconsistências. Não copiar dados de perfil e não publicar arquivos de conta.
3. Catálogo `WatWowMap/pogo-data-api/data/v1/location-cards.json`: **278 IDs** de fundos.
4. `PokeMiners/pogo_assets/Images/LocationCards` no commit fixo **db10df75d6f6f92018d9786af0aecc238fecc4ef**: **263 PNG**, **114.622.187 bytes**, com tamanho e Git blob SHA-1 por arquivo.
5. Cruzamento por `imageUrl + ".png"` com comparação de caixa insensível: **275/278 IDs vinculados a PNG existente**. IDs **28, 204 e 423** não têm correspondência segura e permanecem com placeholder, sem inventar imagem. Há imagens que podem ser reutilizadas por diferentes IDs.
6. Direitos: conteúdo gráfico dataminado pertence a seus titulares; PokeMiners https://pokeminers.com/credits/ destaca propriedade de Niantic/The Pokémon Company. A PR **não embute nem republica PNG de terceiros** no APK. Em vez disso, permite que o próprio usuário inicie download opt-in diretamente de PokeMiners para o **armazenamento privado local**; acesso sem login e não faz upload de inventário.

## Arquitetura do cache
- `pokedex_background_manifest.json` imutável em assets, contendo ID, nome, tipo, filename, tamanho e SHA git blob.
- No Android: `getFilesDir()/pokedex_backgrounds`; somente nomes allowlist `[A-Za-z0-9_-]+.png`, limite 8 MB por arquivo, URL de commit fixo, HTTP 200 sem redirecionamento, timeout e stream 16 KiB, tamanho final exato e SHA git blob completo, gravação `.pending` e rename somente depois de verificar integridade.
- Usuário escolhe **Baixar todos**, **Cancelar** ou **Apagar cache**; progresso e retomada por arquivo validado; a tela precisa permanecer aberta. Limpeza não altera `PGSStats.json`, notas nem fundos originais.
- WebView serve exclusivamente imagens locais validadas em `https://pokesearch.local/bg/<filename>`; a origem externa **não** ganha permissão genérica de navegação JS ou arquivos. Sem CDN de terceiros para recursos privados.
- Na ficha: fundo oficial por ID aparece por padrão **apenas se já estiver em cache**. Escolher um fundo de outro evento é explicitamente **decoração do PokeSearch** (não transforma o Pokémon real); o ID original do JSON permanece inalterado.

## Novas ferramentas
- Filtros combinados por interseção e busca já existente.
- Seleção visual de até três Pokémon; comparação PC/IV/PS/forma/Shiny/Sombra/Fundo/Traje.
- Notas próprias limitadas a 500 caracteres, em SharedPreferences por coleção/ID.
- Histórico agregado das 10 importações mais recentes por coleção: quantidade, IDs novos, ausentes e registros alterados, sem atribuir automaticamente motivo a ausências. Somente snapshots compactos atuais + métricas históricas, não cópias completas.
- Grid com área inferior de segurança, textos/IVs compactos, fundo e seleção com alto contraste. Mantidos os ícones existentes da Home.

## Riscos e pendências da etapa física
- O download integral ~115 MB consome armazenamento e tráfego: modo opcional, requer usuário tocando explicitamente. Não executar silenciosamente em segundo plano.
- Há 3 IDs sem arquivo correspondente; não inventar.
- O conjunto do usuário de modelos 3D e GIFs não foi reempacotado; necessário mapear direitos e cobertura para integração futura.
- Ainda não instalado em Samsung Android 17 nem testadas conectividade móvel, VPN, Wi-Fi, retomada após cancelar, limpeza e 1.198 Pokémon/11 ovos com o JSON original.
- Executar CI Node, Java LT62, OTA LT173, LT211, PGS e assinatura R8; não considerar publicação concluída até release estável com hash e assinatura aprovados.
