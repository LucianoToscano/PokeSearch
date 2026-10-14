# POKESEARCH — AUDITORIA TÉCNICA v0.38-beta
**Data:** 14/10/2026  
**Escopo:** arquivo mestre v0.36 do Google Drive + mestre v0.37 da Biblioteca; `LucianoToscano/PokeSearch/main`; revisão de `MainActivity`, `OverlayService`, `probe.js`, `shiny_login.js`, `WatchAlerts`, `PokemonPicker`, Manifest, Gradle, overlay HTML e workflow.

## Achados e tratamento
| Prioridade | Área | Achado | Medida | Validação |
| --- | --- | --- | --- | --- |
| P0 | Shiny | Estado local ✨ podia divergir do estado real no site. | Comparação após configuração e na coleta; pendência distinta. | Testes JS + CI; falta autenticação real. |
| P0 | GL/UL | Antes não era garantida confirmação de liga e pré-evoluções na coleta. | `verifyFilters`, confirmação de escolhas e rejeição de liga não confirmada. | Revisão estática + CI; falta DOM real. |
| P1 | Login | Dialog podia iniciar refresh repetido e com app em background. | WebView dimensionada; refrescar com Activity visível; controle de recargas. | Compilação; falta OAuth Android. |
| P1 | Serviço | Primeira ativação carregava URL 2x, sessão reaberta limpava spawns e duplicava alertas. | Distinção primeiro start/reload; não limpar conhecidos em login. | Revisão estática. |
| P1 | Android 13+ | Sem chamada de permissão runtime para POST_NOTIFICATIONS. | Solicitação uma vez antes do overlay; lançamento continua se negada. | Build; falta teste dispositivo. |
| P0 | Publicação | Apk debug assinado em CI efêmera. Atualizações não confiáveis. | Bloquear rotulagem de release estável; plano de assinatura permanente. | Limitação conhecida. |
| P0 | Licenciamento | Dados dependem da página PoGoCoordinates; integração pública requer verificar termos e consentimento. | Documentar limite; nenhuma tentativa de contornar autenticação/rate limits. | Verificação de termos: https://pogocoordinates.com/terms |
| P1 | Favoritos | Escolha ainda abre Activity, não modal nativo na sobreposição. | Manter recurso, registrar para próximo ciclo. | Pendente. |
| P2 | Docs | README mencionava v0.30 e IDs antigos. | Atualizar resumo técnico e criar mestre/auditoria v0.38. | Revisão. |

## O que não foi testado
Sem device Android/emulador autenticado nesta sessão: não há prova de que o formulário de 12 dígitos, Google/Discord OAuth, resultado Shiny pessoal, liga e notificações funcionem end-to-end; não afirmar isso a distribuidores. 
Não há licença/API concedida pelo PoGoCoordinates nesta auditoria.

## Segurança e privacidade
Nenhum segredo de assinatura privado deve ser commitado, anexado ao APK ou colocado em arquivos públicos; contas e códigos devem ser preenchidos apenas na página legítima do fornecedor. Backups históricos preservados.

## Critério para distribuição pública
Chave de release estável de posse do proprietário; build assinado com assinatura persistente verificável; teste físico e compatibilidade upgrade; permissão de uso da fonte de dados; documentação e contato/suporte. Antes disso **somente pacote beta de teste com ressalvas**.

## Evidências que devem ser preenchidas após CI
- Commit final: ver `git rev-parse HEAD` no repositório.
- Actions: `https://github.com/LucianoToscano/PokeSearch/actions`
- SHA-256: gerado no kit `SHA256SUMS.txt`.

## Adendo — problemas reproduzidos pelo usuário e correções de código
- **IV100 ! sem ✨:** suspeita documentada de parser rígido que exigia exatamente 3 campos `Raw IV`, não observado em todos os layouts do fornecedor. Agora suporta 3 ou 6 campos Raw IV ou alternativa % IV min/max = 100, com verificação pré-envio. Requer teste real.
- **Teclado do login:** WebView focável, janela com `ADJUST_RESIZE` e overlay temporariamente oculto. Requer teste real.
- **Relatórios:** ⚠️ no dock; registro de eventos em armazenamento privado (máximo 80), mascaramento de dados sensíveis, exportação TXT e WhatsApp opcional. O usuário decide enviar.
- **Proteção contra frequência:** automático mínimo 5 minutos, intervalos 5/10/15/20; 60 segundos mínimo para solicitações efetivamente submetidas. Login/configuração sem busca não consomem intervalo.
- **Uso previsto:** teste restrito a amigos desenvolvedores; não declarar distribuição pública oficial. O proprietário declarou ter autorização de uso; guardar comprovação fora do repositório caso necessário.
- **Critério de entrega técnica:** CI com smoke JS, lint, compile, ZIP, apksigner, versão e SHA-256. Emissão de APK não equivale a validação em telefone.
