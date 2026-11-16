# PokeSearch — ARK LT371 | Continuidade da Busca Inteligente após LT370

Atue como engenheiro Android sênior, auditor UX/UI e responsável pela segurança do projeto `LucianoToscano/PokeSearch`. Leia `AGENTS.md`, `docs/GUIA_MESTRE.md`, `docs/LT370_DRIVE_PGTOOLS_PAS_PAC_AUDITORIA_20261115.md` e `docs/PADRAO_OFICIAL_OVERLAYS_POKESEARCH.md`. Não confundir aprovação de CI com teste físico, publicação com instalação e gesto Android com captura comprovada.

## Estado da base

- **LT370:** implementação integrada pela [PR #444](https://github.com/LucianoToscano/PokeSearch/pull/444), squash `1b21e89c8ba34196f070de8f37ce37c062c4efe2`; todos os 7 gates green no head `ce7eda406296cd6b5678d3d91de0a3460cbabf35`: Node #43779097515, LT169 #43779097573, LT211 #43779097539, Java LT62 #43779097674, OTA #43779097576, PGS QA #43779097522, Secure beta/R8 #43779097537.
- **LT370 OFICIAL PUBLICADA:** **0.03.66 / versionCode 54573 / label 51370**, [release](https://github.com/LucianoToscano/PokeSearch/releases/tag/v0.03.66-54573), [APK](https://github.com/LucianoToscano/PokeSearch/releases/download/v0.03.66-54573/PokeSearch-v0.03.66-LT.apk) **61.173.419 bytes**, SHA-256 da API GitHub `70eadf91f37a6c4363e70778c7d6e3d1bbcb61bbff015cf58d39b6835d5e52dc`, [workflow oficial #43779984816](https://github.com/LucianoToscano/PokeSearch/actions/runs/43779984816) completed/success no SHA `8303bd2f722319c6316ff8b7ebc732df791c4a9a`. Hash confirmado por metadados GitHub, sem recálculo independente. O Android exige confirmação de instalação.
- Branch inclui `release/official-request.json` e `app/src/main/assets/release_notes.json` LT370 com descrição honesta dos limites.

## Implementado

- Fluxo simples: `Procurar Shiny`, `Auxiliar encontros` e `Procurar + auxiliar`, sem criar outro menu flutuante nem apagar sequências e modos antigos.
- Modelos do feed habilitados e do cliente ativo; escopo `Disponíveis (até 10)` ou `Meus favoritos`, contador antes de iniciar; catálogo de miniaturas nativas continua vazio (manifest `entries: []`), portanto sem promessa de todas as espécies.
- Perfil PGSharp/Pokemod sugerido por **duas capturas de tela com modelos separados**, apenas se corresponder de forma estável e exclusiva; fallback manual, sem inferir pela instalação de manager.
- Procurar Shiny exige permissão de notificação e só considera positivo explícito compatível com espécie. Ausência de sinal não prova Pokémon normal.
- `Auxiliar encontros` verifica sprite do feed e, se a tela de encontro for observável, pausa para **captura manual**, sem qualquer arremesso automático, frutas ou confirmação de captura. É assistente, NÃO PaC completo.
- Consentimento por cliente OFF por padrão, limite de interações, repetição opt-in, um único motor visual, status/Iniciar fixos em três abas roláveis.
- Investigação estática dos APKs da pasta Drive autorizada para estudo: PGTools 6.1.1 principal/teste, Pokemod v14.2.1, Velocity, PokeList e documentos. Nenhum asset/código injetor proprietário ou serviço de API sem permissão foi incorporado. Relatório em `docs/LT370_DRIVE_PGTOOLS_PAS_PAC_AUDITORIA_20261115.md`.

## P0 — Tratar como não homologado até evidência real

1. Testar em Android 11/13/14 com PGSharp e Pokemod independentes, vídeo ou screenshots de dois frames para cada espécie/cliente, detecção auto, fallback, acessibilidade, mod em primeiro plano, avisos de segurança e rotação.
2. Validar casos sem modelos, modelos inválidos, modelos ambíguos, 1/5/10 alvos, limite do scanner, prioridade de favoritos e duração de captura. Se não houver foto verificável, declarar `BLOQUEADO`.
3. Validar que só aviso de Shiny explícito e ligado à espécie atual pausa a sessão; sem permissão deve impedir início com explicação.
4. Confirmar o aviso de encontro manual e que o aplicativo não faz arremesso, transferência nem inferência de sucesso. Não permitir sequência avançada assumir estado inexistente.
5. Validar menu compacto P1/P2 e Central sem menus duplicados, escopo, status no rodapé, TalkBack, teclado, dimensões P/M/G e transparência.

## P1 — PaS/PaC completo (ainda NÃO implementado)

- Construir biblioteca legalmente utilizável de miniaturas do FEED PGSharp/Pokemod com hash, cliente, versão, forma/traje, fonte e evidência. Pokédex genérica não substitui miniatura compatível.
- Fazer classificador visual calibrado dos estados de encontro + indicador Shiny real; rejeitar quando inconclusivo, não usar apenas correlação da sprite.
- Criar máquina de estados separada para captura com detecção verificável de bola/fruta/resultado, prévia e confirmação de gesto opt-in, limites e fallback humano. Só anunciar captura automática após testes em aparelho; não importar injetor/rotinas internas do PGTools/Pokemod.
- Adicionar filtros por espécie/forma, níveis e IV somente quando origem própria/autorizada disponibilizar tais atributos; não deduzir IV da cor da sprite.
- Biblioteca de presets, limites/histórico estatístico, diagnósticos por etapa e exportação local. Preferir dados/formatos públicos e licenciados; respeitar 401/403, 429/Retry-After. Não ligar API PokeList `moonani.com` sem direito de uso documentado.

## ARK

Auditar `main` e GitHub Releases → nova branch → mudanças pequenas com regressões e APK QA → 7/7 gates concluídos com sucesso no mesmo SHA → merge → request de versão monotônico (versionCode > 54573; LT370 publicada) → preflight → workflow oficial com R8, assinatura original, APK e hash público → registrar em `AGENTS.md` e `GUIA_MESTRE.md`. Separar sempre implementado/testado/publicado/homologado no Android.
