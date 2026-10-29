# LT145 — Contador conservador de Get Coords (não distribuído)

Data: 28/10/2026
Base: LT144 no commit `5dc3b25b560a52f417ae4c4bde7efd0c83efc0a2`
Branch: `feature/lt145-coords-quota-account-20261028`
**Status: implementação inicial em branch, sem CI Android nem homologação física. NÃO publicar como versão final.**

## Implementado
- `coords_quota.js`: só aceita pares de cabeçalhos explicitamente relacionados a revelações de coordenadas; não confunde `X-RateLimit` genérico com saldo da conta.
- `api_browser_transport.js`: revela sob demanda na WebView oficial; agora envia o Bearer da sessão PoGoCoordinates **quando disponível**, sem enviá-lo a Java, logs ou arquivos. Se o servidor informar cota de revelações nos cabeçalhos, repassa somente três números sanitizados.
- `api_android_session.js` e `AuthorizedApiCollector.java`: transporte apenas de dados saneados, sem JWT e sem reveal_code.
- `CoordsQuotaStore.java`: contador de **requisições Get Coords bem-sucedidas observadas nesta instalação**, compartilhado entre as duas Pokébolas. Não presume que seja o consumo total da conta nem o número que será cobrado pelo servidor.
- `OverlayService.java`: conta apenas novas revelações (API e DOM), não cópias de coordenadas já salvas, e informa o detalhe.
- `detail.html`: linha compacta abaixo de Get coords: exibe saldo oficial recente somente se vier validado do servidor; caso contrário exibe *saldo não informado* + contador local de todas as contas.
- Testes: `lt145-coords-quota.test.js` e atualização da suíte LT77 para o GET autenticado.

## Lacunas que impedem afirmar sincronização por Gmail
1. **Ainda não foi demonstrado** que `GET /users/me`, cabeçalhos de `GET /reveal/{code}` ou outro endpoint oficial retornem `limit, remaining, reset` com escopo explícito de *coordinate reveal*.
2. O rastreador local é **por instalação e inclui todas as contas**. Não é um contador por Gmail e não observa revelações feitas diretamente no site, em outro aparelho ou por terceiros.
3. Os nomes dos cabeçalhos testados em `coords_quota.js` são apenas hipóteses conservadoras. Não anunciar o recurso como saldo real até homologar a resposta do servidor.
4. Precisa estabelecer vínculo estável à identidade da **conta PoGoCoordinates** via endpoint autorizado, preservando JWT só na origem e evitando misturar login Premium do PokeSearch com Google/Discord do site.
5. A troca de conta, logout, renovação de credenciais, cooldown e reset precisam de testes.
6. Testar API ON/OFF, Pokébola 1/2, retorno após reinício, aparelho Samsung e bloqueios 401/403/429.
7. Novo APK deve usar `0.01.45` e `54350`, com certificado permanente e QA. Esta branch **ainda não alterou o versionamento**, não compilou o novo APK e não alterou Drive nem manifesto.

## Critérios de aceitação
- Não exibir número oficial de limite/restantes sem evidência específica do servidor autenticado, para a conta ativa e com tempo de leitura identificado.
- Não inferir reset à meia-noite; usar apenas janela/reset informado pela API.
- Mostrar “não disponível” ou “contagem parcial deste aparelho” sempre que não houver cota oficial.
- Respeitar limites e `Retry-After`; não repetir `reveal` para sondar cota.
- Não expor JWT, código de revelação, Gmail completo ou identificadores de conta em logs/compartilhamentos.
- Preservar integralmente LT144, Halloween Gengar/Zubat, dois treinadores, duas Pokébolas, Premium e botão Compartilhar.

## LT144 auditada
- APK Drive: `1Rgp7IeBU4lZ7pCz1fEQDl4x1nIP7Edlx`
- Manifesto Drive: `15IrWg9FpiNteZcsmUSBtyfd4v2Hmcbrf`
- APK `0.01.44 / 54349`, tamanho 48.993.001 bytes.
- SHA256 `93ba1c98f9aeaf1d267d3a5bfb558e3272c36173964d929c3ebc5b887bdb6fbf`.
- Bloco de assinatura v2 identificado no APK; certificado SHA256 `34766c15d09013ad65873f9976539c8fa2f826e917dae3af57ea628cad689e8e`.
- Manifesto do APK: 1025 normais, 1025 Shiny, 716 formas, 106 trajes; verificados os 2050 hashes do campo `sha256`, sem divergência. Os quatro PNGs Gengar 2023 e Zubat 2026 conferem com SHA256 do prompt.
- **Não houve teste físico visual** de Gengar e Zubat nas telas Samsung, nem validação anônima direta do link público por navegador independente neste trabalho.
