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

### LT125 — Evidência do APK QA e auditoria dos bytes (26/10/2026)
- GitHub Actions QA assinado SUCCESS: [workflow #40433868388](https://github.com/LucianoToscano/PokeSearch/actions/runs/40433868388) e [artefato #12703436369](https://github.com/LucianoToscano/PokeSearch/actions/runs/40433868388/artifacts/12703436369). Sucessos dos testes Node/Java, JDK17, Gradle8.11.1, SDK36, R8, Android assinatura v2 e assembleRelease.
- APK: PokeSearch-v0.01.25-LT-Costumes-Firebase-QA.apk; versionName 0.01.25; versionCode 54329; applicationId com.lucianotoscano.pokesearch; SOURCE_COMMIT d5382398b972b29cbe0b45cf446157a9d0317dcf. APK 42.320.719 bytes, SHA-256 71fb69c82d1ee2c4db8a909d695b557a3f6e6fe71ba7aee9edd772d6ee2618df. Certificado v2 SHA-256 34766c15d09013ad65873f9976539c8fa2f826e917dae3af57ea628cad689e8e.
- ZIP do GitHub Actions: 40.115.947 bytes; SHA-256 35c9d6efb07fd70b19fb46c0e6ca803a287f5160e89c8c083d05c01e3831718d; CRC de ZIP íntegro.
- Prova de sprites dentro do APK: 1.025 base, 1.025 shiny, 82 formas (80 do LT116 + 2 LT119), 10 trajes. Todos os 2.142 hashes SHA-256 do manifesto conferidos com bytes dentro do APK; zero ausências/erros. Os 80 PNGs LT116 são idênticos byte a byte ao ZIP original do usuário. Não equivale a cobertura de todas as formas e trajes Pokémon GO.
- NO-GO produção: ausência de teste autenticado nos dados reais Firebase (1/2 usuários, instalações sem duplicidade e onDisconnect), ausência de prova de deploy real, chat entre dois usuários distintos e testes Samsung pendentes. Manter PR #80 Draft e main LT124 preservada; não promover QA a release estável.
