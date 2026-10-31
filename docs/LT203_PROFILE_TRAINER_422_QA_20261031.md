# LT203 — Diagnóstico 422 e recuperação de treinadores (31/10/2026)

## Evidência e escopo

- Telas da LT202 mostram Conta 1 e Conta 2 conectadas ao PoGoCoordinates, mas "Treinador não confirmado" e erro **`API 422: requisição rejeitada`** na busca.
- Esse 422 foi observado no fluxo `POST /search`; não comprova que `/trainer/lookup` ou `/trainer/confirm` foi chamado. A distinção da rota deve ser registrada.
- Informação adicional fornecida pelo usuário: o botão de remover treinador pode desaparecer no site sem implicar remoção do vínculo no servidor. A ausência de opção de desvinculação não autoriza apagar registros nem fazer chamadas destrutivas.
- `Authorization: Bearer …` e `trainer_code` são elementos esperados do fluxo de vinculação, mas **o PokeSearch não confirma, desvincula ou altera treinador automaticamente**. Look up e confirmação continuam no site oficial, mediante decisão explícita do titular.

## Correções

1. O transporte tem classificação de erro para apenas três destinos abstratos: `search`, `account`, `reveal`; nunca repassa URL de `reveal`, query string, valor de JWT, corpo de requisição ou mensagens do servidor.
2. Ao receber HTTP 400/422, lê até 4096 bytes de erros estruturados e extrai somente nomes de campos permitidos em `detail[].loc` / `detail.errors` / `errors`. Suporta **`body.trainer_code`** e **`header.authorization`**, com indicação segura de parte (`body`/`header`), status e contagem. Dados privados jamais aparecem em logs.
3. O cliente mantém a validação e limites originais: nenhuma tentativa de corrigir `422` removendo filtros ou omitindo parâmetros de forma especulativa. O `POST /search` não adquire acesso VIP nem ignora HTTP 429.
4. Perfil da conta: quando `/profile` do React não fornece prova do vínculo, usa exclusivamente **GET** autenticados `/users/me` e, se necessário, `/trainer` como recuperação. Cada requisição é feita na WebView isolada da respectiva conta (P1/P2), sem extrair tokens para o Android.
5. Somente um treinador explicitamente `active:true`, com nome/código/equipe/nível válidos, pode ser marcado como vinculado. Se não houver dados suficientes, o estado é **desconhecido**, não "removido". A ausência do botão "Remover" ou uma lista vazia **não** é declaração de desvinculação.
6. O texto "Link my account" pode aparecer em perfis VIP com treinador existente. A detecção visual de zero contas exige contagem oficial `0/N` e não usa a presença desse botão como evidência.
7. A conta 2 continua em WebView Profile persistente e separado via AndroidX `MULTI_PROFILE`. Isso evita misturar cookies/LocalStorage das contas 1 e 2. A escolha "Sem treinador" continua desligando Shiny voluntariamente por Pokébola; vincular conta não ativa Shiny sozinho.

## QA obrigatória

- `node app/tests/lt203-trainer-api-422-regression.test.js`, testes antigos de transporte 400/422, perfil e toda regressão Node; compilar Android R8 e verificar assinatura original antes de instalar.
- Simular `users/me` com treinador ativo válido, `users/me` sem schema e `trainer` com vínculo válido; dois arrays vazios, vínculo `active:false`, token ausente, HTTP 401, header `authorization` rejeitado e campo `radius_km` inválido.
- No Samsung com Conta 1 e Conta 2 realmente autorizadas, testar **Gerenciar**, confirmar vínculo no site e atualizar estados P1/P2. Um HTTP 422 deve indicar método/rota **conhecida**, status e **campo do erro, quando fornecido**; sem valores privados.
- Confirmar no Android: nenhum envio de `/trainer/confirm` ou endpoint de desvinculação feito automaticamente; sem apagamento por ausência de botão na interface.

## Limitação

A estrutura atual da resposta autenticada `/trainer` não foi obtida em uma sessão real durante esta correção. O parser aceita somente estruturas estritas e explicitas; se o fornecedor usar outro formato, mantém "desconhecido" em vez de inventar um vínculo. A eficácia no Samsung ainda depende de teste real com conta e treinador vinculados. Não compartilhar capturas que exponham código do treinador, e-mail, cookies ou JWT.
