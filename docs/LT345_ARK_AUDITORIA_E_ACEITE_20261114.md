# LT345 ARK — auditoria de implementação e aceite (14/11/2026)

**ADENDO DE PUBLICAÇÃO (14/11/2026):** versão **0.03.43 / 54550** foi [publicada oficialmente](https://github.com/LucianoToscano/PokeSearch/releases/tag/v0.03.43-54550) como [APK assinado](https://github.com/LucianoToscano/PokeSearch/releases/download/v0.03.43-54550/PokeSearch-v0.03.43-LT.apk), **60.010.180 bytes**, SHA-256 `4d02031c0bb26af2b859990996cbdcc9c3f652492fedbc5e6265c81e47d6f3db`. [Workflow #43642169249](https://github.com/LucianoToscano/PokeSearch/actions/runs/43642169249) completou **SUCCESS** para preflight, regressões, compilação R8 e certificação permanente, asset e hash. PR #371 implementada por squash `8f4fb2299cec85ff0ea8071c238988b6ed1c0186` após **8 gates verdes**: Node QA, LT169, QA Core LT211, Java LT62, OTA LT173, PGS Android QA, Secure beta e LT253 PvP. PR de publicação #372 squash `5bce07739cd98b44387d937a4c56e2eb47d62884` após **7 gates verdes**, incluindo preflight protegido. **Nada disso substitui teste físico; os bloqueios T01–T28 abaixo permanecem. Não houve instalação remota no Samsung.**



## Base e cadeia de entrega
- Versão oficial anterior à LT345: **PokeSearch 0.03.42 / versionCode 54549**, assinada no [workflow oficial #43634931326](https://github.com/LucianoToscano/PokeSearch/actions/runs/43634931326).
- [Issue LT345 #370](https://github.com/LucianoToscano/PokeSearch/issues/370); [PR #371](https://github.com/LucianoToscano/PokeSearch/pull/371), branch `lt345-ark-incremental-ui`.
- **Esta auditoria refere-se a contratos e implementação de código; não equivale a teste físico no Samsung**. A aprovação de CI, a integração e a nova publicação serão registradas em adendo após serem verificadas. Manter [issue #350](https://github.com/LucianoToscano/PokeSearch/issues/350) aberta para OAuth e teleporte.

## O que efetivamente mudou
1. **Home/Contas:** `HomeMenuIconPack` normaliza tamanho óptico por alfa sem recomprimir PNGs; `MainActivity` calcula a borda visível da Pokébola pela matriz de desenho, alinhando o badge de Conta 1/2 **2 pixels físicos acima do topo óptico** e centralizado no eixo horizontal. `PogoAccountSlots.bindAccountOnly` continua selecionando a conta *por Pokébola*, sem executar OAuth nem afetar a outra. Perfil não sincronizado mostra estado de erro, em vez de inventar nome; nova sessão não herda o nome da anterior.
2. **Auto das Pokébolas:** `OverlayService` usa valor persistido especial `-3` para **3 segundos**; mantém valores antigos 3/5/10/15/20 como **minutos**, preservando escolhas já explicitamente salvas. `dock.html` apresenta **3s**, OFF e os minutos antigos. O comando passa pela lógica preexistente do provedor; não burla cooldown, backoff nem limites de buscas.
3. **Informações:** campo Distância começa **oculto por padrão** no nativo e na WebView, mas a distância vinda da API continua disponível quando o usuário habilitar a opção. Preferências anteriores não são apagadas.
4. **Rank Geral:** `pvp_rank_explorer.js` mantém nome+sprite+forma, coloca `#Pokédex` pequeno **abaixo do nome**, com eixo centralizado, e reserva espaço para o título "Rank Geral" sem truncamento horizontal.
5. **Menu PGS:** `PgsAutoMenus` usa a paleta nativa de `OverlayQuickMenus.panelColor`, dimensões compactas 38dp/46dp, área centralizada e painel preso à posição **real** da toolbar; os cinco recursos são lupa, relógio, sino original com desenho Shiny copiado do SVG real do `dock.html` dentro do sino, personalização com engrenagem+lápis e X vetorial. O menu pode retrair sem desligar a busca.
6. **PGS novos alvos:** `PgsAutoTargetPicker` oferece mira neon arrastável, confirmar/cancelar e coordenadas relativas de tela. `PgsAutoTargetPolicy` diferencia Sprite, PokéStop (com deslocamento em px), Ponto e Encontro e gatilhos Mapa/Sem Shiny/Tempo. `PgsAutoClickService` exige jogo visível, ausência de avisos de segurança, resolução igual e mapa populado + estabilidade antes de toque. Confirmação do gesto Android **não comprova** teleportar no jogo; a tela de encontro deve apresentar evidências de captura e não ser classificada como mapa antes de deslizar; sem prova, interrompe. Resultado seguro, mas dependente de testes físicos. **Tocar perto do PokéStop não move o GPS nem gera caminhada real.** Avisos "Sou passageiro"/"Estou seguro" exigem confirmação manual.

## Matriz dos testes T01–T28 (separar estático de físico)
| Testes | Status atual | Evidência / pendência |
|---|---|---|
| T01–T02 | **Código implementado / físico BLOQUEADO** | `MainActivity`, `HomeMenuIconPack`, `PogoAccountSlots`; captura real dos 2px e isolamento Conta 1/2 |
| T03–T04 | **BLOQUEADO pelo provedor e Samsung** | `MainActivity`, `profile_summary.js`; OAuth Google pode bloquear WebView; exige callback oficial do PoGoCoordinates. Nome real só quando perfil oficial fornece |
| T05–T07 | **Código ajustado / visual BLOQUEADO** | `MainActivity`; contrastes, Share e dimensões em claro/escuro ainda requerem comparação física |
| T08–T09 | **Contratos existentes / visual BLOQUEADO** | WebP ON/OFF, `PgsAutoVisualState`, ícone verde/vermelho; verificar em aparelho |
| T10–T13 | **Código alterado / visual BLOQUEADO** | `PgsAutoMenus` e `OverlayQuickMenus`: menu real ancorado, Shiny dentro do sino, notificações e retração; comparação lado a lado no Android |
| T14–T15 | **Implementação anterior / físico BLOQUEADO** | Captura quadrada, retangular, livre proporcional, lupa e alfa beta; não prometer recorte poligonal real nem segmentação perfeita |
| T16–T18 | **Contrato de código / físico BLOQUEADO** | 10 sprites, busca inferior, PGS 25s, reativação; conferir contadores e modelos no Samsung |
| T19–T20 | **BLOQUEADO — teleporte/mapa reais** | `PgsAutoClickService`, `PgsAutoMapReadiness`; callback Android não é confirmação de teleporte PGSharp nem de Pokémon carregado |
| T21–T24 | **Contrato de código / físico BLOQUEADO** | Recuperação sprites, overlay popup/minimização, screenshots locais, diálogo com confirmação manual |
| T25–T28 | **Regressões automatizadas exigidas / físico BLOQUEADO** | Edu X, temas, preferências, P1/P2/Doce Raro; CI antes de merge, Samsung para aceite visual |
| LT345-U1 | **Implementação / físico BLOQUEADO** | Auto P1/P2 3s, preservação dos intervalos antigos, rate limit do provedor |
| LT345-U2 | **Implementação / físico BLOQUEADO** | Mira Ponto/PokéStop, coordenadas por resolução, deslocamento de toque e repetição conservadora |
| LT345-U3 | **Implementação defensiva / físico BLOQUEADO** | Encontro + deslizar só após reconhecimento acessível. **Reconhecimento automático universal de sprites no mapa não comprovado** |
| LT345-U4 | **BLOQUEADO** | login Google oficial requer cooperação do provedor para callback externo quando WebView é recusada |

## Qualidade e publicação
A execução oficial deve passar: Node QA, regressão LT169, Java LT62, QA Core LT211, OTA LT173, PGS APK QA, Secure beta e verificação PvP LT253. Corrigir falhas de CI em vez de remover testes; conservar assinatura, recursos e dados. Somente após aprovação, fazer squash merge da PR #371, abrir pedido protegido de atualização **0.03.43 / 54550**, compilar, assinar e verificar o asset APK e hash em Releases. Não publicar nem encerrar como aceito por dispositivo sem os testes físicos acima.

**Proteção adicional:** nunca tentar clicar automaticamente em avisos de segurança. Um botão de mira confirmado permanece limitado ao tamanho/orientação da tela na qual foi salvo.
