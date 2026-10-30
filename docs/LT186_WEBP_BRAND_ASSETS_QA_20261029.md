# LT186 QA — Segunda fase de redução do APK

## Base e objetivo
- Continuidade direta da LT185 QA (`0.01.85 / 54390`, APK assinado **43.770.614 bytes**), que já reduziu o APK da LT184 pública em **5.776.392 bytes**.
- Branch `optimize/lt186-webp-dedup-20261029`, partindo da revisão validada da LT185. Nova candidata **0.01.86 / 54391**, sem merge ou distribuição pública.
- Meta desejada: aproximar ou atingir **35 MB** mantendo exatamente as funcionalidades e a experiência visual. O número real só pode ser divulgado após compilação.

## Mudanças implementadas
1. Otimizar alguns arquivos PNG pesados do Android como WebP, mantendo os mesmos nomes de recursos (`R.drawable.NAME`) e dimensões/alpha. Fundo claro/escuro da Home, logos efetivamente exibidos, artes das equipes, molduras e Pikachu da missão. O conversor testa as imagens compostas contra fundos preto/branco e rejeita perda visual excessiva; se WebP não for vantajoso ou nítido, mantém PNG.
2. Os quatro masters PNG em `app/src/main/assets/branding/` não são utilizados em Java/JS/HTML pelo aplicativo, já que a Home usa `R.drawable`. Transferi-los para `app/artwork-originals/branding/` **dentro do repositório** mantém a arte original preservada, mas não a inclui no APK. O script verifica possíveis referências antes da remoção de `assets/`.
3. Ajustar testes de contratos visual e adicionar teste LT186 para verificar que não há pares PNG/WebP duplicados nem masters de marca no APK.
4. Build QA isolado com regressões Node completas, Doce Raro, P1/P2, sprites offline, R8, assinatura v2 permanente, comparação de bytes contra 43.770.614 e relatório de SHA.

## Proteções
- Nada de alterar o funcionamento das duas Pokébolas, Doce Raro, login Discord/Google, treinadores VIP, API, alertas, favoritos, opções de filtro, sprites Pokémon ou OTA.
- Ícones com SHA exato, áudio e imagem fonte do launcher permanecem íntegros.
- Não modificar assinatura, applicationId ou versão pública.
- Não fazer merge/Release, atualizar o Drive público ou oferecer a atualização dentro do aplicativo sem QA Samsung e aprovação da versão.

## Estado
Em processo de QA GitHub Actions: a medição do APK e aprovação dos testes será registrada abaixo quando comprovada.
