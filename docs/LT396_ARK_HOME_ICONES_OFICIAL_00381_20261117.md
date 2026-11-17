# PokeSearch — ARK LT396 — restauração de Quests/Comunidade e versão oficial 0.03.81 LT

Data: 17/11/2026. Origem: `main` / PokeSearch 0.03.80 LT / versionCode 54587.

## Solicitação do proprietário

Correção imediata no aplicativo dos ícones da Home:
- **Comunidade**: ainda com a parte direita cortada mesmo após LT394/395; não trocar o desenho.
- **Quests**: ainda com falta de arco inferior; manter desenho.
- **Assistente**: harmonizar o personagem com os 15 outros módulos sem perder a identidade.
- Aplicar e publicar APK oficial atualizável, com assinatura permanente.

## Diagnóstico com os arquivos originais

Os `Quests.png` e `Comunidade.png` originais de `Iconehome (1).zip` foram reabertos. Os problemas estavam na própria arte de origem, não no padding da UI. Quests possuía a borda inferior truncada na linha **y=484**; Comunidade tinha contorno lateral interrompido na coluna **x=488**. A LT394/LT395 só reduziu e reenquadrou as figuras, sem reconstruir traços ausentes.

## Código e artes implementados

- A partir dos mesmos PNGs enviados, foram reconstruídos apenas os fragmentos necessários: Quests, aro inferior até cerca de **y=499**, e Comunidade, fechamento do lado direito até cerca de **x=508**. Rostos, sorriso, símbolo central, espessuras, cores e outras áreas permanecem preservados.
- Arte de verificação no repositório: `docs/assets/LT396_Quests_restaurado.png` e `docs/assets/LT396_Comunidade_restaurado.png`.
- `app/src/main/assets/home-user-icons-atlas.png` contém ambas as correções nos índices **6 e 15**, com margens transparentes de segurança. Os outros **14 módulos permanecem idênticos** ao atlas anterior.
- `MainActivity.addHomeGridCell`: reduz padding redundante dos ícones reparados e mantém escala centralizada. Assistente utiliza o personagem já integrado, apenas aplicando `ColorMatrix` com saturação a **20% na Home**, sem alterar o ícone flutuante.
- Pokédex original, Pokébolas desligadas brancas e sem valores IV na Home, Auto Hunt, tema, 16 módulos, drawer LT395, login, filtros, overlay, dados e notificações mantidos.
- Teste de regressão `app/tests/lt396-home-restore-cut-contours.test.js` decodifica PNG RGBA e verifica presença de pixels novos no arco inferior e na lateral direita. Contratos LT394 e LT395 seguem válidos com SHA de atlas atualizado.

## Evidências de arte

- Atlas: SHA-256 `abdebce91043c4576fcedf3e64f63492a9e18f5d600246090a5032f6d54976af`.
- Quests restaurado: SHA-256 `f9a9b04c7ed10d500b3e75282129304e1b9d8459d3c4198cd9c260ad53e3989e`.
- Comunidade restaurado: SHA-256 `49d34f6f35e4d93992f2b696e93a6e674665c48d25cb52d114e2f953780cdd9b`.

## QA, merges e release

- PR código [#500](https://github.com/LucianoToscano/PokeSearch/pull/500) **MERGED** (squash `745d0350648346296bea1fc00183d57ed9428ac5`). Testes Node QA, LT169 Node completo, LT211, LT62 Java Android, LT173 OTA, FastDev smoke (sem publicar) e beta Android/R8 passaram.
- PR release [#501](https://github.com/LucianoToscano/PokeSearch/pull/501) **MERGED** (squash `34f508c6de51e143b869b58acf94810cf081dff4`), com notas internas e pedido de versão monotônica.
- Versão oficial **PokeSearch v0.03.81 LT**, versionCode **54588**, label **51396**; tag pública **`v0.03.81-54588`**. [Release](https://github.com/LucianoToscano/PokeSearch/releases/tag/v0.03.81-54588) estável, não-draft, não-prerelease.
- Workflow protegido [#44056156922](https://github.com/LucianoToscano/PokeSearch/actions/runs/44056156922) **completed / success**; chave permanente verificada, build assinado, integrity check, publicação de APK e SHA público aprovados.
- APK oficial [PokeSearch-v0.03.81-LT.apk](https://github.com/LucianoToscano/PokeSearch/releases/download/v0.03.81-54588/PokeSearch-v0.03.81-LT.apk), **61.381.903 bytes**; SHA-256 público **`7e794b1a70d9e87f7e10f40a8b7cdb08e98439c6779372df0cb0f8eaf9a9462c`**. Assinatura permite atualização sobre v0.03.80 LT oficial mediante consentimento do Android.
- Release 0.03.80 mantida intacta para histórico/rollback conforme regras existentes.

## Pendências reais para LT397

- **Homologação física Samsung SM-S928B Android 17 ainda não executada.** Testar visualmente a Home v0.03.81 LT instalada e verificar se o arco Quests, contorno Comunidade e o Assistente realmente aparecem proporcionais em tela.
- Validar tema claro/escuro, densidades, fontes grandes, TalkBack, cliques, menu lateral, abertura de cada overlay, estado OFF branco P1/P2, histórico e login.
- A dessaturação do Assistente foi aplicada apenas à Home; conferir se o equilíbrio visual agradou. Não mudar a identidade dos outros módulos sem necessidade.
- O próprio arquivo original pode possuir imperfeições adicionais além dos dois trechos já reconstruídos; registrar screenshots antes de qualquer nova edição de arte.
- Continuar oficialmente da **v0.03.81 LT / 54588**, não reutilizar tag/versionCode. Aplicar ARK, QA e publicação protegida para futuras alterações.

**Limitação explícita:** CI automatizado e exame da arte fonte não substituem inspeção física no Samsung.
