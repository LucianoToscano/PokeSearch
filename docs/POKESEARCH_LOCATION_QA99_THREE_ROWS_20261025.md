# Localização QA99 — layout de três linhas em Samsung

Data: 25/10/2026 · Branch PR #65 preservada, sem merge.
Referência: últimos dois prints do usuário. Layout alvo final **sem slider visível**:

- Linha 1: **Localização** + botão **Colar ↓** + botão **Copiar**, no mesmo alinhamento central.
- Linha 2: **um único campo de coordenadas** com capacidade para **até 30 caracteres** (exemplo `53.759856,-1.495755` e pares negativos longos), sem cortes visuais; texto monospace 12px e largura da janela.
- Linha 3: **[0000] km [✓] [🗑]**, centralizada, com espaçamento pequeno. Raio é validado em **0–1000 km**, botões são iconográficos e têm rótulos acessíveis.
- Janela sem lados gigantes: no máximo 286px e no máximo 165px de altura, com 3 linhas e margens contidas; respeitar tema/transparência selecionados no Editor Visual.
- A seta de Colar deve apontar **para baixo**, ao contrário do desenho anterior.
- O objeto `slide` foi preservado para sincronismo interno de controle/limpeza, mas **não é adicionado ao DOM**, portanto não ocupa uma linha nem aparece na tela. Novo markup é `panel.append(title,fieldRow,label,message)`.
- Ponte `Native.pasteLocationCoords`, `Native.copyLocationCoords`, `Native.setLocation` verdadeira e falsa, regex de latitude/longitude e outros filtros intactos.
- Distinguir testes Node e Gradle de homologação física. Confirmar via screenshot Samsung antes de merge/Release.
- Workflow candidato assinado QA `0.00.99/54302` (versão crescente), certificado permanente R8, Release não debug. Não substituir binário QA 0.00.98 ou Drive público automaticamente.

## Retificação LT100
O usuário enviou nova imagem esclarecendo que o **slider é obrigatório**, com a mesma largura do campo de coordenadas. A exigência 'slider invisível' foi revogada. Veja `POKESEARCH_LOCATION_QA100_FOUR_ROWS_20261025.md`.
