# LT346 ARK — PGS recortador de sprites por ícones — 14/11/2026

Base: versão oficial LT345 (0.03.43 / 54550), commit 67d07eb2832a72565eb944aa721a432cb0acb9ba.

## Implementado e integrado oficialmente
- Substituição dos presets 24/32/44 e títulos/faixas cinzas por três ícones originais de formato: quadrado, vertical e livre.
- Barra vertical branca nativa à esquerda, com alça móvel e intervalo contínuo 16–92 px de referência; sem painel cinza.
- Botões flutuantes Confirmar/Cancelar em WebP original branco, mini-prévia, e dicas por Toast apenas na primeira utilização.
- Reuso da mini-lupa que aparece longe do dedo, da alça de recorte, da captura por Acessibilidade e da gravação somente após confirmação.
- Fundo plano reversível opcional, sem sobrescrever dados/sprites anteriores. Ícones Background On/Off originais dos anexos incorporados como PNG/WebP sem transcodificar.
- Os WebPs de movimento e repouso foram preservados como referências de arte; o controle desenha apenas trilho e círculo, evitando importar a área cinza opaca dessas referências.
- HORIZONTAL permanece no enum internamente para compatibilidade; o novo seletor oferece VERTICAL.

## Testes e impedimentos
- Novo teste estático LT346; os sete gates de implementação (Node QA, LT169, LT211, LT62, OTA LT173, PGS QA e beta Secure/R8) e os sete aplicáveis da PR de release passaram.
- Captura real, ajuste, contraste claro/escuro, mini-lupa, rotação, popup, salvar/cancelar e atualização no Samsung: BLOQUEADOS, até evidência física.
- OAuth Google/Discord, teleporte, Shiny, mapa carregado e Encontro: não homologados. Issues #350 e #370 permanecem.
- Os arquivos Icone_Background_On.png e Icone_Background_Off.webp foram recuperados dos anexos enviados e colocados na pasta de ícones do Drive; o APK usa seus bytes originais.
- **PUBLICAÇÃO CONFIRMADA:** [0.03.44 / 54551](https://github.com/LucianoToscano/PokeSearch/releases/tag/v0.03.44-54551), APK `PokeSearch-v0.03.44-LT.apk` 60.914.376 bytes, SHA-256 `07b5bd7f10e7d2a1c6c0b82d23bf837306d3b58d092f801494a4897eb569f7cb`, workflow [#43646502533](https://github.com/LucianoToscano/PokeSearch/actions/runs/43646502533) SUCCESS, PR #373 squash `d1e5dfae2fc84cae427ff970dc4b78d49795b5f5` e PR #374 squash `8952d6b016dd1cc92924c9713d583a7567c1b5e4`. Ainda não há teste físico do Samsung, nem instalação remota declarada.
