# LT358 — Auditoria avançada PGSharp, scanner e preparação de modelos assinados (15/11/2026)

## Estado e proveniência comprovados
- Repositório: `LucianoToscano/PokeSearch`, `main` verificada no início: `ed3abc7bde530b95d07ba983f491a7955e586364`.
- Última publicação documental e commit confirmados: **0.03.53 / versionCode 54560 / label 51357**; SHA-256 do APK oficial LT357: `e9febb73bdb069a735387b179e026d779d294b360ee32c103c03571df542cec7`. Isso não confirma instalação.
- Referência: APK PGSharp SHA-256 `ed8a7676995088bee463186f6f561f0e400ac43db9c9c1cb346a891c7542a67e`. Inventário e CRC da LT357, sem novo acesso aos bytes neste ciclo: 2.203 entradas, 437 PNGs Android, 168 bundles Unity, 4.548 IDs Addressables, 723 refs externas, 163 refs locais, 15 idiomas, 43.327 pares de traduções por idioma, 66 JSONs auxiliares.
- **Não houve nova extração/descompactação dinâmica do APK nesta sessão.** Dados anteriores são evidência documental LT357, não comprovação de sprites individuais do feed.
- `app/src/main/assets/pgs-native/manifest.json` segue `entries: []`. Imagens obrigatórias de **cartões** recuperadas do APK oficial PokeSearch 0.03.52 **não** são sprites do feed PGSharp. Nenhum arquivo, classe ou conteúdo proprietário foi importado nesta LT.

## Defeitos concretos encontrados, mitigação no código e risco residual
1. **Deadline incompleto (P0).** `PgsAutoIconDetector.find` só verificava 4.500 ms a cada oito linhas de cada template; uma linha com muitos refinamentos de 81 correlações podia exceder o tempo antes de detectar o atraso. LT358 passa a conferir após preprocessamento, ao longo da linha (a cada 32 passos), antes e durante o refinamento, em NMS e no retorno. Qualquer prazo vencido descarta o frame inteiro e expõe `lastScanAborted`, sem gesto. `PgsAutoScanDeadlinePolicy` é puro Java e testável.
2. **Ambiguidade entre formas/variantes (P0).** A LT356 recusava empate de espécies diferentes, mas permitia preferir automaticamente Alola/Galar, normal/Shiny ou outras variantes **nativas** de uma mesma espécie com evidência visual praticamente empatada no mesmo slot. LT358 exige margem de confiança maior que 0,035 entre formas/variantes nativas distintas, ou bloqueia o slot. Não transforma classificação de Shiny por aparência em prova do jogo. Templates pessoais permanecem com semântica anterior.
3. **Diagnóstico obsoleto (P1).** O contador de variantes nativas adiadas era reiniciado depois de saídas prematuras por seleção vazia/incompatibilidade. LT358 limpa o contador no início de cada consulta.
4. **Teste regressivo (P0).** `PgsAutoScanDeadlinePolicyTest`, extensão de `PgsAutoMatchPolicyTest`, contrato Node `lt358-scanner-hard-deadline-and-form-guard.test.js` e inclusão no gate `qa-core-contracts.yml`.
5. **Limitação residual:** verificações periódicas de relógio reduzem risco de sobretempo, mas uma chamada individual de bitmap/correlação pode superar ligeiramente o limite. Thread de captura, concorrência, latência e consumo reais requerem profiling físico. O tempo não é promessa de SLA.

## Matriz de cobertura obrigatória, sem limitar a um Pokémon
A lista lógica inclui todos os **1.025 IDs registrados**, mas uma linha de catálogo **não equivale** a imagem de feed validada. Organizar casos por `(dex, form, variant, providerVersion, resolution, density, uiMode, sourceHash)`, com normal/Shiny, regional, gênero, traje, sombras, mega, outras formas somente quando realmente existentes. Sem fonte autorizada + QA física, status **SEM MODELO**, nunca substituição por arte de Pokédex ou outra espécie.

- Para 1, 5 e 10 espécies ativas: medir recall por forma, falso positivo, falso negativo, empates, número de candidatas, `lastScanMillis`, abortos e CPU/RAM/bateria; incluir ícones adjacentes, rolagem, mudança de zoom, retrato/paisagem, fundo claro/escuro e escala de fonte/densidade.
- Em Samsung e Android compatível, testar em separado: prévia **sem toque**, dois frames estáveis, foco do jogo, tentativa de gesto Android, reação visual do PGSharp, **teleporte realmente comprovado dentro do jogo**, carregamento do mapa, Shiny e Encontro. Capturar vídeo/log com timestamps; callback Android não é prova de teleporte.
- Testar conta sem login, Conta 1/2 independentes, Pokébolas 1/2, Doce Raro, Edu, filtros, persistência, overlays compactos P/M/G, toque longo, rotação, Android 11+, popup e serviço de Acessibilidade.
- Provocar em ambiente controlado telas de segurança acessíveis/não acessíveis; qualquer aviso de conta deve interromper, nunca confirmar. `Sou passageiro` exige ação humana. Se Unity desenhar em GPU sem nós de Acessibilidade, classificar **COBERTURA NÃO GARANTIDA**.

## Biblioteca de miniaturas nativas: protocolo antes de preencher `entries`
**Estado atual: vazia, nenhuma miniatura certificada.** Uma futura ingestão deve exigir: origem individual, direito expresso de redistribuição, tipo de licença, contato/prova auditável, SHA-256, dimensões, ID dex + forma + variante + estado, build do jogo, evidência física Samsung por captura e revisores. Metadados sem evidência não são autorização. Rejeitar duplicates, hashes conflitantes e incompatibilidade da versão exata. Preservar modelos pessoais.

**Atualização remota assinada — PROJETO, NÃO IMPLEMENTADA:**
1. Fixar no APK chave pública própria de assinatura; manter chave privada fora do app/repositório/CI de QA. Preferir Ed25519 com implementação compatível com o Android suportado; avaliar ECDSA P-256 se necessário. Especificar canonicalização binária imutável do manifesto assinado; não assinar JSON com ordenação ambígua.
2. Manifesto assinado deve incluir `schema`, `catalogVersion` monotônico, `minAppVersion`, `providerPackage`, `providerVersion`, hashes/dimensões de cada asset, expiração, chave signatária e revogações.
3. Validar assinatura **antes** de processar qualquer imagem, verificar bytes/hash/dimensões após download, usar staging atômico, limites de tamanho, rollback controlado e armazenamento protegido do maior `catalogVersion` aceito; rejeitar downgrade/replay e revogação inválida.
4. Rotacionar chaves por dupla assinatura/âncoras pré-aprovadas; recuperar apenas pacote anteriormente verificado, nunca relaxar verificação ou permitir atualização HTTP não assinada; catálogo local sempre funciona sem rede.
5. Não habilitar canal OTA de modelos até testes de segurança, decisão formal de direitos, amostras físicas e gates verificáveis. Uma soma SHA-256 em manifesto não assinado não autentica o distribuidor.

## Política de build, regressão e release
Preservar **sem alteração** `app/scripts/build_sprite_bundle.py`, recuperação SHA-pinned da LT357, bloqueios de 401/403/429, dez IDs Samsung normal/Shiny 422,423,459,656,669,670,671,722,723,724 e `scripts/test_lt357_sprite_archive_recovery.py`. Nenhum fallback de outra espécie.

Sete gates para merge: **Node QA, LT169 Node completo, LT211 QA Core, LT62 Android Java, LT173 OTA, PGS APK QA e Secure beta/R8**. Verificar *todos* no SHA final da PR. Só depois fazer merge por SHA esperado. Publicação oficial monotônica **0.03.54 / 54561 / label 51358** dependerá da `main` integrada, preflight do pedido protegido, assinatura permanente, APK público e hash confirmado. Nenhum status será marcado publicado por abrir PR ou iniciar workflow.

**BLOQUEADO sem Samsung físico:** qualidade de reconhecimento por espécie/forma, toque real, teleporte, Shiny, Encontro, UX e desempenho. CI não satisfaz aceite de dispositivo; toda release terá essa ressalva explícita. LT350 PR #385 draft permanece intocada.
