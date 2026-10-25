# PokeSearch QA 0.00.101 — Mural scrapbook e Agradecimentos compactos
Data: 25/10/2026. Continuidade da PR #65 `feature/pokesearch-home-scrapbook-thanks-qa98-20261025`. Não recomeçar, não mesclar, não alterar aplicativo público no Drive.

## Decisões de UX
1. A Home mantém sua única tela e background. O antigo **cartão largo** da homenagem dá lugar a um **atalho cápsula pequeno e alinhado à direita** sob o banner de atualização. Ele traz miniatura original em 31×39dp e rótulo **💙 Agradecimentos**, ~48dp de altura. Não ocupa toda a largura nem flutua sobre filtros ou contadores. Tocar abre a mesma imagem WebP vertical completa, offline e sem cortes, com zoom, X/Voltar e compartilhamento seguro via FileProvider.
2. O Mural passa a apresentar três **balões de scrapbook** com avatar circular, autor, categoria e mensagem. Tons pastéis no tema claro e tons discretos no escuro; recuos menores, tipografia legível, espaçamento enxuto, bordas suaves. Os exemplos são claramente identificados por **EXEMPLOS FICTÍCIOS** — nunca simular publicações reais de pessoas reais.
3. “Ver todos” expande o Mural **na mesma Home**. Chips de categorias Recados/Sugestões/Bugs/Dicas, 20 publicações mais recentes em ordem decrescente, ações Curtir/Responder/Denunciar e editor de recado compacto com apelido e categoria lado a lado. **Não abrir Activity nova** nem usar rolagem aninhada; o usuário rola a Home inteira.
4. O cliente continua com postagens e respostas diretas condicionadas a Auth anônimo, regras Firebase e `scrapbook/config/allowDirectPosts=true`. Este projeto não implanta regras, não abre o feed para produção e mantém o QA atrás das flags build `SCRAPBOOK_STAGE1_QA` + `SCRAPBOOK_ONLINE_QA`. Denúncias confidenciais e validadores não foram enfraquecidos.
5. A janela Localização permanece na estrutura LT100 com quatro linhas: cabeçalho/Colar/Copiar, entrada de coordenadas até 30 caracteres, slider de largura idêntica, [0000]km + ícones Aplicar/Limpar. Todos os outros filtros são preservados.

## QA
- Nova candidata `0.00.101/versionCode 54304`, destinada a APK assinado e protegido por R8, não depurável, certificado permanente.
- Testes automatizados: UI sem Activity adicional, mini-atalho de 48dp, dois WebP aprovados sem modificação, três exemplos fictícios, cards em formato scrapbook, feed de até 20 recados, nenhuma escrita Firebase ao usar preview e localização LT100 intacta.
- Teste físico obrigatório Samsung: primeira renderização, tema claro/escuro, texto longo, scroll, teclados, expansão/recolhimento, visualizador homenagens em paisagem/retrato, localização completa.
- **Não equivaler CI a homologação física; não anunciar mural online** antes de implantação das regras e confirmação de flag servidor. APK público/Drive permanece sem mudanças.
