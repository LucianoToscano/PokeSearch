# PokeSearch — LT373 | Tutorial interativo sobre os overlays reais
**Data:** 16/11/2026, America/Fortaleza. **Estado:** branch QA, não publicado. Base pública LT371 0.03.67 / versionCode 54574. LT372 segue PR draft #452; esta implementação foi feita separadamente sobre a main oficial para não incorporar código ainda não homologado.

## Objetivo aprovado na conversa
Na primeira abertura real de Pokébola 1, Pokébola 2, Doce Raro ou Busca Pokémon, escurecer a tela com uma janela visual **não clicável**, deixar claro somente o **controle já existente**, apontar para ele com linha pontilhada, anel de brilho e dedo animado. Mudar o texto apenas após a pessoa fazer o toque/long press VERDADEIRO. A animação nunca toca sozinha. A arte é desenhada em Canvas com fundo transparente, não recria o ícone nem substitui a imagem do app.

## Fluxos efetivamente codificados
| Alvo | Primeiro gesto | Segundo gesto | Terceiro gesto | Quarto gesto | Complemento |
|---|---|---|---|---|---|
| P1 | Toque para abrir/retrair conforme estado real inicial | Toque novamente e observe estado oposto | Segure a Pokébola por 600ms para abrir menu | Toque para fechar menu | Segure para reabrir; segure ↻ real para abrir intervalos; instrução para escolher intervalo sem alterá-lo automaticamente |
| P2 | Igual a P1, preferências independentes | Igual | Igual | Igual | Botão ↻ próprio da P2 |
| Doce Raro | Toque para exibir/retrair resultados segundo estado real | Toque novamente | Segure 600ms para abrir opções | Toque para fechar opções | Gestos nativos preservados; correção: toque curto com menu aberto fecha menu primeiro |
| Busca Pokémon | Segure o ícone para abrir o menu real | Toque para recolher o nível aberto | — | — | O toque curto pode ativar uma busca; tutorial não força o usuário a iniciá-la |

No botão ↻, a origem do gesto continua no `dock.html`: `bindRefreshGesture` com 600ms; a UI envia a bounding box real de `button[data-key=period]` para o overlay via a ponte local. Na confirmação de LONG PRESS já realizada, o tutorial termina mostrando a dica de escolha do intervalo, sem escolher valor e sem alterar filtros/refresh.

## Implementação
- `OverlayGestureTour.java`: um motor reutilizável, steps por tipo, resumo visual em português, spotlight vazado com EVEN_ODD, pulse ring, dedo vetorial, curva pontilhada, animação de pressionar com progresso, e chip `Pular`. Só uma instância visível por vez, alpha de janela 0,72 abaixo do limite de obscuração Android 12; `FLAG_NOT_TOUCHABLE` na camada de desenho e chip de pular isolado. Redução de animação respeita `ValueAnimator.areAnimatorsEnabled`.
- Alvos rastreados via `getLocationOnScreen` de `grip`/janela nativa; durante arrasto o motor redesenha e segue o alvo. O botão ↻ é lido do DOM local do menu; nunca usa sprite/fake hitbox.
- Eventos conectados diretamente a `OverlayService`, `RareCandyOverlayService` e `PgsAutoClickService`. Nenhum `dispatchGesture`, clique automatizado, API privada, localização falsa ou permissão nova.
- Conclusão salva em `gestureCoachV2Completed` no arquivo privado de preferências de cada overlay (`prefs`, `prefs_secondary`, `rare_candy_overlay`, `pgs_auto_settings_v1`).
- Botão `👆 Rever tutorial interativo dos overlays` em Home > Preferências limpa apenas as quatro chaves de conclusão e reabre o tutorial nos serviços já ativos. Ícones reabertos posteriormente repetem após reinício.
- `app/tests/lt373-overlay-gesture-coachmark.test.js` e `pgs-buscas-auto-qa.yml`: contrato de geometria, flags, gestos reais e integração. Gradle/Android e JS são gates da PR.

## Matriz de teste — registrar sem inferir
| Caso | Cenário | Estado |
|---|---|---|
| T01 | P1 tap/expandir/retrair/600ms/menu/↻ | CI pendente e Android físico BLOQUEADO |
| T02 | P2 independente em posição diferente da P1 | Android físico BLOQUEADO |
| T03 | Doce Raro toque curto com menu aberto fecha somente menu | CI pendente e Android físico BLOQUEADO |
| T04 | Busca Pokémon: long press abre sem iniciar busca | Android físico BLOQUEADO |
| T05 | Spotlight não bloqueia toque no app sob overlay Android 11/13/14 | Android físico BLOQUEADO |
| T06 | Dedo, setas e anéis sem corte em P/M/G, rotação, densidades | Android físico BLOQUEADO |
| T07 | Botão ↻ que usuário moveu/reordenou/ocultou e modo vertical | Android físico BLOQUEADO; não alegar homologia |
| T08 | Pular, replay, persistência por perfil, reinício e onDestroy | CI pendente; Android físico BLOQUEADO |
| T09 | TalkBack com texto acessível e animação reduzida | Android físico BLOQUEADO |
| T10 | APK QA compilado + teste Java/Node completo | GitHub Actions pendente |
| T11 | Signer permanente R8, 7/7 gates no mesmo SHA, APK oficial | Não autorizado antes de homologação física |

## Regras de governança
- Não modificar menus compactos P1/P2, filtros, modelos, sprite scanner, busca inteligente, serviço noturno, contas, OAuth, Doce Raro, OTA ou assinatura.
- Respeitar o limite de obscuração das sobreposições. Acesso físico é obrigatório para confirmar que a janela transparente permite toques nos apps em todas as versões Android.
- Não publicar Release, não avançar versionCode, não mesclar PR antes de gates completos e evidência visual/gestual em aparelho. A LT371 0.03.67/54574 continua oficial.
