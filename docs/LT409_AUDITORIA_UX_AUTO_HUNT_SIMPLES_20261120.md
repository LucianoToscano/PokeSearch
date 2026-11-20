# LT409 — Auto Hunt simples e GPX despoluído (20/11/2026)

## Relato do proprietário
A experiência Auto Hunt + Missões GPX entregue em LT408 é confusa, poluída, espalhada e não parece intuitiva nem automatizada. A implementação LT408 foi honestamente um **planejador manual**, não automação no jogo.

## Causa confirmada no código da v0.03.93
- A entrada de GPX ficava em \`Busca Inteligente → Ação → Avançado → Auto Hunt → Ajustes → GPX\`, e aparecia somente após selecionar o modo interno HUNT.
- No painel Ação, busca de Pokémon, selecionar objetivos, permissões, configurações avançadas e supervisão noturna eram exibidos em sequência, sem escolha simples de finalidade.
- No planejador GPX, o usuário via muitos controles independentes e sete checkboxes na mesma tela, além de valores técnicos, projeção de doces condicionais e botões manuais de progresso, resgate e correção.
- O rodapé \`▷ Iniciar\` não indicava se iniciaria a busca normal ou a rota GPX, o que poderia gerar interpretação indevida.

## Simplificação aplicada na branch candidata
- A bolha de busca abre diretamente a aba **Ação**, com três alternativas claras e exclusivas: \`Missões GPX · abrir\`, \`Buscar Pokémon · configurar\`, \`Supervisão noturna · PGSharp\`.
- As opções da busca de Pokémon aparecem somente quando a pessoa escolhe buscá-los. As confirmações e ações da supervisão PGSharp aparecem somente nesse modo.
- \`⚙ Opções técnicas\` mantém acesso à área avançada original de Monitorar/Clicar/Auto Hunt/Sequência. Aba Ajustes mantém os controles avançados de tempos, notificações, visual e supervisão do motor.
- O botão global \`Iniciar\` fica desativado enquanto a tela mostrar apenas as escolhas ou a supervisão noturna. O GPX abre diretamente o planejador; nunca inicia por engano a busca de Pokémon.
- O planejador GPX começa com um título, importação do arquivo, resumo compacto, ponto atual, cópia da coordenada e próximo ponto. A seção de registro de pesquisa/resgate, checklist de preparação e detalhes técnicos são expansíveis (recolhidos ao abrir).
- A projeção de 12.450 doces teóricos e as distâncias ficam sob **Detalhes da rota**, sem sugerir ganhos reais.
- Nenhuma alteração no motor de toques, políticas de autenticação, PGSharp/Pokemod, resultados, filtros, Home, ícones, dois inventários, Pokébolas P1/P2, imagens ou notas. Não concede permissão/consentimento implicitamente.

## Validação e limites
- Contratos de UI LT369 e GPX LT408 atualizados para prevenir regressão de navegação e exigir controles avançados recolhidos.
- Requer QA Node/LT169/LT211/LT62/LT173/PGS/R8, além de homologação visual no Samsung Android 17.
- **Não adiciona automação de tarefas no Pokémon GO**: não há teleporte, giro, lançamento, coleta/resgate ou execução autônoma noturna. A supervisão não substitui o Go Plus/PGSharp.
- Até merge e publicação protegida da próxima versão, a oficial permanece v0.03.93 LT.
