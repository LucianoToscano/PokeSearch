# PokeSearch Overlay — ARQUIVO MESTRE v0.53-beta
Corrige lacuna na v0.52-beta: filtros estavam apenas na tela inicial, não no menu flutuante. Repositório LucianoToscano/PokeSearch. Base de correção: commit ff7ef41c48abe581b9be177220b0718ef4929eb1. Backup de segurança: backup/v0.52-before-overlay-filter-fix-20261015. Códigos v0.51 e v0.52 mantidos íntegros. Não modifica o PvPPokeGo.
## Recursos desta revisão
- Botão ☷ Filtros no menu flutuante, preservando botões existentes. Painel com scroll e estética escura original abre pelo menu em modo horizontal ou vertical.
- A partir do overlay: escolha do limite PvP 1–200, indicador de rank visível ou oculto, IV personalizado 0–15 por atributo, PC/nível mínimo/máximo, sexo, clima, tamanho e forma. O modo IV/GL/UL continua disponível pelo botão original.
- As preferências sincronizam com a Home, persistem e são enviadas ao coletor do site (site real). Nenhum filtro extra é tratado como aplicado sem confirmação.
- Indicadores: rank EXATO apenas quando o site fornece número de rank, ou quando um único Top 1 foi verificado. Quando o site confirma Top N mas não fornece número exato, o cartão pode exibir GL ≤N / UL ≤N, explicitando que é limite, não posição real. No modo IV puro não se inventa rank PvP.
- A opção de mostrar rank tem padrão ativo nesta revisão, podendo ser ocultada. Estado antigo escolhido explicitamente pelo usuário tem prioridade.
- Menu mantém Shiny only real do site e autenticação oficial, favoritos, alertas, coordenadas, cronômetros, botões e temporização.
## Identidade
Android package com.lucianotoscano.pokesearch; namespace com.lucianotoscano.pokesearchoverlay, minSdk 26, targetSdk 33, compileSdk 36, versionCode 53, versionName 0.53-beta. JDK 17, Gradle 8.11.1, Android Gradle Plugin 8.10.1.
## Restrições conhecidas
A confirmação de filtros depende da estrutura atual do PoGoCoordinates; mudanças no HTML exigirão novos adaptadores. Filtros VIP não podem ser forçados sem habilitação do site. Renderização e OAuth precisam de testes reais em Android 15/16 além de CI. APK assinado com certificado temporário do workflow não atualiza APK antigo assinado com outro certificado sem desinstalar; exportar dados relevantes antes.
