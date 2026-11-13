# LT332 — Correção de proporção na renderização do Edu, restauração das oito sequências (13/11/2026)

## Contexto da falha em LT330–331
Capturas do proprietário mostraram que as poses de Pokébola, parado e evento encerrado exibiam cabeça/corpo com proporções distintas. A LT331 limitou a rotação idle somente a caminhada direita/esquerda, ocultando outras seis sequências automáticas. Os 68 PNGs continuavam disponíveis no atlas mas sem a rotação esperada.

## Correções efetivamente implementadas
- Novo `EduSpriteGeometry512.java` recebe a imagem **real do master 512** após decodificação; corrige a cabeça usando o componente conexo de cabelo castanho, separado dos acessórios. Em poses simples, aplica escala X por largura de cabeça e escala Y pela distância topo–pés, para aproximar as âncoras da #42 (cabeça centro X256, topo Y41, pés Y476). Nas caminhadas de lado, largura natural da projeção é tratada separadamente; arrastado preserva deslocamento intencional.
- Poses contextuais com objetos: transforma **somente a máscara da cabeça**, com ajuste conservador horizontal máximo de 1,22x, para evitar reescalar calendários, celulares, bandeiras e ícones. Não afirmar que esses sprites ficam geometricamente idênticos: o limite evita danificar acessórios. Quadros #52–60 do teleporte mantêm alterações de escala/opacidade e frames #65–67 não sofrem detecção de cabelo inadequada. A #42 é devolvida inalterada.
- Quadros com Pokébola aérea mantêm separadamente a faixa do objeto acima de y=105, evitando ampliá-la com o personagem.
- Transformação aplicada **uma só vez**, antes de colocar o Drawable no cache LRU de oito frames, com `filterBitmap=false` e `antiAlias=false` no desenho; fallback 128 e recursos originais intactos.
- Restauração da rotação ociosa original de **oito sequências e 21 frames + #42**: Pokébola, frente, direita, esquerda, jogando, Shiny, Mewtwo normal e Shiny. Tempo de pausa 5800 ms, repouso após interação 6500 ms e estados contextuais preservados.

## Auditoria e limites
- Fontes físicas no Android permanecem 68 imagens RGBA 512px com checksum original de LT330; a correção ocorre no bitmap renderizado, sem recriar/reescrever cada PNG fonte em Git.
- Ensaios de inspeção PNG fornecidos e simulações geométricas de referência indicam que a uniformização por escalas/máscaras melhora cabelo/corpo sem desativar as poses. Porém as imagens de inspeção foram geradas a partir do ZIP fornecido e **não constituem provas pixel a pixel do APK assinado**.
- Não foi realizada validação real em aparelho Samsung nesta sessão. A consistência de expressões, acessório conectado ao gesto e 100% dos 68 quadros continua exigindo inspeção visual; não declarar remasterização artística integral.
- Issue histórica: [#334](https://github.com/LucianoToscano/PokeSearch/issues/334).

## LT332 — Publicação oficial verificada em 13/11/2026

- **Release estável:** `v0.03.31-54537` — https://github.com/LucianoToscano/PokeSearch/releases/tag/v0.03.31-54537
- **APK oficial:** https://github.com/LucianoToscano/PokeSearch/releases/download/v0.03.31-54537/PokeSearch-v0.03.31-LT.apk
- **Versão:** `0.03.31` · versionCode `54537` · label `51335`.
- **Tamanho:** 46.622.244 bytes · **SHA-256:** `b738cf451167c4ad7d92480d95cd8beaa8d2b5aef693251f547bd820c0f17b72`.
- **Workflow protegido:** https://github.com/LucianoToscano/PokeSearch/actions/runs/43394789856 — `completed/success` (preflight, build, verificação de APK/assinador, upload Release e verificação do hash público).
- **Fonte imutável APK:** `fd28861eecc2f2521dfff3b262f39151db3e382a`; PR #339 integrada por squash `b2af147bb9b609e79d13ccb9ec8395a41ab8df31`.
- **Certificado permanente** (validado no workflow, Android v2): SHA-256 `34766c15d09013ad65873f9976539c8fa2f826e917dae3af57ea628cad689e8e`.
- **Limite de QA:** testes automatizados não atestam perfeição visual em um Samsung real; instalação exige confirmação do Android. A normalização ocorre sobre o bitmap em tempo de exibição, **não** altera arquivos PNG originais nem prova todas as 68 artes anatomicamente idênticas. Issue #334 permanece aberta para remasterização pixel a pixel.

## Regras de continuidade histórica
Executar Node, Java Android, APK de teste, verificador do master 512 e regressões dos tempos/índices de animações. Publicar LT332 / `0.03.31` / `54537` somente quando aprovado no workflow protegido, validando APK e SHA no GitHub Releases, sem instalar silenciosamente.
