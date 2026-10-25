# QA LT100 — Localização em quatro linhas compactas
Data: 25/10/2026. Branch PR #65 preservada, sem merge.

## Layout final confirmado pelo proprietário
1. `Localização [Colar ↓] [Copiar]` — cabeçalho centralizado.
2. `[ 53.759856,-1.495755 ]` — campo em largura integral, aceita até 30 caracteres, sem cortes para coordenadas de precisão usual.
3. `[-------------●--------------]` — **slider de 0 a 1000 km da mesma largura exata do campo de coordenadas**, alinhado verticalmente.
4. `[0000] km [✓] [🗑]` — raio numérico e ícones aplicar/limpar centralizados com espaços pequenos.

Janela com 286dp máximo e altura proporcional às quatro linhas, mantendo transparência/cores existentes. O slider continua sincronizado bidirecionalmente com campo numérico; limpar zera editor, raio e slider. Preservar `Native.pasteLocationCoords()`, `Native.copyLocationCoords()`, `Native.setLocation()` e qualquer outro filtro. Setinha de Colar é para baixo.

## Segurança e homologação
APK QA **0.00.100 / versionCode 54303** em pipeline permanente assinado (R8, não debuggable), sem substituir 0.00.99. Testes Node verificam estrutura, CSS, inputs e ausência de regressões; **a aprovação visual Samsung só ocorre após print/teste físico do proprietário**. Firebase em produção não é ativado neste trabalho. Não fazer merge, Release ou alterar o APK público do Drive.
