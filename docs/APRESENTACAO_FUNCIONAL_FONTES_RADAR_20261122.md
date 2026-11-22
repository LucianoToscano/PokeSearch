# PokeSearch + PGBR — demonstração operacional de fontes e filtros (22/11/2026)

## Entregas no código

PokeSearch PR #559: Radar Android com PokeList/Moonani externo, gateway Golbat/PokeSearch HTTPS com X-Feed-Secret apenas em memória, e demonstração OFFLINE claramente fictícia. Busca por nome/#Dex e filtros de IV, PC, nível, coordenadas, ordenação, expiração e cópia manual apenas de dados não fictícios.

PGBR PR #111: fonte DEMO OFFLINE nas buscas Pokémon e Reides; exemplos fictícios de IV/PC/nível/XXL/rank PvP/raid. Ação de teleporte/caminhada e cópia ficam bloqueadas em DEMO. A busca RocketMap HTTPS com chave opcional, da PR #108, continua o caminho para registros reais.

Gateway Node: POST /webhook/golbat requer X-Source-Secret; GET /raw_data e /status requerem X-Feed-Secret separado. Eventos de um scanner autorizado são verificados, deduplicados e expirados; dados de origem não são fabricados. GET /painel oferece navegador com mapa esquemático e filtros. O scanner real, os segredos e a operação do proxy TLS são do operador, não deste repositório.

## Teste offline imediato no computador com Node 22+

Abra o repositório, faça checkout da branch feat/demo-frontend-live-feed-20261122 e rode:

    node scripts/run-offline-demo.js

Abra no navegador http://127.0.0.1:8766/painel e clique em Exibir demonstração fictícia. Este servidor não tem conexão com fontes externas. Toda chamada a /raw_data responde HTTP 403, e coordenadas DEMO não podem ser apresentadas como spawns. É possível demonstrar a interface para um fornecedor sem conta, scanner ou licença comercial.

## Ativar dados reais quando o operador autorizar

Obtenha autorização do operador para consumir o webhook Golbat/PoracleNG. Crie duas chaves distintas e aleatórias de pelo menos 24 caracteres; não copie chaves reais para código ou Drive. Exemplo para gerar uma chave: openssl rand -hex 32.

No host do gateway, exporte variáveis privadas:

    export POKESEARCH_SOURCE_AUTHORIZED=confirmed
    export POKESEARCH_SOURCE_ID=meu_golbat
    export POKESEARCH_INGEST_SECRET='SUBSTITUA_CHAVE_DE_INGESTAO'
    export POKESEARCH_READ_SECRET='SUBSTITUA_CHAVE_DE_LEITURA'
    node scripts/run-authorized-spawn-gateway.js

O gateway escuta exclusivamente em 127.0.0.1:8765. No Golbat autorizado, configure uma saída do tipo pokemon para http://127.0.0.1:8765/webhook/golbat somente se ele estiver na MESMA máquina, com cabeçalho X-Source-Secret:CHAVE_DE_INGESTAO. A sintaxe oficial usa seção [[webhooks]] com url, types e headers, conforme https://github.com/UnownHash/Golbat/blob/main/config.toml.example.

Para máquinas diferentes, use proxy HTTPS, autenticação, firewall e domínio/certificado válido ou túnel autorizado; não exponha o gateway em HTTP na internet. Confira recebimento pelo GET /status com X-Feed-Secret. waiting_for_source indica zero aparições válidas recebidas e não deve ser disfarçado como problema de filtro; receiving_observations indica eventos reais em cache, sem comprovar cobertura mundial. O web painel do gateway é http://127.0.0.1:8765/painel. Para abrir em aparelhos externos, configure proxy HTTPS do operador.

No PokeSearch Radar, selecione Golbat / meu servidor HTTPS, informe URL base sem /raw_data, a chave X-Feed-Secret, centro/raio (1 a 25 km), filtros e Buscar agora. No PGBR selecione RocketMap, configure a mesma URL HTTPS e a mesma chave de leitura, pesquise na área monitorada. Dados reais só aparecem onde o scanner efetivamente fornecer eventos. O usuário não concede, por si só, acesso comercial às fontes PokeXperience/PGSharp.

## Build para celular e controle de versões

PokeSearch possui workflow .github/workflows/pokesearch-demo-apk-20261122.yml que compila APK de demonstração DEBUG, verifica assinatura e pacote e publica artefato de QA em ZIP. Para coexistir com o aplicativo oficial, o pipeline altera o applicationId somente na cópia temporária do checkout para com.lucianotoscano.pokesearch.demo. O build.gradle.kts do repositório e a assinatura permanente permanecem inalterados; a chave debug da CI é efêmera. APK de testes não é release oficial nem instalação validada em dispositivo físico.

O build PGBR compila os controles Android nas ações de CI da PR #111. Não se afirma que foi gerado um APK PGBR assinado/instalável sem o pipeline e insumos completos do projeto.

PRs de desenvolvimento empilhadas: PokeSearch #559 sobre #557 sobre #556; PGBR #111 sobre #108. Não fazer merge automático: preservar mudanças paralelas e testar antes da integração.

## O que as tecnologias oferecem neste protótipo

Golbat: normalizador, webhook autenticado, cache, filtro e consulta reais quando o operador disponibilizar dados.
PoracleNG: coexistência com contratos de eventos/alertas; o projeto não se passa por uma instância PoracleNG.
ReactMap: referência de organização e filtro; mapa esquemático funcional do protótipo é independente, sem copiar nem hospedar ReactMap.
pokemon-webhook histórico: referência de payload, sem copiar código de licença não verificada.
wwm-uicons: indexador executável de metadados; sprites só após conferir direito de redistribuir.
PokeXperience: contato e diligência de licença/API ainda necessários, sem chave contratada ou cobertura inventada.

Referências técnicas: https://github.com/UnownHash/Golbat/blob/main/webhooks.md ; https://github.com/WatWowMap/ReactMap ; https://github.com/WatWowMap/wwm-uicons ; https://pokexperience.com/faq/ ; https://github.com/LucianoToscano/PokeSearch/pull/559 ; https://github.com/LucianoToscano/PGBR/pull/111 .

Não misturar coordenadas fictícias com reais, não afirmar Shiny individual sem confirmação, não burlar HTTP 401/403/429 e não divulgar chaves.
