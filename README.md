# PokeSearch — Android Overlay

**Versão de desenvolvimento: v0.45-beta (versionCode 45).** APK Android separado do PvPPokeGo para testes privados entre amigos desenvolvedores. Package ID: com.lucianotoscano.pokesearch; minSdk 26, compileSdk 36, Java 17, Gradle 8.11.1.

## Interface e funcionamento
- Sobreposição compacta sobre Pokémon GO com engrenagem arrastável. Toque na engrenagem para expandir/recolher somente as opções; sprites permanecem visíveis e deslocam-se para baixo quando as opções estão abertas.
- Seta para cima sob a coluna recolhe TODOS os resultados e opções; engrenagem restaura sprites. X vermelho ao lado do coração encerra o overlay.
- Modos IV100, GL#1, UL#1 e ✨ Shiny opcional, independente da liga. Busca automática em intervalos de 5, 10, 15 e 20 minutos; mínimo de 60 segundos entre consultas efetivamente submetidas. O site fornece até dez resultados conforme limite.
- Sprites P/M/G próximos, com rolagem; ficha de CP/IV/nível/rank/sexo/tamanho/golpes/local/despawn e coordenadas quando disponíveis.
- Menu de configuração em janela separada de aproximadamente 308 x 29dp (expande apenas durante opções). O resto da tela do jogo continua recebendo toques fora da coluna de Pokémon e da barra.
- Favoritos (até 50) no próprio overlay, com busca e Concluir dentro de um único quadro cinza translúcido, blur condicional ao suporte do Android. Alertas gerais/de favoritos, relatório ⚠ TXT/WhatsApp, Pix voluntário.
- Login via site oficial PoGoCoordinates só quando necessário para ✨. Ao concluir, o usuário permanece na Home do PokeSearch, e a sessão é atualizada. O app não solicita senha ou código de amizade em campo próprio.
- Guia rápido ilustrado com os mesmos ícones do overlay no primeiro uso e disponível na Home.

## Verificações e distribuição
O GitHub Actions em [build-overlay.yml](.github/workflows/build-overlay.yml) executa testes de sintaxe e contratos JavaScript, lint, Gradle assembleDebug, teste de unidade, validação ZIP, versão e assinatura APK v2, gerando APK, ZIP do código-fonte, checksum SHA256SUMS e docs.

**Importante:** a assinatura de debug do CI não é chave persistente de distribuição e pode mudar, impedindo instalação sobre builds anteriores. Este é um APK **beta de teste**; não alegar funcionamento real no aparelho sem testar. Para distribuição estável, usar keystore privada persistente, backups seguros e confirmação do proprietário. Atualizações do site podem mudar o DOM e causar falhas de busca. Respeitar os termos e a autorização aplicável ao PoGoCoordinates; não tentar contornar limites. Não registrar códigos de amizade, cookies ou credenciais nos relatórios.

## Arquivos mestres
- [Arquivo mestre v0.45](docs/ARQUIVO_MESTRE_v0.45.md) — única referência prioritária para retomar o projeto em outro chat.
- [Auditoria v0.45](docs/AUDITORIA_v0.45.md) — bugs, correções, matriz de testes e riscos.
- Histórico v0.38–v0.40 preservado em docs; mestre mais antigo v0.36 no Google Drive.
- [Catálogo de bugs e melhorias](https://docs.google.com/spreadsheets/d/1aam5N7DNnzMqJj5giZTdsAmzWkHTWPj-uKcUUVwreiI/edit).

## Próximos passos
Testar no Android a nova interação da engrenagem, recolhimento da coluna, pass-through de toques, seletor de favoritos, login Google/Discord, consultas IV100/GL/UL/✨ e tutorial. A cor translúcida permanece caso o dispositivo não suporte blur. Use ⚠ para exportar diagnóstico TXT sem compartilhar credenciais.

Projeto não afiliado à Niantic, Nintendo ou The Pokémon Company.

## Localização opcional — v0.42
Um **único ícone 📍** na barra de opções abre ou oculta o editor de localização. Dentro do editor, ao lado do campo de latitude/longitude, a chave ON/OFF ativa ou desativa o filtro; um slider permite raio entre **0 e 1.000 km**. Ocultar o painel não altera o estado do filtro. OFF remove coordenadas e raio aplicados pelo app e mantém o modo IV100/GL#1/UL#1 e Shiny que estavam selecionados. Antes de enviar a busca, o aplicativo confere os valores no formulário oficial. A proteção entre consultas permanece em vigor.

## v0.43-beta — indicador permanente do raio + revisão da barra
- Com o filtro 📍 **ON**, o botão de localização exibe o raio em km dentro do mesmo ícone e o dock mostra uma pequena etiqueta `📍 50 km`, inclusive quando as opções estão recolhidas, sem adicionar outro botão. Quando 📍 está OFF, a etiqueta desaparece.
- Corrigida a grade do menu: 12 botões em 12 colunas, com X vermelho na mesma linha e ao lado do coração Pix, sem que o X seja empurrado para uma segunda linha.
- Ao trocar de localização para filtros ou AUTO, o painel de coordenadas libera o foco do teclado e volta ao tamanho normal. Ocultar o editor mantém o filtro ON; desligar limpa os valores do site conforme verificação.
- Nenhum código de treinador, token de autenticação ou coordenadas completas é acrescentado à etiqueta. O app preserva limites mínimos de pesquisa.

## v0.44-beta — correções de usabilidade
Barra responsiva com posicionamento vertical quando não couber ao lado da engrenagem, sequência consistente dos 12 controles, seta contrastante, favoritos mais translúcidos, feedback de AUTO/atualização manual e validação mais rígida das coordenadas. Revisão em código e testes automatizados não substitui comprovação no celular.

## v0.45-beta — AUTO e Shiny
Vencimentos limpam a lista sem iniciar consultas extras; login cancela buscas antigas; falha de Shiny diferencia vínculo pendente de estado não comprovado. Diagnóstico captura apenas status categórico de sessão. Comprovação de uso físico ainda pendente.
