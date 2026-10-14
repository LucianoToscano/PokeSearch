# PokeSearch Overlay — ARQUIVO MESTRE v0.47-beta

Atualizado em 14/10/2026. Base v0.46-beta main d49fe74ae00d9abc3e581bb6f63620b60f9ceacb.
Repositório: https://github.com/LucianoToscano/PokeSearch. Aplicativo independente, NÃO alterar PvPPokeGo.

## Estrutura, ferramentas e versão
Android applicationId com.lucianotoscano.pokesearch; namespace Java com.lucianotoscano.pokesearchoverlay. versionCode 47/versionName 0.47-beta. JDK 17, Gradle 8.11.1, plugin Android 8.10.1, minSdk 26, targetSdk 33, compileSdk 36.
settings.gradle.kts JÁ EXISTIA na v0.46, com repositórios Gradle e include(":app"): a alegação de ausência no relatório externo é incorreta.
O pacote final inclui pasta raiz editável: .github, app/build.gradle.kts, scripts, assets HTML/JS, Java, res, testes, settings.gradle.kts, build.gradle.kts e docs históricos. CI acrescenta Gradle Wrapper 8.11.1 e PNG circular gerado ao ZIP-fonte. Abrir a pasta raiz no Android Studio.

## Recursos preservados
IV100=15/15/15, GL#1, UL#1 com pre-evoluções quando validadas pelo site; Shiny opcional e somente confirmado com autenticação/vínculo no PoGoCoordinates; coordenadas e raio 0 a 1000 km com verificação do site; AUTO de 5, 10, 15 ou 20 minutos e limite de 60s; sprites e detalhes, favoritos, alertas, transparência e recolhimento, ícones adaptativos, login/logout na Home, relatório de bugs. Não fabricar resultados, não publicar cookies/tokens/códigos ou coordenadas particulares.

## Correções reais v0.47
1. Gerador RoundIcon.java funciona no modo headless; build Gradle passa -Djava.awt.headless=true. O CI valida bytes do PNG gerado novamente e o inclui no ZIP-fonte completo.
2. WebView do site trata falhas no carregamento do frame principal: marca site indisponível, invalida geração da pesquisa, cancela buscas pendentes e mostra aviso. Erro de conexão registrado somente por código inteiro, nunca URL.
3. Operações centrais de WebView/overlay e interpretação dos resultados JS registram etapa e classe da exceção; não usam getMessage(), nem capturam HTML, tokens ou dados pessoais.
4. CI acrescenta Gradle Wrapper funcional gerado com Gradle 8.11.1, confere settings.gradle.kts e versão do wrapper dentro do ZIP-fonte, assina/verifica APK, calcula e executa sha256sum -c SHA256SUMS.txt. BUILD_PROVENANCE.txt registra SHA do commit/execução do workflow.
5. targetSdk 33 permanece nesta beta. Não impor foregroundServiceType="specialUse" sem permissão FOREGROUND_SERVICE_SPECIAL_USE, justificativa de subtipo e ensaios Android 14+. Planejar migração em release separado. compileSdk36 com targetSdk33 não é erro de compilação.

## Estado de validação
Testes estáticos/JS não equivalem a execução no Samsung SM-S928B Android 16. Continuam pendentes autenticação real Google/Discord, Shiny no site, retorno OAuth externo, sobreposição no Pokémon GO, ícones/menu nos cantos, login/out, localização 0/50/1000km e desempenho/memória sob uso prolongado.
SHA256 confirma integridade relativa a um hash confiável, não demonstra build bit-a-bit reproduzível. Guardar arquivos anteriores v0.42–v0.46; auditoria atual docs/AUDITORIA_v0.47.md.
