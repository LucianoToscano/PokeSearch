# PokeSearch — Estado canônico LT168 (29/10/2026)

## Versão-base oficial confirmada

**LT168 · 0.01.68 · versionCode 54373** é a versão pública atual confirmada em 29/10/2026.
- Repositório: `LucianoToscano/PokeSearch`, branch `main`.
- PR de implementação e distribuição: [#112](https://github.com/LucianoToscano/PokeSearch/pull/112), **merged** em 29/10/2026 11:16:11 UTC.
- Commit da versão compilada: `b21bb0aed5f6f919a0a1d0f1d64677f908c2859f`. Mudanças documentais posteriores não alteram os bytes do APK.
- Release oficial, estável, marcado como `latest`: [`v0.01.68-54373`](https://github.com/LucianoToscano/PokeSearch/releases/tag/v0.01.68-54373), publicado em 29/10/2026 11:19:50 UTC.
- Nome do APK: `PokeSearch-v0.01.68-LT.apk`. Tamanho **49.416.673 bytes**; SHA-256 `a331a28b853a23b2bbd0fc02e51d2f483646eac4d21aca717ef7e29faa3ab70f`.
- Download: https://github.com/LucianoToscano/PokeSearch/releases/download/v0.01.68-54373/PokeSearch-v0.01.68-LT.apk
- [GitHub Actions oficial #40864077543](https://github.com/LucianoToscano/PokeSearch/actions/runs/40864077543): **SUCCESS**. Executou testes, build protegido, assinatura permanente Android, integridade do APK, auditoria de SHA-256 e conferência da elegibilidade pelo feed `releases/latest`.
- Application ID inalterado: `com.lucianotoscano.pokesearch`; certificado permanente Android v2 mantido. A instalação é voluntária e depende de confirmação no Android.
- A versão oficial anterior, LT167 (`0.01.67` / `54372`), foi substituída como `latest`; manter seu registro no histórico, sem reescrever releases imutáveis.

## Correções incluídas na LT168

1. **Identidade das mensagens antigas:** Chat → menu `⋮` → `Mensagens antigas` permite selecionar explicitamente o autor histórico, confirmar e **desfazer** a associação. Ela é visual, local ao dispositivo e vinculada ao UID atual, afetando alinhamento e foto mostrada. Não altera `authorUid` no Firebase, propriedade de mensagens, autenticação, regras ou permissão de moderação. Nunca associar pelo apelido de forma automática.
2. **Alinhamento e avatar:** mensagens novas usam a sessão autenticada do chat; mensagens antigas só passam para o lado direito mediante vínculo explícito quando o UID anterior já não está autenticado. Avatar opt-in escolhido no chat; não importar foto do Google automaticamente.
3. **Ícone de modo no compartilhamento:** processamento dos PNGs em cache remove apenas região escura conectada às bordas quando os cantos indicam matte opaco, procurando evitar o quadrado preto no Hundo/GL/UL sem remover detalhes internos. A confirmação visual em Samsung ainda é necessária.
4. **Backup da Home:** novo item `Importar dados` abre o JSON `pokesearch-home-export-v1` produzido por `Exportar dados`, valida formato, tipos, tamanho e limite de 50 favoritos, confirma antes de restaurar. Não transfere conversa do Firebase, contas, tokens, localização/coords, Premium, ou preferências independentes da Pokébola 2. O backup original também não contém esses dados.

## Compatibilidade, testes e pendências

- Código da LT168 deriva da LT167 e preserva GL/UL/ML, pesquisa API/DOM, Shiny, recursos Premium, favoritos, alertas, sprites, atualizador e as duas Pokébolas.
- Novas regressões: `app/tests/lt168-legacy-chat-identity-icon-matte.test.js` e `app/tests/lt168-home-data-import.test.js`. Workflow Node QA e compilação Java aprovados, além do workflow oficial de APK.
- **Não confundir CI com homologação física**. Testar no Samsung: mensagens antigas vinculadas e desvinculadas, separação de autores iguais, foto, novo compartilhamento, matte dos ícones, exportação/importação e funcionamento de P1/P2. Capturas da LT167 indicavam que as correções anteriores não resolveram o histórico; o mecanismo explicitamente reversível introduzido na LT168 ainda precisa de confirmação no aparelho.
- O APK já está publicado para todas as instalações elegíveis via GitHub Releases. Não há instalação remota silenciosa nem garantia de exibição imediata do aviso em cada aparelho.
- **Regra de continuidade:** LT168 é a base oficial. Para qualquer LT169+, consultar o HEAD/última release antes de desenvolver; não restaurar LT165/LT167 como base, não reutilizar `54373` nem sobrescrever a tag `v0.01.68-54373`. Preservar o certificado v2 e realizar QA de P1 e P2.

## Registro de autorização

O proprietário solicitou explicitamente a integração (merge), atualização do aplicativo para todos e documentação desta versão como atual. A PR #112 e o workflow oficial já haviam concluído essas ações antes desta consolidação documental. **Nenhum novo APK ou release duplicado foi criado ao registrar este estado.**
