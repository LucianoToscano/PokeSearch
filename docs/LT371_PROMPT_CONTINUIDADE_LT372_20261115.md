# PokeSearch — ARK LT372 | Continuidade após LT371

**Data do fechamento:** 15/11/2026 (America/Fortaleza). Repositório: `LucianoToscano/PokeSearch`.

Leia `AGENTS.md`, `docs/GUIA_MESTRE.md`, `docs/LT371_MODO_NOTURNO_SUPERVISAO_20261115.md`, `docs/LT370_DRIVE_PGTOOLS_PAS_PAC_AUDITORIA_20261115.md` e o padrão de overlay `docs/PADRAO_OFICIAL_OVERLAYS_POKESEARCH.md`. Preservar integralmente as funcionalidades LT369/LT370, estilos compactos P1/P2, modelos, filtros, contas, dados, assinatura e caminhos OTA.

## Base confirmada no código

- **LT371 implementação:** [PR #448](https://github.com/LucianoToscano/PokeSearch/pull/448), merge squash `f86e083b8889f7bca7f2c97abfb8956db8a34b49`, head `23425a9ec1a36826199fd67ac645edf273eaadb1` com **7/7** gates de CI aprovados: Node #43784223271, LT169 #43784223098, LT211 #43784223089, LT62 Java #43784223113, OTA #43784223158, PGS QA APK #43784223154, Secure beta/R8 #43784223188.
- **Pedido oficial LT371:** [PR #449](https://github.com/LucianoToscano/PokeSearch/pull/449) integrada à main via squash `8d7fb07711cc5f614bdf02b68eace0567edf7aa7`. Solicita `0.03.67 / versionCode 54574 / label 51371`, anterior `v0.03.66-54573`. Os seis gates da PR e preflight passaram, com workflow oficial disparado [#43786477267](https://github.com/LucianoToscano/PokeSearch/actions/runs/43786477267). **Verificar o resultado público do workflow antes de declarar LT371 oficialmente publicada ou compartilhar APK.** Revalidar tag `v0.03.67-54574`, asset `PokeSearch-v0.03.67-LT.apk`, status completed/success, assinatura permanente e SHA-256 fornecido pelo GitHub. Se faltar qualquer prova, não afirmar publicada.
- **O que LT371 implementou:** `☾ Modo noturno · PGSharp`, na aba Ação compacta da Central, com confirmações manuais não persistidas de Autowalk e Virtual Go Plus já ativados no PGSharp. A supervisão do PokeSearch verifica jogo em primeiro plano, avisos de segurança e concorrência com outros motores a cada 30s; para **apenas a supervisão** e notifica. Ícone lunar na bolha. Não envia gestos nesse modo, não ativa/para recursos de terceiros, não caminha/captura por conta própria, não usa GPS falso.
- **Limites:** o PGSharp é responsável por Autowalk e Virtual Go Plus; VGP depende das condições e edição do cliente. PokeSearch não sabe se ambos estão conectados nem se ocorreu captura. Pokemod/Outro ainda sem equivalência homologada. Android pode suspender o monitoramento ao bloquear tela ou matar Acessibilidade; nenhuma garantia de funcionamento até amanhecer. Não atravessar prompts de passageiro, conta, localização, login ou segurança. Cliente modificado pode contrariar regras do jogo.

## P0 — Homologação física

1. Testar PGSharp em aparelho com as funcionalidades efetivamente ativas e autorizadas, Android 11/13/14, por sessões curtas e longas. Separar `observou personagem andar`, `observou tentativa de captura`, `confirmou captura no jogo`, `supervisão ativa` e `notificação recebida`; não inferir uma coisa da outra.
2. Testar tela acesa/bloqueada, jogo em primeiro plano/segundo plano, bateria, economia de energia, perda de permissões, VGP desconectado, Pokébolas indisponíveis, mochila cheia, aviso de segurança e alternância de perfis. Marcar `PASS`, `FAIL`, `BLOQUEADO` com evidência por caso.
3. Testar início/parada da supervisão no menu compacto; confirmar que parar PokeSearch **não** pára Autowalk/VGP do PGSharp e que início de outros motores não executa gestos simultâneos. Testar acessibilidade (TalkBack), rotação, densidades, P/M/G e visibilidade do estado lunar.
4. No Pokemod, não prometer caminhada/captura automática até verificar como o cliente oferece, ou não oferece, esses recursos. Não importar injetores de outros APKs nem suas rotinas internas.

## P1 — Próxima implementação LT372

- **Prioridade técnica:** diagnóstico da conexão real do VGP e do estado do jogo *somente se observável via UI/acessibilidade com consentimento*, sem API privada. Sem prova, usar `não confirmado` e pedir verificação manual.
- Indicadores de saúde de sessão: última leitura, notificações locais, ausência de jogo, pausas explicadas, resumos verificáveis; nenhuma contagem de capturas inferida de toques.
- Pré-validação visual de inventário/bolas com amostras autorizadas, sem alegar captura automática completa.
- Expandir a arquitetura de provedor somente com evidências de compatibilidade para PGSharp e Pokemod; não confundir arquivo APK instalado com mod em execução.
- Ajustar eventual falha detectada em teste físico antes de publicar novas promessas.

## ARK e release

Auditar código/CI + identificar melhorias, corrigir em branch, criar regressões, exigir **7/7 gates `completed/success` no mesmo SHA** e testes físicos quando a funcionalidade depender de tela. Fazer merge, gerar pedido de publicação monotônico (para LT372, versionCode >54574 **somente depois de confirmada LT371**), workflow permanente, assinatura original, APK público não-draft + hash. Atualizar `AGENTS.md`, `docs/GUIA_MESTRE.md`, auditoria e este ARK, distinguindo código integrado, publicado e homologado. Nunca declarar instalação no celular sem confirmação.
