# LT63 — Pedido de compilação assinada

Autorização expressa em 24/10/2026 para compilar somente na branch `fix/lt63-compact-cascades-samsung-20261024`, sem merge em `main`. Resultado esperado: `PokeSearch-v0.00.63-LT.apk`, `versionName=0.00.63`, `versionCode=54261`.

Certificado permanente obrigatório: `34766c15d09013ad65873f9976539c8fa2f826e917dae3af57ea628cad689e8e`. Não é permitido gerar APK com certificado alternativo. O binário depende de CI, testes Node, Java, Gradle, unzip, aapt e apksigner. A validação física Samsung é posterior ao artefato.

## CI attempt 2
A primeira tentativa do workflow LT63 encontrou uma asserção herdada do teste FILTERS-POGO-02 que ainda continha texto antigo sobre campos vazios. O teste foi corrigido para exigir restauração fiel do rascunho Min/Max; código Android e assinatura não alterados. Nova execução aprovada somente na branch LT63.

## CI attempt 3
A segunda execução detectou testes LT62 que assumiam larguras antigas (PC/Nível 168px, Clima 160px, Ordenar 156px, Forma 110px) e foram atualizados para os valores LT63 reais. O workflow agora confere explicitamente `POKE_TEST_PUBLIC_VERSION=0.00.63` e `versionName='0.00.63'` pelo aapt, evitando distribuir a versão 0.00.62. Sem merge ou troca de certificado.
