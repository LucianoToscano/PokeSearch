# PokeSearch LT145 — QA assinado (28/10/2026)

Versão em homologação: **0.01.45** (versionCode **54350**).
Base pública preservada: **LT144 0.01.44 / 54349**.
Branch: `feature/lt145-coords-quota-account-20261028`.
**Commit exato do APK e dos testes:** `ce966cf70017cfcd2f2675b43b4c056772b971cb`.

## Evidência de build
- GitHub Actions: https://github.com/LucianoToscano/PokeSearch/actions/runs/40635562944
- Resultado da execução: **success**.
- Artifact ID: **12792929439**.
- Arquivo no artifact: `PokeSearch-v0.01.45-LT-QA.apk`.
- SHA-256: `db42208665e9cfaf016cca58cf108cd458a74ab6ba8e84c5ce0952f3f810555b`.
- Tamanho: **49.119.210 bytes**.
- Assinatura APK v2 verificada pelo GitHub Actions.
- SHA-256 do certificado: `34766c15d09013ad65873f9976539c8fa2f826e917dae3af57ea628cad689e8e`.
- Testes JavaScript, testes Android disponíveis e regressões aprovados na execução.

## Funcionalidades aplicadas
1. Sessão PoGoCoordinates verificada em leitura de `/users/me`, sem expor email/JWT à interface nativa. Contador de revelações bem-sucedidas observadas no aparelho.
2. Quota `remaining/limit` apenas quando entregue pela API em campos identificados especificamente para reveal, sem apresentar limite de pesquisa como limite de cópias. **Saldo global por Gmail e reset NÃO confirmados no provedor.**
3. Cooldown experimental: registro local da última captura, confirmado sem publicar no chat; referência por treinador vinculado; desfazer/resetar; estimativa nos cards, redução por relógio local sem requisição adicional. Despawn continua independente.
4. Distância `distance_km` tratada como distância ao centro de busca, não entre dois encontros; só se permite estimativa marcada quando centro da pesquisa coincide com a última captura e a busca está verificada/atual. Caso contrário, indisponível. Tabela comunitária é aproximação, **não garantia de ausência de penalidade**.
5. Corrigido uso de `sourceIndex` versus índice visível na confirmação da captura.
6. Deerling #585 e Sawsbuck #586 Autumn normal/Shiny mapeados por forma exata. Quatro PNGs vindos de commit imutável do repositório PokeMiners, checados por Git blob SHA-1 e manifest SHA-256.
7. Fallback de quatro sprites de Gengar Fall 2023 e Zubat Halloween 2026 com hashes preservados.

## Auditoria ZIP e PNG
- APK validado como ZIP íntegro; manifesto dentro do APK igual ao manifesto externo.
- 1025 sprites normais, 1025 Shiny, 720 variantes, 106 trajes.
- Os quatro PNGs de Autumn e os quatro PNGs especiais de Gengar/Zubat conferidos por SHA-256.
- `assets/cooldown_estimate.js`, `assets/coords_quota.js`, `assets/sprite_offline.js`, `assets/dock.html` e `assets/detail.html` presentes.

## Pendências honestas
- Não foi realizada validação visual em aparelho Samsung ou Motorola. Os testes de código e presença da imagem **não comprovam renderização no WebView**.
- Não foi demonstrado saldo oficial por conta Gmail/Discord, usos no site e janela de renovação; não exibir números inventados.
- Não há confirmação de instalação por cima de LT144 em aparelho real, dados Premium preservados após upgrade, alternância de treinadores ou notificações em uso real.
- Testar num aparelho: ambas Pokébolas; cards normal/Shiny Deerling e Gengar/Zubat; confirmar captura sem chat; desfazer; cooldown visível apenas com distância confiável; ausência de consumo extra de quota; trocar conta/treinador.

## Distribuição
**Não publicar LT145 automaticamente para todos.** O usuário pediu teste/homologação de cooldown antes de distribuição geral.
Em 28/10/2026, o manifesto de atualização permanente `15IrWg9FpiNteZcsmUSBtyfd4v2Hmcbrf` continua em LT144 `0.01.44/54349`, `forceUpdate=false`.
Conservar botão Compartilhar apontando para o APK LT144 público até a aprovação explícita da LT145.
