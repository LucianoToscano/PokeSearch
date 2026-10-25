# LT81 — Samsung: localização (aplicar, exibir, limpar)

Evidência física: print com raio 1000 km, coordenadas cortadas no campo superior, aviso “⚠ Localização não aplicada” e lixeira sem zerar visualmente o valor. Diagnóstico comprovado no código: input ocupa a terceira posição na mesma linha que título e colar, deixando pouco espaço; ação limpar invoca Native.setLocation(false,"",0), mas não modifica os controles visíveis. Há ainda uma janela em que React pode re-renderizar Coords e Radius depois de verificados, antes de Search.

Correção QA LT81: cabeçalho e botão colar na primeira linha, campo de coordenadas na segunda linha ocupando 100% do painel de até 296 px. Limpar zera instantaneamente coordenadas, raio e slider 0 km, então remove preferências via Native e exige confirmação de ausência no site para a próxima pesquisa. Editor conserva texto ainda não enviado contra atualizações assíncronas do Android. Última verificação, se divergente por re-render, reaplica o par até duas vezes antes de falhar fechada. Não envia Search sem prova exata; preserva filtros não geográficos e resultados anteriores.

Branch fix/lt81-location-apply-clear-wide-samsung-20261024; QA versão 0.00.81, versionCode 54284. Testes + APK protegido R8 com certificado permanente. **NÃO publicar para usuários do app LT80 antes de homologação Samsung.** Testar valores longos, raio 1000 km, limpar antes e após aplicar, Shiny, Raw e preferências preservadas, e mensagens de falha. Main, releases LT80 GitHub, LT79 Drive e demais PRs intactos. A imagem sozinha não permite confirmar se a aplicação falha por mudança do site, autenticação ou algo mais.

## Resultado da compilação QA e distribuição privada
- GitHub Actions https://github.com/LucianoToscano/PokeSearch/actions/runs/40156253334 — SUCCESS, testes automatizados e build Gradle release assinados.
- APK QA: `PokeSearch-v0.00.81-LT-Samsung-QA.apk`, `0.00.81`, versionCode `54284`, applicationId `com.lucianotoscano.pokesearch`, 38602191 bytes.
- SHA-256 verificado no ZIP pelo `sha256sum -c`: `73a8ad95d9a06841b046c655272a9e4a267d33dcdae0fdd21d736b1e361dd81d`.
- Certificado de assinatura SHA-256 permanente `34766c15d09013ad65873f9976539c8fa2f826e917dae3af57ea628cad689e8e`. Assinatura v2 `true`, arquivo não depurável, mapeamento R8 presente.
- SOURCE_COMMIT: `727611991e3fa9105f211a2d3d5adff2336bcdef`.
- Google Drive QA **privado**: https://drive.google.com/file/d/1I-Kru6pK4TW9M1SE5RD-0nsVlQUtGPpf/view — pasta `QA_LT77_NAO_PUBLICADO`; confirmado owner-only, sem permissão anyone.
- `docs/GUIA_MESTRE.md` foi atualizado pelo workflow #40156322379 (SUCCESS), preservando histórico.
- **Homologação Samsung física ainda pendente**: nenhum relatório de aplicação/limpeza após instalar LT81, portanto nenhuma divulgação pelo GitHub Releases 0.00.81 nem alteração do Drive público.
