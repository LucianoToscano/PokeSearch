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
