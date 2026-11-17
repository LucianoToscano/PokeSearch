# PokeSearch — ARK LT393 — Home 16 módulos / Atualização oficial 0.03.78 LT
Data: 17/11/2026

## Escopo e autorização

Pedido do proprietário: reconstruir a Home da versão oficial 0.03.77 LT usando os desenhos enviados em `Iconehome.zip` e `Iconehome (1).zip`, sem menu Extra, com 16 módulos em grade 4×4, sem destaque especial para Pokébolas 1/2. As Pokébolas refletem a família da imagem dos ícones flutuantes de suas respectivas buscas.

## Entrega

- Código: PR [#491](https://github.com/LucianoToscano/PokeSearch/pull/491) **MERGED**, squash `afbe0109a9e9d1e83f36a00f2d24798147dccd75`.
- Home: 16 células 4×4, labels compactos, sem cards grandes, papel de parede preservado. Atlas interno `app/src/main/assets/home-user-icons-atlas.png` com 12 artes derivadas dos arquivos do proprietário; duas Pokébolas dinâmicas; Assistente e Rocket usam artes que já faziam parte do pacote incorporado. Os arquivos originais de overlays, sprites e logins não foram substituídos.
- Controles existentes: P1/P2, Auto Hunt, Assistente do Dia de Reides, Raids, Power Spots, Quests, Rocket e Rare Candy mantidos. Módulos ainda sem backend (PvP, Pokédex, Scanner, Trocas, Calculadora, fórum Comunidade) mostram aviso de preparação em vez de dados fabricados.
- Espelhagem P1/P2: filtros independentes `prefs` e `prefs_secondary`, base carregada dos recursos `result-icons` usados por `dock.html` e valores IV/rank quando aplicáveis. Não representa como confirmadas as categorias Shiny/fundos nem estados de histórico sem confirmação do WebView.
- Testes de fonte: `app/tests/lt393-home-16-owner-icons.test.js`, ajustes dos contratos anteriores e `docs/LT393_HOME_16_ICONES_ORIGINAIS_20261117.md`. PR #491 passou Node QA, LT169, LT211, LT62 Java Android, LT173 OTA, FastDev smoke (sem distribuição) e Secure beta APK/R8.

## Publicação oficial

- PR [#492](https://github.com/LucianoToscano/PokeSearch/pull/492) **MERGED**, squash `27a5835353e9d6b23b62cfacb2f6b05b628219c3`.
- Versão pública: **PokeSearch v0.03.78 LT**, versionCode **54585**, label **51393**. Tag **`v0.03.78-54585`**.
- Workflow protegido [#44041413061](https://github.com/LucianoToscano/PokeSearch/actions/runs/44041413061): **completed / success**. Verificação da chave permanente e certificação do APK, integridade, pacote, atualização monotônica e SHA-256 público passaram.
- APK: [PokeSearch-v0.03.78-LT.apk](https://github.com/LucianoToscano/PokeSearch/releases/download/v0.03.78-54585/PokeSearch-v0.03.78-LT.apk), **61.251.587 bytes**, SHA-256 **`a11a89a4923106db1c421318572727af2d307b91f10c7c7799a50478c23c3ded`**.
- Release: [v0.03.78-54585](https://github.com/LucianoToscano/PokeSearch/releases/tag/v0.03.78-54585) não-draft, não-prerelease, asset status `uploaded`, digest verificado. Release 0.03.77 mantida.
- Histórico embutido em `app/src/main/assets/release_notes.json`. Atualização oficial instala sobre o APK anterior de mesma assinatura, mediante consentimento do Android.

## Pendências reais — não considerar homologadas

1. Teste físico do APK em Samsung SM-S928B Android 17 e Android 11–17: aparência dos 16 ícones, deslocamento/rolagem, toque, fidelidade visual dos dois modos, diferentes fontes/densidades e TalkBack.
2. Confirmar no aparelho se a representação das duas Pokébolas espelha todos os detalhes gráficos do resultado flutuante (histórico, Shiny, indicador de fundo, badges), inclusive troca em tempo real; a versão atual implementa imagem-base e valores de filtros, não uma réplica visual completa.
3. Implementar páginas reais para Pokédex/Inventário, Scanner, Trocas, PvP, Calculadora e Comunidade quando houver especificação; não transformar avisos de preparação em recursos supostamente concluídos.
4. Reordenação da grade por arrastar/soltar foi proposta no projeto, **mas não implementada** nesta entrega.
5. QA física de login Google/Discord/MFA, duas contas independentes, PGSharp/Pokemod, sprites, busca visitante 5 resultados, consentimento do instalador e limites reais HTTP 429 continua pendente.

## Continuidade — LT394

Partir da oficial 0.03.78 LT / 54585. Primeiro coletar screenshots reais no Samsung da Home 4×4 e comparar visualmente cada ícone ao pacote do usuário. Corrigir centralização/escala/títulos sem introduzir fundos gigantes e sem alterar a assinatura, manter o overlay P1/P2 independente e auditar badges faltantes do WebView antes de dizer espelhamento completo. Testar P1/P2, Auto Hunt, Rare Candy, Raids, login, release notes, instalação sobre 0.03.77 e compatibilidade com o jogo. Após QA, proceder a ARK protegido para próxima versão monotônica.
