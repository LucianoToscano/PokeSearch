# Instruções de continuidade PokeSearch

1. **LEIA PRIMEIRO** [docs/GUIA_MESTRE.md](docs/GUIA_MESTRE.md): é o estado canônico **resumido** e atualizado. Sempre consulte o HEAD, PRs e GitHub Actions reais antes de editar.
2. **HISTÓRICO COMPLETO** preservado sem mudanças em [docs/GUIA_MESTRE_BACKUP_INTEGRAL_2026-10-25.md](docs/GUIA_MESTRE_BACKUP_INTEGRAL_2026-10-25.md). **Não carregue o arquivo de 1,46 MB inteiro automaticamente.** Abra trecho ou pesquise palavra-chave/LT apenas quando o resumo e documentos especializados forem insuficientes.
3. **NÃO REINICIE O PROJETO.** Preserve as mudanças oficiais LT87 e evolução LT88–LT93 e Scrapbook PR #64; nunca usar LT83 como versão atual. Verificar branches antes de alterar.
4. **Identidade fixa:** `applicationId com.lucianotoscano.pokesearch`; namespace `com.lucianotoscano.pokesearchoverlay`. Java 17, Gradle 8.11.1, compileSdk 36, targetSdk 33, minSdk 26.
5. Preserve overlay, `probe.js`, API autorizada/DOM, login, Shiny, GL/UL/IV, sprites, filtros, localização, favoritos, notificações, FirebaseStats, assinatura permanente, preferências e limite de 10 resultados. Não divulgar JWT/tokens.
6. **Governança:** não fazer merge, Release, atualização pública de APK, escrita Firebase do mural nem mudança de assinatura sem autorização explícita. Compilação/QA automatizados não equivalem a homologação física Samsung.
7. **Atualizações documentais:** manter o Guia Mestre resumido (edições concisas) e arquivos específicos de cada etapa. **Não apendar indefinidamente ao backup**, não substituir backup com saída truncada. O backup é protegido por Git blob `466a92323dc319720b4ced50caf413a1a2bbef04` (1.459.814 bytes).
