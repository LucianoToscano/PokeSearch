# LT322 OFICIAL — informações sobre itens e condições de evolução

**Data:** 09/11/2026 · **Base de trabalho:** LT321 · **Estado:** PR #322 integrada, APK oficial LT322 assinada e publicada; homologação física Samsung pendente.

## Objetivo

Melhorar o painel **Análise PvP** já existente, sem outro menu, sem alterar ranks/IVs e sem modificar a Pokébola principal ou secundária individualmente. Na linha da evolução, mostrar discretamente **Etapa especial** quando o grafo da família comprovar o caminho e houver requisito conhecido (item, moedas, módulo atrair ou condição ambiental).

## Escopo

- Criado `app/src/main/assets/evolution_requirements.js` com **77 transições especiais conhecidas**: Pedra Solar, Pedra do Rei, Revestimento Metálico, Escama de Dragão, Melhora (Up-Grade), Pedra de Sinnoh, Pedra de Unova, três maçãs de Applin, moedas de Gimmighoul, módulos/chuva e lua cheia de Ursaring, tarefas de companheiro, caminhada, corações e horários.
- A nomenclatura oficial do Pokémon GO em português foi verificada: **20 Maçãs Doces/Azedas/Xaropentas**, cada variante com **200 Doces de Applin**. A denominação antiga "Maçã Melada" não era a tradução oficial. Dipplin → Hydrapple exige **400 Doces de Applin** e **capturar sete Pokémon Dragão tendo Dipplin como companheiro**, segundo anúncio oficial de 2025.
- Evoluções por companheiro/tarefas estão incluídas quando o grafo oferece uma rota verificável (Primeape, Charcadet, Bisharp, Pancham, Poipole, Pawmo, Feebas, Inkay etc.). Essas condições podem ser flexibilizadas temporariamente por eventos; **nenhum requisito mostra progresso, posse de itens ou status real da conta**.
- Exibir até múltiplos itens em uma rota (exemplo: **Porygon → Porygon2 → Porygon-Z** requer Up-Grade e Pedra de Sinnoh), sem somar doces nem alegar posse do item.
- Caminho dirigido calculado apenas sobre `PokeSearchPvpFamilyCatalog.links`; linhagem desconhecida, sem dados, costume, Mega, variantes regionais e formas Shadow não recebem exigência inferida.
- `Kirlia → Gallade` tem observação de macho; `Snorunt → Froslass` tem observação de fêmea.
- Módulos e condições de tempo não significam consumo automático do item, e algumas evoluções permitem alternativas (como clima/chamariz). Mostrar condições sem afirmar disponibilidade.
- O componente é local e offline, não consulta novas APIs ou autenticação. Ambos os overlays usam a mesma WebView de detalhe. Preserva `applicationId`, versionCode atual, assinatura, limites de busca e qualquer preferência já salva.
- **15 PNGs originais preservados:** arquivos enviados no Drive em 09/11/2026, mantidos byte a byte em `app/src/evolution-image-masters/` e associados aos rótulos das condições. Correspondem a sete itens tradicionais, três maçãs, Moedas de Gimmighoul e quatro módulos atrair. **Não** substituem os ícones atuais de tipos, menus, passes ou Edu. Durante a compilação, `app/scripts/EvolutionPreviewIcons.java` gera miniaturas transparentes PNG 64×64 para `build/generated/evolution-preview-assets/evolution-items/`, incluídas nos assets da APK. Os 15 originais não entram no APK.
- **Origem verificada:** a pasta `Banco de Imagens` contém 133 arquivos (129 PNG, 3 WebP e 1 ZIP); o ZIP tem 98 imagens sem erros de integridade. Os 15 arquivos da PR têm bytes idênticos aos correspondentes no ZIP (SHA de blob Git coincidente), transparência real e dimensões PNG verificadas. Não publicar URL privada ou dados de conta nos manifests. Inventário dos 133 arquivos preservado em `docs/CATALOGO_ASSETS_DRIVE_20261109.csv` com estados separados `LT322` versus `somente catalogado`.
- **Governança de mídia:** imagens recebidas do usuário foram incluídas no repositório e APK publicados a pedido do proprietário. A autorização e os direitos de redistribuição das artes da franquia **não foram comprovados nesta auditoria**; revisar com o proprietário. A publicação técnica não equivale a licença.

## QA e pendências

Teste `node app/tests/lt322-evolution-requirements.test.js` verifica 77 regras, 15 PNGs reais (cabeçalho, bytes e dimensões), rotas de múltiplos passos, casos de risco, renderização de ícones e herança P1/P2. A PR passou as regressões completas e cinco gates oficiais; a publicação autorizada executou build assinado e verificações de SHA-256, versão, certificado e limite de tamanho. **QA físico Samsung ainda está pendente.**

**Pendências:** validar outros requisitos situacionais e novas regras/variações por Game Master; a tradução oficial das três maçãs já foi confirmada. A tabela é um subconjunto de evoluções especiais confirmadas, não catálogo universal de todas as tarefas, formas e custos. `Etapa especial` é informação; não prova que um Pokémon individual pode evoluir. A Release oficial agora é `LT322 / 0.03.22 / 54528`.

## Atualização sobre exigências por evento — 21/11/2026

- O anúncio **oficial** do Dia Comunitário de Pawniard confirmou uma exceção para **Bisharp → Kingambit**: em **21/11/2026, das 14h até antes das 21h (horário local)**, a missão passa de 15 para **1 chefe de Reide do tipo Sombrio ou Aço**, com Bisharp como companheiro. A evolução entre 14h e 21h também pode conceder o ataque especial **Humilhação Dividida**. Fonte: https://pokemongo.com/pt-BR/news/communityday-november-2026-pawniard (texto corrigido em 28/10/2026).
- O módulo usa a data e hora locais do **aparelho** ao abrir/renderizar o painel; não consulta um servidor de horário e não garante que o relógio do usuário coincida com o relógio do jogo. **Antes** da janela, informa o bônus futuro sem substituir o requisito normal; **durante** a janela, apresenta 1 chefe; a partir das **21h**, restaura automaticamente a regra de 15 chefes e remove o aviso. A tela pode precisar ser reaberta para recalcular; conferir o botão de evolução dentro do jogo.
- Foram criados testes determinísticos de bordas 13h59, 14h00, 20h59 e 21h00, abrangendo também linhas descendentes **Pawniard → Kingambit** e bloqueio de linhas teóricas.
- Acrescentado **Floette → Florges** (20 corações com Floette companheiro e 100 Doces de Flabébé) conforme https://pokemongo.com/news/valentines-day-event-2022; cores diferentes continuam não sendo inferidas silenciosamente do espécime capturado.
- Continua fora do escopo: atualização de relógio em tempo real com a tela aberta, detecção de requisitos cumpridos, indicação de posse de doces, eventos futuros não anunciados e atendimento a variantes regionais fora do grafo do catálogo atual.

## Fontes e proveniência

- Ajuda oficial Pokémon GO — https://niantic.helpshift.com/hc/en/6-pokemon-go/faq/100-evolving-your-pokemon/
- Evento oficial 2025 (Dipplin/Hydrapple e quantidades) — https://pokemongo.com/pt-BR/news/harvest-festival-2025
- Evento oficial 2026 (nomes Maçãs Doces/Azedas/Xaropentas) — https://pokemongo.com/pt-BR/news/harvest-festival-2026
- Guia de condições e tarefas — https://pokemon.gameinfo.io/pt-br/guides/evolution-requirements
- Pokémon GO Hub — https://pokemongohub.net/post/wiki/evolution-items/
- Pokémon GO Info — https://pokemon.gameinfo.io/en/guides/evolution-requirements
- [Arquivo Mestre PokeGoBR 09/11/2026] (anexo do solicitante): índice de referências, não banco de dados integrado e nem licenças automáticas.

## Controle do tamanho da APK (pendência técnica)

A LT321 pública tinha APK de **34.710.626 bytes**; o limite declarado no fluxo oficial é **35.000.000 bytes**. Os 15 PNGs de origem somam **1.083.681 bytes** em disco, incluindo `gimmighoul-coins.png` de 512.120 bytes. **Mitigação publicada e verificada:** mestre original preservado fora dos assets; durante a compilação, 15 miniaturas PNG 64×64 transparentes são criadas por Java 17 com filtro bicúbico. Execução local do gerador sobre os 15 originais entregou **70.701 bytes** somados (redução de aproximadamente 93,5%), limitados por QA automatizado a 180 KB. A tela apresenta 14px; 64px oferece 4,6× de resolução. O APK assinado de produção foi validado com **34.788.940 bytes** (abaixo de 35.000.000), certificado permanente verificado e SHA-256 publicado. A **validação visual física no Samsung ainda está pendente**.

## Publicação oficial comprovada — 09/11/2026

- PR #322 integrada à `main` por squash: `062ff94f3f259b7ff623c300c8f83970b485596d`.
- Commit-fonte exato, incluindo a solicitação oficial: `5a35e7f9cabec43781d7780256648d450f8a6670`.
- Workflow protegido `PokeSearch permanent official release` [#42649309515](https://github.com/LucianoToscano/PokeSearch/actions/runs/42649309515): `completed/success`, preflight e publish concluídos. Java 17, testes Node/OTA, geração de 15 miniaturas 64×64 (70.701 bytes), Gradle/R8, assinatura Android v2, integridade ZIP/APK, manifesto e tamanho aprovados.
- Release estável [v0.03.22-54528](https://github.com/LucianoToscano/PokeSearch/releases/tag/v0.03.22-54528), publicada às 15:58:39 UTC; arquivo [PokeSearch-v0.03.22-LT.apk](https://github.com/LucianoToscano/PokeSearch/releases/download/v0.03.22-54528/PokeSearch-v0.03.22-LT.apk) de **34.788.940 bytes**, SHA-256 `91db785c8c69218d10ced2cf15cee57aa7b6fa99d5da12730644bb567e72d3a8`.
- Certificado permanente SHA-256: `34766c15d09013ad65873f9976539c8fa2f826e917dae3af57ea628cad689e8e`. `versionCode=54528`, `versionName=0.03.22`, `label=51326`.
- Artefato de verificação Actions `PokeSearch-v0.03.22-54528-Signed-Verified`, ID `13689840344`. O canal público é o GitHub Release/latest, lido pelo atualizador do aplicativo. **Nenhuma instalação automática foi confirmada; exige confirmação do Android.** LT321 preservada para rollback.

