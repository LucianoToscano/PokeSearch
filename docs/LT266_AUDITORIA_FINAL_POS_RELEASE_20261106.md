# PokeSearch LT266 — Auditoria adicional independente pós-release
Data: 06/11/2026. Escopo: confirmar binários da LT266 publicada e identificar riscos restantes sem alterar código de produção.

## Estado confirmado diretamente no GitHub
- Último `releases/latest` no momento da auditoria: [v0.02.66-54470](https://github.com/LucianoToscano/PokeSearch/releases/tag/v0.02.66-54470), `draft=false`, `prerelease=false`, `published_at=2026-11-06T12:56:18Z`, target commit `360e76f96d415c2c9a4c5ea1110b4b029d163386`.
- APK público [PokeSearch-v0.02.66-LT.apk](https://github.com/LucianoToscano/PokeSearch/releases/download/v0.02.66-54470/PokeSearch-v0.02.66-LT.apk), `uploaded`, **34.180.555 bytes**, `sha256:218e07e37945216021724429acd9b64a971a1e108688ec15bd5d079615555abf`.
- [Workflow #42221094365](https://github.com/LucianoToscano/PokeSearch/actions/runs/42221094365): `preflight` e `publish` `completed/success`; passos de compilação assinada, verificação do APK/assinatura, publicação e revisão do digest público `success`. Primeiro workflow #42220773155 falhou por `lt146-update-version-notification.test.js` (notas fora de ordem), corrigido mantendo a verificação.
- [PR #246](https://github.com/LucianoToscano/PokeSearch/pull/246) mesclada em `b83b3ddd346a5ca72a74e727fe125a5fe2066b6e` após oito gates verdes: Node full, Node QA, core, Java, visual P/M/G, PvE, OTA e preflight; além do APK de QA privado concluído.
- Comparação independente das listagens GitHub `main` vs. tag `v0.02.66-54470` no diretório `ui-icons`: os **18 PNGs** `type-*-lt266.png` têm nomes, tamanhos e Git blob SHAs idênticos. Total original 5.802.585 bytes, PNG RGBA 1024×1024 com alpha preservado. Arte geral do Drive não foi incorretamente adicionada como 19º tipo.

## Auditoria visual, funcional e de integridade
- Fonte dos 18 PNGs: [pasta do Drive informada pelo usuário](https://drive.google.com/drive/folders/1_V-_a_ShpYE_tzXERwVqAk2LRRPXd0IN). Os originais foram copiados byte a byte; mapeamento local offline usa exatamente os 18 nomes internos da API e preserva rótulos PT-BR do cartão.
- `lt266-types-from-drive.test.js` confere SHA-256, RGBA, 1024×1024, par de tipos Pidgey Normal/Voador e contrato OTA, sem alterar IV, rankings ou dados Pokémon. Workflow oficial faz checksum dos 18 dentro do APK final.
- Teste automatizado visual WebView P/M/G aprovou contrato e ausência de recorte nos cenários cobertos; **não equivale a teste físico real no Samsung**.
- Não houve mudança matemática nem de tipos no motor PvP/PvE. Rank Classe IV continua independente do Rank Geral, e ranking de Raides continua a referência por tipo de agosto/2026, não universal nem chefes ao vivo. Traduções LT265 não foram ampliadas sem fonte.
- O APK cresceu em relação à LT265: 34.180.555 vs. 28.638.433 bytes. Os PNGs originais de 1024 px priorizam fidelidade; medir uso de memória em smartphone real antes de propor resolução adaptativa.

## Pendências verificáveis
1. Samsung físico P1/P2: ícones novos no fundo claro/escuro, fontes, rolagem, painel único, IV A/B, forma normal/evolução/Mega, PC, PS, níveis e limites de ligas.
2. Investigar `Golpe sem tradução` em Fletchling/Talonflame/Pidgey/Pidgeot via moveId/proto da fonte PT-BR travada; nomes técnicos e API não devem ser traduzidos diretamente.
3. Conferir instalador OTA com a LT265 instalada (Android pede confirmação de atualização); nenhum teste de instalação foi executado neste atendimento.
4. Nenhuma confirmação de upload/sincronização dos arquivos de volta ao Drive; somente leitura da pasta de origem.
5. LT265 permanece disponível para rollback, se necessário.

Conclusão: **merge + oito gates + assinatura + publicação + digest + identidade dos 18 PNGs comprovados**. Homologação física e auditagem mais ampla das traduções ficam pendentes, sem simulação.
