# LT259 — avaliação PvE antes da captura (06/11/2026)

## Solicitação
Mostrar se o Pokémon do cartão é útil em Raides antes de usar "Pegar Coordenadas", de forma tão imediata quanto a faixa de GL/UL/ML; incluir acesso também na área existente **Análise PvP · N avaliações**, sem adicionar outro menu flutuante.

## Como funciona
- Novo controle compacto **🏆 Raides** logo abaixo dos chips de PvP, antes de "Pegar Coordenadas". Ele aparece ao abrir um encontro e atualiza a avaliação de forma assíncrona; tocar expande o resultado **dentro do mesmo cartão**, compatível com a rolagem única introduzida na LT258.
- Na seção já existente **Análise PvP**, novo atalho "🏆 Ver avaliação de Raides (PvE) neste cartão".
- Rank da **espécie/forma e tipo de atacante**, não da combinação IV nem uma posição universal dos melhores Pokémon. Exibir # do tipo, estágio evolutivo que conseguiu essa posição, nome dos golpes, marca de Elite e indicação de Mega/Shadow/projeção. A edição de IV, PC, nível ou coordenadas não provoca requisição ao servidor externo nem altera a classificação por espécie. Nenhum dado privado é enviado.
- Dados públicos consultados em cache no endpoint estático documentado `https://s-tier-devs.github.io/pogo-db-api/api/`, ranker por ER (mistura de DPS/TDO) e rankings por tipo. Projeto-fonte `https://github.com/S-Tier-Devs/pogo-db-api`, README com licença MIT e metodologia. **A fonte pública foi atualizada no repositório em 03/08/2026**, portanto este primeiro modo rotula o dataset como **referência de agosto**, não como rank PvE ao vivo ou counter oficial para chefe atual. A disponibilidade real do endpoint em Samsung e a compatibilidade dos JSONs ainda carecem de validação em dispositivo/rede. Se não houver posição verificada ou se falhar, exibir informação indisponível — não fabricar rank.
- Enquanto busca, ou como fallback offline, mostra **Ataque-base** do melhor estágio conhecido na família calculada localmente pelo Game Master, explicitamente identificado como mera prévia, nunca como classificação de Raide. Não supor que fantasias possam evoluir; verificar forma/espécie e não transferir Mega X para Mega Y.
- Fontes, caches e regras são independentes das duas Pokébolas e de login. O estado do card é invalidado ao trocar de Pokémon para impedir que rank antigo apareça em outra captura.

## Arquivos
- `app/src/main/assets/pve_raid_rank.js`: módulo novo com fetch estrito, aliases de tipos, status de fonte, dados de IV independente, projeções e cache com limite.
- `app/src/main/assets/detail.html`: chip, painel no mesmo card, link dentro da análise PvP, validação de identidade e fallback sem rank.
- `app/src/main/java/com/lucianotoscano/pokesearchoverlay/OtaAssets.java` e `scripts/build_ota_pack.py`: paridade da allowlist OTA assinada.
- `app/tests/lt259-raid-pre-capture-rank.test.js`: testes de regressão com dataset sintético reproduzível: tipo, evolução, Mega, fantasias, ranking não confirmado, cache e política OTA.

## QA e publicação
- Teste funcional específico executado em harness JS: **PASS**. Script principal do cartão e módulo compilam como JS.
- A suíte integral GitHub Actions, testes visuais P/M/G, consulta real à fonte, inspeção física Samsung P1/P2 e assinatura/distribuição **ainda precisam de aprovação**.
- Não publicar ou afirmar APK/OTA entregue até confirmação de workflow oficial de release, assinatura v2, hash e `releases/latest`.
- A LT258 oficial anterior deve permanecer disponível para rollback.
