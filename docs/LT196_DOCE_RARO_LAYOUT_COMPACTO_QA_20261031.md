# LT196 — Doce Raro compacto com informações sobre a sprite (QA)

Base: LT195 oficial (0.01.95/54400), PR #159, mantendo a assinatura permanente e o overlay independente.

## Mudanças
- Reduzir o item de Doce Raro para **a mesma altura de 47 dp com ou sem cooldown**, com o **despawn** em linha única sob a imagem e o cooldown sobreposto na parte superior da célula de sprite (46 × 29 dp).
- Distância, quando habilitada, sobreposta no rodapé da sprite; tempo de cooldown acima, em badge escuro translúcido, sem texto adicional “Pronto”.
- **Vermelho:** cooldown acima de 30 segundos. **Rosa:** últimos 30 segundos. **Verde:** check ✓ pequeno após o tempo estimado. **Azul:** ● marca o doce copiado como origem. O contador continua a cada segundo.
- Para tempos ≥ 1h, badge usa `1h15` e arredondamento conservador para minutos, enquanto a descrição de acessibilidade expõe o tempo exato. Para tempos inferiores a 1h, `m:ss`.
- Imagem previamente copiada não fica totalmente cinza: saturação 60% e opacidade 88%; preserva a indicação de cópia sem ocultar a arte.
- Nenhuma mudança no cálculo Haversine, na tabela de cooldown, na cópia, na persistência, nos estados P1/P2, na API, nos limites do provedor, em despawn ou no refresh.

## Testes
- Nova suíte Node `lt196-candy-compact-sprite.test.js`: altura fixa, única linha de despawn, badges dentro do sprite, cores, copiar/reset, 10 doces e atualizações por segundo.
- Teste Java de produção `CandyCooldownPolicyTest.java`: acrescenta 9 cenários de labels compactos a 56 checagens de LT195.
- Workflow `pokesearch-node-qa.yml` inclui LT196.
- Necessária compilação Android, screenshot e teste autenticado no Samsung antes da publicação.
- **Estado inicial:** branch de QA; não publicada/mesclada, sem alteração do APK público LT195.
