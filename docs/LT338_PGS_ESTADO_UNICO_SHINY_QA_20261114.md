# LT338 — Auditoria incremental PGS: estado único e alertas Shiny

**Data:** 14/11/2026. **Base:** main em 87c61905c8712cfa7a1795dfc99cd9a29d1a65f9. **Estado:** correção em QA; não equivale a release publicada.

## Evidências da revisão

1. A Home (PgsBuscasPanel) duplicava a leitura de pokemon_catalog.json, a normalização, a lista selecionada, o persist e a ordenação que já existiam no PgsAutoCatalog. Os dois caminhos podiam apresentar comportamento divergente e testar regras diferentes.
2. PgsAutoShinyListener tratava o emoji ✨ isolado e a chave "shiny:" sem valor como sinal positivo suficiente. Esse critério poderia interromper a automação por anúncios, avisos negativos ou informação genérica.
3. PGS Buscas Auto permanece experimental e desligado por padrão. O reconhecimento exige modelos locais escolhidos pelo usuário, confirmação temporal antes do toque e permissões Android; CI não é prova de segurança em tela real.

## Correções propostas na branch

- Home delega catálogo, seleção, alternância e prioridade a PgsAutoCatalog. A lista de 0–50 espécies, templates locais, atalhos, estética compacta, preferências existentes e ordem de prioridade continuam intactos.
- PgsAutoShinySignal é um classificador Java sem dependências Android que exige frases positivas ou um campo de estado positivo explícito. Negação textual tem prioridade. O emoji isolado, "shiny:" sem valor, "shiny: false" e mensagens de marketing não geram pausa.
- Contratos Node atualizados; novo teste Java com 16 casos positivos, negativos e ambíguos. O workflow PGS compila e executa esse teste antes do APK debug de QA. O teste Java não homologa formatos reais do PGSharp.
- Nenhuma alteração em P1/P2, Doce Raro, Edu, catálogo de imagens, masters 512, conta/Firebase, assinatura, OTA, timers ou serviço de gestos.

## Validação e limites

Executar Node completo, contratos PGS, JVM, build Android e QA protegido no HEAD final. Confirmar CI verde antes de merge e release. **O APK debug de QA não substitui o APK oficial, pois não usa a assinatura permanente.**

A issue #350 permanece aberta: validar no Samsung a interface, 50 espécies, gestos, falsos positivos, notificações Shiny reais, bateria e persistência. Mensagens do PGSharp ainda não coletadas: formatos adicionais só entram após captura real e comparação segura.

**QA legado paralelo:** o workflow de QA LT146 #43574012280 falhou no empacotamento/validação de sprites (AssertionError após recuperação de evento LT144 via CDN), apesar de testes de código terem passado. Investigar deriva de recursos e validar o hash original; não remover asserts nem substituir imagens para contornar a falha. Esse pipeline histórico não prova que o PGS falhou, mas deve permanecer monitorado.

**Publicação:** somente incrementar versão e enviar pedido oficial após aprovação automática e verificação da configuração de release, hash e certificado. A LT337 permanece oficial até lá.
