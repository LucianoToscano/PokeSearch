# LT360 — Auditoria complementar Pokemod 14.2.1, lista lateral e perfil universal (15/11/2026)

## Escopo e fonte diretamente inspecionada
- **APK recebido efetivamente reaberto**: `Pokemod-v14.2.1 Versao Aberta para Desenvolvedores Autorizado para PokeSearch e LucianoToscano.apk`, 48.886.418 bytes, SHA-256 **`a671a80e9454882bc456ed9d857bb6be2e0c220c34c43c119d6b98bd256851f1`**, **1.088** entradas, `ZipFile.testzip() = None` (CRC íntegro).
- **Três imagens do usuário inspecionadas diretamente**: `1794721093169.jpeg` **691×1536**, `1794721099641.jpeg` **360×1536** (ampliação/recorte, **não** dimensão de aparelho), `1794721125858.jpeg` **864×1536** (fotografia de outra tela; perspectiva/recorte). **Não copiar** screenshots do usuário ou avatar para o repositório.
- Imagem 1: mapa Pokémon GO, coluna de círculos claros contendo imagens de Pokémon e um **controle distinto de radar/lupa no rodapé**. Imagem 2: ampliação confirma miniaturas individualizadas dentro de círculos; o controle de radar não é Pokémon. Imagem 3: outra disposição, dois círculos de Pokémon com noite/iluminação diferente. Os locais visuais estão próximos à **borda esquerda**, não no mapa 3D central.
- Exemplos **aproximados**, não calibração física: primeira captura, centro de círculo à esquerda ~`x=50, y=930` em 691×1536; terceira ~`x=90,y=1160` em 864×1536. Fotos podem ter redimensionamento. Não extrapolar para px/dp reais, tipo de aparelho, toque, espécie exata, funcionalidade ou plugin ativado. Não tratar imagem de radar como sprite nem confundir círculos claros do próprio jogo com prova de espécie.
- Evidência que **não aparece** nas capturas: se um toque na lista teleporta, abre encontro, seleciona, mostra opções ou simplesmente navega; se Pokemod estava injetado naquele instante é inferido pelo contexto do usuário, não verificado por instrumentação do PokeSearch.

## Auditado além da LT359: formatos e limites
- O APK é o **gerenciador** `com.pokemod.app.public`, não o APK do Pokémon GO e não um arquivo claramente estruturado de imagens do feed. **411 PNG**, **3 JPG**, **2 GIF**, **23 OGG**, **2 DEX**, **9 bibliotecas .so** (`libconceal` e `libfancier` em ABIs diferentes); **3 assets executáveis**: `pokemod-injector` ELF AArch64 **23.746.440** bytes, `busybox-arm64` e `sqlite3-arm64`.
- O DEX contém referências de recursos `SHINY_NOTIFICATION_SOUND`, `default_shiny_found`, `ic_legendary_scanner` e `ic_legendary_scanner_wrapper`. **Isso não é um atlas de sprites Pokémon**, nem demonstra API pública para obter dados internos da lista. Os arquivos `assets/` são executáveis, não pastas de modelos de miniaturas.
- O ELF mostra identificadores de processos e RPC genéricos, inclusive `com.nianticlabs.pokemongo` e `Pokemod Injector version %s`. A inspeção de strings ASCII **não encontrou um catálogo legível de sprites por espécie/formas** nem os termos de interface `shiny/radar/sprite/teleport` em nomes claros. **A ausência de strings claras não demonstra ausência de implementação em código nativo ou payload remoto.** Nenhum executável do APK foi iniciado.
- Website oficial `https://pokemod.dev/pt`: descreve Shiny Scanner, notificações e opções de coordenadas, Virtual GO Plus, Quest Tweaks, Magic Bag, PvP Metrics, Cooldown Tracker, Account Manager e muitos outros. São funcionalidades do Pokemod conforme **fornecedor**, não novas capacidades comprovadas no APK, nem APIs com licença de uso para PokeSearch.
- **Zero** modelos individuais de miniaturas de feed com validação e direitos de redistribuição. `app/src/main/assets/pgs-native/manifest.json` permanece `entries: []`. A autorização de avaliação técnica do APK não comprova sublicença sobre sprites Pokémon de terceiros nem permite integrar executáveis/injetores privados sem contrato e proveniência. **Nenhum asset proprietário foi copiado.**

## Decisão de arquitetura: dois clientes exclusivos para um complemento
- O usuário relata que PGSharp e Pokemod **não são usados simultaneamente no mesmo jogo**. O PokeSearch deve trabalhar sobre um **perfil único selecionado** (`pgsharp`, `pokemod`, `other`) e não exigir os dois apps instalados nem ativar ambos. Legados continuam em PGSharp; capturas do Pokemod ficam em Pokemod; dados de Pokébolas, contas e filtros seguem independentes.
- O jogo visual do Pokemod ocorre em `com.nianticlabs.pokemongo`; o pacote do **gerenciador** `com.pokemod.app.public` não é janela de captura, alvo de clique ou prova de módulo injetado. Pokemod exige root segundo seu site, **PokeSearch não solicita root** nem se integra ao injetor.
- **PGSharp**: manter a busca do feed nas **duas bordas**, 28% do width em retrato e 34% em paisagem; banda vertical 7%..91%; comportamento legado preservado.
- **Pokemod**: por padrão observar somente a **barra esquerda** de círculos vista nas imagens, com seletor pequeno para usar **barra direita** se o usuário a mover. A mesma banda vertical e geometria proporcional são adotadas inicialmente; **não é calibração física comprovada**. Nenhum pixel 3D central deve receber correspondência.
- **Outros clientes**: varredura de prévia nas duas bordas, mas `PgsAutoHostPolicy.OTHER` continua **sem despacho automático de gesto**. Cliente futuro requer confirmação de pacote/versão/janela, ROI e consentimento de captura, com perfil específico antes de habilitar toque.
- O botão do PokeSearch na direita da tela, **arrastável**, tende a não conflitar com a lista esquerda do Pokemod, mas overlay real, Samsung, teclado, acessibilidade e modo paisagem precisam de ensaio.

## Melhoria implementada no código original LT360
1. `PgsAutoScanRegionPolicy` puro Java: ROI por provedor e lado, limites X de iteração; sem coordenadas de GPS, sem cópia da imagem do usuário, sem pixel absoluto.
2. `PgsAutoHostSettings`: guarda `pokemod_sidebar_side` só no perfil Pokemod, sem mudar contas/filtros/cadastros.
3. `PgsAutoIconDetector`: captura perfil/lado ao criar o detector, usa ROI antes da correlação para evitar símbolos do lado oposto e encurta a varredura horizontal com limite de **4.500ms e 256 candidatos mantidos**; mantém segunda captura estável e recusa de ambiguidades.
4. `PgsAutoMenus`: configura lado da lista **dentro** do seletor PGS/PM/OUT; sem aumentar fileira principal; previne suposições de toque. Mudança de lado chama `modelsChanged()` e invalida scanner antigo.
5. `PgsAutoClickService.startTeaching()`: instrução específica para capturar o **desenho interno**, sem círculo igual entre espécies e sem ícone de radar nem cenário. 
6. `PgsAutoScanRegionPolicyTest`, Node contrato LT360 e QA Core LT211: provas determinísticas de retrato, paisagem, amostras de geometria aproximada, PGSharp sem regressão, Pokemod por coluna, bordas e OUT somente prévia. **Não são provas de reconhecimento ou toque reais.**

## Outras oportunidades recomendadas, sem atribuição indevida ao APK
| Prioridade | Ferramenta PokeSearch | Valor complementar, sem duplicar internals do Pokemod | Evidência / limite |
|---|---|---|---|
| P0 | Assistente visual da lista Pokemod | Aprendizagem de ROI e miniaturas por espécie/forma/variantes, marcação de interesse e prévia sem gesto | Ícones circulares aparecem nas imagens; toque sem prova |
| P0 | Gestão de modelos por cliente | Catálogo `(provedor, layout, jogo, dex, forma, variante, largura, altura, hash, direitos, evidência)` e teste de escala/iluminação | Projeto próprio; só dados lícitos |
| P0 | Segurança de Auto Click | Confirmar duas capturas, pacote/janela do jogo, não atingir botões/avisos, distinguir callback Android de resposta no jogo; ação manual até homologação | Funcionalidade nativa de acessibilidade do PokeSearch |
| P1 | Monitoramento sem clique | Alertas de espécies favoritas visíveis na lista, deduplicação por slot e sessão, sem injetar código no Pokemod | Novo recurso a desenvolver; não inferir Shiny de miniatura normal |
| P1 | Painel de compatibilidade | Saber qual cliente, lado da lista, modelos disponíveis, falso positivo, latência, timeout, permissão de captura e consumo | Novo diagnóstico, não usar dados privados do jogo |
| P1 | Catalogador de variantes | Família, forma regional, gênero, trajes, normal/Shiny, XXL/XXS, distinguindo hipótese vs validação no aparelho | Exige dataset autorizado; não há 1.025 modelos prontos |
| P1 | Assistente de Reides e PvP | Recomendação/planejamento PokeSearch usando seus próprios dados autorizados, sem ler RAM do Pokemod | Evitar duplicar módulos pagos |
| P2 | Quests, Rocket, Power Spots | Filtrar, favoritar e coordenar atividades entre resultados PokeSearch e jogo, só com dados/URLs autorizados | Não inferir API de `queries` ou Receiver no APK |
| P2 | Histórico e sessões | Registrar apenas alertas e capturas consentidas; dados locais segmentados por perfil e conta PokeSearch | Nunca extrair credenciais do Pokemod |
| P2 | Biblioteca remota assinada | Ed25519/ECDSA pinado, hash por modelo, versionamento, antirrollback e revogação de conteúdo licenciado | Arquitetura futura, **não implementada** |
| P3 | Integração oficial de comandos | Apenas se o fornecedor entregar documentação de API, contratos explícitos e permissões | `DataReceiver`/intent vista no APK **não** é contrato de API |

## Protocolo físico antes de afirmar compatibilidade funcional
- Samsung com **um** dos clientes por vez: PGSharp depois Pokemod; não exigir instalações simultâneas, não inferir módulo só pela presença do gerenciador.
- Testar lista Pokemod no lado esquerdo e direito com 1/5/10 espécies e variações de layout, zoom, densidade, tema diurno/noturno, retrato/paisagem; selecionar Pokémon real, nunca botão de radar.
- Capturar e salvar sprite pessoal por cliente e comparar início/fim do scroll; 2 frames no mesmo slot; demonstrar que o PGS nunca usa captura PM e vice versa.
- Se o usuário quiser clicar: registrar separado **reconhecimento**, **seleção de pixel**, **gesto Android**, **resposta visual da UI**, **coordenadas/teleporte efetivo**, **encontro**, **Shiny**. Uma etapa não prova a próxima.
- Evitar aceitar automaticamente diálogos `Sou passageiro`, avisos de conta, suspensão, sobreposição Unity não legível. Medir CPU/RAM, duração do scanner e bateria por perfil.
- Preservar P1/P2, Rare Candy, Edu, filtros, favoritos, contas, status OTA, Samsung required-card sprite fallback SHA-pinned LT357 e PR LT350 #385 draft.

**Estado de entrada**: LT359 oficial **0.03.55 / versionCode 54562 / label 51359**, `main` inicial `79821b47c8bfd9578f7766e9d4b7979b61c62b4b`. Ao completar: sete gates verdes no head final, merge seguro, publicação monotônica por workflow protegido e verificação pública do SHA. Não publicar relatório de QA físico como PASS sem dispositivo real.
