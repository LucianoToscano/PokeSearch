# Integração incremental: observações autorizadas de Pokémon GO (22/11/2026)

Status: adaptador OFFLINE e testes adicionados em branch isolada. NÃO significa feed global ativo, endpoint de terceiros autorizado, rede pública, tela Android atualizada, APK gerado ou importação automática.

## Base documental e separação de escopos

- Arquivo Mestre PGBR: https://github.com/LucianoToscano/PGBR/blob/main/PGBR_ARQUIVO_MESTRE_UNICO.md
- Guia Mestre do PokeSearch: docs/GUIA_MESTRE.md
- Catálogo central de 85 registros (65 + 20, incluindo duplicatas): https://docs.google.com/document/d/12-I-rUfnQR0YL_mDExTJfx2zXgfxgB8-Bkp2tyuVPfI/edit
- Romain Thomas, Ekoparty 2021 (apresentação original): https://drive.google.com/file/d/1nEf72fUU4hXS2V8alnuc4pv3unUdINV3/view
- O estudo do PGSharp é histórico e não descreve API de aparições mundiais.
- iFlowGo, Moonani/PokeList, PokeXperience e PoGO Alerts são fornecedores independentes. URLs encontradas em artigos não garantem autorização, quota, disponibilidade ou redistribuição; este PR não consulta esses serviços.

## Código entregue

functions/spawn-observation-normalizer.js: módulo sem rede, independente do app Android e do Firebase, aceita dados JSON já obtidos legitimamente:
- {pokemons:[...]} — coleção no formato RocketMap;
- {events:[...]} — eventos já coletados;
- {type:"pokemon", message:{...}} — evento de webhook de Pokémon.

O operador deve fornecer explicitamente authorized=true e sourceId configurado. A flag NÃO comprova licença: é apenas a proteção contra ingestão acidental. A autorização real para usar e distribuir dados permanece uma condição independente. O módulo não lê credenciais, cookies, localização do celular, processos ou chaves.

Valida espécies, encounter_id, latitude/longitude, expiração, limites de entrada, IV completo (três componentes), PC, nível e deduplicação. Recusa entradas antigas, com coordenadas inválidas ou sem horário confiável. Limites: 500 eventos e 512 KiB por JSON textual. Registra sourceId/receivedAtMs/expiresAtMs; campos ausentes permanecem null. Nunca infere Shiny a partir de indicação de possibilidade.

toRocketMapRawData() produz o subconjunto compatível com o parser RocketMapFeedData.java já existente no PGBR. O campo disappear_time é Unix milissegundos. IV percentual isolado sem três componentes não será convertido em IV 100 no esquema RocketMap, pois o PGBR não deve exibir estatísticas imaginárias.

## Exemplo offline (dados inteiramente fictícios)

    const {normalizeWebhookBatch, toRocketMapRawData} =
      require("./functions/spawn-observation-normalizer");
    const result = normalizeWebhookBatch({
      pokemons: [{
        pokemon_id: 25,
        encounter_id: "teste_123",
        latitude: -6.15,
        longitude: -35.21,
        disappear_time: 1795363800000,
        individual_attack: 15,
        individual_defense: 15,
        individual_stamina: 15
      }]
    }, {
      authorized: true,
      sourceId: "scanner_autorizado",
      nowMs: 1795363200000
    });
    console.log(result.accepted);
    console.log(toRocketMapRawData(result));

Este módulo não publica servidor HTTP nem configura URL /raw_data no PGBR, não tem polling de feeds e não garante aparições mundiais. A saída só pode ser usada depois de disponibilizada com proteção de acesso num servidor autorizado.

## Verificações

- Teste: node --test functions/spawn-observation-normalizer.test.js
- Workflow: .github/workflows/authorized-spawn-webhook-qa.yml (executar e conferir resultado real; não presumir aprovado).
- Cobertura: autorização explícita, proveniência, expiração, formatos de timestamp, IV coerente, duplicatas, limites, JSON malformado, recusa de eventos de tipo diferente e formato de saída PGBR.

## A implementar depois

1. Provar autorização e documentar o contrato da fonte.
2. Habilitar transporte seguro opt-in para webhooks, com autenticação, assinatura e rate limits, e sem publicar segredos.
3. Integração opcional na API e interface PokeSearch, mantendo P1/P2 independentes.
4. Disponibilizar um endpoint HTTP autorizado que respeite o formato do parser RocketMap e configurar manualmente no PGBR.
5. Ensaios de payload/latência/rede reais e homologação física no aparelho.
6. Atualizar documentos canônicos e testes a cada integração.

Protocolo: branch própria, sem merge automático, sem mudança de release ou assinatura, sem alterar Firebase Rules, login, imagens ou configurações privadas.
