# PokeSearch — ARK LT370 | Continuidade após LT369 OFICIAL

Atue como mantenedor Android sênior, auditor UX/UI e engenheiro de QA/release do repositório `LucianoToscano/PokeSearch`. Leia `AGENTS.md`, `docs/GUIA_MESTRE.md`, `docs/LT369_OVERLAY_UNICO_BUSCA_20261115.md` e `docs/PADRAO_OFICIAL_OVERLAYS_POKESEARCH.md`. Respeite decisões e autorizações técnicas existentes; não solicitar repetidamente confirmação para tarefas já autorizadas e não inferir sucesso de simulações ou capturas de tela não verificadas.

## Base publicada e comprovada

- **LT369 0.03.65 / versionCode 54572 / label 51369**, [release pública](https://github.com/LucianoToscano/PokeSearch/releases/tag/v0.03.65-54572) e [APK](https://github.com/LucianoToscano/PokeSearch/releases/download/v0.03.65-54572/PokeSearch-v0.03.65-LT.apk). Arquivo de 61.172.771 bytes, SHA-256 reportado pelo GitHub `bd75824dc7f3912e1b631ed59cc638038ea0c3e665dfc0eaee0e167f03a75c7e`. [Workflow oficial #43773646619](https://github.com/LucianoToscano/PokeSearch/actions/runs/43773646619) `completed/success` no SHA `36557a2d9afd787b3c58d0c4d53fb88fc6a821d4`.
- **Código:** [PR #441](https://github.com/LucianoToscano/PokeSearch/pull/441), squash `99699ade65f01cc0342e385a001c2c2f04814817`; sete gates CI green no head `f2ae374a00f08b8cd42b95bfe73f828866867db8`. **Release:** [PR #442](https://github.com/LucianoToscano/PokeSearch/pull/442), squash `36557a2d9afd787b3c58d0c4d53fb88fc6a821d4`.
- **UX incluída:** segurar a bolha abre diretamente um ÚNICO painel de Busca com abas **Pokémon / Ação / Ajustes**, sem atalhos antigos repetidos. Tempos, avisos, indicador de toque, aparência e Auto Hunt avançado ficam na mesma aba Ajustes rolável; seleção PGSharp/Pokemod/Outro na aba Pokémon.
- **Reordenação:** o usuário segura a **própria linha** do Pokémon ou da etapa de sequência e arrasta. Não há setas ↑/↓ nem alça ≡. Toque curto edita, pressão longa destaca com retorno tátil, soltar persiste e cancelar não altera. `PgsAutoCatalog.moveTo` e `PgsSequenceStore.moveTo` mudam prioridades/etapas sem enviar gesto ao jogo. TalkBack recebe ações de mover para frente/trás.
- As sprites, dados, preferências, autenticação, modos, P1/P2, Doce Raro, Radar PokeList, Data Hub e assinatura permanecem preservados. Captura/teleporte/nova posição no jogo **nunca** são comprovados só pelo callback Android.

## P0 — Auditar em dispositivos físicos (não homologado por CI)

1. Testar Android 11, 13 e 14; clientes PGSharp e Pokemod separadamente; telas P/M/G e modo claro/escuro; bolha nas quatro bordas; paisagem/retrato; teclado visível; escalas de fonte; TalkBack.
2. Abrir Central com **segurar na bolha** e verificar que não aparece a barra antiga. Tocar na bolha com a Central aberta deve retrair o painel, sem alterar a sessão.
3. Testar arraste por pressão longa em listas de 1, 2, 5, 10 espécies e sequências de 1, 5, 12 etapas. Checar que o item acompanha o dedo, permite rolar nas bordas, soltar posiciona no alvo correto, cancelar restaura e o estado persiste depois de reiniciar app. Repetir após editar/capturar sprites.
4. Testar toque curto na etapa para editar, botões Copiar/Excluir, confirmação de limpar por toque longo e ações de acessibilidade. Arrastar não deve tocar no jogo nem consumir consentimento de gestos.
5. Revisar painel único com menus de sprites transitórios, scanner e seletor de áudio do sistema; eliminar navegação desnecessária sem suprimir os diálogos indispensáveis de captura/permissão/seleção.
6. Validar que o overlay não causa toques fantasmas, que a busca só começa no botão explícito e que perfis PGSharp/Pokemod não misturam sprites, autorizações, temas ou etapas.
7. Registrar PASS/FAIL/BLOQUEADO com vídeo, screenshots e modelo/versão Android. Ausência de dispositivo não equivale a PASS.

## P1 — Evolução somente depois de feedback real

- Melhorar rolagem automática do item segurado em listas longas, feedback de destino e restauração de posição após interrupção do serviço.
- Undo de reordenação dentro da sessão, quando houver protótipo validado.
- Eliminar código morto de toolbar após garantir paridade e cobertura de testes, sem apagar assets/ícones usados por outras áreas.
- Separar definitivamente ajustes gerais e de Auto Hunt por perfil quando necessário, sem espalhar menus.
- Biblioteca de sequências nomeadas, condicionais visuais limitadas e edição visual direta de pontos, sempre com consentimento e limites; não afirmar pronto antes de implementar/testar.

## ARK / publicação

Auditar latest e main → criar branch de correção → testar e documentar → sete gates no mesmo SHA (Node, LT169, LT211, Java, OTA, PGS APK QA, Secure/R8) → merge seguro → novo pedido oficial monotônico (`versionCode > 54572`) → CI protegido + assinatura permanente + release não-draft + APK/digest público → atualizar `AGENTS.md`, `docs/GUIA_MESTRE.md`, notas e prompt. Nunca anunciar versão instalada no celular ou homologação sem prova. Instalação requer confirmação Android.
