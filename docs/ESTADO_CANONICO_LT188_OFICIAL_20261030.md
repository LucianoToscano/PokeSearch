# PokeSearch LT188 — publicação oficial, auditoria geral e pacote-fonte para outras IAs
Data: 30/10/2026 (UTC). Documento oficial de continuidade **posterior** à compilação assinada, sem alterar o commit-fonte do APK.

## Fonte e integração
- PR [#146](https://github.com/LucianoToscano/PokeSearch/pull/146) integrada por squash à `main`, commit `cd86684c032b4966a84f7013c29243d164b2ae9d`.
- Release/latest oficial **v0.01.88-54393**: https://github.com/LucianoToscano/PokeSearch/releases/tag/v0.01.88-54393
- GitHub Actions oficial [41006064367](https://github.com/LucianoToscano/PokeSearch/actions/runs/41006064367) **SUCCESS**; Node, compilação Java/Android, OTA, sprites, R8, assinatura v2, APK e ZIP verificados. O APK é produzido pelo SOURCE_COMMIT acima.

## APK oficial
- `PokeSearch-v0.01.88-LT.apk`, **29.014.309 bytes**, SHA-256 `b30c0cc389cd8a4b5de065ab637485e1d5dab3bcd955428198d5880e49992f34`.
- versionName **0.01.88**, versionCode **54393**; certificado permanente SHA-256 `34766c15d09013ad65873f9976539c8fa2f826e917dae3af57ea628cad689e8e`; mesma identidade/applicationId, não debuggable e assinatura Android v2 verificados pelo CI.
- Asset direto: https://github.com/LucianoToscano/PokeSearch/releases/download/v0.01.88-54393/PokeSearch-v0.01.88-LT.apk
- Artefato CI `PokeSearch-LT188-54393-Oficial-Assinado` ID **12955033866**, ZIP **26.730.719 bytes**, integridade CRC verificada e APK interno extraído com mesmo SHA/bytes da Release; arquivo de evidências `SOURCE_COMMIT.txt`, `SHA256SUMS.txt`, `SIGNING-REPORT.txt` e inventário.
- O atualizador consulta `GitHub Releases/latest`: a versão é oferecida quando o aparelho consultar e houver versão inferior; instalação requer aceite Android, **não há instalação silenciosa**.

## Revisão funcional implementada
- Filtros GL/UL agora expõem PC e Nível na mesma ordem dos modos IV: Ordenar → PC → Nível → Clima → Tamanho → Sexo → Forma. PC PvP e Evoluções continuam adicionais somente nas ligas.
- `probe.js` deixa de omitir PC/Nível da aplicação/verificação DOM nas ligas; sem controle real disponível, deve informar que não foi confirmado em vez de inventar resultados.
- `api_result_contract.js` evita carregar liga, PC mínimo PvP e flag Evoluções anteriores para Raw IV/IV%.
- `OverlayService.java` só mostra prévias de filtro correspondente; ao sair UL/GL para IV `0/13/13` ou IV% sem prévia correspondente, descarta sprites/ícones antigos. P1 e P2 herdam a mesma correção mantendo preferências independentes.
- Testes `lt188-dual-mode-filters.test.js` e suítes históricas aprovados. Não afirmar homologação física de login, menus, rede ou notificações Samsung sem teste real.

## Fonte completa para auditoria/edição por outras IAs
- ZIP REAL da Release: `PokeSearch-Auditoria-Completa-Fonte-LT188.zip`, **28.652.739 bytes**, SHA-256 `b9a6ec97cac36f83bbac674dbefcd4f17923285aa9cdcee73485f60c212f0347`; contém árvore de código rastreado, `LEIA_PRIMEIRO_PROMPT_OUTRAS_IAS.md`, testes, documentação, inventário e hashes. Limite de **199.000.000 bytes** validado.
- Download: https://github.com/LucianoToscano/PokeSearch/releases/download/v0.01.88-54393/PokeSearch-Auditoria-Completa-Fonte-LT188.zip
- Cópia Drive da árvore compactada (ZIP de artefato): https://drive.google.com/file/d/1kDTfYTSd96LNM8aU0JbUZ0N0Q7z8YYKR/view — **28.714.148 bytes**, 819 entradas, CRC íntegro, SOURCE_COMMIT igual ao APK. SHA-256 local da cópia `38f5a07824317daa11f011828dd8ca0862afbae47b9e5c9025f9b21ff17ccac8`.
- Prompt isolado Drive: https://drive.google.com/file/d/1r41ZR8eAE-f8hLe9VeRkrHqdFKRXfYVS/view, 7.304 bytes.
- Fontes da árvore são do único commit registrado, não uma decompilação; o pacote **não inclui** credenciais, keystore, caches de build nem dependências externas baixadas.

## Google Drive de instalação — distinção obrigatória
- **Novo ZIP de distribuição no Drive**: https://drive.google.com/file/d/1NsX1XtIvtEpt1WKHZMS3mZzH5Ca_Hu3Q/view — `PokeSearch-LT188-APK-Oficial-Assinado.zip`, 26.730.719 bytes. Contém o APK oficial de 29.014.309 bytes e relatórios/assinatura. Recebido no diretório `PokeSearch_App`, compartilhamento público herdado.
- **LINK LEGADO AINDA LT187:** https://drive.google.com/file/d/1XXKGy3AjtDx4uMnt2N4Wd3FVNV0Qn_5P/view — continua `PokeSearch-v0.01.87-LT.apk`, 29.013.825 bytes. **Não foi substituído**, pois a transferência de um APK extraído como binário cru para o mesmo ID não foi suportada pelo fluxo de referências conectado nesta sessão. Substituir aquele ID pelo ZIP danificaria o download direto do app, portanto deliberadamente evitado.
- Para instalação rápida, usar **APK direto GitHub Releases** ou extrair o ZIP novo do Drive. O atualizador interno já oferece LT188 por GitHub/latest. Ainda não alegar que o link de compartilhamento antigo entrega LT188.

## Testes pendentes e riscos remanescentes
- QA físico Samsung, duas Pokébolas simultâneas, IV% e UL/GL, filtros PC/Nível/PC PvP nas abas reais do PoGoCoordinates, erros de internet, autenticação Discord/Google, dois treinadores VIP e sons/notificações P1/P2.
- `Network Error` nas capturas pode vir do Pokémon GO e não prova erro na rede do PokeSearch; exigir logs antes de atribuir causalidade.
- Preservar o APK anterior como rollback e manter SHA/versões imutáveis.
