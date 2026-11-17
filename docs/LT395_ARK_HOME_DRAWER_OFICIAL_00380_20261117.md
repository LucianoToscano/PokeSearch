# PokeSearch — ARK LT395 — Home e menu lateral oficial 0.03.80 LT

Data: 17/11/2026. Propriedade: projeto LucianoToscano/PokeSearch. Branch oficial: main.

## Requisitos

O proprietário apresentou a Home e o drawer atuais e solicitou:
1. Quests e Comunidade **sem recortes**, preservando as artes enviadas (Quest sem corte inferior e Comunidade sem corte direito).
2. Assistente harmonizado com a grade sem trocar seu personagem.
3. Alinhamento geral dos 16 módulos e refinamento visual.
4. Menu lateral compacto, com ícones/textos alinhados, menos ações primárias e funções secundárias realocadas, **sem apagar funcionalidades**.
5. Aplicar no aplicativo e publicar nova versão oficial instalável por cima.

## Modificações implementadas

- `MainActivity.addHomeGridCell`: margens ópticas específicas para índices 6/15 e 3, correção do alinhamento das legendas e 0,92 de opacidade no Assistente. Não trocou o personagem.
- `app/src/main/assets/home-user-icons-atlas.png`: atlas 4×4 recomposto **somente nas células Quests e Comunidade**, a partir de seus arquivos de origem `Quests.png` e `Comunidade.png`, com área interna reduzida para margens transparentes. SHA-256 `0038a203fa074002ef8bb710662d32e9c8231a6f90e5914a120b4c6fa8e909e6`, dimensão 1024×1024. Nenhuma outra célula do atlas foi alterada.
- Drawer: grupos Principal (Conta, Favoritos, Preferências, Filtros PGSharp), Ajuda e atualizações (Novidades, Guia rápido, Reportar problema) e Mais (Dados e backup, Sobre o aplicativo). Cabeçalho com versão, ícones em coluna fixa, títulos centralizados, ripple nativo.
- Conta mantém duas contas PoGoCoordinates, vínculos P1/P2 e ação Premium quando autorizada. Dados e backup mantém importação e exportação. Sobre mantém Compartilhar, Agradecimentos e as estatísticas com `FirebaseStats.bind`.
- `showHomeTransparencyDialog` permanece acessível em Preferências. `showCommunityHomeOptions` permite Mostrar/Ocultar/Abrir o chat do módulo Comunidade, preservando o estado `communityLiveChatVisible`. Fórum ainda não implementado é identificado como em preparação.
- Mantidos tema, fundo, Pokébolas brancas OFF e sem números/IVs na Home, 16 módulos, overlays, PGS, login, rankings, buscas, banco de dados, sprites e compatibilidade existente.

## Evidências de integração e QA

- PR de código [#497](https://github.com/LucianoToscano/PokeSearch/pull/497) **MERGED**, squash `728eaf699139b7472544b2083c295c6e8deaa784`. Teste novo `app/tests/lt395-home-icons-drawer-contract.test.js`, contratos antigos relocados para suas novas rotas, checks Node QA, LT169, LT211, LT62 Android Java, LT173 OTA e beta APK/R8 todos **SUCCESS**.
- PR de release [#498](https://github.com/LucianoToscano/PokeSearch/pull/498) **MERGED**, squash `c7d9e92e9c3aa45aa49343d2fc58beedc4ff41c2`.
- **PokeSearch v0.03.80 LT**, versionCode **54587**, label **51395**, tag **`v0.03.80-54587`**. Workflow protegido oficial [#44051560798](https://github.com/LucianoToscano/PokeSearch/actions/runs/44051560798) **completed/success**. Assinatura permanente, build protegido, verificação do APK, liberação e conferência pública do SHA-256 passaram.
- APK oficial: [PokeSearch-v0.03.80-LT.apk](https://github.com/LucianoToscano/PokeSearch/releases/download/v0.03.80-54587/PokeSearch-v0.03.80-LT.apk), **61.379.327 bytes**, SHA-256 **`927ca15c01472ca106a6b5d591213d6a3b910bba712cd7b399bf628cad12600d`**. Tag pública estável, não-draft, não-prerelease, asset `uploaded`.
- Atualização monotônica e assinada, instalável sobre a versão 0.03.79 LT com mesma assinatura mediante consentimento do Android. Release antiga permanece disponível.
- Registro de novidades interno em `app/src/main/assets/release_notes.json` com minVersionCode 54587.

## Pendências de homologação — LT396

- **Teste físico no Samsung SM-S928B Android 17 e em telas menores ainda não executado.** Capturar Home completa e menu principal, Conta, Dados, Sobre, Preferências e opções da Comunidade.
- Confirmar que Comunidade não recorta à direita e Quests não perde traços inferiores. O atlas original foi reenquadrado; se o próprio original possuir parte incompleta, não redesenhar sem autorização explícita.
- Verificar Assistente visualmente comparado aos demais em claro/escuro, taxa de toque, TalkBack, dimensão de fonte, scroll e retorno de telas.
- Conferir atualização instalada sobre v0.03.79 sem perda das duas contas/filtros/sprites, e detecção de atualizações via GitHub.
- Continuar desenvolvimento a partir da **0.03.80 LT / 54587**, sem republicar o mesmo tag/code. Executar o ARK ao finalizar a próxima etapa.

**Importante:** os testes CI não comprovam fidelidade visual pixel a pixel, nem equivalem a homologação física do Android.
