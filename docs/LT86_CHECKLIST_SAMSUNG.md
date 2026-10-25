# Checklist Samsung LT86 QA — somente evidência física

Instalar o APK privado assinado `PokeSearch-v0.00.86-LT-API-QA.apk` **apenas após** GitHub Actions confirmar SUCCESS e verificar hash, certificado e versionCode 54289.

| Cenário | Resultado | Evidência |
|---|---|---|
| Menus repetidos, troca, fora, horizontal/vertical | PENDENTE | gravação Samsung |
| Pokémon sugestões sem digitar; sprite base confiável | PENDENTE | screenshot |
| Formas: primeiros 60 e Mostrar mais até >200 | PENDENTE | screenshot |
| Escolha múltipla de formas e confirmação na API | PENDENTE | requisição/resultado redigidos |
| Nível 50 no seletor e `level_max:50` aplicado | PENDENTE | inspeção do request sem segredo |
| Sexo/tamanho/clima/ordenar com marcação | PENDENTE | screenshot |
| Login Google, API ON default, escolha DOM persistente | PENDENTE | teste de instalação |
| Shiny treinador vinculado, GL/UL, IV Raw/% | PENDENTE | busca autorizada |
| Geofiltro `24.9407581,121.1889794`, raios 0/215/1000 | PENDENTE | captura |
| Limpar coords e raio sem afetar filtros alheios | PENDENTE | captura |
| Get coords verdadeiro do spawn; 401/403/429 | PENDENTE | teste e códigos sem segredos |
| Notificações/Favoritos/Editor Visual/arraste Pokébola | PENDENTE | regressão Samsung |

Nunca converter um PASS automatizado em PASS físico. A imagem dos Pokémon especiais só deve ser exibida quando houver URL validada; placeholder neutro é permitido.


## Complemento de verificação física

- [ ] Abrir Pokémon e Favoritos, observar imagens simultâneas da mesma espécie e carregamento alternativo quando houver rede.
- [ ] Verificar que sprites de trajes/formas especiais sem fonte validada continuam usando placeholder (não imagem incorreta).
- [ ] Ver ⚲ Genderless nas Informações de Voltorb com dados de sexo confirmados; verificar após ativar a linha Sexo.
- [ ] Com todas as Informações expandidas, arrastar a Pokébola até as bordas direita e esquerda, testar giro horizontal/vertical, sem travar ícone nem cortar controles; conferir que resultados reancoram.
- [ ] Em Filtros, ▣ > 1/2/3 > Salvar/Usar; verificar persistência após fechar o app; não modificar Shiny, localização, favoritos nem preferências de outros perfis.
- [ ] Em Favoritos, ▣ > segurar 1/2/3 salva, tocar carrega; confirmar grade 10×5, limite 50 e independência de notificações/sons.


## Cartão, informações e Despawn
- [ ] Editor Visual > Info Pokémon > ✓ Mostrar todas as informações: Despawn, PC, nível, IV Raw/%, sexo ⚲, golpes, local, distância e GL/UL/ML confirmados, sem valores inventados e com rolagem no texto.
- [ ] Quando ordenar por distância e usar raio válido, conferir que o campo Distância aparece sem desligar outros dados; verificar requests do site/API.
- [ ] Quando faltar rank de PvP, campo correspondente ausente em vez de valor calculado sem identidade.
- [ ] Drag da Pokébola até o lado direito com todas informações ativas; depois arrastar *o cartão de detalhe* pelo cabeçalho sem mover Pokébola. ×, Get coords e Favoritos devem continuar clicáveis.
- [ ] Ao expirar um Pokémon (Despawn 0), verificar que sprite/card desaparece mesmo com info Despawn oculta e com Atualização OFF, sem recarregar spawn vencido. Observar se nova busca respeita limite do servidor.
- [ ] Verificar sprite de resultados com rede lenta: fallback CDN permitido somente para espécie padrão PokeAPI; forma/traje continuam sem sprite suposta.
