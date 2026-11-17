# ARK LT399 — Minha Pokédex com fundos e comparação · release pública oficial

**Data:** 17/11/2026
**Base:** PokeSearch v0.03.83 LT / versionCode 54590
**Publicado:** PokeSearch **v0.03.84 LT** / versionCode **54591** / label **51399**
**Release:** https://github.com/LucianoToscano/PokeSearch/releases/tag/v0.03.84-54591
**APK oficial:** https://github.com/LucianoToscano/PokeSearch/releases/download/v0.03.84-54591/PokeSearch-v0.03.84-LT.apk

## Evidência de publicação e assinatura
- GitHub Release `draft=false`, `prerelease=false`, `published_at=2026-11-17T13:13:45Z`
- Asset `PokeSearch-v0.03.84-LT.apk`, GitHub `state=uploaded`, **61.507.794 bytes**
- Hash SHA-256 informado pela API GitHub: `ca2f6050819537a6de8476af9dfcbc22e0b0670c9ac5c4c6ca8c8ee20c37f070`
- Assinatura permanente validada pelo workflow: certificado SHA-256 esperado `34766c15d09013ad65873f9976539c8fa2f826e917dae3af57ea628cad689e8e`
- Workflow oficial: https://github.com/LucianoToscano/PokeSearch/actions/runs/44089858641 — **completed/success**; `Validate APK and signer`, `Release to all app users`, `Verify public release and hash`, `Erase private signing material` e `Complete job` executados com sucesso
- PR #509 (código): https://github.com/LucianoToscano/PokeSearch/pull/509 — squash `b87c6c4e67e496d69734bb2569f42814f5ce51b3`
- PR #510 (versionamento): https://github.com/LucianoToscano/PokeSearch/pull/510 — squash `de02821f19e54eab7079a419a07dee8a03201b00`

## Implementação no inventário privado
- Catálogo factual versionado com **278 IDs** do WatWowMap; **263 PNG** do PokeMiners (total original de **114.622.187 bytes**) e **275 vínculos verificados**. IDs **28, 204 e 423** não possuem imagem exata comprovada e são preservados como sem imagem.
- Apenas **manifesto, IDs, nomes, tamanhos e SHA git blob** no APK. **Nenhuma imagem extraída de jogo do PokeMiners ou do ZIP do usuário foi incorporada à distribuição pública**; direitos permanecem com seus titulares.
- O usuário inicia **manualmente e em privado** `Minha Pokédex > Fundos > Baixar todos`. Download para `getFilesDir()/pokedex_backgrounds`, sem compartilhar coleção; bytes e SHA conferidos, retomada de arquivos completos, cancelamento e exclusão somente do cache visual.
- Ao abrir a ficha, o fundo original identificado no `PGSStats.json` é usado quando a arte correspondente estiver no cache; se o usuário escolher outro, ele é marcado como **decoração do PokeSearch**, não como fundo possuído dentro do jogo. Preserva a informação original de importação.
- Filtros combinados, comparação de 2–3 Pokémon, anotações locais privadas por exemplar e histórico de até dez importações por coleção (novos, ausentes e alterados). A ausência não é interpretada como prova de transferência.
- Ajustes de grade para nomes extensos e área inferior de rolagem, sem substituir os 16 ícones originais da Home ou afetar P1/P2, buscas, autenticação, Comunidade, Quest, Assistente ou a assinatura.
- Sem trocas, leilões, vendas, API de conta oficial ou sincronização automática.

## QA realizado / pendente
- PR #509 SHA `5337102b46ed502755ced5195ff2516d280b7399`: Node QA, LT169, LT211, LT62 Java, LT173 OTA, Secure beta APK/R8 e smoke automatizado concluídos com sucesso; jobs de publicação não solicitados foram skipped.
- PR #510 SHA `0b98b0aea464af69d1797938baa538f312224fc5`: preflight oficial, Node, LT169, LT211, LT62, LT173 e Secure beta APK/R8 com success antes do merge.
- Workflow de produção compilou e verificou novo APK público. **Não houve instalação física** no Samsung SM-S928B Android 17, teste real de download dos 263 PNG, teste de rede lenta/sem rede, comparativo de screenshots, TalkBack nem homologação de 1.198 Pokémon e 11 ovos após atualização.
- O ZIP `Sprites Pokemon.zip` enviado possui 107 entradas principais, 55 ZIPs internos com modelos/atlases/texturas; não foram incorporados sem correspondência e autorização. O ZIP mestre de dados continua sendo referência; suas possíveis inconsistências não foram substituídas silenciosamente no app.

## Próxima etapa LT400
- Testes reais no Samsung: instalação sobre 0.03.83 sem desinstalar, importação por SAF, 1.198 Pokémon/11 ovos, filtros simultâneos, comparação, notas, histórico, fundo original e decoração.
- Testar download/cancelamento/retomada/limpeza, tamanhos, disponibilidade de 263 arquivos, tratamento de HTTP 429, memória/armazenamento e redes instáveis.
- Melhorar suporte a imagens de formas Shiny/vestimentas somente com metadados e arte de origem autorizada. Não inventar forma ou fundo quando ausente.
- Adicionar etiquetas personalizadas locais e importação/exportação opt-in de backups em etapa futura; preservar privacidade e isolamentos das duas contas.
- Após QA e futuras mudanças: ARK obrigatório, squash merge, versionCode monotônico, workflow oficial protegido, conferir APK/release/assinatura e registrar evidências; FastDev não é canal de entrega.
