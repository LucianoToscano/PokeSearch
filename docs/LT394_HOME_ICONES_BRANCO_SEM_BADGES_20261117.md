# PokeSearch LT394 — Correções visuais da Home 0.03.78 LT

Data: 17/11/2026. Origem oficial: v0.03.78 LT (versionCode 54585).

## Requisitos confirmados pelo proprietário

1. Pokébolas na Home **sem 100%, 0%, IV, ranking, porcentagens ou badges sobre a imagem**. Ícone apenas; o texto "Pokébola 1" / "Pokébola 2" identifica o módulo, não a busca.
2. **Desligadas = Pokébola branca original, sem seleção**, mesmo que o filtro salvo continue 100%. Ligadas = espelhamento **somente da arte** associada à busca flutuante; P1 e P2 independentes.
3. Rocket deve acompanhar padrão branco/minimalista dos outros símbolos.
4. Quests não pode perder a borda/parte inferior.
5. Comunidade não pode perder o canto: **não trocar a arte enviada**.
6. Pokédex **não pode receber outro desenho**: apenas ampliar o WebP original enviado para ficar proporcional à grade.
7. Preservar 16 módulos, Home 4×4, fundo, ações, contas, atualização, dados e assinatura.

## Correções de código

- `MainActivity.refreshHomePokeballImage`: usa estado real do serviço no cache visual (`on:` / `off:`), não só o filtro. Desligado mostra `HomeUserIconAtlas.icon(...0/1)` com imagem branca sem seleção. Ligado mantém `HomeFloatingModeIcon.icon` e as configurações existentes. Nenhum badge ou valor é adicionado à Home.
- `MainActivity.addHomeGridCell`: remove sobreposição `homeModeBadges`, mantém somente `ImageView` e título do módulo.
- `HomeUserIconAtlas`: habilita células 0, 1 e 7 para as imagens branca/off das Pokébolas e Rocket branco, mantendo a mesma ordem dos 16 módulos.
- `app/src/main/assets/home-user-icons-atlas.png`: montado com as artes originais já enviadas; Quests e Comunidade são **as mesmas imagens** com margem de segurança, Pokédex é **o mesmo WebP original** ampliado após retirar margem transparente. Rocket usa símbolo de escudo/R branco, sem trocar a função. Nada de cores/artefatos novos em Pokédex ou Comunidade.

SHA-256 do atlas LT394: `cd26911b8a11143ebccde08e922e892bec33373513f56a264a45d8df5b1c874f`.

## Qualidade / pendências

Contrato Node `app/tests/lt394-home-icon-corrections.test.js`; demais contratos antigos e CI Android devem passar antes do merge. Testes em dispositivo real Samsung Android 17, uso simultâneo P1/P2, estados reais, modo escuro/claro e legibilidade ainda dependem de homologação física, não podem ser afirmados por teste de código. Nenhuma publicação antecipada.

## Publicação

Criar nova `versionCode` estritamente superior a 54585 e usar **somente** o workflow oficial protegido com assinatura permanente e SHA-256 público. Manter a v0.03.78 disponível. Instalação sobre a versão anterior sem desinstalação, mediante consentimento do Android.
