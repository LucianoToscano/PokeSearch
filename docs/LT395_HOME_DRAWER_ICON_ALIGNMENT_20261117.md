# PokeSearch — LT395 — Home e menu lateral compactos

Data: 17/11/2026. Base oficial: PokeSearch v0.03.79 LT / versionCode 54586.

## Requisitos do proprietário

- **Quests**: conservar o desenho original, permitir todo o limite inferior no tile, sem recortar arte.
- **Comunidade**: conservar o mesmo PNG original, inclusive contorno à direita; corrigir enquadramento.
- **Assistente**: manter o personagem existente, reduzir discretamente sua dominância e padronizar o alinhamento, sem trocar a identidade.
- **Home 4×4**: alvos e rótulos alinhados, preservar ícones da Pokédex, Pokébolas brancas quando desativadas, P1/P2 sem badges e a personalização do fundo.
- **Drawer**: organizar em Principal, Ajuda e atualizações, Mais; Conta continua com gerenciamento P1/P2, Preferências mantém controles e recebe Transparência dos fundos; Dados e backup passa a apresentar importação/exportação; Sobre reúne Compartilhar, Agradecimentos e estatísticas. Chat passa a ser acessado pelo módulo Comunidade na Home, com Mostrar/Ocultar/Abrir. Não excluir callbacks nem mudar dados de usuários.

## Implementação

- Em `MainActivity.addHomeGridCell`, espaçamento óptico por índice: Quests 6, Assistente 3, Comunidade 15. O ImageView utiliza FIT_CENTER, rótulos com baseline previsível e nenhum overlay adicional. O Assistente tem mais respiro e opacidade de 92% na Home; toque não restaura arte antiga de hover.
- `home-user-icons-atlas.png` é recomposição transparente a partir dos arquivos **originais** `Quests.png` e `Comunidade.png` fornecidos pelo proprietário, com área útil interna reduzida e margens positivas em todos os lados. As outras 14 células permanecem byte-equivalentes ao atlas anterior.
- O drawer usa linhas uniformes, glifo em coluna fixa, título alinhado, feedback de toque nativo, cabeçalho com versão e temas existentes. Páginas internas Dados/Sobre/Conta mantêm as funções operacionais, sem acrescentar tela de login ou destruir preferências.
- Transparência continua chamando `showHomeTransparencyDialog` através da página Preferências. Chat continua respeitando `CommunityScrapbookStage1.isEnabled` e o estado persistido anterior. Estatísticas continuam populadas por `FirebaseStats.bind`, agora na página Sobre.
- Nenhum estado de autenticação, cookie, sprite, captura, API ou chave do APK foi modificado.

## Evidências e QA

Atlas SHA-256: `0038a203fa074002ef8bb710662d32e9c8231a6f90e5914a120b4c6fa8e909e6`, dimensão 1024×1024, 4×4.
Contrato novo: `app/tests/lt395-home-icons-drawer-contract.test.js`; regressões antigas dos menus atualizadas para seus novos locais, com ações intactas.

**Limitação:** testes de código não comprovam pixel-perfect em aparelho. Homologação física no Samsung SM-S928B Android 17 e em outros tamanhos, tanto modo claro quanto escuro, permanece pendente. Se ainda houver fragmento visual faltando na arte original de Quests (e não no enquadramento), não redesenhar sem inspeção e autorização sobre o desenho.

## Publicação

Somente nova versão monotônica via solicitação e workflow protegido, compilação/assinatura permanente, digest público e revisão dos testes. Preservar a v0.03.79 LT. ARK após sucesso e prompt de continuidade LT396.
