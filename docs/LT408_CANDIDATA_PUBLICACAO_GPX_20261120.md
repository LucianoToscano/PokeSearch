> **ATUALIZAÇÃO DE STATUS — 20/11/2026:** este documento registra o estágio de desenvolvimento anterior à publicação. A funcionalidade **de planejador GPX manual (não Auto Hunt noturno)** foi publicada como **PokeSearch v0.03.93 LT / 54600** na [release oficial](https://github.com/LucianoToscano/PokeSearch/releases/tag/v0.03.93-54600). Ver [ARK LT408 com prova de assinatura, build e limitações](ARK_LT408_GPX_OFICIAL_20261120.md). Afirmações históricas de “PR de rascunho”, “não publicável” ou “publicação pendente” abaixo devem ser entendidas como status da época, não o estado atual. **Automação noturna segue pendente.**

# LT408 — Candidata oficial: planejador GPX de pesquisas (20/11/2026)

**Solicitação de publicação expressa do proprietário em 20/11/2026.** O escopo da versão oficial é um **planejador offline/manual**, não um farm noturno automático.

## Capacidades efetivamente implementadas
- Leitura de GPX por seletor de arquivos Android (SAF), arquivo em armazenamento privado e validação limitada de XML, coordenadas e tamanho; suporta wpt/rtept/trkpt, preserva 500 pontos do exemplo.
- Distância geográfica acumulada e maior deslocamento entre coordenadas, sem apresentá-los como cooldown ou caminhada real.
- Checklist de sete verificações manuais e expiração de declarações; confirmação das condições do jogo não é obtida do PGSharp.
- Filtro específico de pesquisas apresentado nas capturas do PoGo Coordinates: tipo Candy, Eternatus (#890), missão Make an Excellent Throw e prêmio esperado de 25 doces. Ação de copiar a configuração.
- Confirmação explícita de pesquisa recebida, resgate confirmado separadamente, desfazer último registro e contagem de doces/trios **somente com registros informados manualmente**. Progresso privado por hash do GPX.
- Integração no submenu atual do Auto Hunt, sem substituir Home, Pokébolas P1/P2, Pokédex, inventários, ícones, login, notas ou filtros.

## O que esta versão NÃO faz
- Não gira Poképaradas, não altera coordenadas GPS, não aciona teleporte/PGSharp, não arremessa Pokébola, não coleta, apaga ou resgata tarefas automaticamente. Não executa ciclo de farm enquanto o usuário dorme.
- GPX não prova tarefa, recompensa, horário de expiração ou número de doces. O limite de 10 pesquisas é o rótulo da conta gratuita na captura, não uma limitação do app ou de todos os arquivos GPX.
- Sem homologação no Samsung Android 17 com uso real. Ferramentas de automação/localização simulada podem violar políticas do jogo e resultar em medidas contra a conta.

## Qualidade e ARK
O PR #535 precisa de QA Node, LT169, LT211, LT62, LT173, PGS QA e Secure R8 de candidato **todos concluídos com sucesso no head final** antes do merge. A publicação usa exclusivamente a chave permanente e o workflow oficial de `release/official-request.json`, após novo PR de versão, com `versionCode` e `label` monotônicos.

Não redistribuir APK DEV/FastDev ou APK de QA. Após publicação, verificar release real, asset assinado, certificado, tamanho, hash, GitHub Actions e atualizar `AGENTS.md`, `docs/GUIA_MESTRE.md` e ARK.

**Status na criação deste documento:** candidato em revisão. Nenhum APK novo publicado até prova contrária pela API do GitHub.
