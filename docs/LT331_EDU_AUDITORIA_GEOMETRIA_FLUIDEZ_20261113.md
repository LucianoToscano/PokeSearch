# Edu — auditoria crítica das 68 sprites LT330 (13/11/2026)

**Estado:** REPROVADO para nova publicação visual integral; issue [#334](https://github.com/LucianoToscano/PokeSearch/issues/334). A última versão pública confirmada antes desta mudança é `v0.03.29-54535` LT330. Não apresentar a próxima release como remasterização aprovada enquanto as 68 imagens não forem corrigidas.

## Evidências e método

Quatro screenshots reais mostram saltos de escala, fisionomia e fantasia em idle: entre as poses de Pokébola, jogando, Mewtwo e #42 Parado. Uma triagem dos 68 PNGs **fornecidos pelo proprietário** (`Sprites_Edu.zip`) comparou o componente escuro dominante do cabelo, centro/topo óptico e base central de pés. Esses valores são indicativos de divergências **nas fontes**, não um hash/medição independente dos masters efetivamente empacotados no APK.

- #42 canônica: largura aparente do cabelo ~213px em 512, topo ~41px, base central ~476px.
- #00–03: largura ~146–149px (~−30 a −31%) e pés ~455px. Preservar Pokébola como objeto independente da geometria.
- #05–08 (caminhada frente): ~185–201px (~−6 a −13%) e topo oscilando entre ~58–87px.
- #24–27 (direita): 196–197px (~−8%); #32–35 (esquerda): ~202px (~−5%). Esses dois ciclos são próximos em escala e foram mantidos temporariamente em idle.
- #29 (mapa): ~174px (−18%); #63–64 (jogando): ~172px (−19%). Requerem ajuste real de cabeça/corpo separado dos acessórios.
- **44 de 44** poses comuns sinalizadas pela triagem estrita por ao menos uma discrepância de cabeça (±2%), centro/topo (±4px) ou pés (±4px). Algumas poses têm movimentos verticais legítimos, portanto esse sinal **não equivale a reprovação artística isolada**.
- **23 quadros especiais** (arrastado 9–18, teleporte 52–60, Shiny 62, armaduras/Sombria 65–67) não receberam aprovação automática; exigem comparação manual por máscaras.
- #42 permanece intocada e referência de identidade.

## Causa de interface comprovada

`RaidDayAssistantOverlayService.EDU_IDLE_ROTATION` na LT330 incluía Pokébola, caminhada frente/laterais, jogando, Shiny e duas armaduras Mewtwo. O usuário via mudanças de identidade/traje sem ação. Como mitigação conservadora, a branch associada a este relatório restringe o **idle automático** aos ciclos laterais direitas 24–27 e esquerda 32–35; preserva todas as 68 poses e mapeamentos de eventos/ações no atlas. **Isso diminui o salto, mas NÃO corrige todas as artes**.

## Gates exigidos antes da release visual

1. Artista/sistema de edição refaz anatomia da cabeça/óculos/rosto a partir de #42, evitando correções por escala global nas cenas com acessórios.
2. Entregar novos PNGs 512 transparentes para os 68 índices, com quadros especiais tratados separadamente (teleporte, arrastado, armaduras); #42 idêntico pixel a pixel.
3. Validar cada máscara de personagem: ±2% largura de cabeça em poses comparáveis; ±4px centro/pés não intencionais, corte ≤0,8%, nenhum quadro vazio.
4. Rever GIFs sequenciais e transições em tamanhos reais P/M/G (100/150/200 px), inclusive do fallback 128, além do teste visual real Samsung.
5. Atualizar ZIP de masters, SHA-256, fragmentos binários, fallback, testes de UI e registro mestre, rodar CI de Android e integridade do APK assinado.
6. **Não habilitar versão pública somente por passar Node, Gradle, SHA e 512×512.** A uniformidade visual ainda não está comprovada.

A arte de referência, os relatórios completos de 68 linhas e GIFs de inspeção foram gerados na conversa de auditoria. Os protótipos de 7 quadros são **experimentais**, não um pacote aprovado para o APK.
