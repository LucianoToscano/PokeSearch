# PokeSearch LT193 — estado oficial e auditoria pós-publicação (30/10/2026)

## Evidências objetivas
- Versão pública **LT193 / 0.01.93 / versionCode 54398**.
- [GitHub Release oficial](https://github.com/LucianoToscano/PokeSearch/releases/tag/v0.01.93-54398) é latest, pública e não é prerelease.
- APK `PokeSearch-v0.01.93-LT.apk` de **29.016.937 bytes**; SHA-256 **`bd52034270913ae7c48a14bfe82d64e1ab5cef7ad8588f7e3d56e4c615928546`**.
- SOURCE_COMMIT do instalador: `6995cd7b80633994d010f6d987f10b018ab4dc68`, PR [#155](https://github.com/LucianoToscano/PokeSearch/pull/155).
- [GitHub Actions #41025717103](https://github.com/LucianoToscano/PokeSearch/actions/runs/41025717103) **SUCCESS**: scripts Node, OTA, geração de recursos, build Gradle/R8, versão, assinatura, hash e conferência do asset publicado.
- Relatório da assinatura extraído do ZIP: **v2 true**, um signatário, certificado SHA-256 `34766c15d09013ad65873f9976539c8fa2f826e917dae3af57ea628cad689e8e` (mesmo da linha anterior).

## Motivo de uma terceira correção
O problema em 0/15/15 persistia no Samsung mesmo após LT192. A LT192 tratava IV comprovado diferente de IV ausente, mas **não corrigia o percentual decimal retornado pelo provedor**:
- O parser da API aceitava `raw_iv=0/15/15` com `iv_percent=66.67` e devolvia `ivPercent="66.67"`.
- A validação do Android só aceitava IV% inteiro e rejeitava um cartão correto, sinalizando `IV não comprovado`.
- LT193 verifica matematicamente o percentual fornecido e repassa a forma canônica: `0/15/15` = `67` na exibição arredondada. Também aceita percentuais precisos no validador Android e cartões com raw IV completo mesmo se a porcentagem separada faltar.
- `app/tests/lt193-api-decimal-iv-native.test.js` reproduz o cartão que a LT192 rejeitava, além de negar IVs contraditórios e conferir a herança de P1/P2.
- Detalhes e lacunas técnicas: [LT193_API_IV_DECIMAL_SAMSUNG_20261030.md](LT193_API_IV_DECIMAL_SAMSUNG_20261030.md).

## Google Drive e distribuição
- [**Novo ZIP LT193 com APK assinado e relatórios**](https://drive.google.com/file/d/1nZeta54r5fDR7KFnPi40P5ZB-E-Bs73Z/view): **26.720.425 bytes**, CRC íntegro, APK interno 29.016.937 bytes com SHA-256 idêntico ao publicado. Contém `SHA256SUMS.txt`, `SIGNING-REPORT.txt`, `PACKAGE-VERSION.txt` e `SOURCE_COMMIT.txt`.
- [APK direto pela Release](https://github.com/LucianoToscano/PokeSearch/releases/download/v0.01.93-54398/PokeSearch-v0.01.93-LT.apk).
- Canal do atualizador público: GitHub Releases/latest. O Android exige aprovação do usuário para instalação.
- **Link legado do Drive para APK direto `1XXKGy3AjtDx4uMnt2N4Wd3FVNV0Qn_5P` segue LT187**, nome `PokeSearch-v0.01.87-LT.apk`, 29.013.825 bytes. Não declarar que esse link entrega LT193.

## Limites e QA físico
- Há uma **incompatibilidade determinística corrigida e testada no código**; não há prova de que o servidor retornou exatamente essa representação na captura específica.
- **QA físico Samsung com API real autenticada: NÃO EXECUTADO nesta execução**. Não declarar a correção do comportamento no aparelho como homologada.
- Verificação recomendada no dispositivo: LT193 instalada sobre LT192; P1/P2 independentes; modo IV 0/15/15 e IV% 0–92; no site, confirmar se há um spawn realmente correspondente com IV comprovado. Não exigir que apareça Pokémon se o servidor retornou zero spawns.
- Se o aviso persistir, obter diagnóstico sanitizado do app contendo origem da busca (API/DOM), quantidade de cartões, contagem de rejeitados e motivo de rejeição; nunca enviar JWT, cookies, coordenadas ou códigos de treinador.
