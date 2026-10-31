# LEIA PRIMEIRO — PokeSearch
Estado confirmado em 31/10/2026: versão pública LT206 (0.02.06, versionCode 54413). O repositório é LucianoToscano/PokeSearch. Antes de qualquer edição, conferir o GitHub Releases/latest, main e docs/GUIA_MESTRE.md.
Arquivo histórico docs/LEIA_PRIMEIRO_PROMPT_OUTRAS_IAS_LT191.md descreve uma base antiga. LT190/LT191 são históricos. Desde LT191, a proteção Retry-After já admite até 24 horas na API e nas duas Pokébolas. A LT206 corrigiu também o teto visual residual de 3600 segundos e a leitura de data HTTP no Doce Raro.

## Preservar
- Assinatura Android permanente, applicationId e namespace.
- Duas Pokébolas, preferências independentes e máximo 10 resultados.
- WebView com JWT somente do lado do site; login opcional e Shiny temporariamente indisponível.
- Doce Raro separado do cooldown do jogo e limites reais do PoGoCoordinates.

## Fluxo
1. Ler AGENTS.md, docs/GUIA_MESTRE.md, código real e testes antes de modificar.
2. Aplicar mudanças pequenas, documentar arquivos, diffs, testes e riscos.
3. Exigir QA Node, Java/Android, OTA e verificação do mesmo certificado.
4. Publicação e merge exigem autorização explícita; não confundir testes automáticos com Samsung físico.
5. Refatorar dock.html e arquivar workflows antigos por fases, após matriz de dependências, testes e rollback.
6. Não incluir segredos, dados de conta, JWT ou keystore.
