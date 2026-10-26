# Firebase Stats LT117 — não implantado
**Deploy de funções ou regras Firebase NÃO foi autorizado nem executado.**
Os clientes não devem ler `stats/installations` nem `stats/online` de outros usuários; o app foi alterado para ler apenas `stats/public/installCount` e `stats/public/onlineCount`, com `—` se não estiverem disponíveis.

Antes de produção: confirmar projeto, instância/region e conta Firebase (Functions v2 pode precisar de faturamento); validar regras no Emulator; implementar idempotência por eventId e reconciliação para triggers entregues mais de uma vez; inicializar com contagem privada via Admin SDK sem expor UIDs; revisar regras efetivamente publicadas no Console, implantar em etapas e obter autorização expressa.
**Status P1-02:** código cliente e regras versionadas corrigidos; produção/contadores reais pendentes.
