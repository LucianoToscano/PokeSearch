# POKESEARCH — ARQUIVO MESTRE v0.38-beta
**Data:** 14/10/2026  
**Fonte da verdade:** https://github.com/LucianoToscano/PokeSearch — `main`  
**Versão:** `versionCode=38`, `versionName=0.38-beta`  
**Package:** `com.lucianotoscano.pokesearch`; **namespace Java:** `com.lucianotoscano.pokesearchoverlay`  
**Android:** minSdk 26, targetSdk 33, compileSdk 36, Java 17 / Gradle 8.11.1.

## Histórico e continuidade
- Histórico preservado: mestre v0.36 no Google Drive (backup de 14/10/2026), mestre v0.37 na Biblioteca do usuário. Antes de alterar, conferir HEAD vigente.
- Usar apenas `LucianoToscano/PokeSearch/main`; NÃO alterar `PvPPokeGo-APK-Build` nem `PvPPokeGo`.
- Anteriores: v0.35-beta usou chave de distribuição distinta; v0.36-teste foi debug; v0.37-teste compilou no Actions 38577289104 (SHA-256 `5f940e5dc81c7ea1a4bb678f7f11b3ad490f7f5c9b1cc84deaac34ae212eb065`). Não assumir compatibilidade de assinatura entre versões.

## Objetivo e UX aprovada
APK Android separado do Pokémon GO, overlay transparente mínimo; coluna de sprites P=35, M=45, G=55px, engrenagem arrastável, menu compacto 100% / GL#1 / UL#1, ✨ Shiny, AUTO 5m, atualizar ↻, temporizador, sino geral, estrela favoritos, coração Pix. X vermelho fecha; minimizar deixa engrenagem e restaura. Cartões detalham dados reais e coordenadas quando o site fornece. Não misturar abas do site na home.
- Home: PokeSearch, Ativar overlay, favoritos, preferências, Pix.
- Login: WebView de autenticação apenas sob demanda para Shiny; usuário faz login no PoGoCoordinates e vincula seu código de amizade de 12 dígitos na página oficial. O app não solicita senha ou código em diálogo próprio.
- Shiny: preferência **desejada** diferente da confirmação **real** no site; ícone pendente até verificação. Sem dados inventados.
- Modos PvP: ranking 1, liga correta e pré-evoluções devem estar confirmados antes de exibir/alertar.
- Favoritos: até 50 espécies em seção separada; acesso pelo próprio overlay ainda é pendência de UX (atualmente chama MainActivity). Preservar os alertas e o Pix.

## Correções incorporadas nesta revisão
1. `probe.js`: valida modo e liga selecionada, rank1 e pré-evoluções; expõe `verifyFilters`, compara Shiny apenas com confirmação.
2. `OverlayService.java`: antes de submeter busca, verifica Shiny e filtros completos; impede resultados de liga não confirmada e retorno divergente de Shiny; protege contra callbacks obsoletos por geração; elimina carregamento duplicado na primeira inicialização; conserva conhecidos ao atualizar sessão para não reemitir alertas.
3. `MainActivity.java`: WebView do site permanece fora da home; autenticação sob demanda com altura explícita, detecta domínio oficial, limita notificação de mudança de sessão, atualiza após vinculação, evita serviço chamado da Activity já em segundo plano; solicita permissão de notificações uma vez no Android 13+.
4. `app/tests/probe-smoke.test.js`: cenários básicos de Shiny pendente/ativo, vínculo do treinador e Raw IV, integrados ao CI.
5. Ícone oficial PNG circular preservado. APK gerado por compilação Android, não por alteração/reassinatura de APK pronto.

## LIMITES E BLOQUEADORES
- **Distribuição pública estável não aprovada:** build debug do GitHub Actions tem certificado efêmero. Uma nova build pode exigir desinstalação e perda de preferências, pois a chave não é persistida. Para release atualizável, criar/chavear assinatura privada estável fora do código e protegê-la com backup e CI Secrets (exige configuração autorizada do proprietário).
- **Integração externa:** termos do PoGoCoordinates limitam scraping em massa, automação excessiva, reuso comercial. Verificar permissão/licenciamento com o provedor antes da distribuição pública.
- **Ainda sem teste físico autenticado:** login Google/Discord, vínculo do treinador, Shiny real, coleta IV100/GL/UL, alarmes, overlay e notificações devem ser testados num Android real. CI verde confirma compilação/integridade, não operação end-to-end.
- Não usar contas de terceiros, burlar limites, nem armazenar tokens/códigos sensíveis nos documentos ou no GitHub.

## Testes e entrega
1. Checar HEAD atual; `node --check` nos JS; `node app/tests/probe-smoke.test.js`.
2. `gradle --no-daemon :app:assembleDebug`, `unzip -t`, `apksigner verify --verbose`; validar `applicationId`, versão, ícone PNG e SHA-256.
3. Registrar link da execução CI, commit e checksum na auditoria; disponibilizar kit de testes em Google Drive com backup e pastas organizadas.
4. Não anunciar testes físicos não realizados; preservar documentação histórica e versões anteriores.

**Próximo marco:** validar uso real no Samsung e assinar release com chave estável; resolver favoritos dentro do overlay. 
