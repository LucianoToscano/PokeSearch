# LT251 — Corrigir seletor de evolução truncado no simulador (05/11/2026)

## Evidência
No print de Oddish 0/12/14, o painel PC/Nível expandido mostra `Forma` como **“B...”** no lugar de Bellossom; a seleção possui setas de 20px e uma barra de nível com espaço insuficiente. A causa é a regra CSS com três colunas da LT249/LT250, não a ausência da evolução nem erro de cálculo.

## Implementação
- O último override de `detail.html` passa `#psCpSimFields` para **duas linhas** com grid `minmax(0,1fr) auto`: `Forma` ocupa ambas as colunas da primeira linha, e `Nível` e o número ocupam a linha inferior.
- Seletor com largura disponível e 34px de altura; setas de 30px; fonte 12px em nome de evolução; slider de nível usa o espaço livre.
- Painel pode rolar até `min(68vh,430px)`, fonte de 11–12px em resultados e 10px em descrições. Não altera número de linhas do card quando fechado; calculadora aparece somente ao tocar PC ou Nv.
- Preserva dados `familyForms` confiáveis, troca de Teddiursa→Ursaring→Ursaluna, rotas Mega verificadas, cálculo de CP/PS/nível, botão PC-alvo, 0/0/0 e 15/15/15, sem custos fictícios.
- **Mantidas LT250**: três divisões PvP e botão de ataques, uma única identificação 🔵/🟡/🟣, zero em buscas vazias e estado independente P1/P2. Não alterar posição manual, notificações, busca ou API.

## Controle de qualidade
- Novo teste `app/tests/lt251-readable-cp-selector-oddish.test.js`, além de regressões de todos os recursos existentes.
- Candidata **LT251 · 0.02.51 · versionCode 54455 · label 51255**, baseada na LT250 pública.
- Exigir Node completo, QA central, Java, OTA, APK beta, merge, publicação assinada e verificação do SHA-256. Teste visual físico Samsung P/M/G ainda não realizado.
