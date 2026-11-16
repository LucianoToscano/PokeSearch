# ARK PokeSearch — obrigação de integrar e publicar (regra mestra)
Instituída por instrução expressa do proprietário em 16/11/2026, após LT376e.

## Interpretação executiva obrigatória

**Quando o proprietário solicitar "ARK" para encerrar uma etapa do desenvolvimento, o comando inclui autorização para executar o ciclo completo de entrega:** auditoria, correções, testes, **merge para `main`**, **publicação de uma nova release oficial com APK assinado**, registro no Guia Mestre, evidências e prompt de continuidade. "ARK" **NÃO** significa somente gerar relatório, abrir PR ou compilar APK QA. A regra atual substitui as instruções históricas de LT376/LT376e que exigiam pedir nova autorização mesmo depois de o usuário solicitar ARK.

**Exceção explícita:** se o proprietário disser para não publicar/não fazer merge, respeitar essa restrição específica. Não usar texto histórico "sem merge/publicação" de fases anteriores para bloquear um ARK atual autorizado.

## Gates antes do merge e publicação

1. Verificar `main`, últimas PRs/releases, `AGENTS.md`, Guia Mestre e fluxos oficiais; evitar sobrescrever trabalho concorrente.
2. Executar gates obrigatórios da revisão: Node QA, LT169, LT211, LT62 Java, LT173 OTA, PGS APK debug QA, Secure beta/R8, e os complementares relevantes. **Aprovação automática nunca deve ser apresentada como homologação física**.
3. Se os gates passam, fazer merge da PR de desenvolvimento (preferir squash conforme histórico oficial), conferir SHA de integração/estado `main`. Em caso de falha ou conflito, corrigir e repetir testes. Não fazer merge cego.
4. Preparar nova versão monotônica e `versionCode` superior à última publicação, incluindo `release/official-request.json` e entrada correspondente em `app/src/main/assets/release_notes.json`, com notas sobre limitações não comprovadas.
5. Submeter PR de versão e validar seus gates; integrar somente com o procedimento protegido. A publicação deve ocorrer exclusivamente pelo workflow `PokeSearch permanent official release`, que verifica assinatura permanente, build R8, versão, pacote, integridade e o APK. Nunca distribuir APK de QA como oficial ou contornar secrets/checagens.
6. Verificar de fato o run `completed/success`, release pública não-draft/não-prerelease, asset `uploaded`, versão, tamanho, digest e certificado da assinatura. **Sem esta verificação, não declarar "publicado"**.
7. Finalizar ARK em documentos do repositório e Guia Mestre com SHAs, PRs, run IDs, artefato, pendências físicas e novo prompt. Preferir preservar a release anterior, sem substituir tag/asset existente.

## Se houver bloqueador real

A obrigação é **tentar concluir integralmente durante o ARK**, não ignorar segurança ou inventar êxito. Se faltar segredo, workflow protegido, permissão, check obrigatório, assinatura correta ou se o GitHub reportar falha, registrar o ponto exato e a evidência, manter o estado preservado, e indicar de maneira explícita que **o ARK ainda não concluiu a publicação**. Não adiar por padrão "para outro chat" quando os gates e ferramentas disponíveis permitem concluir agora.

## Controle de qualidade

Testes em dispositivo Android físico, OAuth real, PGSharp/Pokemod separados, câmera, toque e efeitos visuais que não foram executados devem permanecer **pendentes** e constar nas notas da release quando a publicação de testes de campo for expressamente solicitada, sem transformar CI em alegação de aprovação física. Nunca alterar a assinatura permanente nem burlar a verificação do workflow oficial.

Esta norma é prospectiva e governa o significado de ARK dentro do projeto PokeSearch. Registros antigos de estados não publicados são históricos e não contradizem autorizações posteriores.
