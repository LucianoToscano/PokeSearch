# PokeSearch LT305 — QA físico Samsung (ainda pendente)
**Data:** 07/11/2026. **Base oficial:** LT305 · 0.03.05 · versionCode 54511. [Release](https://github.com/LucianoToscano/PokeSearch/releases/tag/v0.03.05-54511), APK `PokeSearch-v0.03.05-LT.apk`.
**Estado:** lista de verificações para executar no Samsung S24 Ultra; **não equivale a teste realizado**.

## Como validar
Instalar a LT305 oficial sobre a LT304 com assinatura permanente; conferir em Configurações/Informações a versão realmente instalada. Fazer as verificações com Pokémon GO visível, sem compartilhar capturas privadas.

| ID | Procedimento no Samsung | Resultado esperado | Status |
| --- | --- | --- | --- |
| S01 | Abrir Edu pela Home e tocar no treinador | Apresentação curta: “Olá! Meu nome é Edu”; respostas Sim/Agora não; uma fala por vez | Pendente |
| S02 | Abrir conversa sobre fundo claro e escuro do jogo | Balão branco opaco com texto escuro legível, borda fina e cauda discreta, sem painel gigante | Pendente |
| S03 | Pressionar sprite por aproximadamente 1,2 s, depois tocar e arrastar | Ajustes aparecem só após segurar; toque curto abre/recolhe conversa; arraste não dispara ajustes indevidamente | Pendente |
| S04 | Trocar P/M/G nos ajustes ocultos, reiniciar o serviço | P=50/M=75/G=100 pixels físicos; G padrão sem escolha prévia; preferência antiga e posição persistentes | Pendente |
| S05 | Simular hoje no fuso de Brasília | Evento fictício D=hoje, D−1=ontem; sem passes verdadeiros, alteração de GPS ou gravação de reide real | Pendente |
| S06 | Escolher Evento real, selecionar a data e aceitar risco | Apenas data na preparação; não exibir seis perguntas antigas; respeitar aceite por evento e horários não verificados | Pendente |
| S07 | Responder E01 “Sim, tenho”, “Não tenho” e “Vou conferir” | Sem passe/sem certeza mantém pergunta e não registra confirmação falsa | Pendente |
| S08 | Confirmar chegada ao Havaí, copiar coordenadas e aguardar o mapa | Um toque copia coordenadas; chegada NÃO confirma carregamento; sem confirmação do mapa não avança | Pendente |
| S09 | Nova Zelândia, reide E04, retorno ao Havaí, passe E06 e repetição E07 | Sequência JSON preservada, vitória ≠ captura, “sem passe” segue caminho seguro | Pendente |
| S10 | Iniciar evento real diretamente em D e retomar sessão D−1 ao mudar de dia | Início em E08 no dia D; transição manual preserva histórico sem marcar etapas/passagens como concluídas | Pendente |
| S11 | Kiribati opcional, E10 com várias reides e E11 resumo; fechar/reabrir o jogo | Sem contador inventado de passes; reides separadas e checkpoint restaurado | Pendente |
| S12 | Autorizar/recusar captura Android e testar P1, P2 e Doce Raro simultaneamente | Edu e painel somem antes da autorização Android; só a bolha recolhida retorna; OCR PT/EN precisa de confirmação; overlays e busca continuam funcionais | Pendente |

## Evidência para relatar uma falha
Informar ID S01–S12, versão realmente instalada, ação executada, resultado esperado, resultado observado e uma captura sem dados privados quando necessário. Marcar como **aprovado** só com teste real; CI Node/Android e publicação não comprovam funcionamento físico.

## Integridade e limites
APK oficial da LT305: **34.033.264 bytes**; SHA-256 **`9d20b6dbe607a13a442d41d8c7e4aca6c717ff5be0632226a08f9a0ce687754d`**. Pipeline oficial #42407546825 `completed/success`. Não alterar nem automatizar localização, toques, reides ou restrições do jogo. O tutorial comunitário não garante passes e pode violar os Termos do Pokémon GO.
