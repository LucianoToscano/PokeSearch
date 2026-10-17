# PokeSearch — Arquivo Mestre v0.52-beta (candidato de testes)
Base de desenvolvimento: `security/v0.51-beta` no SHA `d2eb0262a1d2418aa7cc958bf6a6c47149300767`. Backup imutável por branch `backup/v0.51-beta-before-customization-20261015`. Implementação isolada: `feature/v0.52-custom-overlay-20261015`. A branch `main` não foi modificada.
## Identidade preservada
Pacote `com.lucianotoscano.pokesearch`, namespace `com.lucianotoscano.pokesearchoverlay`, versionCode 52, versionName 0.52-beta. Android SDK: mínimo 26, alvo 33, compilação 36. Gradle 8.11.1, Java 17 e AGP 8.10.1. Projeto separado do PvPPokeGo.
## Alterações na versão em desenvolvimento
- Tela inicial com seção recolhível para personalizar toolbar. Orientação horizontal/vertical, switches independentes para cada um dos 12 controles; engrenagem sempre acessível. Preferências persistentes.
- Visual e cores compactas originais; chevron de retração reduzido; opção para mostrar rank acima do sprite, sem exibir número quando a posição não estiver conhecida.
- Filtro de PvP GL/UL rank 1 ao máximo escolhido (1–50), usando opção Top ranking do site com verificação da liga e do intervalo.
- IV personalizado A/D/HP selecionável de 0 a 15; modo IV perfeito preservado.
- CP e nível mínimo/máximo opcionais encaminhados e verificados no filtro do site.
- Intervalo AUTO 3 minutos adicionado, preservando OFF, 5, 10, 15 e 20. Após último spawn expirar, agenda nova busca respeitando pelo menos 3 minutos entre buscas de rede.
- O controle ✨ continua compartilhando o estado real do Shiny only no PoGoCoordinates, sem inventar Shiny ativado. Fluxo oficial de autenticação e cookies preservado.
- Favoritos, alertas, timer, QR/Pix, atualização manual, busca por coordenadas, relatório de bugs e long press preservados.
## Estado de validação
Compilação, Android físico, estabilidade da UI nas bordas, integração OAuth e comportamento real do site NÃO devem ser declarados aprovados sem CI e testes no aparelho. Os campos adicionais (weather, sexo, tamanho, formas, ordenação completa e VIP) ainda exigem verificação da estrutura atual do site. Rank de IV só é exibido se conhecido; em buscas Top 1 é possível usar confirmação explícita do filtro do site. Assinatura release de CI usa certificado temporário, diferente de uma chave permanente de distribuição; atualizar APK instalado sem desinstalar pode falhar por incompatibilidade de assinatura. Não incluir nem publicar segredos/chaves de assinatura. Preserve os documentos históricos.
