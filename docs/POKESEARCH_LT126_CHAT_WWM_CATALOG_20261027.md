# LT126 — Chat Firebase e primeiro catálogo externo WatWowMap

Data de referência do pedido: 26/10/2026. Execução: 27/10/2026.
Branch: `fix/lt126-chat-wwm-catalog-sprite-audit-20261027`
PR empilhada: [#83](https://github.com/LucianoToscano/PokeSearch/pull/83), baseada na PR [#80](https://github.com/LucianoToscano/PokeSearch/pull/80). Não promovida a main.

## Chat: incidente reproduzido por screenshot e revisão do código

- No aparelho: `PokeSearch v0.01.24 LT`, `Ativos agora: —`, `Instalações: —`; mensagem `Não foi possível enviar`, leitura `Não foi possível carregar o chat`. **Esta captura não é da QA R2 0.01.25/54330**.
- O Chat LT122 utiliza `chat/messages` por Firebase Authentication anônimo e Realtime Database, com query `orderByChild(createdAt).limitToLast(60)`; o arquivo `firebase-realtime.rules.json` versiona `chat/messages`, mas **não prova deploy das regras em produção**.
- Falha de ordem de inicialização potencial: Chat chamava `FirebaseApp.getInstance("PokeSearchStats")`, que falha se o cartão de estatísticas ainda não tiver criado o app nomeado. Foi criado `FirebaseStats.ensureApp(Context)`, utilizado em ambos.
- Falha de UX: botão Enviar era liberado antes da confirmação da leitura, e `DatabaseError.PERMISSION_DENIED` era tratado como falha genérica de conexão. Agora o envio exige feed autenticado e lido, exibe acesso negado distinto de indisponibilidade e permite reconexão pelo texto de estado.
- Sem postagens fictícias, categorias, funções de moderador, outros backends ou exposição de UIDs no frontend. O chat continua um só feed.
- **NO-GO do Firebase real:** execução no aparelho com duas identidades e implantação atual de Rules ainda não confirmadas. Nenhum `firebase deploy` foi executado. Não afirmar que o chat já está operacional em produção.

## Primeira integração de catálogo: dados estáticos e validados no build

Provedor usado: `WatWowMap/pogo-data-api`, commit fixo `42b315f317ca8cee8e178249328eab5173e5ca70`. O importador `app/scripts/update_wwm_catalog.py` baixa **apenas durante o build**: `pokemon.json`, `forms.json`, `costumes.json` e traduções PT-BR nas categorias `pokemon`, `forms`, `costumes`. Exige esquema, integridade estrutural (IDs distintos, referência de defaultFormId e todos os form IDs presentes), 1.025 espécies, pelo menos 1.400 formas e 80 trajes; salva hashes SHA-256 dos arquivos upstream no `wwm_catalog_provenance.json`. Gera `wwm_catalog.js` para asset local, compartilhado entre o card e os resultados P1/P2.

- Os IDs WWM de forma não são confundidos com IDs das variedades da PokeAPI. O catálogo serve para confirmar nomes e formas padrão; **não cria URLs de sprite com base em IDs supostos**.
- Teste de identidade: WatWowMap `710 Pumpkaboo`, default `2641` (Average), e `711 Gourgeist`, default `2645` (Average). A PokeAPI inclui a sprite base padrão dessas formas. A LT125 reconhecia Small/Large/Super, mas não o rótulo Average; correção aplica somente às formas exatas comprovadas. `426 Drifblim` é base normal quando não há forma indicada.
- O contrato API conserva `form_id` apenas quando presente e numericamente válido; não altera encounter IDs, IV, CP, coordenadas, Shiny, cap 10, rank ou despawn.
- `dock.html` e `detail.html` carregam o mesmo catálogo local antes de `sprite_offline.js`, mantendo os sprites normal/Shiny já empacotados, 82 variantes nomeadas e 634 variedades da QA R2.

## Outras fontes inspecionadas, sem copiar novos PNGs

- `UIcons/UIcons`: especificação de nomenclatura `{id}_f{form}_c{costume}_s.png`, **convenção, não equivalência entre catálogos**.
- `WatWowMap/wwm-uicons`: `index.json` apresenta 11.065 caminhos em `pokemon` na inspeção, com `426.png`, `426_s.png` e arquivos `710_f2642_s.png` etc. Referência concreta para etapa futura de validação de bytes/imagem e licença; nenhuma URL remota foi inserida no resolvedor.
- `nileplumb/PkmnHomeIcons`, `nileplumb/PkmnShuffleMap`: identificados como bases candidatas de outros estilos, não empacotadas.
- `PokeMiners/pogo_assets`, `PokeMiners/game_masters`: fonte complementar para trajes; **preservados os dez arquivos de trajes hash-verificados da LT125**. O README de PokeMiners explicita a titularidade dos assets e o uso educacional; titularidade/permissão para redistribuição não deve ser presumida.
- A declaração de autorização do responsável pelo aplicativo está registrada, mas não substitui documentação própria de licença de cada terceiro. Não declarar permissões independentes verificadas sem a licença respectiva.

## Cobertura, QA e limitações

Antes LT125 R2: 1.025 base + 1.025 Shiny + 716 PNGs de formas + 10 trajes = **2.776 PNGs hash-verificados** no APK; 80/80 LT116 idênticos aos fornecidos.
Depois LT126: permanece o mesmo total de imagens na fase 1 (não inventar cobertura nova), **ganha catálogo de metadados com 1.025 espécies / 1.506 formas / 87 trajes conforme upstream inspecionado**, mais pt-BR. Cobertura de formas identificadas não significa cobertura de imagens correspondentes.

Testes criados: `lt126-chat-wwm-sprites.test.js`, com inicialização de Firebase, acesso negado do Chat, preservação das formas Average/base e dos demais tamanhos, metadata de `form_id`. A compilação só autoriza novo APK se a importação, os testes Node, Java, Android, R8, certificado e manifesto passarem.

**Samsung pendente:** verificar P1 normal / P2 Shiny simultâneos; Noibat #714, Drifblim #426, Pumpkaboo Average #710; Galarian Darmanitan e trajes; chat com duas contas anônimas; fechamento de Home com Pokébola ativa; contadores reais e permissões RTDB. Não substituir a LT125 QA original, não mesclar na main nem publicar automaticamente uma release.

## Diagnóstico do backend

A rules versionada é restritiva na raiz. Um cliente pode receber `PERMISSION_DENIED` se `chat/messages` ainda não estiver implantado; isso explica o sintoma mas **não está confirmado como causa única** sem consulta autenticada ao RTDB real. A implantação de **todas as rules** pode também afetar a contagem legada `stats/online` / `stats/installations`; portanto, não implantar o arquivo indiscriminadamente antes de verificar o contrato de contadores ou aplicar uma migração segura. O firmware Samsung e status de rede não foram simulados.

## Referências públicas

- https://github.com/WatWowMap/pogo-data-api
- https://github.com/UIcons/UIcons
- https://github.com/WatWowMap/wwm-uicons
- https://github.com/PokeMiners/pogo_assets
- https://github.com/PokeMiners/game_masters
