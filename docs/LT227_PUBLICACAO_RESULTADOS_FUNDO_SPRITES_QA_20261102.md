# LT227 — Envio público: P/M/G, sprites visíveis e modo sem fundo

Referência 02/11/2026. Base pública anterior: LT215 (0.02.15 / code 54422).
LT226 QA (0.02.26 / 54433) corrigiu a silhueta alfa. Uma correção posterior na main remove molduras residuais do modo sem fundo. A distribuição pública será LT227 (0.02.27 / 54434), superior ao QA 54433 já instalado por alguns usuários.

## Incluído
- Resultados P/M/G: cartões P30/M40/G50dp, arte 88%, normalização de alfa visual visando ~87% da silhueta quando a origem permite CORS. O arquivo de imagem não é modificado.
- Com fundo mantém escolhas e transparência do Editor Visual.
- Sem fundo remove backgrounds, bordas, sombras e pseudo-molduras do container, .spawn e .spriteStage.
- Duas Pokébolas independentes; login opcional, Shiny pausado e cotas de PoGoCoordinates preservadas.
- Sem alteração da assinatura Android nem do fluxo de autenticação.

## Arquivos e testes
app/src/main/assets/dock.html, app/src/main/assets/sprite_visual_scale.js, app/tests/lt226-visible-sprite-alpha-fill.test.js, app/tests/lt227-frameless-results.test.js, app/src/main/assets/release_notes.json, workflow oficial LT227.
Exigir Node completo, OTA, Android/JVM, R8, pacote com versionCode 54434 e versionName 0.02.27, certificado SHA-256 original 34766c15d09013ad65873f9976539c8fa2f826e917dae3af57ea628cad689e8e, integridade APK e hash do asset.
Release antiga permanece preservada para histórico.

## QA físico ainda pendente
Em Samsung, validar P1 e P2, P/M/G, fundos ON/OFF, horizontal/vertical, sprites especiais e fantasias, CORS bloqueado, detalhes, cliques, arrastar janelas e OTA sobre LT215 e QA LT226 sem limpar dados. Testes automatizados não comprovam a exibição final em todas as telas. Instalação depende da confirmação Android.
