# PokeSearch LT275 — corrigir colisão ícone de evolução x bandeira (06/11/2026)

## Evidência real Samsung
Fotografia enviada pelo usuário após instalar a LT274: Wooloo com ícone de evolução branco/verde visualmente **em cima da bandeira GL preta/amarela e UL roxa**; o mesmo padrão no cartão de Raides. O erro persistia porque a LT274 restaurou o tamanho do marcador, mas também restaurou seu deslocamento de 5px para dentro do botão, **levando-o ao encontro da bandeira triangular**. O teste LT274 verificava apenas tamanho/margem e explicitamente tolerava a sobreposição das caixas.

## Correção alvo
- **Sem crescer cartões**: linha de 47px, cinco cartões de 45px; mesma largura, mesma ordem, mesmo rank acima.
- **Sem remover/diminuir bandeiras**: mantém 23px e alinhamento horizontal central. Move apenas sua imagem 4px acima, preservando o espaço na ponta inferior direita.
- **Marcador original sem redesenhar**: PNG LT272 15px (13px em viewport <=345px), ancorado a 2px/1px do canto em tamanhos amplos e 1px/1px nos estreitos. Transparência da arte e borda do botão proporcionam afastamento visual; não deixar o ícone projetar-se para fora.
- **QA visual anticollision**: screenshots P/M/G agora rejeitam a antiga margem 5px, exigem canto livre e estimam a folga do marcador à lateral inclinada direita da bandeira triangular. Não voltar a simplesmente desativar o teste de colisão.
- **Preservação**: todas as cinco avaliações, ataques específicos de liga, som, filtros, pokébolas independentes, OTA, login e dimensões de card sem alteração.

## Critérios e pendências
- Rodar testes Node, Android Java, PvE, OTA e screenshots reais do HTML empacotado em tamanhos P/M/G.
- Testar painel real no Samsung P1 e P2 após instalação. CI Chrome não prova a mesma renderização física.
- Publicar release apenas após CI de PR aprovada, merge e workflow oficial permanente; o maior código estável anterior é LT274 `0.02.74/54478`.

## Publicação final confirmada
- PR #268 mesclada; fonte incorporada à main em `20ca811f2b2f54fae3dd61298648259862296f43`.
- Workflow oficial #42305617402 concluiu `success`; assinatura permanente e hash validados.
- Release pública estável [v0.02.75-54479](https://github.com/LucianoToscano/PokeSearch/releases/tag/v0.02.75-54479) publicada em 06/11/2026 às 22:36:15 UTC.
- APK `PokeSearch-v0.02.75-LT.apk` 33.612.890 bytes, SHA-256 `b63cefa27d84bd74bc5747935f40e3f5732b084609ada31fb9d858dfb054b881`.
- A publicação não comprova instalação no Samsung; solicitar foto real após atualização se necessário para homologação.
