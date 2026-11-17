# PokeSearch LT396 — reconstrução real das bordas Quests / Comunidade e Assistente na Home

**Origem oficial:** PokeSearch v0.03.80 LT, versionCode 54587. Data 17/11/2026.

## Diagnóstico confirmado

Nas duas imagens **originais do usuário**, provenientes de `Iconehome (1).zip`, o erro está nos pixels da arte, não apenas no padding da interface:

- `Quests.png`: imagem 512×512, últimos pixels opacos da borda inferior em **y=484**. O aro do símbolo termina em linha reta, embora sua continuação curva devesse alcançar cerca de **y=499**.
- `Comunidade.png`: imagem 512×512, últimos pixels opacos à direita em **x=488**. A cápsula dos rostos termina em lateral reta; seu contorno deveria fechar perto de **x=506**.
- Ajustes LT394 e LT395 tinham reescalado as imagens mas **não reconstruído os segmentos inexistentes**, portanto a falha continuou visível.

## Correção LT396 — preservação de autoria

- A arte original foi preservada pixel por pixel na parte existente. Só os segmentos de borda ausentes foram reconstruídos por extrapolação do traçado existente, com suavização das extremidades.
- Quests: complemento inferior **y=485..499**, dentro da tela 512×512. Nenhuma mudança de símbolo, cor ou linguagem visual.
- Comunidade: complemento lateral direito **x=489..508**, sem alterar os rostos, sorriso ou formato presente.
- Os dois PNGs restaurados ficam em `docs/assets/LT396_Quests_restaurado.png` e `docs/assets/LT396_Comunidade_restaurado.png`. O atlas embarcado 4×4 troca **somente** as células 6 (Quests) e 15 (Comunidade), com margens internas positivas de pelo menos 15px. Os outros 14 ícones permanecem idênticos à v0.03.80.
- `MainActivity.addHomeGridCell`: margens equilibradas ao material já reparado, permitindo exibir os contornos completos. Assistente mantém a **mesma imagem/personagem** original e aplica apenas dessaturação na Home (20% da saturação); o ícone flutuante do Assistente não é alterado.
- Grade de 16 módulos, Pokédex original, Pokébolas brancas OFF sem valores, menus laterais organizados, temas e todas as ações existentes permanecem inalterados.

## Integridade da arte

| Recurso | SHA-256 |
|---|---|
| Atlas embarcado `home-user-icons-atlas.png` | `abdebce91043c4576fcedf3e64f63492a9e18f5d600246090a5032f6d54976af` |
| Quests restaurado | `f9a9b04c7ed10d500b3e75282129304e1b9d8459d3c4198cd9c260ad53e3989e` |
| Comunidade restaurado | `49d34f6f35e4d93992f2b696e93a6e674665c48d25cb52d114e2f953780cdd9b` |

Teste de regressão `app/tests/lt396-home-restore-cut-contours.test.js` descomprime os PNGs, valida **pixels reais** dos segmentos ausentes e verifica digest do atlas. Os testes antigos LT394 e LT395 têm o hash atualizado, sem relaxamento dos demais contratos.

## Critérios de aceitação

1. A renderização do app deve mostrar aro inferior completo de Quests e a borda direita arredondada de Comunidade.
2. Os ícones não podem perder pixels após redimensionamento, em modo claro/escuro, em escala normal/acessível e em aparelhos diferentes.
3. Assistente segue reconhecível, com cor mais discreta na Home e imagem original inalterada no overlay.
4. Nenhum efeito sobre filtros, bots, busca, sprites, logins, dados, notificações ou reordenação da grade.
5. Publicar somente depois dos testes Node, LT169, LT211, Java Android LT62, LT173 OTA e compilação beta/R8.
6. **Homologação física Samsung SM-S928B Android 17 continua pendente**. CI e screenshot dos recursos não substituem teste com APK instalado.

Próxima etapa ARK LT397: homologar visualmente no aparelho, registrar capturas antes/depois e preservar versão oficial monotônica/assinada.
