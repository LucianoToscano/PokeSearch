# PADRÃO OFICIAL DOS OVERLAYS POKESEARCH
**Política obrigatória de UI, interação, persistência e QA — LT344 / 14-11-2026**

## 1. Fonte de verdade e reutilização
Os menus das Pokébolas 1/2 e o overlay de Doces Raros são as referências de implementação. Antes de modificar um overlay, inspecionar **o próprio componente existente**, `app/src/main/assets/dock.html`, os JSONs/configurações do módulo, `OverlayQuickMenus`, `OverlayService` e `RareCandyOverlayService`. Reutilizar primitivas, ícones e tratamento de estados; nunca copiar à mão uma aparência aproximada. Caso haja divergência entre este texto e o componente funcional, preservar o componente e registrar as medidas reais após inspeção. Não mudar recursos antigos só para acompanhar um overlay novo.

## 2. Geometria e ícones
- Respeitar densidade Android: tamanho de toque em **dp**; distância visual excepcional em **pixels físicos** quando assim especificado. Não confundir 1–2 px com 1–2 dp.
- Referência da bolha PGS: alvo de toque **44 dp**, slot **35 × 30 dp**, arte visível **21 dp**, pulso **850 ms**, conforme módulos originais e `PgsAutoVisualState`. Não agrandar artificialmente os submenus.
- Referência `dock.html`: `--dock:53px`, `#gear:35×30px`, ícones SVG 21px, botões de toolbar 30px; `#choices` possui 166px básico e variantes 232/306px. Estas são medidas **CSS** do próprio dock, não especificações universais para todos os overlays Android.
- Ícones da Home devem ter áreas opacas equivalentes e centro alinhado, mantendo os PNGs originais de 512px, alpha, nitidez e estados Normal/Hover/Ativo. O logo preserva proporção e tamanho. Compartilhar precisa do contraste correto.
- Seletores de Conta P1/P2: centro horizontal da respectiva Pokébola e distância visual de **1–2 px físicos acima dela**. Selecionam conta de uso da Pokébola, **não iniciam OAuth**. Login tem botões próprios e posicionamento separado.
- Na Busca Pokémon: Home OFF/ON usa `busca_pokemon_overlay_off.webp`/`busca_pokemon_overlay_on.webp`; **dentro da bolha**, OFF/ON usa `busca_pokemon_off.webp`/`busca_pokemon_on.webp`. Preservar transparência e relação dos recursos.
- Personalização e notificações: usar **os mesmos** recursos de engrenagem+lápis, sino e fechar das Pokébolas. Ícone Shiny dentro do sino: reutilizar arte original branca/amarela, nunca estrela genérica solta. Tocar fechar tem semântica específica por componente (Edu: encerra serviço; Busca: fechar/retrair não altera pesquisa conforme estado).

## 3. Comportamentos e estados separados
- `menuExpanded`, `searchEnabled`, `automationRunning`, `awaitingMap`, `counter`, `error` e `accountSlot` são conceitos distintos; não reutilizar um booleano para várias funções.
- Busca Pokémon: menu aberto + toque no ícone principal = retrair **sem desligar**; menu retraído + toque = alterar estado da busca. Toque longo/arraste só onde definidos no componente original.
- Centro do ícone: **branco** ocioso; **verde** enquanto espera/carrega mapa; **vermelho** em erro real; animação compartilhada, sem criar duplicata.
- Configurações P/M/G, exibição dos contadores, opacidade, posição, alertas e busca devem persistir em chaves por overlay. As duas Pokébolas nunca devem alterar vinculação da conta da outra, nem compartilhar indevidamente dados privados.
- Notificação PGS: categorias visíveis **Novos Pokémon** e **Shiny monitorado**, deduplicadas; um toque/gesto comum não declara Shiny. Respeitar estados silenciado/ativo/desligado existentes.
- Captura: modos Quadrado, Horizontal e Livre; prévia ampliada, lupa fora do dedo, alças, confirmar/cancelar antes de gravar. Não alegar silhueta removida automaticamente sem algoritmo e evidência; preservar fallback PNG original e amostras antigas.
- Timer PGS: **25s por padrão** para `Cooldown Mapa`, `Sem Shiny` configurável inclusive zero; sem teto arbitrário, validação de números e aritmética segura. Desativar/reativar inicia novo ciclo, reusa sprites salvos e não herda `clickedAt`.
- Separar `captura → reconhecimento → confirmação estável → gesto aceito → gesto concluído pelo Android → teleporte comprovado no jogo → mapa populado → próximo destino`. O cronômetro ou `dispatchGesture.onCompleted` não equivalem a teleporte real.

## 4. Acessibilidade, OAuth e Android
Acessibilidade só com consentimento do usuário e validação do aplicativo em primeiro plano. Avisos **Sou passageiro / Estou seguro** interrompem gestos e relógio até **confirmação humana**; não automatizar consentimento de segurança. Minimizar, popup, orientação e retomada devem preservar estado quando o Android permitir, sem duplicar overlays ou interceptar toques invisíveis. Remover `FLAG_SECURE` somente das janelas controladas pelo PokeSearch; não contornar proteções externas. OAuth Google/Discord apenas em fluxos oficiais; WebView Google pode ser barrada; integração externa exige callback oficial. Não compartilhar cookies/tokens nem alegar sessão importada de navegador externo.

## 5. Gates e evidência
Toda alteração visual exige comparação com Pokébola 1, Pokébola 2 e Doces Raros **em modo claro e escuro**, diferentes densidades, janelas popup, gesto e menu aberto/fechado. Rodar Node completo LT169, QA Core LT211, Java LT62, OTA LT173, PGS Android QA e beta Secure/R8 antes de integrar; preservar assets, assinatura permanente e atualização monotônica.

Registrar **PASSOU/FALHOU/BLOQUEADO**, arquivo/commit, vídeo/log e cenário para T01–T28 do prompt mestre LT344. Teste de código não substitui teste de dispositivo. Testar OAuth, gesto/teleporte, reconhecimento real do mapa e Shiny **fisicamente no Samsung** na [issue #350](https://github.com/LucianoToscano/PokeSearch/issues/350). Nunca afirmar APK/publicação sem artefato, digest e workflow oficial verificados.

## 6. Política de alteração
Preservar componentes oficiais anteriores; extrair componente compartilhado antes de duplicar aparência. Toda exceção de dimensão, arte ou transição deve ter justificativa, teste e registro no Guia Mestre. Este documento é requisito para overlays novos e refatorações futuras.


## Adendo LT345 — regra vinculante para todos os menus de sprites e Busca Pokémon

A partir da [issue LT345 #370](https://github.com/LucianoToscano/PokeSearch/issues/370), **não aceitar** menus de sprites, Buscar Pokémon ou Auto Click que sejam apenas visualmente parecidos com os originais: devem compartilhar as primitivas, os drawables e as regras efetivas de geometria dos menus das Pokébolas 1/2 e Doces Raros. Comparar `OverlayQuickMenus`, `dock.html`, `OverlayService`, `RareCandyOverlayService` e `PgsAutoMenus` diretamente. Critérios obrigatórios:

1. **Ancoragem:** a barra e seus submenus permanecem presos à bolha correspondente, mesmo após arrastar, girar, minimizar/retomar ou abrir popup. Nunca deixar um menu flutuando em posição antiga.
2. **Estética:** aparência minimalista, delicada, compacta, intuitiva, elegante e moderna; mesma altura, ícones e padding óptico dos controles de referência, sem aumentos arbitrários. Áreas de toque acessíveis podem ser maiores que a arte visível.
3. **Ícones originais:** fechar (X), personalização (engrenagem+lápis) e notificações (sino) são os mesmos recursos originais, não aproximações. O símbolo Shiny branco/amarelo deve ficar **inteiramente dentro** do sino, alinhado ao seu centro óptico.
4. **Comportamento:** toque para abrir/retrair não desativa a busca; toque longo e arraste preservados; fechar segue semântica da função. Não usar um único estado para visibilidade, execução e temporizador.
5. **Regressão:** comparar capturas em modo claro/escuro e escalas distintas com Pokébola 1, Pokébola 2 e Doce Raro; validar geometria real em pixels físicos e dp, acessibilidade, alpha e persistência antes do merge.
6. **Novos alvos:** modos PokéStop, Ponto Específico e Pokémon + gesto só podem executar quando a tela-alvo foi validada; nenhum gesto em avisos de segurança, confirmação de direção ou conteúdo desconhecido. Um callback de gesto Android não prova sucesso no jogo.

**Estado deste adendo:** regra/documentação registrada, mas implementação e homologação LT345 ainda pendentes. Não anunciar APK LT345 sem build e release verificáveis.
