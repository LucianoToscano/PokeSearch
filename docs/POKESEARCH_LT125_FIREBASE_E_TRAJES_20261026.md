# LT125 — Investigação da regressão Firebase e restauração de sprites de trajes

Data 26/10/2026, base do código `main 65c9b4219744bad180e435faa23739e08e7d183f`.

## Por que os contadores mostraram traços
- `FirebaseStats` da versão anterior LT87 mostrava contagem de filhos em `stats/online` e `stats/installations`, confirmando funcionamento sem Functions no dispositivo do usuário.
- LT117 migrou a leitura para `stats/public/onlineCount` e `installCount` sem comprovação de implantação de trigger/reconciliação. Ausência de contagem pública vira `—`.
- Fix: leitura compatível dos dois caminhos legados, somente se regras já permitirem. Agregado servidor sempre tem prioridade; leitura privada negada simplesmente não funciona e o app conserva traço. Não abrir acesso global a IDs; o pacote RTDB versionado atual continua sem read permission para outros UIDs. A compatibilidade antiga é temporária, até confirmar deploy e preencher agregados.

## Funcionalidade de servidor
- Nome exato projeto: `pokesearch-lt`; RTDB `https://pokesearch-lt-default-rtdb.firebaseio.com/`.
- `functions/index.js` usa explicitamente esse URL, nunca banco de projeto default por engano.
- Functions existentes `onInstallationAdded/Removed`, `onPresenceAdded/Removed`, `reconcileCounters` têm ledger e recuperação periódica.
- Novo script privado `functions/scripts/reconcile-once.js` consulta contagens reais, publica em `stats/public`, lê de volta e verifica, sem inventar dados. Config de deploy separada `firebase.json`, `.firebaserc` e workflow `lt125-firebase-live-deploy.yml` com autenticação através de secret GitHub. Cloud deployment só está concluído se esse workflow de produção finalizar com sucesso, e teste com dois celulares/usuários mostrar os totais reais. Se Firebase Spark não permitir Functions, a conta precisará do nível exigido pelo Firebase. Verificar IAM e credenciais. Nenhuma chave de servidor adicionada ao repo.

## Trajes
Fonte: árvore do GitHub PokeMiners/pogo_assets no commit `c2a686eb08ace6e890d8fe3d2134c76988db87b5`, `Images/Pokemon - 256x256/Addressable Assets/`.
- 4/5/6 `GOGGLES_2026`, normal e shiny (6).
- 3/6/9 `COPY_2019` normal (3) e Venusaur fêmea (1).
- Total 10 arquivos próprios, PNG validado e SHA-1 de blob Git conferido na construção. Manifesto contém SHA-256 de cada um.
- Resolver `sprite_offline.js` usa correspondência estrita entre Dex e traje, não cai na forma normal. Para `COPY_2019` Shiny sem arte confirmada, mostra ausência de arte exata, não um clone inventado.
- Pesquisa do seletor e resultados compartilham resolvedor; fontes cache/Android local, sem servidor adicional.

## Provas esperadas para fechamento
- `lt125-go-costume-counter-compat.test.js` passa junto à suíte existente.
- `build_sprite_bundle.py` produz dez PNGs íntegros e manifesto; artefato APK do CI contém esses arquivos em assets.
- APK protegido com mesmo certificado e applicationId `com.lucianotoscano.pokesearch`.
- Firebase real: evidência explícita de deploy, leitura pública autenticada correta e valores vivos, além de testes Samsung. Não marcar tudo como resolvido só por build.


## Auditoria adicional LT116 — 80 formas incorporadas ao builder
- Conferidos **80 arquivos PNG únicos e estruturalmente válidos** no ZIP anexado (40 formas, cada uma com normal/Shiny; sem PNGs vazios ou duplicados).
- Formas cobertas: Alola, Galar, Hisui, Deerling/Sawsbuck Spring; incluem três aves de Galar, Darmanitan Standard/Zen, Yamask, Darumaka, Mr. Mime, Stunfisk. Seleção de sprites é compartilhada entre busca, cards, P1 e P2.
- **Hashes do ZIP de origem:** os 80 IDs de blob Git foram calculados do arquivo anexado e incluídos em `app/scripts/fetch_form_sprites.py`. O builder exige identidade do binário baixado, PNG válido e commit PokeAPI imutável; se divergir, o build falha explicitamente, sem inserir arte errada.
- Não substituir `dock.html`, `detail.html`, `api_result_contract.js`, `api_android_session.js` ou `sprite_offline.js` completos por versões LT116: as versões atuais incorporam regras de autenticação, API/DOM, P1/P2, Chat e trajes LT125. Apenas integrar o comportamento pertinente, preservando os caminhos atuais.
- Histórico RTDB confirmado: o mesmo blob `a9da533b45de15c2fde945bfebe558bc264ea0ed` das tags LT87 e LT111 contava `stats/online` / `stats/installations`. A mudança direta consta do commit LT117 `5c14d3a67d63ceb61b7dad5cdc947763ec0af05b`. Não há evidência de deploy dos agregados; teste em produção segue aberto.
- Reinstalações podem gerar novo UID anônimo e duplicidade histórica de registro de instalação. É necessário validar semântica no backend antes de alegar medição exata de dispositivos únicos. Um build bem-sucedido não certifica números reais.
