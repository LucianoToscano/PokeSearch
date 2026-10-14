# Plano de teste físico — PokeSearch 0.48-beta (Samsung SM-S928B, Android 16)

**Status: roteiro preparado, execução física ainda pendente.** Este roteiro não é prova de testes realizados. Não use credenciais, códigos de amizade ou coordenadas pessoais em relatórios compartilhados.

## Preparação (5 minutos)
- Salve os dados que deseja preservar. A assinatura de APK debug do CI pode diferir das versões anteriores e exigir remoção do aplicativo antigo.
- Verifique permissão **Aparecer sobre outros apps** e notificações nas Configurações do Android.
- Inicie Pokémon GO como aplicativo de fundo apenas depois de configurar o PokeSearch.

## Testes visuais e de interação
- [ ] Abra PokeSearch > Ativar overlay. Confirme engrenagem acessível, seta escura **40×32 dp**, e favoritos com fundo parcialmente transparente.
- [ ] Arraste o dock para cada canto e para ambos os lados da tela; abra o menu. Confirme que a ordem dos 12 ícones inverte ao mudar para a esquerda e nenhuma opção cobre a engrenagem.
- [ ] Abra a escolha 100%/GL#1/UL#1 e troque entre as três opções; confirme feedback e filtro real no site.
- [ ] Teste AUTO em 5,10,15,20 minutos; anote início/fim de duas buscas. Pokémon vencidos devem sair da tela sem disparar nova consulta.
- [ ] Toque ↻ durante busca pendente e fora da espera mínima de 60 segundos; verifique indicação e chegada de novos resultados.

## Login e sessão
- [ ] Na Home, Entrar/vincular abre site opaco sem overlay no fundo quando o serviço não está ativo.
- [ ] Teste login Google e Discord quando aplicáveis; volte à Home, observe se a sessão é reconhecida. **OAuth externo pode exigir retorno manual.**
- [ ] Teste Shiny ON com treinador vinculado e OFF sem vinculação, distinguindo confirmação real de estado pendente.
- [ ] Sair confirma antes de limpar apenas dados locais do site; preserve favoritos e preferências, e exija login novamente.

## Localização, alertas e segurança
- [ ] Use coordenadas de teste públicas, sem dados pessoais. Teste 📍 OFF, 0 km, 50 km, 1000 km e uma entrada inválida; confirme indicador e filtros efetivos no site.
- [ ] Cadastre Pokémon de teste como favorito e acione Testar notificação. Ícone na barra do sistema deve ser uma lupa/Poké Ball branca, sem bloco colorido.
- [ ] Gere relatório pelo menu ⚠ e revise manualmente antes de enviar: dados pessoais e segredos podem aparecer em formatos não previstos.
- [ ] Teste por 30 minutos incluindo abertura/fechamento de menus, login e resultados; registre travamentos, consumo de memória quando disponível e atrasos de toque.

## Regressões e evidências a devolver
Em caso de falha, informe versão 0.48-beta, Android 16, tela/ação, resultado esperado versus observado, captura sem dados sensíveis e relatório TXT revisado. Não envie credenciais, cookies, tokens, códigos pessoais ou coordenadas privadas.

## Resultado
A preencher após execução física: ☐ aprovado ☐ reprovado ☐ não testado. Até lá, o estado desta validação permanece **não testado**.
