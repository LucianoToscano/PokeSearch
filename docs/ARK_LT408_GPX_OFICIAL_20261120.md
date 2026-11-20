# ARK LT408 — PokeSearch v0.03.93 LT — GPX Eternatus (20/11/2026)

**RELEASE OFICIAL PUBLICADA E VERIFICADA:** PokeSearch **v0.03.93 LT / versionCode 54600 / label 51408**; tag [v0.03.93-54600](https://github.com/LucianoToscano/PokeSearch/releases/tag/v0.03.93-54600), publicada em **2026-11-20T06:29:23Z**, `draft=false`, `prerelease=false`.

**APK oficial permanente:** [PokeSearch-v0.03.93-LT.apk](https://github.com/LucianoToscano/PokeSearch/releases/download/v0.03.93-54600/PokeSearch-v0.03.93-LT.apk), **61.766.746 bytes**, asset `uploaded`, digest informado pelo GitHub **SHA-256 `641f1fdafeab68a65ed67c7c627a615c5d71e13887fec13c4b9fad500efd5f36`**. Assinatura permanente esperada e verificada no workflow protegido: certificado SHA-256 `34766c15d09013ad65873f9976539c8fa2f826e917dae3af57ea628cad689e8e` e Android APK v2. O hash citado vem da API do GitHub e da verificação do workflow com os bytes produzidos, **não de download independente do APK nesta sessão**.

**Workflow público protegido:** [#44687638801](https://github.com/LucianoToscano/PokeSearch/actions/runs/44687638801) `completed/success`, código-fonte para publicação `a490714904b2b57b09b3e02d14296673040bae16`; jobs preflight e publish `completed/success`. Pipeline verificou pedido de versão, testes de regressão, geração de assets, R8/release, chave oficial, assinatura, tamanho, SHA, criação e verificação do asset público.

## Integração, QA e versões
- **Código:** [PR #535](https://github.com/LucianoToscano/PokeSearch/pull/535) squash `529caf83b7d8fd886d7f8a02bcf1c24439599b2c`. Head final `f564b34a8c43819a1b2cbb3c641c50f7a89fee24`; QA executado com sucesso: Node, LT169, LT211, LT62, LT173, PGS Buscas Auto QA e Secure R8 [#44686832727](https://github.com/LucianoToscano/PokeSearch/actions/runs/44686832727).
- **Pedido de versão:** [PR #536](https://github.com/LucianoToscano/PokeSearch/pull/536) squash `a490714904b2b57b09b3e02d14296673040bae16`, head `eb218aa4bed6dcad8706513ca26ad246f3d92e1e`. QA incluindo Secure R8 [#44687327539](https://github.com/LucianoToscano/PokeSearch/actions/runs/44687327539) aprovado.
- `release/official-request.json` traz `version=0.03.93`, `code=54600`, `label=51408`, `previous_tag=v0.03.92-54599`, `qa_max_code=54599`; notas no APK em `app/src/main/assets/release_notes.json`.
- Canal único de distribuição: PokeSearch oficial `com.lucianotoscano.pokesearch`, firmado pela chave permanente; **nenhum FastDev, DEV, preview ou APK interno distribuído**.

## Escopo real da atualização
- **Planejador local GPX:** importação SAF, parser XML com limites, até 3.000 pontos, preservação de ordem e nomes, apoio a `wpt/rtept/trkpt`, duplicatas sinalizadas, arquivo privado e persistência por SHA-256 da rota. Tela dentro da navegação atual do Auto Hunt.
- Diagnóstico de rota: grupos de três coordenadas como **candidatos**, distância geográfica acumulada e maior salto por haversine. GPX enviado possui 500 pontos, 166 trios completos, 2 pontos sobrando e aproximadamente 569,45 km; **não é duração, cooldown nem confirmação de pesquisa**.
- Perfil de filtro conferido nas capturas PoGo Coordinates: **Reward type Candy → Eternatus (#890) → Task Make an Excellent Throw → recompensa esperada Eternatus Candy ×25**, copiável pelo usuário. O selo “Free account · up to 10” é limitado à tela mostrada, não restringe GPX em geral.
- Checklist de **sete verificações manuais** com validade declarada de até 24h: fonte, vagas de pesquisa, capacidade Pokémon/itens, configuração de giro no PGSharp, tarefa/recompensa verificadas e revisão de espera.
- Registros individuais e reversíveis de tarefa recebida e **recompensa efetivamente resgatada**, contador de doces/trios só pelo que a pessoa confirma no aplicativo, checkpoint privado por arquivo. Não confiar que uma coordenada representa um doce recebido.
- Preservados Home e ícones, os cinco ícones de Auto Hunt, Pokébolas P1/P2, filtros, login, contas, Pokédex, dois inventários, sprites, notas, fundos e PGSStats SAF. Nenhuma credencial ou imagem privada do vídeo enviada ao GitHub.

## Limitações, segurança e pendências
- **Esta versão NÃO executa Auto Hunt noturno automático.** Nenhum teleporte, GPS falso, giro automático de Poképaradas, limpeza/captura, lançamento excelente, descarte de pesquisas, resgate de doces ou controle do cliente Pokémon GO/PGSharp foi implementado neste módulo.
- As pesquisas, recompensas, os tempos e a expiração não são verificados por GPX, screenshots ou site. A projeção de 12.450 doces no arquivo anterior era **apenas matemática condicional**, nunca ganho real.
- O vídeo de 18/11 mostrou o estoque de Pokémon cheio, a rota e configurações GoPlus Virtual; não demonstrou trinca concluída nem resgate. Os checklists foram incluídos para reduzir afirmações indevidas, **sem provar o jogo**.
- **Sem homologação física Samsung Android 17**, sem teste real de 10/500 pesquisas ou integração no jogo. O uso de clientes modificados e localização simulada pode violar políticas do jogo e gerar penalidades.
- O app é instalável apenas após confirmação humana no Android; não houve instalação remota.
- Testes automatizados e CI são evidência do código e do processo de release, não substituem testes físicos de permissão SAF, legibilidade, carregamento Android ou compatibilidade de todas as sprites.

## Continuidade recomendada
Testar instalação por cima da versão 0.03.92 LT, abertura do submenu Auto Hunt → GPX, importação de GPX pequeno/500 pontos, pausa/reentrada, checklist e registros após reinício; confirmar que nenhuma interação com o jogo ocorre por engano. Para futura automação real de campo, exigir fonte de pesquisas válida, integração comprovada, estados observáveis, pausa em telas inesperadas, sem contornar avisos de segurança, e homologação em aparelho antes de divulgação pública.
