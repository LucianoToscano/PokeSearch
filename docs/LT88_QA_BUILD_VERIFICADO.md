# LT88 QA — Build protegido verificado (25/10/2026)

**Estado:** PASS automatizado no GitHub Actions; homologação Samsung pendente.

## Proveniência
- Repositório: `LucianoToscano/PokeSearch`; PR #63 Draft.
- Branch: `feature/lt88-lt93-evolution-20261025`.
- Commit de origem do APK: `a2456e0bf79ee47f150e651d8437346f328786b3`.
- GitHub Actions: https://github.com/LucianoToscano/PokeSearch/actions/runs/40174045764 — **SUCCESS**.
- Artefato: https://github.com/LucianoToscano/PokeSearch/actions/runs/40174045764#artifacts, ID `12591188072`, ZIP `PokeSearch-v0.00.88-LT-Cycle-QA-protected-release`.
- SHA-256 do ZIP: `9b6230c09567e06df9a838556379d5dce019627b52a663929dcc283b437e1c90`.
- APK `PokeSearch-v0.00.88-LT-Cycle-QA.apk`, 38.610.023 bytes, SHA-256 `f99593ef50f6e9db0a89ed25b2b9d59e874bb49ef7438d11d2bf5af0c09b7548`.
- Pacote `com.lucianotoscano.pokesearch`; versionName `0.00.88`, versionCode `54291`.
- APK R8 release não depurável, assinatura v2 verificada pelo apksigner.
- Certificado permanente SHA-256 `34766c15d09013ad65873f9976539c8fa2f826e917dae3af57ea628cad689e8e`.
- `SHA256SUMS.txt`, `SIGNING-REPORT.txt`, `SOURCE_COMMIT.txt`, `PACKAGE-VERSION.txt` e `PROTECTION.txt` empacotados no artifact.
- SHA APK reconferido após extração do artifact; ZIP íntegro e APK ZIP validado.

## Escopo implementado nesse APK (somente QA)
1. Favoritos ☆/★ salvos entre contador e botão X, sem linha extra; long press salva, toque carrega.
2. Filtros com título central, botão ▣ com margem direita, superfícies de fundo do tema claro/escuro na rail/editor/flyout.
3. Sprites padrão: cache privado limitado + leitura no menu e resultados, deduplicação de requisições no seletor Pokémon, suporte a espécie NORMAL oficial e placeholder seguro de formas não verificadas.
4. Nomes editáveis dos perfis gerais existentes (3).
5. Deduplicação recente de notificações de spawn e bloqueio de alertas expirados; alertas API seguem em QA suspensos.
6. Três localizações de busca nomeadas (salvar/usar) sem GPS físico, usando Bridge.setLocation.
7. Ajustes dos testes históricos e novas suítes de proteção LT88 e LT91.

## Não concluído / não homologado
- LT88: Samsung físico, detalhes de ancoragem e Despawn observável, medição real de consumo e desempenho.
- LT89: importação/exportação, nomeação dos favoritos, indicadores/desmarcação completa.
- LT90: prioridades de favoritos, diagnóstico voluntário e tuning de bateria.
- LT91: Modo Caçada e alertas/perfis próprios.
- LT92: Mural da Comunidade Firebase seguro/moderado.
- LT93: métricas de versão, administração e privacidade completas.
- Sem PASS Samsung real após instalar este QA; sem merge na main, sem GitHub Release oficial.
- Versão oficial permanece LT87/54290 até autorização específica.

## Checklist físico
Verificar em Samsung menus, fundos, transparências, estrelas perfis, sprites, Forma, Genderless ⚲, GL/UL/IV/Shiny, expirados Despawn, drag Pokébola/cartão, Get coords, favoritos e localização com 24.9407581,121.1889794 e 0/215/1000 km. Não considerar CI sucesso como PASS físico.

## Guia Mestre
O Guia Mestre recebeu append protegido com verificação de hash de prefixo no workflow #40173698711 (SUCCESS), sem modificar o histórico anterior. O presente documento detalha os resultados do build, sem reescrever o Guia Mestre. 
