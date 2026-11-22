# PokeSearch/PGBR — Golbat, PoracleNG, ReactMap, wwm-uicons, PokeXperience (22/11/2026)

**Status:** implementação de gateway **opt-in**, filtros do radar PokeSearch, exportação e metadados de sprites em branch de desenvolvimento. Nenhum feed mundial de terceiros desbloqueado; PR sem merge, sem APK publicável.

## Protocolo e versões
- PokeSearch main base da PR anterior #556: `54246b7d68a199d2f2ddda0897dbc543ad0d4f9f`. Esta branch inicia no HEAD `7caa4270d691c07da2ecbb55f32e9cd99d12a49b` da PR #556 para não modificar a entrega anterior, e deverá ser integrada por PR empilhada.
- PGBR main base `5087e7486e90f84167017b500cc8c3319e050825`; correções UI e header em branch `fix/radar-source-filter-search-20261122`.
- [Arquivo Mestre central de referências no Drive](https://docs.google.com/document/d/12-I-rUfnQR0YL_mDExTJfx2zXgfxgB8-Bkp2tyuVPfI/edit), [Mestre do Banco de Dados](https://docs.google.com/document/d/1eICcw5lHl-vg3H_5HcGCF3p-TICD_zOuvSxo3kEZnk4/edit).

## 1. Golbat + PoracleNG, ingestão de eventos
Documentação Golbat: https://github.com/UnownHash/Golbat/blob/main/webhooks.md
API Golbat: https://github.com/UnownHash/Golbat/blob/main/api.md
API PoracleNG: https://github.com/jfberry/PoracleNG/blob/main/API.md

Novos módulos:
- `functions/authorized-spawn-gateway.js`: servidor HTTP **local em memória** para POST `/webhook/golbat` e GET `/raw_data`. Recebe lote de envelopes `type:"pokemon"`, valida cada encontro com módulo da PR #556, preserva IV verificado por componentes (sem degradar na atualização), descarta expirados, deduplica e oferece filtros locais por viewport, espécie, IV, PC e nível (no estilo de arquitetura ReactMap). Inclui JSON `pokemons[]` e `gyms:{}` compatíveis com o parser PGBR. Não cria dados nem roda scanner.
- `scripts/run-authorized-spawn-gateway.js`: servidor inicia **somente em 127.0.0.1**, porta 8765 padrão, com opt-in `POKESEARCH_SOURCE_AUTHORIZED=confirmed` e três variáveis de configuração para IDs/segredos. Para servir aparelhos externos, é necessário proxy HTTPS de um operador autorizado, firewall/allowlist, autenticação e governança. **Não** expor diretamente à internet.
- `functions/authorized-spawn-gateway.test.js`: testes de POST, recusa sem chave, normalização, GET, janela geográfica, IV e expiração.
- Fontes de inspiração: PoracleNG (padrão de filtros, geofence e alertas) e Golbat (contrato de webhook). Nenhuma implementação ISC/Unlicense/GPL externa foi copiada; próprio código PokeSearch foi escrito para este contrato.

### Configuração operacional de LABORATÓRIO autorizada
Antes de iniciar, o operador confirma o direito de consumir o feed, configure em variáveis privadas (exemplo ilustrativo; NÃO colocar os segredos em Git):
```
export POKESEARCH_SOURCE_AUTHORIZED=confirmed
export POKESEARCH_SOURCE_ID=meu_scanner
export POKESEARCH_INGEST_SECRET='ESCOLHER_UMA_CHAVE_ALEATORIA_LONGA_AQUI'
export POKESEARCH_READ_SECRET='ESCOLHER_OUTRA_CHAVE_ALEATORIA_LONGA'
node scripts/run-authorized-spawn-gateway.js
```
Golbat pode adicionar um cabeçalho `X-Source-Secret` na configuração de envio; sem a chave correta os POSTs recebem 401. A chave de leitura `X-Feed-Secret` é diferente e deve ser configurada manualmente no painel HTTPS RocketMap do PGBR (nova branch PGBR). O PGBR mantém essa chave apenas na memória do diálogo e não a grava em SharedPreferences nem na URL. Um proxy HTTPS exposto pelo operador pode encaminhar o header privado ao gateway local; a configuração de TLS/proxy e autenticação não é criada por este projeto.
Exemplo de consulta à instância local **somente para testes**:
```
curl -H "X-Feed-Secret: SUA_CHAVE_DE_LEITURA"   "http://127.0.0.1:8765/raw_data?swLat=-6&swLng=-36&neLat=-5&neLng=-35&pokemon=true"
```
Em um dispositivo externo use **HTTPS** servido pelo proxy autorizado, não URL HTTP e nem IP local do aparelho.

### Limitações honestas
- O cache é **volátil**; ao reiniciar, retorna zero registros até chegarem novos eventos.
- Uma fonte que envia HTTP 403/429 ou nenhum registro continuará sem resultados. O gateway não tem acesso direto a servidores Niantic/PGSharp.
- Não existem reides processadas: `gyms:{}` apenas mantém o contrato ao consultar reides, sem criar reides fictícias.
- `disappear_time_verified` do Golbat indica nível de confirmação; este gateway só valida que há horário futuro, não altera a natureza estimada da origem. O usuário deve ser informado da incerteza e a integração final deve exibir este metadado antes de chamar o resultado de comprovado.
- Fonte com auth delegada: `X-Golbat: hey!` é cabeçalho estático informativo, **não** autenticação; enviar `X-Source-Secret` aleatória e colocar o webhook atrás de firewall.
- O gateway usa HTTP de loopback: não está pronto como serviço público exposto (sem TLS próprio, persistência, garantias de fila/retry, controles de acesso por usuário, métricas e observabilidade operacional). PoracleNG processa alertas, não deve ser tratado como scanner.

## 2. Correção dos filtros e aplicação de ideias de ReactMap
ReactMap README: https://github.com/WatWowMap/ReactMap
Licença MIT: https://github.com/WatWowMap/ReactMap/blob/main/LICENSE

PokeSearch `PokeListRadarActivity.java` recebeu filtros **locais** de Nome/#Pokédex, mínimo de PC, mínimo de nível, IV100, somente com coordenadas e comando Limpar filtros locais. `PokeListLocalFilterPolicy.java` garante que filtros estritos não aceitem IV/PC/nível ausente; também revalida a lista de espécies/IV mínimo pedidos ao backend (porque um provedor pode ignorar parâmetros). Filtros locais nunca reconsultam o fornecedor, e um HTTP 403 não vira resultado falso. `app/tests/PokeListLocalFilterPolicyTest.java` valida casos de dados desconhecidos, espécie, acento, expirados e outras categorias.

PGBR `LiveFeedFilters.singleAllowedSpecies()` passa o único #Dex escolhido no painel ao primeiro GET global iFlowGo; antes a filtragem era feita só após receber page=1 e escondia Pokémon que não constavam dela. `LiveFeedDialog` agendou atualização específica de busca Global ao digitar (debounce + limitação de 5 s já existente), adicionou Limpar filtros e melhorou diagnósticos de zero registros. Nada contorna recusas do fornecedor.

**Cuidado:** o ReactMap declara filtros Basic/Intermediate depreciados; não transplantar UI/backend complexo sem testes, licença e avaliação de dependências. Conceitos e estrutura, sem copiar seu frontend.

## 3. wwm-uicons — inventário seguro sem duplicar conteúdo protegido
Base PNG: https://github.com/WatWowMap/wwm-uicons
Versão WebP: https://github.com/WatWowMap/wwm-uicons-webp
Índice original: https://github.com/WatWowMap/wwm-uicons/blob/main/index.json

`scripts/catalog-uicons-index.js` transforma um `index.json` de origem recebida localmente num manifesto auditável com caminho/categoria/extensão/procedência/hash SHA-256. Não baixa PNGs nem WebPs, marca cada entrada como `assetRights:"review_required"` e não substitui arquivos da biblioteca. O índice do repositório analisado continha 15.732 referências em 16 grupos; muitas são sprites de Pokémon/recompensas, mas número de referências não equivale a permissão de distribuição.
Exemplo: `node scripts/catalog-uicons-index.js index.json manifest.json`.
Testes: `functions/uicons-manifest.test.js`.
O `package.json` declara MIT, mas o README credita imagens a Mygod, whitewillem e PokeMiners; direitos dos arquivos devem ser verificados individualmente antes de incluir no APK, inclusive imagens de Pokémon, efeitos e marcas.

## 4. PokeXperience — diligência comercial, SEM ACESSO CONFIRMADO
Homepage e condições: https://pokexperience.com/ e https://pokexperience.com/terms/
FAQ: https://pokexperience.com/faq/
Na consulta de 22/11/2026, o plano Sapphire anunciava feed `mapper data + JSON/webhook` por US$50/mês; plano Whale anunciava mapa mundial por US$250/mês. O primeiro não garante o segundo. Termos não concedem expressamente sublicença de redistribuição das coordenadas para aplicativos independentes.

O canal formal que aparece na FAQ é o atendimento `#🙋🏻help` no Discord. Os termos exibem o endereço `info@spam-trap.example.com`, um placeholder, **não** endereço confiável de contato; não enviar dados a esse email. A solicitação deve pedir confirmação por escrito de:
1. Se há API/JSON/webhook oficialmente licenciado para uso server-to-server pelo PokeSearch/PGBR e para redistribuição para usuários finais.
2. Campos e JSON de exemplo sem dados privados, autenticação, HMAC, limites de taxa, retenção, SLA, escopo geográfico, timeouts, tratamento de IV e shinyPossible.
3. Preços, requisitos de assinatura e autorização para ambiente de homologação, fins comerciais e apps Android.
4. Se integrações com Golbat/PoracleNG e armazenamento em cache temporário são permitidos.
5. Canal oficial de suporte e contrato de licença assinado, se aplicável.

**Modelo de solicitação (não enviado):**
"Olá, equipe PokeXperience. Estamos avaliando uma integração autorizada de dados de aparições do Pokémon GO em nossos projetos PokeSearch e PGBR. Gostaríamos de confirmar se o feed JSON/webhook do Sapphire inclui API documentada para terceiros, quais direitos de exibição/redistribuição e cache são concedidos, a cobertura geográfica, limites, autenticação e preços para uso por aplicativo independente. Poderiam compartilhar documentação, esquema de payload e condições comerciais por escrito? Obrigado."

**Status:** sem contato enviado, contrato não confirmado, credenciais não obtidas. Não publicar cliente ou simular dados PokeXperience antes de aprovação.

## Testes/revisão
- Workflow do PokeSearch: `.github/workflows/authorized-spawn-webhook-qa.yml`: Node 22 para gateway/normalizador/indexador + javac Java 17 para filtros + compilação Android debug sem publicar ou assinar APK.
- Workflow do PGBR: `.github/workflows/pgbr-radar-filters-qa-20261122.yml`: testes de feed, filtros e compilação de controles Android.
- Não fazer merge automático sobre PRs paralelas, nem atualizar a release/assinatura atual sem homologação em aparelho.

PENDÊNCIAS EXTERNAS: autorização de feed real, proxy TLS e instalação do scanner próprios do operador, validação de payload/IV/expiração ao vivo, QA em Android físico e direito de redistribuição das imagens. A PR pode ser validada como infraestrutura sem dados em tempo real.
