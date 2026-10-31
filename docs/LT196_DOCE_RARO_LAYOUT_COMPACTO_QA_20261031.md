# LT196 — Doce Raro compacto com informações sobre a sprite (QA)

Base: LT195 oficial (0.01.95/54400), PR #159, mantendo a assinatura permanente e o overlay independente.

## Mudanças
- Reduzir o item de Doce Raro para **a mesma altura de 47 dp com ou sem cooldown**, com o **despawn** em linha única sob a imagem e o cooldown sobreposto na parte superior da célula de sprite (46 × 29 dp).
- Distância, quando habilitada, sobreposta no rodapé da sprite; tempo de cooldown acima, em badge escuro translúcido, sem texto adicional “Pronto”.
- **Vermelho:** cooldown acima de 30 segundos. **Rosa:** últimos 30 segundos. **Verde:** check ✓ pequeno após o tempo estimado. **Azul:** ● marca o doce copiado como origem. O contador continua a cada segundo.
- Para tempos ≥ 1h, badge usa `1h15` e arredondamento conservador para minutos, enquanto a descrição de acessibilidade expõe o tempo exato. Para tempos inferiores a 1h, `m:ss`.
- Imagem previamente copiada não fica totalmente cinza: saturação 60% e opacidade 88%; preserva a indicação de cópia sem ocultar a arte.
- Nenhuma mudança no cálculo Haversine, na tabela de cooldown, na cópia, na persistência, nos estados P1/P2, na API, nos limites do provedor, em despawn ou no refresh.

## Correção complementar — coleta confirmada pelo usuário
- A imagem apresentada pelo jogador mostra a mensagem recebida ao pegar o doce dentro do Pokémon GO. O PokeSearch não possui evidência autenticada desse evento, portanto **não inicia cooldown ao simplesmente copiar coordenadas** nem tenta monitorar secretamente o outro aplicativo.
- **Toque curto:** copia apenas e seleciona o doce. Um ✓ pequeno, dentro da célula de sprite selecionada, fica disponível para o usuário confirmar a coleta depois da mensagem do jogo. **Toque longo no doce** ou **✓ em Informações** também permite confirmar. O diálogo pergunta explicitamente se a coleta ocorreu. Só o botão `✓ Peguei` grava `confirmedCandyHopAtMs` e inicia o contador estimado.
- Ao copiar outro doce antes do prazo estimado, mostra diálogo nativo com distância entre os pontos e tempo restante; `Cancelar` mantém a área de transferência intacta e `Copiar mesmo assim` copia sem declarar nova captura. O aviso é informativo, não altera o Pokémon GO.
- Migração LT195: as preferências antigas `lastCandyHopCoords/AtMs` não são importadas como coleta real; no máximo viram seleção pendente. Checagem de novo formato `confirmedCandyHopCoords/AtMs` permanece após reinício.
- O mesmo controle compacto de 47dp é preservado; temporizador só aparece após coleta confirmada e botão ✓ de confirmação usa o canto da sprite, não outra linha.
- Testes adicionais `lt196-candy-pickup-confirmation.test.js` e regressões Java `CandyCooldownPolicyTest.java` validam confirmação, migração, estado copiando/pegando e aviso antes de copiar.

## Lista limpa — coletados desaparecem
- **Somente o ✓ Peguei confirmado** insere o doce no registro de coletados. Copiar não esconde, não deixa a imagem cinza e não dispara atualização ao copiar dez itens.
- Ao confirmar coleta, esconder o doce do overlay imediatamente por padrão; a lista ajusta a altura ao número de doces restantes, evitando buracos.
- Botão ◌/◉ discreto no cabeçalho de Informações mostra/oculta os coletados confirmados para consulta. É opcional, sem nova linha nem menu mais alto.
- O registro fica em `SharedPreferences` com coordenadas e prazo da ocorrência; ao expirar o despawn, o registro é retirado para evitar bloquear um doce novo no mesmo lugar. Não enviar coordenadas nem registros para servidores adicionais.
- Quando os dez doces da lista tiverem **coleta confirmada**, permitir o refresh existente; nenhuma cópia isolada dispara essa regra.
- Detecção automática da mensagem do Pokémon GO **não implementada**: requer avaliação independente de permissões de acessibilidade e/ou projeção de tela com consentimento. A UI do jogo pode não expor texto; reconhecer sprite por imagem/OCR é um experimento opt-in e não deve ser anunciado como confiável ou ativado silenciosamente.

## Testes
- Nova suíte Node `lt196-candy-compact-sprite.test.js`: altura fixa, única linha de despawn, badges dentro do sprite, cores, copiar/reset, 10 doces e atualizações por segundo.
- Teste Java de produção `CandyCooldownPolicyTest.java`: acrescenta 9 cenários de labels compactos a 56 checagens de LT195.
- Workflow `pokesearch-node-qa.yml` inclui LT196.
- Necessária compilação Android, screenshot e teste autenticado no Samsung antes da publicação.
- **Estado inicial:** branch de QA; não publicada/mesclada, sem alteração do APK público LT195.

## Publicação oficial verificada em 31/10/2026
- PR #160 mesclada; SOURCE_COMMIT `2f99205726a46dfef4f6e70b85bbb4ca96c2a9c3`; versão `0.01.96`, `versionCode=54401`.
- [Workflow de assinatura #41178326181](https://github.com/LucianoToscano/PokeSearch/actions/runs/41178326181): **SUCCESS**, Node, JVM, Android, OTA, build R8 e validação de assinatura.
- [Release oficial LT196](https://github.com/LucianoToscano/PokeSearch/releases/tag/v0.01.96-54401), APK de **29.018.893 bytes**, SHA-256 `b5026d73b11649e57c225b19a73e0a33e5886800dd0983425ab626e9b29b159e`.
- Certificado de assinatura v2 original, SHA-256 `34766c15d09013ad65873f9976539c8fa2f826e917dae3af57ea628cad689e8e`.
- [Google Drive LT196](https://drive.google.com/file/d/1DPL5hxYYTaBl__e58sBABIMQRkt5BR53/view) com ZIP oficial e relatórios (**26.728.300 bytes**), SHA-256 `c93059f6a42cb78028b0566e9ddf8a442038ac7582ea82a693990241ebd91e96`. Verificação ZIP passou, hash do APK interno coincide com o GitHub.
- A LT196 é latest do GitHub e está disponível ao mecanismo padrão de atualizações; não há confirmação de recebimento por cada aparelho.
- Samsung físico e API autenticada não testados nesta execução. Detecção da mensagem/sprite pelo outro app ainda não foi implementada.
