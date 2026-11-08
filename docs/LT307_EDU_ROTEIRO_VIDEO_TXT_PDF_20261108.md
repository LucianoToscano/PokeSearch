# LT307 — Edu: fidelidade ao vídeo + transcrições de “Bug dos Passes”
**Revisão:** 08/11/2026. **Base:** LT306 oficial `0.03.06` / versionCode `54512`.
**Versão candidata:** LT307 `0.03.07` / versionCode `54513` / label `51311`, sujeita aos gates oficiais.

## Fonte primária fornecida pelo proprietário
- Vídeo `videoplayback (1).mp4`.
- TXT `BUG DOS PASSES ATÉ 40 PASSES DE RAIDS GRATUITO NO #pokemongo.txt`.
- PDF de mesmo título, 4 páginas.
- Autor da fala: EduhunterPlay (conforme identificação prévia); apresentação histórica do Mega Chandelure **31/10/2026, 14h–17h, horário local**, com o autor usando **22h da véspera** como exemplo pessoal.
- Não interpretar a quantidade anunciada de passes (“15 a 16”, “39”, “até 40”) como resultado confirmado, compromisso do aplicativo, ou regra de eventos posteriores. Não copiar automaticamente esses horários para outros eventos. O vídeo é um relato comunitário, sujeito aos Termos do jogo e sem verificação independente de eficácia.

## Diferenças corrigidas em relação a LT306

| Etapa | O que a fonte mostra | Comportamento LT307 |
|---|---|---|
| E01 | Véspera: passe laranja não gasto, sem softban, sem ter jogado em país onde já era D | Perguntar cada condição, não presumir; se faltar, permitir ignorar primeira parte e aguardar D |
| E02 | **Primeira** chegada ao Havaí, aguardar carregar mapa/Pokémon (não há exigência de reinício nessa chegada inicial) | Cauda do Edu e botão de copiar coords preservados; confirmar chegada e carregamento, sem mandar reiniciar |
| E03 | Havaí → Nova Zelândia; passe disponível ao entrar na reide | Confirmar chegada, verificar passe manualmente no ginásio; sem passe, oferecer tentativa de reinício na própria NZ |
| E04 | Reide na NZ; autor alerta que derrota pode interromper o método | Confirmar venceu/perdeu/saiu e captura separadamente. Perda/saída informa alegação e oferece caminho seguro para D |
| E05 | Depois de cada reide, voltar ao **Havaí** e **fechar e reabrir** jogo antes de regressar | Perguntar chegada; nova pergunta exige reinício e confirmação do mapa |
| E06 | **Voltar à Nova Zelândia** para outra reide/passe | Confirmar chegada na NZ, passe visto no ginásio. Sem passe, oferecer **uma tentativa** de reinício ali, rechecagem, depois D |
| E07 | Com passe extra, repetir reide na NZ → Havaí → NZ, sem refazer primeira chegada ao Havaí | `repetePara=E04` no JSON (era incorretamente E02), mantendo contagem apenas de ciclos informados |
| E08 | No dia D, somente após evento **começar no local escolhido** | Perguntar “começou?” antes de habilitar a fase final. Se ainda houver passes, jogar normalmente antes de ir a Kiribati |
| E09 | Após esgotar passes e iniciado o evento, o relato inclui **Kiribati**, fechar/reabrir e carregar o mapa **uma vez** | Não chamar “variante opcional” dentro da sequência do autor. Escolha explícita para tentar ou jogar normalmente; registrar que antecipação do passe de amanhã não é garantida |
| E10 | Voltar ao local do evento, conferir passe no ginásio, reides em sequência sem novos reinícios | Confirmar retorno; pedir evidência manual do passe antes de anotar cada reide; se acabar, Kiribati caso não tentado ou resumo |
| E11 | Encerrar e contabilizar resultados reais | Separar passes vistos, ciclos, resultados e capturas; nunca converter alegações em recompensas |

## Regra de UI
- Continuar **um balão por vez**; balão branco independente e sua cauda voltada à sprite, sem painel escuro nem botões presos ao balão (visual LT306).
- Coordenadas Havaí `21.2709423,-157.818172`, Nova Zelândia `-41.282491,174.769132`, Kiribati `1.987149,-157.477137` são copiadas ao tocar, **sem localização automatizada**.
- Menu oculto por pressionar o Edu ~1,2s; preferência G=100 pixels físicos padrão preservada.
- Subperguntas são checkpoint local na sessão real; simulação fictícia não escreve eventos reais.
- Não acusar o usuário de “erro” se passes não surgirem. Proteger leitura visual/MediaProjection e confirmações humanas.

## QA/Release
- Teste `app/tests/lt307-edu-video-original-flow.test.js` fixa a ordem, estados NZ e Kiribati, origem textual, ramo sem passe e ausência de garantias.
- Testes LT304 foram atualizados apenas nas expectativas substituídas por solicitação do proprietário. Executar Node QA, LT169, LT211, LT62 Java e LT173 OTA para commit exato da PR.
- **PENDENTE:** teste físico Samsung sobre Pokémon GO, balão/cauda/drag/size G, fonte ampliada, autorização do Android, múltiplas reides e datas D−1/D, além de OCR PT-BR/EN.
- Fluxo de publicação oficial: PR com QA verde → merge autorizado → pedido `release/official-request.json` em main → workflow `pokesearch-official-release.yml` assinado → conferir latest/asset/hash → registrar evidências, sem afirmar instalação.
