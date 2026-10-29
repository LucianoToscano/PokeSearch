# LT129 — Compartilhamento voluntário de capturas e reações no Chat PokeSearch

Data: 27/10/2026. Branch: `feature/lt129-capture-share-chat-reactions-20261027`. Base: LT128 PR #87; **nenhum merge na main, deploy Firebase ou Release oficial**.

## Experiência in-game sem interrupções

- Copiar coordenadas pelo Get coords (via API ou DOM) e pelo botão Copiar mantém o comportamento original. Nenhum alerta automático, diálogo, notificação, som ou janela extra aparece sobre Pokémon GO.
- **Somente enquanto o cartão de detalhes estiver aberto**, após uma **cópia bem-sucedida**, um botão discreto `🎉 Capturou? Compartilhar no chat` aparece dentro do cartão. Se o jogador não tocar, não ocorre nada. Se fechar a janela, a opção desaparece.
- O primeiro toque abre somente uma **confirmação inline no próprio cartão**: `Capturou mesmo? [Não] [✓ Sim, compartilhar]`, sem modal nativo nem mudança automática para Home. Só o segundo toque, de confirmação expressa, envia ao Chat PokeSearch.
- A mensagem possui `authorUid`, `nickname`, `text` e `createdAt=ServerValue.TIMESTAMP`, respeitando o schema original. Exemplo: `🎉 Capturou um Noibat ✨!`. O Shiny aparece **apenas se o próprio resultado marcou shiny**. O aplicativo NÃO sabe se houve captura real: trata-se de declaração voluntária do treinador.
- **Nunca envia coordenadas, lat/lng, localização, IV, PC, revelação, JWT ou IP**. Nenhuma postagem no Get coords/cópia simples; mensagem só após a confirmação no cartão.
- A implementação compartilhada é em `OverlayService`, herdada por `SecondaryOverlayService` (P1/P2). Guarda `requestGeneration`, índice original `sourceIndex`, identidade do card e deduplicação de envio bem-sucedido por encontro enquanto serviço ativo. Uma nova busca ou fechamento invalida a oferta.
- Se a pessoa copiar por toque longo sem abrir o detalhe, **não há nova UI bloqueando o jogo**. O compartilhamento ficará disponível apenas ao abrir o card e copiar com ele visível. P1/P2 mantêm modos, notificações e buscas separados.

## Reações compactas entre treinadores

- Três opções discretas em cada mensagem: **❤️, 👍, 🎉**. Mostrar contagem real junto ao emoji e realce discreto da reação própria.
- Firebase RTDB `chat/reactions/$messageId/$uid = "❤️" | "👍" | "🎉"`; a conta autentica e só grava/exclui seu próprio nó; uma reação ativa por pessoa por mensagem. Tocar de novo desfaz; tocar outra substitui.
- A leitura é restrita a usuários autenticados e as gravações exigem que `chat/messages/$messageId` exista. Sem nova coleta de dados pessoais e sem Firebase Storage.
- O listener de reações atualiza bolhas em tempo real **sem rolar automaticamente o histórico**; não dispara sons, alertas, notificações ou alteração nos filtros do jogo. Uma falha de permissão de `chat/reactions` não interrompe leitura/envio normal do chat.

## Regras reais Firebase — atenção ao banco de produção

- Branch e modelos versionados têm o novo bloco `chat/reactions`. **Essas regras NÃO foram implantadas** no Firebase real nesta etapa; o usuário deve mesclar apenas `chat.reactions` dentro das regras atuais, que já liberam `stats/online` e `stats/installations`.
- Versão de regras recomendada para acréscimo de nó **dentro de `chat`**, mantendo `chat/messages`, `chat/avatars` e todo `stats` intactos:

```json
"reactions": {
  ".read": "auth != null",
  "$messageId": {
    "$uid": {
      ".write": "auth != null && auth.uid === $uid && root.child('chat/messages').child($messageId).exists()",
      ".validate": "newData.isString() && (newData.val() === '❤️' || newData.val() === '👍' || newData.val() === '🎉')"
    }
  }
}
```

- Não usar a antiga arquitetura Mural/Orkut. Não instalar Firebase Admin SDK nem usar chaves de serviço. A autenticação Google administrativa continua LT128 e não é necessária para reações.

## Testes e implantação

- Testes Node: `app/tests/lt129-capture-share-reactions.test.js` verificam a confirmação dupla, nenhuma publicação automática, privacidade das coordenadas, P1/P2, RTDB owner-only e leitura de contadores.
- Android: compilar APK R8 assinado permanentemente, SHA-256/certificado Android v2, arquivo ZIP inferior a 199 MB, versão QA `0.01.29` / `54334`.
- Samsung ainda necessário: Get coords API e DOM nas duas Pokébolas, cópia rápida, UI inline não bloqueadora, postar um Shiny e um normal de maneira voluntária, reações de duas contas e remover reação, ausência de banners para long press, contadores preservados.
- A edição de mensagens por até 30 min discutida anteriormente não faz parte desta etapa de captura/reação e precisa de regras e UI próprias para impedir adulteração do timestamp.

## Entrega

Seguir `AGENTS.md` e Issue #84: GitHub Actions artifact com APK verdadeiro, bytes/hash/CRC/assinatura e link verificado. Nunca apenas sandbox; nunca declarar build aprovado como teste físico.



## Resultado verificável da QA assinada — 27/10/2026

- [CI Android/Node aprovado — run #40472467296](https://github.com/LucianoToscano/PokeSearch/actions/runs/40472467296).
- [Download principal — Artifact #12718609297](https://github.com/LucianoToscano/PokeSearch/actions/runs/40472467296/artifacts/12718609297), validado como ZIP contendo **APK de verdade**, checksums, certificado, source commit, versão e inventário de sprites (CRC íntegro).
- APK: `PokeSearch-v0.01.29-LT129-Capture-Reactions-QA.apk`; `versionName 0.01.29`; `versionCode 54334`; `applicationId com.lucianotoscano.pokesearch`.
- Tamanho exato APK: **43.375.725 bytes**, SHA-256 `9f0f59009af20330171769524ae368871d7e71e6999265488e301ac52586e838` conferido com `SHA256SUMS.txt`.
- SOURCE_COMMIT embutido: `287714827fd80b16911134e895395ffe6424d706` (os commits seguintes são apenas documentação).
- ZIP GitHub Actions: **40.883.213 bytes** (<199 MB), SHA-256 `6caa397be2d9bd97d7cb20d041b96399af5e6cf929cd8b8076071a670fc4eb0c`, testzip sem corrupção.
- Assinatura Android v2 `true`, certificado permanente SHA-256 `34766c15d09013ad65873f9976539c8fa2f826e917dae3af57ea628cad689e8e`, mesma assinatura da LT128. Android SDK 26–33, compile SDK 36.
- O CI executou a suíte Node e Android/JVM e as auditorias de assets; **não equivale à homologação real com P1/P2 sobre Pokémon GO no Samsung**, nem prova regras RTDB de reações implantadas na produção.
- **Entrega:** o GitHub é o canal prioritário para evitar `Library file not found`; ZIP já verificado. Nada foi implantado no Firebase nem mesclado na main.
