# Auditoria técnica — PokeSearch v0.43-beta
Data: 14/10/2026. Referências: arquivos mestres v0.36–v0.42, capturas reais e revisão de `main` do repositório `LucianoToscano/PokeSearch`.

## Bugs / mudanças da revisão final

| ID | Prioridade | Problema ou solicitação | Medida implementada | Validação |
|---|---|---|---|---|
| PS-035 | P2 | Usuário quer identificar raio ativo mesmo ocultando o editor 📍 | Etiqueta não interativa `📍 50 km` acima da coluna e texto `50km` dentro do botão 📍 ON; desaparece ao desligar | Teste estático e CI; visual Android pendente |
| PS-036 | P1 | Menu tem 12 botões mas apenas 11 colunas e pode cortar o X | Grid com 12 colunas totalizando 329 px; X permanece junto ao coração no mesmo fundo padrão | Teste automático compara colunas e botões; Android pendente |
| PS-037 | P1 | Abrir modo/AUTO diretamente após editor 📍 deixava janela focável ao teclado | Libera foco/estilo de popup de localização ao alternar menus | Teste de contrato; aparelho pendente |
| PS-023 | P1 | Sprites com intervalos visuais excessivos na versão anterior | Linhas `spriteSize-8` com limite mínimo e rolagem | Código e teste estático; conferência visual pendente |
| PS-024 | P1 | Recolhimento acima da engrenagem | Chevron ^ depois da lista; engrenagem restaura resultados | Código e teste estático; conferir toque real |
| PS-025 | P2 | X vermelho fora da barra | Mesmo padrão da barra, imediatamente após Pix | Conferido no HTML/CSS; conferir em diferentes tamanhos |
| PS-026 | P0 | Zona transparente interceptava toques do Pokémon GO | Barra e coluna em janelas `TYPE_APPLICATION_OVERLAY` separadas, limita área tocável da barra | Compilação; teste de pass-through pendente |
| PS-027 | P1 | Favoritos com dois quadros, títulos repetidos, botão fora do painel | Único diálogo translúcido arredondado com Concluir interno e blur opcional | Compilação; teste de toque, foco e blur pendente |
| PS-028 | P2 | Login voltava ao jogo em vez da Home | Manter MainActivity visível ao sair do WebView | Teste de contrato; aparelho pendente |
| PS-029 | P2 | Tutorial confuso e símbolos divergentes | Guia HTML visual, ícones SVG equivalentes, novo trecho sobre 📍 e raio | Conferência do arquivo; visual Android pendente |
| PS-031–034 | P1/P2 | Opção de localização não integrada e desativação pouco clara | Pin único, chave inline, colagem, slider 0–1000, ocultação independente, OFF limpa, verificação no site | Código e CI; autenticação real pendente |

## Auditoria de integridade
- Menu tem 12 botões em 12 colunas. Cabeçalho flutuante separado da coluna de sprites.
- `#locBadge` é apenas texto com `pointer-events:none`; não cria uma segunda ação 📍.
- Valor mostrado na etiqueta provém do estado do filtro `locationEnabled`/raio, não de coordenadas; OFF limpa o indicador.
- `toggleChoices` libera foco ao sair do painel geográfico. A ação Ocultar não altera o estado ligado/desligado.
- Fonte de dados continua dependente do DOM real de PoGoCoordinates e de sessão autorizada. Leitor tem validações para IV100, GL/UL e Shiny opcional; mudanças do site podem exigir adaptações.
- O throttle mínimo de 60s e intervalos de 5/10/15/20m reduzem requisições repetidas, **mas não garantem imunidade a bloqueios**.
- `BugReport` limita histórico e mascara dados sensíveis comuns; revisar relatórios exportados antes de compartilhar.

## Critérios técnicos exigidos
1. Node --check em scripts JS; `node app/tests/probe-smoke.test.js`; `node app/tests/overlay-ux.test.js`.
2. `gradle :app:testDebugUnitTest :app:assembleDebug :app:lintDebug`.
3. `unzip -t` APK, `apksigner verify` APK v2 e `aapt` confirmando `versionCode=43`, `versionName=0.43-beta`, pacote correto.
4. Artefato de GitHub Actions contendo APK, ZIP do source, SHA256SUMS, mestre, auditoria; confirmar que commit do run corresponde ao commit esperado.
5. Atualizar Google Drive do projeto e catálogo de bugs, preservar backups anteriores.

## Pendências que não devem ser descritas como resolvidas experimentalmente
- Verificar no celular se o fundo da barra não bloqueia toques e os menus abrem corretamente à direita/esquerda.
- Login Google/Discord e vinculação do treinador, atualização da sessão ao voltar à Home.
- Funcionamento real de Coords/Area, raio 0/50/1000, Shiny, IV100/GL#1/UL#1.
- Legibilidade do indicador 📍 ao abrir/recolher o menu, com raio mínimo/máximo, e espaçamento entre Pokémon em P/M/G.
- Blur em Android 12+ e entrada via teclado de favoritos e relatório.
- APK debug ainda **não é release estável**; certificados de CI podem impedir atualização sobre outra beta. Criar keystore permanente apenas com autorização do proprietário.

## Sugestões futuras (não aplicadas nesta versão)
- Instrumentação de interface Android em dispositivos/emuladores de diferentes larguras.
- Padrões alternativos de densidade de sprites, caso a transparência interna dos sprites varie.
- Expor status de permissão/atualização em diagnóstico exportável, sempre sem tokens, código de amizade ou coordenadas completas.
