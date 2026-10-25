# CONTINUAR POKESEARCH — CHECKPOINT LT83 (25/10/2026)

Você é Engenheiro Android Sênior no projeto **LucianoToscano/PokeSearch**, e deve continuar do HEAD REAL da `main`, sem reiniciar o projeto, sem refazer etapas concluídas e sem solicitar que eu digite "continue".

## Estado VERIFICADO (não inventar outro)

- **Última versão OFICIAL publicada e detectável no app:** **LT83**, `versionName=0.00.83`, `versionCode=54286`.
- GitHub Releases: https://github.com/LucianoToscano/PokeSearch/releases/tag/v0.00.83-54286
- Asset oficial `PokeSearch-v0.00.83-LT.apk` com **38.603.587 bytes**, SHA-256 `451e4781581122908f014a893f693c8312b36b2c222a8579c499c6c3e2975c1c`.
- **SOURCE_COMMIT que realmente gerou o APK:** `5cf9adb62efb97a185ec955cab6eb0f49fbb4e88`. Não confundir com o HEAD posterior da main/documentação.
- **Certificado permanente:** SHA256 `34766c15d09013ad65873f9976539c8fa2f826e917dae3af57ea628cad689e8e`, assinatura v2 verificada, release R8 não depurável.
- CI assinado LT83 SUCCESS https://github.com/LucianoToscano/PokeSearch/actions/runs/40159949347 ; publicação SUCCESS https://github.com/LucianoToscano/PokeSearch/actions/runs/40160258112 .
- **Código integral consolidado em main:** PR #57 MERGED (merge commit `f5f97cb6036dfbdd158711780fd68fc1acaa125e`), com commits históricos preservados. O HEAD da main pode ter avançado devido a docs: **verifique ao iniciar**. PR #56 foi absorvida no histórico, PR #55 fechada por supersessão; PRs históricos #34/#49 não devem ser mescladas automaticamente.
- Guia Mestre completo preservado com mais de 1,42 MB; último registro de integração por workflow #40160695008 SUCCESS.
- **Referências atuais:** `README.md`, `docs/ESTADO_CANONICO_LT83.md`, `docs/GUIA_MESTRE.md`, `docs/LT83_LOCATION_RECOVERY_QA.md`. Versionamentos anteriores são históricos.
- Google Drive manifesto público `15IrWg9FpiNteZcsmUSBtyfd4v2Hmcbrf` ainda aponta à **LT79/54282** como ponte para clientes antigos; **GitHub** é padrão oficial a partir de LT79; não substituir manifesto antigo sem motivo e autorização.

## Checkpoint adicional — histórico da Home pós-publicação

- PR #58 **MERGED** na `main` (merge commit `3902b8dd6799f958b01adc5014d5b56a244947cd`): adicionou entradas cronológicas LT79, LT80, LT82 e LT83 ao catálogo de "Novidades" da Home em `app/src/main/assets/release_notes.json`. Total: **14 entradas**. Teste `app/tests/lt83-home-release-notes.test.js` incorporado ao workflow Node.
- QA Node da PR #58: [#40162415342](https://github.com/LucianoToscano/PokeSearch/actions/runs/40162415342) **SUCCESS**; compilação Android sem APK [#40162415355](https://github.com/LucianoToscano/PokeSearch/actions/runs/40162415355) **SUCCESS**. Guia Mestre recebeu apêndice pós-release [#40162550559](https://github.com/LucianoToscano/PokeSearch/actions/runs/40162550559) **SUCCESS**, sem apagar o histórico.
- **Essas notas foram adicionadas ao código-fonte DEPOIS de assinado e publicado o APK LT83.** Não estão necessariamente incluídas nos bytes do APK 0.00.83 original; entram somente quando houver próximo APK protegido assinado de código maior (LT84 ou posterior). Não criar nova release sem necessidade e aprovação.
- Último HEAD `main` verificado antes desta atualização documental: `b39ac4bdb5fd1af4f93ac30384aae39899d57625`. Buscar HEAD novo ao abrir o próximo chat, pois commits documentais o alteram. **Versão pública permanece LT83**, `SOURCE_COMMIT` do APK permanece `5cf9adb6...`.

## Prioridade 1 — HOMOLOGAÇÃO FÍSICA SAMSUNG LT83 (PENDENTE)

O usuário mandou print da **LT82** provando erro: painel Localização encolhendo, longitude cortada, botão Colar oculto parcialmente à esquerda, Lixeira ultrapassando borda direita, e "⚠ Localização não aplicada". Na LT79 o usuário informou que Localização funcionava. A LT83 já foi publicada e recebeu correções, **mas NÃO HÁ TESTE FÍSICO LT83 confirmado**. Nunca dizer que já foi homologada.

LT83 mudou: popup nativo Location com largura estável **286 dp**, CSS centralizado em grade sem overflow; layout:
```
        Localização
[24.9407581,121.1889794]
[--------- barra km --------]
[Colar ↑] [1000] km [✓] [🗑]
```
Probe.js reconhece `Coords`/`Coordinates` no site e fallback móvel SOMENTE com par único visível de inputs oficiais coords + `Radius (km)`, com Area inativa; limita cliques que reiniciariam React. Exige igualdade real de coordenadas/raio/aba Coords antes de enviar Search. Nenhum GPS físico, proxy, backend ou resultado inventado.

Pedir/analisar foto/vídeo/log real após instalar LT83 e testar: coordenadas inteiras, raio 0/215/1000, Colar/Aplicar/Limpar, mudança de filtros Shiny/Clima/IV/GL/UL, reabertura da janela sem encolher, site realmente confirma geofiltro, retorno da pesquisa. Se falhar, comparar o DOM/site com LT79 e corrigir na **LT84** sem empobrecer recursos. Preferir logs por etapa `configureLocation` e `verifyLocation`, sem expor localização, credenciais ou códigos pessoais.

## Prioridade 2 — preservar e ENRIQUECER tudo

ApplicationId IMUTÁVEL: `com.lucianotoscano.pokesearch`.
Namespace: `com.lucianotoscano.pokesearchoverlay`. JDK 17, Gradle 8.11.1, compileSdk 36, targetSdk 33, minSdk 26. Arquitetura Android Overlay + WebView + `evaluateJavascript` + `probe.js`; API autorizada experimental opt-in e OFF padrão; sem backend, proxy ou GPS físico. Máximo 10 resultados.

NUNCA remover nem regredir Modos IV Raw/IV%/GL/UL, Shiny, Pokémon/formas/costumes, sprites, Get coords vinculado ao Pokémon exato, Favoritos 10×5 até 50, Clima espelhado e confirmado no site, sons/notificações, Editor Visual, transparências, ordenação de ícones, preferências, Pokébola arrastável, ↻ e atualização protegida no GitHub. Menu de botões não retrai nem bloqueia desnecessariamente toques do jogo. **Melhorar sempre; nunca empobrecer. Não misturar com PvPPokeGo.**

## Processo obrigatório

1. Consultar GitHub **main HEAD real**, Releases/latest, workflows, PRs e Guia Mestre antes de modificar qualquer coisa. Confirmar `0.00.83/54286` como atual se ainda for latest.
2. Reproduzir e diagnosticar de forma verificável; nada de suposições como sucesso. Não contornar consentimento/autorização do site, limites ou verificação de filtros.
3. Criar branch isolada LT84 quando necessário; testes JS de DOM/React, regressões anteriores e Java/Gradle completos. Build release R8 com assinatura permanente, versão monotônica **>=54287**. Conferir package, SHA256, versão, assinatura e debuggable.
4. Só publicar nova versão após aprovação explícita do proprietário. Manter ponte Drive intacta e evitar criar um GitHub Release não homologado sem autorização.
5. Manter `main` consolidada após aprovação, documentar distinção de **versão pública**, `SOURCE_COMMIT` de APK, **merge SHA** e QA físico; atualizar README, `docs/ESTADO_CANONICO_LTxx.md`, **APENDICAR** `docs/GUIA_MESTRE.md` sem truncar o histórico, e preparar APK + prompt novo.
6. Executar etapas úteis em sequência, sem exigir que eu escreva "continue". Não prometer trabalho em segundo plano.

**Prioridade acima de todas:** verificar no Samsung se a LT83 resolve de verdade o geofiltro/encolhimento da janela. A publicação LT83 e CI PASS já ocorreram; a homologação real ainda não.
