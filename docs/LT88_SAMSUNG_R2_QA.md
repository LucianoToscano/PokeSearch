# LT88 Samsung QA R2 — 25/10/2026

## Evidências físicas de regressão
Capturas 04:54–05:07 no Samsung da versão 0.00.88/54291:
- Filtros e Modos ainda translúcidos, prejudicando a leitura; listas de opções sem fundo forte.
- Localização: Colar rejeita texto de coordenadas, mesmo quando o usuário vê um valor válido na área de transferência. Falta Copiar.
- Pokémon: sprites ausentes em algumas entradas *_NORMAL. Não usar sprite de outra forma/traje.
- Favoritos e Localização: apenas um perfil selecionado deve ficar amarelo, não todos os que estiverem gravados.
- Perfis gerais: painel Salvar dentro do menu gera áreas vazias, sobreposições e botões ilegíveis.
- Resultado: IV A/D/S nem sempre exibido; rótulo Despawn duplicado; ordenação por Distância pode renderizar resultados com metadados parciais.

## Correções implementadas na PR Draft #63
1. Fundo contrastante apenas na rail/editor de Modos/Filtros, opções Ordenar/Clima e flyout de perfis; área externa transparente continua pass-through. Separar no flyout Filtro 1–3, tocar carrega, segurar salva, × exclui.
2. Favoritos: 3 estrelas no cabeçalho, somente perfil ativo amarelo; toque para usar, segurar abre Salvar/Excluir; instrução no título.
3. Localização: botão Colar e Copiar, parser de texto completo ou URL com um par de coordenadas; rejeitar ambiguidades; ações de locais 1–3 apenas após toque longo, ajuda ?, estrela acesa somente quando o perfil é o selecionado e está aplicado.
4. Normalização: espécie_NORMAL aprovada pelo catálogo pode carregar a miniatura básica; forma especial continua em placeholder se não houver sprite validada.
5. Resultado/Detalhes: IV A/D/S e IV% separados, validados; timer exibe só tempo; não mostrar ?/?/? artificial; metadados anteriores reaproveitados só para encontro estritamente idêntico e não expirado.

## Segurança
- Main permanece LT87/54290, sem merge ou Release.
- Nova candidata de APK de teste: 0.00.89 / 54292, mesmo pacote e certificado permanente; este documento não atesta o build até GitHub Actions concluir SUCCESS.
- Sem leitura de clipboard em segundo plano, sem GPS físico, sem contorno de códigos API 401/403/429.
- A compatibilidade com o sistema Android de clipboard e popups exige TESTE FÍSICO; CI não substitui Samsung.

## Checklist QA obrigatório
Modos, Filtros, Clima, Ordenar, altura sem espaços vazios; Filtros 1/2/3 usar/salvar/excluir e preservar Shiny/localização; Favoritos ativo único; Localização clipboard texto/link, copiar, três locais e raios 0/215/1000 km; formas e sprites padrão/variantes; IV 0/15/15, GL/UL, Genderless ⚲, Rank PvP verificado, Despawn e ordenação; arrastes. Coordenadas de referência 24.9407581,121.1889794.

## Escopo do ciclo ainda pendente
LT88 homologação completa Samsung; LT89 importação/exportação e filtros; LT90 otimização avançada; LT91 Caçada; LT92 Mural Firebase; LT93 administração/métricas. Nenhuma dessas etapas é declarada completa por esta correção.

Nota: a versão de pacote 0.00.89 é apenas sequência numérica do APK QA 54292; não significa que LT89 inteira foi homologada.

## Prova automatizada do APK QA R2
- GitHub Actions protegido #40177146234: SUCCESS, `https://github.com/LucianoToscano/PokeSearch/actions/runs/40177146234`.
- SOURCE_COMMIT do APK: `03f22968b25cb3668e3f5b3eadde74a420d3ebc1` (não confundir com commits documentais posteriores).
- APK: `PokeSearch-v0.00.89-LT-Samsung-R2-QA.apk`, 38611955 bytes.
- SHA-256 do APK: `685fed288b895d220510ac5a893dc0eb58acc5a3ed7b46b4a041f1f317a5439b`.
- Artefato Actions #12592712470: ZIP SHA-256 `39afebda37911bc640bd828d2d2e22838f049076eb8f56473350464e78d34954`.
- Pacote `com.lucianotoscano.pokesearch`, versão `0.00.89`, versionCode `54292`. Gradle unit tests e assembleRelease PASS; R8/shrinkResources; APK ZIP íntegro e não depurável.
- apksigner v2 TRUE, certificado SHA-256 `34766c15d09013ad65873f9976539c8fa2f826e917dae3af57ea628cad689e8e` igual ao anterior.
- Workflow Guia Mestre #40177311565 SUCCESS: prefixo histórico preservado por SHA-256, registro R2 anexado, sem truncar.
- Não há PASS Samsung R2 nem publicação oficial; segurança da conta/API e pesquisas continuam protegidas.
