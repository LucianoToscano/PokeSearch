# PROTOCOLO GLOBAL — DESENVOLVIMENTO PARALELO SEM PERDAS

> Proposta de governança em branch QA. **Não é release, homologação, merge nem substituto do Arquivo Mestre.**
> Referência: solicitação do responsável em 21/11/2026.

## Objetivo

Permitir alterações simultâneas em múltiplos chats, preservando todas as funcionalidades, melhorias e correções aprovadas.

## Regras obrigatórias

1. Antes de qualquer alteração, consultar a documentação central e verificar o estado atualizado do repositório oficial.
2. Nunca trabalhar sobre uma cópia desatualizada sem verificar as alterações posteriores.
3. Criar uma branch independente para cada tarefa.
4. Não sobrescrever alterações realizadas por outros chats.
5. Registrar o commit de origem, os arquivos alterados, as mudanças realizadas e os testes executados.
6. Preparar um Pull Request para integração, sem publicar diretamente na branch principal.
7. Antes da integração, comparar a branch com a versão oficial mais recente e identificar conflitos e regressões.
8. Preservar as funcionalidades existentes e combinar mudanças compatíveis. Se houver alterações incompatíveis, solicitar uma decisão antes de descartar qualquer uma.
9. Somente considerar uma correção concluída após validação e integração oficial.
10. Compilar e disponibilizar versões oficiais somente a partir do código consolidado e validado.
11. Manter histórico de versões, commits e alterações para permitir recuperação segura.
12. Nunca apagar códigos, recursos, documentação ou arquivos importantes sem inventário e justificativa.

**REGRA DE OURO:** diferentes chats podem desenvolver simultaneamente, mas nenhum pode substituir o trabalho dos outros. O GitHub é a fonte oficial do código; o Arquivo Mestre documenta regras, decisões e estado do projeto.

## Execução segura e classificação de limpeza

- **A — Proposta de remoção:** duplicata idêntica comprovada por SHA-256, temporário ou cache sem valor, considerando usos e referências.
- **B — Proposta de mesclagem:** conteúdos sobrepostos, preservando tudo que seja exclusivo e sua proveniência.
- **C — Manter/arquivar:** conteúdo único, histórico, versões funcionais, experimental ou não verificado.
- Inventariar e registrar A/B/C antes de agir. Exigir autorização explícita antes de exclusões definitivas.
- Nunca modificar assinaturas, keystores, credenciais ou segredos; nunca divulgar esses materiais.
- Manter rollback e caminhos de origem/destino para movimentações.
- Não usar "teste aprovado" como sinônimo de APK instalado e validado em dispositivo.

## Estados de cada entrega

1. **Analisado:** evidência consultada e problema delimitado.
2. **Implementado na QA:** commit registrado, sem alegar validação.
3. **Validado na QA:** testes nomeados, resultados e limitações registrados.
4. **Integrado oficialmente:** PR revisado e integrado; ainda não significa release.
5. **Publicado/homologado:** release/verificação em aparelho documentadas separadamente.

## Checklist antes do PR e antes da integração

- Registrar SHA-base, SHA atual, diferença em arquivos, branches e PRs paralelos.
- Revalidar a `main` imediatamente antes de integrar.
- Verificar dependências entre PGBR, PokeSearch, PvPPokeGo, PGSharp e Banco de Dados Pokemon Go.
- Nunca resolver conflito por "arquivo mais recente vence"; comparar trechos/commits e preservar ambas as contribuições compatíveis.
- Não descartar nenhuma solução incompatível sem decisão explícita.
- Verificar regressões no código e nas configurações, registrar testes e permitir rollback.
- Não publicar APK nem executar merge na ausência de autorização específica.

## Relação com o Arquivo Mestre

O protocolo fornece regras de trabalho; a documentação canônica específica de cada projeto define requisitos, prioridades e estado técnico. Divergências devem ser relatadas e reconciliadas, nunca resolvidas por sobrescrita silenciosa.

## Observações específicas — PokeSearch

`docs/GUIA_MESTRE.md` é o Mestre canônico; consultar também `LEIA_PRIMEIRO_PROMPT_OUTRAS_IAS.md`, `AGENTS.md` e o índice central. Preservar P1/P2 independentes e as regras de API e rate limit.
