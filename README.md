# PokeSearch — Android Overlay

> **Guia Mestre oficial e permanente:** [docs/GUIA_MESTRE.md](docs/GUIA_MESTRE.md). Documento central de todas as versões, histórico, diário, metas, decisões, bugs e backlogs. O README é uma apresentação resumida; para continuidade do desenvolvimento, consultar o Guia Mestre e o HEAD da branch ativa.

**Versão de desenvolvimento: v0.50-beta (versionCode 50).** Aplicativo Android independente, dedicado exclusivamente à pesquisa e visualização flutuante de Pokémon, para testes privados de desenvolvimento. Package ID: com.lucianotoscano.pokesearch; minSdk 26, compileSdk 36, Java 17, Gradle 8.11.1.

## Interface e funcionamento
- Sobreposição compacta sobre Pokémon GO com engrenagem arrastável. Toque na engrenagem para expandir/recolher somente as opções; sprites permanecem visíveis e deslocam-se para baixo quando as opções estão abertas.
- Seta para cima sob a coluna recolhe TODOS os resultados e opções; engrenagem restaura sprites. X vermelho ao lado do coração encerra o overlay.
- Modos IV100, GL#1, UL#1 e ✨ Shiny opcional, independente da liga. Busca automática OFF, 5, 10, 15 e 20 minutos; mínimo de 60 segundos entre consultas efetivamente submetidas. O site fornece até dez resultados conforme limite.
- Sprites P/M/G próximos, com rolagem; ficha de CP/IV/nível/rank/sexo/tamanho/golpes/local/despawn e coordenadas quando disponíveis.
- Menu de configuração em janela separada, com largura responsiva e 12 ícones compactos lado a lado em uma linha (altura base 34dp), expandida somente quando necessário. O resto da tela do jogo continua recebendo toques fora da coluna de Pokémon e da barra.
- Favoritos (até 50) no próprio overlay, com busca e Concluir dentro de um único quadro cinza translúcido, blur condicional ao suporte do Android. Alertas gerais/de favoritos, relatório ⚠ TXT/WhatsApp, Pix voluntário.
- Login via site oficial PoGoCoordinates só quando necessário para ✨. Ao concluir, o usuário permanece na Home do PokeSearch, e a sessão é atualizada. O app não solicita senha ou código de amizade em campo próprio.
- Guia rápido ilustrado com os mesmos ícones do overlay no primeiro uso e disponível na Home.

## Verificações e distribuição
O GitHub Actions em [build-overlay.yml](.github/workflows/build-overlay.yml) executa testes de sintaxe e contratos JavaScript, lint, Gradle assembleDebug, teste de unidade, validação ZIP, versão e assinatura APK v2, gerando APK, ZIP do código-fonte, checksum SHA256SUMS e docs.

**Importante:** a assinatura de debug do CI não é chave persistente de distribuição e pode mudar, impedindo instalação sobre builds anteriores. Este é um APK **beta de teste**; não alegar funcionamento real no aparelho sem testar. Para distribuição estável, usar keystore privada persistente, backups seguros e confirmação do proprietário. Atualizações do site podem mudar o DOM e causar falhas de busca. Respeitar os termos e a autorização aplicável ao PoGoCoordinates; não tentar contornar limites. Não registrar códigos de amizade, cookies ou credenciais nos relatórios.

## Arquivos mestres
- [Arquivo mestre v0.50](docs/ARQUIVO_MESTRE_v0.50.md) — única referência prioritária para retomar o projeto em outro chat.
- [Auditoria v0.50](docs/AUDITORIA_v0.50.md) — bugs, correções, matriz de testes e riscos.
- Histórico v0.38–v0.40 preservado em docs; mestre mais antigo v0.36 no Google Drive.
- [Catálogo de bugs e melhorias](https://docs.google.com/spreadsheets/d/1aam5N7DNnzMqJj5giZTdsAmzWkHTWPj-uKcUUVwreiI/edit).

## Próximos passos
Testar no Android a nova interação da engrenagem, recolhimento da coluna, pass-through de toques, seletor de favoritos, login Google/Discord, consultas IV100/GL/UL/✨ e tutorial. A cor translúcida permanece caso o dispositivo não suporte blur. Use ⚠ para exportar diagnóstico TXT sem compartilhar credenciais.

Projeto não afiliado à Niantic, Nintendo ou The Pokémon Company.

## Localização opcional — v0.42
Um **único ícone 📍** na barra de opções abre ou oculta o editor de localização. Dentro do editor, ao lado do campo de latitude/longitude, a chave ON/OFF ativa ou desativa o filtro; um slider permite raio entre **0 e 1.000 km**. Ocultar o painel não altera o estado do filtro. OFF remove coordenadas e raio aplicados pelo app e mantém o modo IV100/GL#1/UL#1 e Shiny que estavam selecionados. Antes de enviar a busca, o aplicativo confere os valores no formulário oficial. A proteção entre consultas permanece em vigor.

## v0.43-beta — indicador permanente do raio + revisão da barra
- Com o filtro 📍 **ON**, o botão de localização exibe o raio em km dentro do mesmo ícone e o dock mostra uma pequena etiqueta `📍 50 km`, inclusive quando as opções estão recolhidas, sem adicionar outro botão. Quando 📍 está OFF, a etiqueta desaparece.
- Corrigida a grade do menu: 12 botões em 12 colunas, com X vermelho na mesma linha e ao lado do coração Pix, sem que o X seja empurrado para uma segunda linha.
- Ao trocar de localização para filtros ou AUTO, o painel de coordenadas libera o foco do teclado e volta ao tamanho normal. Ocultar o editor mantém o filtro ON; desligar limpa os valores do site conforme verificação.
- Nenhum código de treinador, token de autenticação ou coordenadas completas é acrescentado à etiqueta. O app preserva limites mínimos de pesquisa.

## v0.44-beta — correções de usabilidade
Barra responsiva com posicionamento vertical quando não couber ao lado da engrenagem, sequência consistente dos 12 controles, seta contrastante, favoritos mais translúcidos, feedback de AUTO/atualização manual e validação mais rígida das coordenadas. Revisão em código e testes automatizados não substitui comprovação no celular.

## v0.45-beta — AUTO e Shiny
Vencimentos limpam a lista sem iniciar consultas extras; login cancela buscas antigas; falha de Shiny diferencia vínculo pendente de estado não comprovado. Diagnóstico captura apenas status categórico de sessão. Comprovação de uso físico ainda pendente.

## v0.46-beta — Menu e autenticação
Abertura dos popovers IV100/GL/UL, AUTO e localização sem clipping, inversão direita/esquerda da barra e sincronização dos dois WebViews, área de toque ampliada, chevron visível, favoritos translúcidos, login/logout na Home com retorno após autenticação detectada. OAuth externo e interação Android ainda dependem de validação física.

## v0.47-beta — auditoria e projeto editável
O settings.gradle.kts já existia na v0.46; importar a pasta raiz no Android Studio. A entrega contém Gradle Wrapper 8.11.1 e PNG do ícone gerados no CI, scripts, testes e documentação. Gerador do ícone executa sem X11 e é testado quanto à consistência. Erros de WebView e parsing registram classe de exceção, nunca URL, credenciais ou mensagem bruta.

Mantido targetSdk=33 neste beta: foregroundServiceType=specialUse não foi habilitado sem avaliação de permissões/políticas Android 14+. Migração planejada em etapa separada. Teste Samsung, OAuth e Shiny real ainda pendentes.

## v0.48-beta — Notificações, diagnóstico privado e testes Samsung
Ícone de notificação monocromático em `app/src/main/res/drawable/ic_notification.xml` aplicado ao serviço e aos alertas. Relatórios usam um sanitizador puro Java com testes próprios, preservam delimitadores de linha reais e exibem aviso para revisão antes do envio. Tratamento de exceção no fechamento de janelas e envio de notificações registra apenas classe/etapa. Consulte `docs/GUIA_TESTE_SAMSUNG_v0.48.md`. O alvo Android permanece targetSdk 33 deliberadamente. O ZIP-fonte contém projeto editável, scripts, testes e Gradle Wrapper.

## v0.49-beta — B06 e ciclo de vida
Runnables de login, página e recarga têm nome, cancelamento e guarda por requestGeneration. LOGIN_BEGIN cancela atualização automática, expirados e busca enfileirada; LOGIN_END reinicia em segurança; REFRESH_LOGIN aguarda 350 ms após sincronizar cookies. onDestroy cancela todos os timers, remove três janelas antes de destruir WebViews e as interfaces JS. Catches adicionais de média importância registram só etapa/classe. Manifest, targetSdk33, compileSdk36, ícones, UI e o aplicativo independente permanecem preservados. Teste Samsung/OAuth real ainda pendente.

## v0.49 — ajustes PS-075–PS-080
Botões "🔔 Testar notificação" nos Favoritos e nas Preferências; Back do Android navega no WebView do login; elimina corrida LOGIN_END/REFRESH_LOGIN; coordenadas aceitam sinal explícito "+", preservando validação; abertura do menu sincronizada uma vez; retorno IV100 inacessível removido e aviso de privacidade atualizado. Consulte [Guia Samsung v0.49](docs/GUIA_TESTE_SAMSUNG_v0.49.md). OAuth e experiência Samsung ainda exigem teste físico.

## v0.50-beta — manutenção de permissões, preferências e segurança
PS-081: solicitação de POST_NOTIFICATIONS no teste manual da Home, com envio automático se aprovada; orientação sem solicitação no seletor flutuante. PS-082: SYNC_PREFS atualiza localmente sprite, ordenação, timers e alertas no overlay sem rede. PS-084: logs de falhas de leitura de catálogo/assets registram etapa e classe. PS-085: sanitização de code/state/session_id/discord_token em parâmetros soltos. Callbacks evaluateJavascript recusam respostas quando requestGeneration muda ou loginPaused. Código B06 e ordem onDestroy preservados. Manter targetSdk 33, compileSdk 36, Manifest e a identidade do PokeSearch inalterados. [Guia Samsung v0.50](docs/GUIA_TESTE_SAMSUNG_v0.50.md). Validação real no aparelho ainda pendente.

## v0.50-beta — ajustes complementares da experiência Android (14/10)
Feedback de usuário: engrenagem e seta totalmente sem cartão de fundo, paleta neutra cinza/branco translúcida, menu lateral sem espaçamento vertical indevido e ícone de localização menor. AUTO agora inclui OFF (sem execução periódica); aviso de novos Pokémon aceita desligado, ligado ou silencioso, com canais separados. Ao abrir o painel de login, o WebView tenta acionar o link oficial de entrada, sem inventar rota OAuth. Incluída tolerância a Intent de serviço com action nula. A pasta externa `Documentacao/` do pacote completo traz apenas seis arquivos vigentes; histórico permanece em `PokeSearchOverlay/docs/`. A integração real com o site, os resultados IV/GL/UL e a autenticação OAuth em múltiplos aparelhos Android ainda demandam validação física.

## Independência e compatibilidade Android
PokeSearch possui código, documentação, namespace e distribuição **próprios**. Não faz parte de outro repositório ou produto. O alcance técnico parte de `minSdk 26` (Android 8.0), e a compatibilidade precisa ser verificada em dispositivos reais de várias marcas, versões e formatos — não só em um Samsung. A aprovação de CI não substitui esses testes.

**Padrão visual estável:** elegância minimalista cinza/branco, transparência dos botões flutuantes, ícones centralizados, uma única linha de 12 ações compactas, margens de 2 px entre botões e zero espaços vazios artificiais. A área de toque do menu permanece restrita à sua janela; o restante do jogo continua acessível. [Matriz Android e critérios de aceitação](docs/GUIA_COMPATIBILIDADE_ANDROID_v0.50.md). O roteiro [Samsung SM-S928B](docs/GUIA_TESTE_SAMSUNG_v0.50.md) é somente um caso de teste.

### Ajustes complementares PS-086–PS-088
O retorno do login móvel agora detecta também o marcador de conta ativa próximo ao filtro Shiny, não apenas o botão Sair, que pode estar oculto. Após autenticação confirmada, o diálogo fecha e retorna ao PokeSearch mesmo se o Shiny ainda não estiver ativado; a ativação ocorre no serviço e precisa de confirmação pelo site. O toque em ✨ opera no switch da página atual, sem obrigar a selecionar antes Stats/PvP e sem aguardar cooldown da busca. Quando o menu abre próximo ao topo, engrenagem e sprites se movem juntos, minimizando buracos visuais.


### Fluxo de login mínimo — revisão final da v0.50-beta
A tela de login do PokeSearch oculta inicialmente a página extensa de pesquisa do PoGoCoordinates atrás de um indicador nativo discreto. Primeiro verifica a sessão; caso não esteja autenticado, tenta acionar o botão oficial de acesso e então revela a autenticação real do próprio site/provedor. Ao confirmar sessão, fecha automaticamente o diálogo e volta à Home do PokeSearch, **sem depender de Shiny ligado**. Caso o site mude e o controle de entrada não seja localizado, disponibiliza a opção **Mostrar o site para entrar**, sem prender o usuário em carregamento. Não inventar endereços OAuth, não copiar formulários, não coletar credenciais. A aparência/fluxo reais dependem de teste Android e do DOM do PoGoCoordinates.

## PS-090 — Correção do menu e do login acionado por ✨
**Pedido confirmado por captura:** restaurar o menu original com **12 ícones pequenos lado a lado em UMA única linha** (34dp), cores cinza/branco e sem espaçamento artificial; retirar a grade 6×2 (66dp), que foi uma regressão de UX. Os filtros continuam ativos sem alteração funcional. Ao tocar ✨ deslogado, o fluxo de login deve tentar o botão oficial ou o próprio switch Shiny da aba Pokémon, sem mostrar primeiro a página de pesquisa. Após a autenticação, retorna automaticamente ao PokeSearch; o switch passa a ser gerenciado e confirmado no serviço. Uma máscara neutra só desaparece quando os controles reais de autenticação estão disponíveis. Se o DOM do site mudar, o fallback voluntário permite mostrar o site, nunca um bloqueio sem saída. Respeitar o Manifest/targetSdk/identidade do aplicativo independente. OAuth real e interface em diferentes Androids exigem validação física.
