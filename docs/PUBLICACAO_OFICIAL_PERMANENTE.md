# Publicação oficial permanente — operação pelo assistente

Pedido do proprietário em 05/11/2026: cuidar das etapas técnicas de atualização sem exigir upload de YAML, disparo manual de build ou manipulação de APK pelo usuário. Esta preferência não autoriza publicar mudanças não solicitadas. Um pedido de atualização/publicação autoriza concluir as etapas correspondentes sem pedir novamente a mesma permissão.

## Procedimento para próximas atualizações autorizadas

1. Ler AGENTS.md, Guia Mestre e manual operacional. Consultar main, releases/latest e QA instalada; preservar dados, P1/P2 e assinatura.
2. Implementar as alterações e testes em branch, registrar notas em app/src/main/assets/release_notes.json, obter CI aprovado e integrar conforme pedido autorizado.
3. Atualizar apenas release/official-request.json na main para solicitar a publicação. Não criar um novo workflow por LT. Campos: schema=1, enabled=true, version (0.xx.xx), code (maior que última release e QA instalada), label (rótulo interno válido), previous_tag (latest conferida), qa_max_code (maior código QA conhecido), release_notes (texto revisado).
4. O push dispara .github/workflows/pokesearch-official-release.yml. O preflight testa os gates e valida a solicitação sem segredos. Só uma solicitação válida entra no job protegido official-updates.
5. O job revalida latest, executa regressões Node/OTA/Java, prepara assets, compila com R8, assina com certificado permanente e confere pacote/versão/não-debuggable/v2/hash. Publica somente após sucesso, com tag imutável; nunca substitui APK já publicado.
6. Acompanhar a execução do SHA exato. Verificar releases/latest, APK público, digest, assinatura, pacote, versão e artefato. Registrar evidências no Guia Mestre; não declarar sucesso antes disso.
7. O app LT237+ tem pré-download em Wi-Fi não tarifado habilitado por padrão, sujeito às preferências, rede e agendamento Android. Instalação continua exigindo confirmação do sistema; não prometer instalação silenciosa ou imediata.
8. Se faltar conexão, permissão ou aprovação exigida pelo ambiente, informar o bloqueio real. Não remover proteções, não pedir chaves e não prometer acesso garantido em toda sessão.

## Estado inicial e limites

A configuração é instalada com enabled=false: não recompila nem substitui LT237 e não publica uma versão artificial só para testar o fluxo. O caminho de testes/preflight deve ser validado no CI; a primeira publicação futura pelo fluxo genérico precisa de acompanhamento completo. A assinatura/build/publicação usados como base são os do workflow oficial LT237 bem-sucedido #41960200682. O workflow manual e os workflows históricos ficam preservados, mas não devem ser disparados em paralelo ao fluxo permanente.

O assistente registra as evidências após cada publicação. Espelho Drive só quando solicitado/autorizado e com acesso disponível; GitHub Releases é o canal usado pelo app.
