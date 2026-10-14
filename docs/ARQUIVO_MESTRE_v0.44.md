# PokeSearch — ARQUIVO MESTRE v0.44-beta
Data: 14/10/2026. Base original: v0.43-beta, commit ca794262e9eab8c9e86dc1818c1bea0f4888e9b7.
Repositório: https://github.com/LucianoToscano/PokeSearch ; branch de desenvolvimento fix/location-confirmation-v044.
Identidade: pacote Android com.lucianotoscano.pokesearch, Java com.lucianotoscano.pokesearchoverlay, versionCode 44, versionName 0.44-beta. minSdk 26, compileSdk 36, Java 17, Gradle 8.11.1.
INDEPENDENTE de PvPPokeGo. Nunca alterar os outros repositórios.

## Características preservadas
Overlay arrastável pela engrenagem, barra com 12 controles, sprite P/M/G, chevron sob Pokémon, X após coração, cartões e coordenadas quando disponíveis.
Filtros IV100, GL#1, UL#1 com pré-evoluções em PvP; Shiny apenas com opt-in e confirmação do site. AUTO 5/10/15/20 minutos e mínimo de 60 segundos entre consultas submetidas. Atualização manual respeita esse limite.
Favoritos até 50, alertas gerais e de favoritos, Pix voluntário, bug report protegido, login via site oficial, tutorial visual.
Filtro 📍 opcional com coords lat,long e raio 0–1000 km: ON e OFF separados de Ocultar; OFF limpa preferências e modo do site; etiqueta exibe somente raio, sem coordenadas.
Preservar resultados reais. Não contornar limitações do PoGoCoordinates. Não publicar códigos de amizade, senhas, cookies, tokens e coordenadas sensíveis.

## Revisão v0.44
1. Barra responsiva: ajustar largura ao dispositivo; usar posições direita/esquerda apenas quando couber; senão acima/abaixo da engrenagem, para evitar que a cubra.
2. Remover inversão RTL que desorganizava a ordem dos ícones; manter 12 colunas proporcionais.
3. Chevron com fundo quase opaco, contorno contrastante e área de toque maior.
4. fit da interface consolidado por quadro e correção de padding zero.
5. AUTO confirma configuração com toast; atualizar reconhece o toque, mas sem burlar cooldown do site.
6. Favoritos com painel mais transparente, borda elegante, pesquisa e botão Concluir preservados.
7. Probe de localização exige raio não vazio (inclusive zero explícito), lat/long válidas e confirmação do modo Coords; nunca enviar busca não confirmada.
8. Java aceita somente coordenada integral válida; leitura de coords compara CP para distinguir ocorrências da mesma espécie.

## Verificação
CI: verificar sintaxe JS e contratos; Gradle testDebugUnitTest, assembleDebug, lintDebug; unzip, apksigner, aapt package/version, SHA256.
Ainda NÃO verificados no aparelho: transparência da sobreposição, posições em cantos, cliques reais, desempenho visual, teclado e blur, login Google/Discord, filtros IV/ligas/Shiny e raio 0/50/1000 no DOM real.
Não confundir build verde com testes funcionais. APK debug assinado por CI pode não atualizar a beta anteriormente instalada.
Histórico mantido: docs/ARQUIVO_MESTRE_v0.43.md; docs/AUDITORIA_v0.43.md e versões anteriores. Auditoria atual: docs/AUDITORIA_v0.44.md.
Arquivo Mestre Google Drive v0.43: https://docs.google.com/document/d/1xuGRs6Kxf52fI16H_QH6RxYjnkIrhNPvZ0vNndBVkWo/edit
