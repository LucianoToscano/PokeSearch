# LT123 — Chat simples, contadores Firebase, sprites e controles P1/P2

## Correções
- UI top: dois botões lado a lado; `Sem Filtro.png` desligado e `Personalizado.png` ligado. PNGs verificados no Drive, cada controle mantém o próprio serviço e estado.
- Sprites: PokeAPI `pokemon.csv` 326 variedades alternativas, catálogo imutável cruzado com source tree `d8c2fb...`: 317 normais + 317 shiny verificadas e 742 aliases. A lista de resultados, busca e card usam `sprite_offline.js` compartilhado e `VerifiedSpriteCache` pode baixar/cachear caminho de variedade exata. Nove variedades (Koraidon e Miraidon modos de transporte, Mega Zygarde) ausentes do provedor, além de costumes GO não catalogados. Nenhuma imagem errada deve substituí-los.
- Firebase: `FirebaseStats` lê apenas `stats/public/installCount` e `onlineCount`; triggers RTDB com transação idempotente e job servidor de reconciliação por hora escritos. Publicação em produção **não realizada/atestada**. Sem deploy os números continuarão indisponíveis; não inventar.
- Chat LT122: conversa única ao vivo sem divisões e sem moderação prévia, dependente das novas Rules RTDB em produção.
- Build QA 0.01.23/54327, testar Node/Gradle/R8 + certificado. Dois filtros/serviços independentes e demais preferências preservados.

## Pendências reais
- Deploy Firebase Functions e RTDB Rules por conta autorizada, confirmação de IAM/Blaze e teste de leitura/atualização de contadores.
- Testes das sprites regionais GO, costumes e formas sem fonte oficial (não afirmar 100%).
- Verificação Samsung física das duas Pokébolas, resultados, favoritos, chat, botões, localização e notificações.
- A QA não promove automaticamente release pública estável.
