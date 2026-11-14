# LT336 — Auditoria das 68 sprites Edu: triagem de pixels (14/11/2026)

## Base preservada
- Continuidade sobre a LT335 oficial `0.03.34 / versionCode 54540 / label 51338`; sem downgrade, sem alteração de APK e sem modificação de arte.
- A LT335 compõe `#00–03` (Pokébola) e `#63–64` (celular) usando o corpo `#42`. **Os PNGs originais desses seis índices NÃO equivalem ao quadro final desenhado no Samsung.**
- O pacote ZIP interno `edu_avatar_masters_512_lt330.part00…12` é validado por tamanho e SHA-256 oficial. Os 68 PNGs são lidos em RGBA 512 e conferidos individualmente, sem recompressão.

## O que a etapa adiciona
- `app/tests/lt336-edu-pixels-68-audit.test.js`: descomprime os pixels com Node nativo (PNG RGBA, filtros 0–4), conta pixels opacos e avalia região do cabelo, óculos, mãos e pés, comparando medidas com a referência `#42`.
- Resultados informativos `medidas.csv` e `medidas.json`, além de `index.html` com as 68 fontes lado a lado com `#42` e imagens PNG intactas. A execução é automatizada pelo workflow específico `edu-visual-source-audit.yml`, que anexa o relatório como artefato privado/temporário da Action.
- Cabeça: tolerância de triagem ±2% na largura e ±4px no eixo. Pés: ±4px na base. Borda: mais de 0,8% dos pixels opacos nos primeiros/últimos 4 pixels do quadro. **Nenhum desses limites autoriza alterações automáticas na arte.**
- Exceções tratadas separadamente: `#09–18` arrastado, `#52–60` teleporte, `#62` Shiny, `#65–67` fantasias. Gestos `#00–03, #63–64` marcados como composição runtime. Outras diferenças são apenas alertas para inspeção humana.

## Limites e aprovação
- O analisador trabalha com as **fontes 512**, não fotografa a tela e não executa o compositor Java. Medições cromáticas podem confundir cabelos sob capacete, brilho, sombras, mãos sobrepostas e efeito de movimento.
- **Não afirmar correção artística, fluidez ou continuidade do braço no aparelho** com base nesse teste. Para aprovação, abrir o comparador `◀️ 👬 ▶️` com linhas-guia no Samsung e filmar as oito sequências em P/M/G; checar cabeça, óculos, ombro, mãos, pés, posição e nitidez em transição.
- Nenhuma publicação oficial, alteração da assinatura, `release/official-request.json`, atualização do app ou merge automático faz parte desta PR de QA.
- Quando resultados visuais estiverem aprovados, atualizar `docs/GUIA_MESTRE.md` com a evidência e apenas então propor retoques precisos nos masters/fallbacks e próxima versão.

## Execução
```bash
node app/tests/lt336-edu-pixels-68-audit.test.js
# Abrir app/build/edu-visual-audit/index.html
```

Rastreio: [issue #334](https://github.com/LucianoToscano/PokeSearch/issues/334).
