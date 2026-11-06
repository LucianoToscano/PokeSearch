# PokeSearch — continuar após LT267

Repositório https://github.com/LucianoToscano/PokeSearch
Leia docs/GUIA_MESTRE.md e docs/LT267_AUDITORIA_SPRITES_ICONES_RAIDES_20261106.md.

Base inicial comprovada LT266 (0.02.66/versionCode 54470). Branch LT267 feature/lt267-sprites-raid-icons-20261106, verificar PR, CI, merge e releases/latest.
Corrigido ícone da LC para a Copa de LT265, imagem Mega original substitui mega-symbol.png, nova imagem Sombroso exibida só para Shadow comprovado. Raides mostra "Mega Beedrill" e tipo ilustrado por PNG da LT266, Rank # por tipo. A fonte PvE possui somente um Ágil e um Carregado; não criar segunda recomendação sem dados adicionais.
Sprites 10 exatos (Diwali Pikachu e Squawkabilly Blue/Green/White/Yellow normais e Shiny) integrados via hashes Git blob PokeMiners c2a686... preservando URL da API do site como prioridade. Sem fallback falso.
Revisar em Samsung ambas Pokébolas, modo P/M/G, transparência, cálculos IV A/B, PC, PS e limites de liga, rolagem até coordenadas, close de painéis e tradução de ataques. Não presumir tests físicos.
Conferir CI completo (Node, Java, visual, OTA, PvE) antes de merge. Após, solicitar versão LT267 0.02.67 code 54471 label 51271, confirmar assinatura permanente, tag pública, SHA-256, e atualizar Guia Mestre e auditoria pós-release. Preservar rollback LT266, login opcional e dados PvP/PvE separados.

## Complemento ao terminar LT267
Verificar 18 PNG_512 do ZIP revisado e `rank-geral-lt267.png` em `ui-icons`; antigos LT266 devem ficar intocados. Confirmar hashes novos no APK assinado, regressões Node, Java, WebView P/M/G, PvE, OTA. A imagem RG não modifica algoritmo, apenas aparece nos botões de RG. Publicar LT267 apenas após CI e arquivo mestre atualizado. Não inventar second charged de Raides sem fonte.
