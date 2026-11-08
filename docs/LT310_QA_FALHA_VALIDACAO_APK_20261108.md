# LT310 QA — atualizador GitHub: erro genérico ao baixar LT309

Data: 08/11/2026. Base pública: LT309 / 0.03.09 / code 54515. Evidência: captura Samsung, o aviso encontra a LT309 e exibe **Não foi possível validar o APK** no diálogo antes do instalador.

## Diagnóstico comprovado e limites

- O código LT309 agrupa em uma única mensagem erros HTTP, conexão, timeout, redirecionamento, armazenamento e SHA/certificado; a captura **não comprova** que o APK público esteja corrompido.
- GitHub Actions oficial LT309 #42482922039 concluiu `success` em preflight/publish, verificou a assinatura v2, pacote, tamanho, SHA-256 do APK e digest/bytes do asset da Release.
- O cliente Android usava 6500 ms para conexão e 10000 ms para cada leitura, que podem ser insuficientes em rede lenta. Este é um risco, não um diagnóstico de timeout comprovado.
- Não existe log sanitizado Android da falha específica nem confirmação de instalação no Samsung.

## Alteração limitada

1. Categorizar falhas sem expor dados de TLS, URLs de redirecionamento ou exceptions completas; tratar como erro, nunca instalar APK inválido.
2. Exibir imediatamente **Baixar APK oficial pelo navegador** como alternativa segura mesmo se o download embutido falhar.
3. Aumentar tempo limite HTTPS (12 s conexão / 30 s leitura), preservando whitelist de hosts/HTTPS, limite de tamanho, SHA-256, pacote, code e certificado fixo.
4. Preservar todas as outras telas, relógio e sprites do Edu, dois overlays P1/P2, Doce Raro, APIs, assinatura e permissões.

## Testes

- `node app/tests/lt310-updater-validation.test.js` valida contratos estáticos de integridade, categorização e alternativa externa.
- Necessários ainda testes CI Java/Gradle/OTA/Node e validação física na Samsung: uma tentativa com Wi-Fi, uma com conexão ruim e instalação manual por link oficial. Não afirmar QA físico ou causa-raiz sem evidência.

## Distribuição

A LT309 permanece oficial até revisão/CI; esta branch NÃO publica nem substitui o APK. Uma eventual LT310 (code maior que 54515) requer merge, certificação de testes e pedido oficial de release.
