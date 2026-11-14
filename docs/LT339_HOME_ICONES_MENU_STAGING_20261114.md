# LT339 — Home: novos ícones, controles e menu lateral (EM EDIÇÃO)

**Data:** 14/11/2026. **Base oficial:** LT338 0.03.37 / versionCode 54544 / fonte `a870b3e2` após registro documental.  
**Status:** implementado na branch de trabalho `feature/lt339-home-icon-menu-refactor-20261114`. **Sem PR de merge, APK, alteração em release/official-request.json ou publicação** por pedido explícito do responsável. A LT338 continua sendo a última versão instalada/distribuída oficialmente.

## Artes recebidas — 6 PNGs originais preservados

| Enviado | Recurso Android | Dimensões originais | SHA-256 |
|---|---|---|---|
| Pokebola 1 e 2 Off.png | `res/drawable-nodpi/home_pokeball_off.png` | 256×256 | `922f1314c60f0c102dcac34669117af24628390d9402e3e6197205fab18fe203` |
| Pokebola 1 e 2 On.png | `res/drawable-nodpi/home_pokeball_on.png` | 256×256 | `bdd744da75d7f3a118179f88e789f83496ec262b2e1f16590fab8cd4a80fac6e` |
| Busca_Pokemon.png | `res/drawable-nodpi/home_search.png` | 1000×1000 | `5e203b9a61b26204d62ba68147bf60a1e823abf1995f8074bbba46401ba4d183` |
| Weather_Menu.png | `res/drawable-nodpi/home_weather.png` | 256×256 | `3b6b6031a4de92ee06ede025a2c78c6b49e4d19e9331c3367b374702457da768` |
| Modo_Claro.png | `res/drawable-nodpi/home_mode_light.png` | 512×512 | `40353e440a644d2f44b040aabace3d516c339db2265dc763fc6fa482d4b04c3f` |
| Modo_Escuro.png | `res/drawable-nodpi/home_mode_dark.png` | 512×512 | `360f66c9c04e535dca757d588b0286c2fbbca67f0b676a977b250410fbe74089` |

Todos os 6 SHA-256 acima identificam os PNGs fornecidos diretamente pelo responsável, **sem redução, conversão, recorte ou quantização**. A mesma imagem OFF/ON serve às Pokébolas 1 e 2, que mantêm estados separados dos serviços Android. O novo ícone Busca Pokémon preserva a abertura funcional do painel `PgsBuscasPanel`. Weather preserva seu estado atual de atalho em desenvolvimento.

## Home — organização

- Fileira única de 10 ícones sem fundo mantida, incluindo P1/P2, Busca Pokémon, Passes, Raids, Power Spots, Quests, Rocket, Weather e Doce Raro.
- Doce Raro permanece no slot de 44dp, mas agora com 7dp de recuo interno, reduzindo seu tamanho visual para aproximar o do ícone Quests; comparar em Samsung após futura build.
- No topo: relógio do Edu, Apoiar, **ícone para alternar Claro/Escuro**, **ícone Compartilhar** e Menu; sem o texto do antigo botão Compartilhar. O tema claro aplica cor de contraste ao desenho branco da lua sem alterar a arte PNG. O comando usa a preferência `homeLightMode` existente, sem tocar nos filtros/contas.
- Removidas da Home as caixas inferiores de **Ativos agora**, **Instalações**, **Compartilhar app** e **Agradecimentos**, mantendo dados e ações no menu.
- Removido da Home o texto Premium **"Conta Premium · Gerenciar / Sair"**, preservando o fluxo original em **Menu > Conta**. O acesso Premium permanece restrito a `PremiumAccess.controlled()`.

## Menu lateral

- O menu tem rolagem vertical interna, sem cortar os comandos em telefones compactos.
- Nova aba **Conta**, com `Voltar ao menu`, Pokébola 1 · Conta, Pokébola 2 · Conta e Conta Premium · Gerenciar / Sair (quando autorizado); reutiliza os métodos existentes sem criar nova sessão.
- Compartilhar e Agradecimentos continuam disponíveis no menu principal.
- Os contadores Firebase de Ativos agora/Instalações aparecem na seção **ESTATÍSTICAS** no fim do menu. Os listeners permanecem centralizados em `FirebaseStats`; nenhum contador ou identificação pessoal é inventado.
- O menu preserva Favoritos, Transparência, Preferências, Exportar/Importar, Filtros PGSharp, Chat, Guia rápido, Novidades e Reportar.

## Compatibilidade, testes e pendências

- Ajustados testes históricos de Home, homenagens, Premium e temas para a organização nova, sem retirar funções.
- Novo contrato Node `app/tests/lt339-home-icons-drawer-contract.test.js` exige 6 hashes, dimensões, transparência, estados ON/OFF, funções, drawer Conta e proibição de voltar a montar os painéis ocultos na Home.
- QA estrutural do código e hashes são possíveis sem compilar. **Build Gradle/Android, inspeção visual P/M/G, toques Samsung, integração completa e homologação física permanecem PENDENTES**, conforme decisão de não gerar APK nesta rodada.
- **Não incrementar code nem atualizar release_notes** até receber as próximas alterações solicitadas. Não acionar workflow que construa APK nem abrir PR que possa acionar pipelines de APK.
- A issue #350 da homologação PGS continua pendente e não é modificada aqui.
