# LT346 ARK — PGS recortador de sprites por ícones — 14/11/2026

Base: versão oficial LT345 (0.03.43 / 54550), commit 67d07eb2832a72565eb944aa721a432cb0acb9ba.

## Implementado na branch candidata
- Substituição dos presets 24/32/44 e títulos/faixas cinzas por três ícones originais de formato: quadrado, vertical e livre.
- Barra vertical branca nativa à esquerda, com alça móvel e intervalo contínuo 16–92 px de referência; sem painel cinza.
- Botões flutuantes Confirmar/Cancelar em WebP original branco, mini-prévia, e dicas por Toast apenas na primeira utilização.
- Reuso da mini-lupa que aparece longe do dedo, da alça de recorte, da captura por Acessibilidade e da gravação somente após confirmação.
- Fundo plano reversível opcional, sem sobrescrever dados/sprites anteriores. On/Off tenta os respectivos nomes de asset, com fallback Android até disponibilização dos originais.
- Os WebPs de movimento e repouso foram preservados como referências de arte; o controle desenha apenas trilho e círculo, evitando importar a área cinza opaca dessas referências.
- HORIZONTAL permanece no enum internamente para compatibilidade; o novo seletor oferece VERTICAL.

## Testes e impedimentos
- Novo teste estático Node LT346; CI Android e regressões completas precisam executar.
- Captura real, ajuste, contraste claro/escuro, mini-lupa, rotação, popup, salvar/cancelar e atualização no Samsung: BLOQUEADOS, até evidência física.
- OAuth Google/Discord, teleporte, Shiny, mapa carregado e Encontro: não homologados. Issues #350 e #370 permanecem.
- Os arquivos Icone_Background_On/Off não foram localizados no Drive pelo nome declarado; o fallback mantém operação funcional, mas não equivale ao ícone fornecido.
- Nenhum APK LT346 deve ser considerado oficial sem merge, workflow de publicação protegido, assinatura e hash comprovados.
