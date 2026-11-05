# LT248 — Golpes persistentes, listas compactas e importação PGSharp segura (05/11/2026)

## Prints do usuário
- Greavard 1/14/15 (GL IV #1 ↳ Houndstone, RG #653) apresenta **🗡** após consultar o conjunto recomendado sem legado, mas volta incorretamente a **⚔️** ao fechar o painel. A causa era recriar o botão com texto padrão.
- Litwick 15/15/15 tem IV Classe #1 próprio, porém PvPoke não fornece um conjunto recomendado; a aplicação expandia todos os golpes possíveis do Game Master, ocupando grande parte do card.
- O usuário pediu aproveitar os 101 filtros Pokémon de um catálogo derivado do backup PGSharp, preservando critérios, slots e duas Pokébolas sem duplicar filtros ou revelar dados privados.

## Alterações técnicas
1. **Status de golpes persistente:** `detail.html` tem `psVerifiedMoveIcons` em memória, indexado por liga+espécie efetivamente consultada. Após a fonte confirmar o status completo da combinação, salva ⚔️ (com ao menos um legado/Elite) ou 🗡 (sem legado). Reabrir ou re-renderizar o mesmo card mantém o sinal. Um Pokémon diferente não herda o status. Sem fonte ou só golpes possíveis, fica neutro com tooltip explicando que não foi comprovado.
2. **Lista sem recomendação:** caso `availableOnly=true`, mostrar `Sem conjunto PvP recomendado` e `Ver N golpes possíveis` dentro de `<details>`, fechado por padrão e com altura limitada a 130px após expansão. A lista de movimentos NÃO é anunciada como um conjunto otimizado. As cores/tipos/status individuais continuam oriundos da fonte verificada e nenhum golpe novo é inventado.
3. **Importar filtros PGSharp:** novo `PgsFilterImport.java` transforma apenas catálogo JSON **sanitizado** do tipo `pokesearch_analysis_only_not_directly_importable`. A seleção ocorre no menu Home já existente `Importar dados`; o catálogo aprovado é guardado em armazenamento privado do Android. Item `Filtros PGSharp` no Home permite escolher um modelo e ver uma prévia com IV, nível e espécies antes de aplicar.
4. **Condições preservadas:** IV% de 0 a 100 e faixa de nível 1–50 podem ser importados; IVs A/D/S com valores exatos são transformados em modo raw. Critérios individuais não equivalentes (forma, sexo, tamanho, Shiny específico, intervalo A/D/S não exato) são **rejeitados**, nunca silenciosamente ignorados. Títulos, emojis, posição RG anotada, distância, notificações, ordenação e rank geral não substituem dados confirmados pelo PokeSearch. PGSharp .dat não é importado por conter dados adicionais de conta.
5. **Limite de 50 espécies:** filtros com mais de 50 IDs são divididos em páginas explícitas, sem cortar ou ampliar critérios ocultamente. Cada grupo usa IDs verificados no catálogo do app e seleção por nome igual ao serviço existente. Quem escolhe a Pokébola 1 ou 2 recebe a configuração; serviços são `exported=false`, estado/contas da outra permanecem independentes.
6. **Escopo não suportado:** filtros de raides e pesquisas permanecem disponíveis no catálogo externo, mas não são aplicados como busca de encontros, pois o provedor atual não fornece os mesmos dados. Não é feita importação em massa sem escolha individual nem ativação automática de alertas.

## Arquivos e testes
- `app/src/main/assets/detail.html`, `app/src/main/assets/release_notes.json`
- `app/src/main/java/com/lucianotoscano/pokesearchoverlay/PgsFilterImport.java`, `MainActivity.java`, `OverlayService.java`
- `app/tests/lt248-move-icon-persistence-compact-fallback.test.js`, `app/tests/lt248-pgs-safe-import-contract.test.js`
- Contrato LT246 atualizado para o painel recolhível.
- Base LT247 `0.02.47/54451`; candidata LT248 `0.02.48/54452`, label `51252`.
- Necessários: Node completo, QA central, Java Android, OTA e APK beta. Somente após merge/assinatura publicar no canal oficial `releases/latest`; registrar SHA-256 e evidências.
- Verificação visual em Samsung P1/P2 P/M/G e seleção manual de um filtro do JSON pelo usuário permanecem indispensáveis. Não alegar instalação nem teste físico.

## Evidências oficiais — LT248 (05/11/2026)

- **Código e merge:** [PR #224](https://github.com/LucianoToscano/PokeSearch/pull/224) mesclada na `main`, commit `92e78a362827a21763112b38a62813d012f6ea4a`. Revisão aprovada `d7e799fef867defe209b66507c3978551b8f617b`.
- **Checks QA aprovados da revisão:** PokeSearch LT169 regressão Node completa [#42008971201](https://github.com/LucianoToscano/PokeSearch/actions/runs/42008971201), Node QA [#42008971214](https://github.com/LucianoToscano/PokeSearch/actions/runs/42008971214), QA core LT211 [#42008971068](https://github.com/LucianoToscano/PokeSearch/actions/runs/42008971068), Java Android LT62 [#42008971152](https://github.com/LucianoToscano/PokeSearch/actions/runs/42008971152), OTA LT173 [#42008971305](https://github.com/LucianoToscano/PokeSearch/actions/runs/42008971305) e APK beta privado [#42008971066](https://github.com/LucianoToscano/PokeSearch/actions/runs/42008971066): todos `completed/success`.
- **Pedido de release:** `release/official-request.json` no commit `950f4b42d3c77067ebc65f9bf31744e68f294a8f`, `0.02.48`, `versionCode 54452`, `label 51252`, `previous_tag v0.02.47-54451`.
- **Workflow permanente assinado:** [GitHub Actions #42009490399](https://github.com/LucianoToscano/PokeSearch/actions/runs/42009490399), `completed/success`, com `preflight` e `publish` `success`. Etapas `Validate APK and signer`, `Release to all app users` e `Verify public release and hash` concluídas com `success`.
- **Release pública estável:** [v0.02.48-54452](https://github.com/LucianoToscano/PokeSearch/releases/tag/v0.02.48-54452) em `releases/latest`, publicada em `2026-11-05T10:20:57Z`, `draft=false`, `prerelease=false`, source commit `950f4b42d3c77067ebc65f9bf31744e68f294a8f`.
- **APK assinado:** [PokeSearch-v0.02.48-LT.apk](https://github.com/LucianoToscano/PokeSearch/releases/download/v0.02.48-54452/PokeSearch-v0.02.48-LT.apk), **28.384.017 bytes**, SHA-256 `fd541d1cec0944b64461c01ebd873a5c38225c385256cde13a963d9760a5d2ac`, asset `uploaded`.
- **Catálogo PGSharp analisado:** entre os 101 modelos Pokémon do JSON sanitizado do usuário, 93 passam pelas verificações estruturais iniciais e 8 exigem critérios ainda não convertidos sem perda (4 intervalos IV por atributo, 2 tamanhos, 2 formas); 28 filtros de pesquisas e 14 de raides permanecem fora do importador de encontros. Os modelos não são ativados em massa: usuário escolhe cada preset e sua Pokébola.
- **Distribuição/limites:** A atualização está visível em `releases/latest`, consultado pelo atualizador interno. Instalação requer confirmação do Android. **Não há prova de instalação, QA visual físico Samsung P1/P2 P/M/G ou aplicação real de um preset PGSharp no dispositivo do usuário.** O usuário deve importar o catálogo sanitizado JSON pelo Home e selecionar o modelo.
