# ARK LT400 — Banco visual da Pokédex, filtros corrigidos e release oficial (17/11/2026)

## Publicação realmente verificada
- **PokeSearch v0.03.85 LT**, versionCode **54592**, label **51400**.
- **Release pública:** https://github.com/LucianoToscano/PokeSearch/releases/tag/v0.03.85-54592, publicado em 17/11/2026 às 14:18:43Z, draft=false, prerelease=false.
- **APK assinado permanente:** https://github.com/LucianoToscano/PokeSearch/releases/download/v0.03.85-54592/PokeSearch-v0.03.85-LT.apk
- Asset GitHub `PokeSearch-v0.03.85-LT.apk`, **61.738.872 bytes**, state=uploaded.
- SHA-256 do asset conforme API GitHub e workflow `Verify public release and hash`: **608f4d496a94d658138961c2bd2fd1a9b72574d5ebdf13a0610391ba9cb35304**.
- Assinatura permanente esperada/validada no workflow, certificado SHA-256 **34766c15d09013ad65873f9976539c8fa2f826e917dae3af57ea628cad689e8e**.
- Workflow oficial #44100824305 https://github.com/LucianoToscano/PokeSearch/actions/runs/44100824305 **completed/success**, preflight, Node/OTA, geração de assets, build assinado, validação APK e certificado, publicação da release pública, hash e limpeza do material privado, todos sucesso.
- Código PR **#512** https://github.com/LucianoToscano/PokeSearch/pull/512, squash merge `3397674c8b7110c22344d8485dc1fd9b6852d76d`.
- Versionamento PR **#513** https://github.com/LucianoToscano/PokeSearch/pull/513, squash merge `3016a8f87125b06a2cd726c4e36c88afa4de8c2d`.

## Resultado: catálogo de sprites GO e classificações
- Novo banco de metadados `app/src/main/assets/pokedex_sprite_manifest.json`: **3.850 sprites Addressable Pokémon GO** (cerca de 119 MB na origem), **2.213 sprites legadas** (cerca de 58 MB), **6.063 entradas de arquivo** com nome/tamanho/Git blob SHA-1, commit de origem PokeMiners fixado em `db10df75d6f6f92018d9786af0aecc4ef`.
- Também indexa **1.506 formas** (108 com isCostume), **87 tipos de traje**, **1.025 espécies** com bandeiras Lendário/Mítico/evolução/gênero e formas padrão.
- `pokedex_sprite_catalog.js` verifica (speciesId, formId/formName, costumeId, gender, shiny) e só resolve arquivo presente no catálogo. Bug Giratina Altered causado por `FORM_UNSET` corrigido e regressão real aprovada; testes cobrem Deoxys Attack, Kyurem Black, Ducklett, Eternatus, Pikachu com roupa, Shiny e ausências honestas.
- `PokedexSpriteStore.java`: opções **Baixar sprites do inventário**, **Baixar coleção GO completa** e **Baixar imagens legadas**. Download SOMENTE após toque do usuário, cache privado no aparelho, caminho fixo, arquivos allowlist e tamanho máximo, verificação byte/hash e arquivo `.pending`, cancelamento/retomada, limitação do estado e limpeza. PNGs extraídos de jogos são de seus titulares; nenhum dos 6.063 PNG foi embutido no APK oficial nem exportado ao GitHub como asset.
- `PersonalPokedexActivity` fornece bridge segura e só entrega imagens baixadas via WebView intercept local; não envia PGSStats a terceiros.
- Sombroso = `pokemonDisplay.alignment=1` (93 no arquivo de referência), Purificado = `alignment=2` (7); indicadores visuais diferenciados. Fundo desconhecido não se torna automaticamente localidade.
- Lendário, Mítico e Pode Evoluir por metadados verificáveis. Evento visual diferente de origem em evento; Mega registrada leva em conta `megaEvolvedForms`, booleano e nível, sem afirmar paridade com filtro in-game de outro snapshot.
- Preservados ícones da Home e P1/P2, overlays, busca, cadastro, privacidade, inventários independentes e funções de análise; comércio fora do escopo.

## QA e limitações reais
- Head PR código #512 `c7f29963c427d09086d013de04b8e44de8f927be`: Node, LT169, LT211, LT62 Java, LT173 OTA, FastDev smoke advisory, Secure beta APK/R8 = **success**. Uma versão anterior da PR falhou em caso Giratina e foi corrigida; não ocultar esse achado.
- Head PR versionamento #513 `c2c5b66444e5281ee3105e37bf3ad3a645c37cdb`: preflight release, Node, LT169, LT211, LT62, LT173, FastDev advisory, Secure beta R8 = **success**. Jobs marcados skipped não alegados como tests.
- O APK oficial foi compilado e validado por workflow protegido.
- **Não houve homologação física Samsung SM-S928B Android 17**, importação real PGSStats via SAF no APK final, comparação visual pixel a pixel, teste de rede real nem download de 6.063 arquivos no telefone. A cobertura é dos arquivos encontrados na fonte, não 100% das combinações possíveis de sprite/forma/costume/gênero/Shiny.
- Os dados do PGSStats real e seus identificadores não foram adicionados ao GitHub.
- Sprites do Pokémon GO e modelos terceiros têm direitos autorais; catálogo de metadados e download pessoal opt-in não constituem licença para redistribuição, uso comercial ou integração automática em APK.

## Continuidade LT401
Validar fisicamente instalação sobre v0.03.84; checar 1.198 Pokémon, 11 ovos, contagem Shiny, 93 Sombrosos, 7 Purificados, trajes, Mega, fundos, Giratina Altered e outras formas; monitorar cache/rede/armazenamento, download parcial e retomada, perfis e desempenho. Se necessário ampliar cobertura apenas após provas e permissão de uso. Cumprir ARK a cada atualização (auditar → testar → merge → release protegida → hash/certificado → Guia Mestre e prompt).
