# LT274 — Restauro das proporções dos ícones de evolução (06/11/2026)

## Feedback de aceitação
As duas imagens enviadas mostram regressão LT273: a caixa do ranking ficou maior enquanto o ícone branco/verde encolheu. A referência aceita é a **primeira imagem**, com cartões compactos e o marcador original legível no canto inferior direito.

## Diagnóstico reproduzido no código
- LT271: linha dos cinco ícones 47px; cada cartão 45px; bandeira central 23px.
- LT272: marcador PNG `ui-icons/ps-evolution-lt272.png`, 15x15px (13x13px em largura estreita), offset 5px inferior/direita.
- LT273: regras tardias passaram cartão para 54px/linha para 56px, e reduziram indevidamente marcador para 11px (9px em largura estreita), offsets 4/3px.

## Correção LT274
- Removidas **somente** as regras conflitantes de LT273 sobre tamanho/posição dos cartões e do indicador de evolução em `app/src/main/assets/detail.html`.
- Reutilizadas as regras LT271/LT272 originais: cartões 45px, linha 47px, marcador 15px ou 13px com margem de 5px.
- Bandeiras 23px, números #, ordem Raides / GL / UL / ML / Rank Geral, atalhos, duas Pokébolas e painéis de golpes inalterados.
- Atualização do teste `lt253-visual-screenshots.cjs`: a verificação anterior exigia `span <= 12px`, contradizendo o tamanho LT272. Novo contrato exige 13 a 15px, insets >=4px, alinhamento do rank e bandeira centrada. O bounding-box do PNG triangular pode se cruzar com a área **transparente** do indicador; a verificação mantém inspeção visual por screenshot.
- Teste de regressão `lt274-evolution-rail-layout.test.js` adicionado ao conjunto de Node automático.
- Notas de atualização embutidas sob `versionCode 54478`.

## Segurança e homologação
- Não alterar versões nem publicar APK antes de CI de PR aprovado; o arquivo `release/official-request.json` deve ser alterado **somente na main** após o merge, com último release conferido.
- Validar P/M/G e Samsung físico; CI/Chromium não é prova de instalação no telefone.
- Evitar expansão do botão, redução das bandeiras ou transformação do marcador num emblema ilegível.

## QA e publicação
- PR #265: https://github.com/LucianoToscano/PokeSearch/pull/265
- Fonte da LT273 para rollback: v0.02.73-54477.
- CI: registrar resultado do commit exato antes de merge. Publicação não declarada neste documento.
