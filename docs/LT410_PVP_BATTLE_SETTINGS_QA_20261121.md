# LT410 — Preferências de Batalhas PvP (QA, 21/11/2026)

## Origem
Capturas do proprietário mostram controles de batalha para Equipe Rocket
(ataque ágil, carregado e escudo), mas faltava opção distinta para PvP.
O ícone PvP da Home do PokeSearch era somente `futureHomeModule` (toast).

## Escopo desta PR
- O ícone **PvP** na grade original 4×4 abre uma Activity própria.
- Liga Grande / Ultra / Mestra / Copas: preferência privada.
- Preferências PvP independentes: ataque ágil, carregado, escudo e troca.
- Valores iniciais OFF. Dados somente em `pvp_battle_preferences_v1`.
- Atalho funcional para a Pokédex privada e reset de preferências.
- Visual compacto, sem substituir ícones, Home, overlays ou motor Rocket.
- Nenhuma modificação na tela do Pokémon GO, PGSharp ou outros serviços.

## Limite essencial
**Isto NÃO implementa batalhas PvP automáticas.** As opções são preferências
de planejamento futuras, nunca gatilhos de execução. Não há detector de estado
PvP, energia, minijogo carregado, escudos, troca ou autorização para controle
automático confiável. A tela avisa isso explicitamente. Não declarar equivalência
ao PGSharp nem que uma batalha foi realizada.

Para evoluir com segurança para controle real:
1. Obter capturas e evidência física da interface PvP em ambiente autorizado.
2. Separar estado PvP real de Rocket/Ginásios/Raids e demais overlays.
3. Projetar detector de fase e transições verificáveis, inclusive reconexão,
   oponente trocando, ataques carregados e pausas.
4. Implementar consentimento separado, parada imediata e teste de gestos
   sem falsos toques no jogo.
5. Homologar em Samsung Android 17 com logs redigidos e testes de regressão.

## QA e entrega
Teste estático proposto: `node app/tests/lt410-pvp-preferences.test.js`.
A compilação Android, inspeção visual e homologação física não foram realizadas
nesta sessão. **Não solicitar ARK nem publicar APK com automação PvP declarada**
sem implementação e provas reais. Preservar canal LT oficial.
