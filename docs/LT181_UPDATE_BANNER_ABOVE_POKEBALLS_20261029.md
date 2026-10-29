# LT181 — Próxima versão: aviso de atualização acima das Pokébolas (29/10/2026)

## Pedido do proprietário
Na mesma conversa em que autorizou publicar a LT180 para todos, pediu que **na próxima versão** o aviso de atualização apareça **acima das Pokébolas, na parte superior da Home**.

## Implementação isolada
- `MainActivity.buildHome()`: o único `homeUpdateHolder` passa a ser inserido em `screen` com índice **1**, diretamente após o cabeçalho PokeSearch e antes da linha `dualOverlayRow` (Pokébolas 1/2).
- Cartão mantém interface nativa existente e callbacks de `GitHubUpdateCenter` e `UpdateCenter`, só muda a posição. Protege os fluxos de download/assinatura SHA-256/mesmo certificado, Depois, Ignorar, avisos e versão atual.
- `View.GONE` quando não elegível: não abre espaço vazio acima das Pokébolas nem desloca demais a Home.
- Margens laterais 4dp e superior/inferior 5dp para alinhar visualmente à linha de Pokébolas.
- P1/P2, login, overlays, chats, mural, condições de rede, atualização OTA e menus do Doce Raro permanecem intactos.

## Verificação/lançamento
- Teste estático de regressão `app/tests/lt181-top-update-banner.test.js` verifica índice de inserção, ocultação e todas as ações do cartão.
- Notas LT181 preparadas com `minVersionCode=54386` no arquivo `release_notes.json`.
- Branch `feature/lt181-update-banner-above-pokeballs-20261029`, derivada da `main` com correção LT180 mesclada; a **LT180 (54385) é a publicação autorizada neste turno**.
- **A LT181 não deve ser mesclada ou publicada durante a publicação da LT180.** Exigir testes Node/Java e APK com assinatura permanente e validação visual antes de próxima publicação.


## Ampliação LT181 — menus uniformes e resultados Candy completos (29/10/2026)
- O usuário mostrou diferenças de layout entre Localização/Atualização/Informações do Doce Raro e Pokébolas e a aparência isolada dos botões Reportar/Doar/Fechar do menu •••. Os três menus Candy passaram a reutilizar as medidas finais do `dock.html`: Localização **148px**, linhas 26/32/24/29px, intervalo com seis botões **30px**, Informações em **grade compacta 2×2**.
- Fundo do Doce Raro: CSS com as mesmas variáveis `--visual-menu-*` e a mesma matemática de `visual_editor.js`. O serviço Android lê o **mesmo** `prefs/visualPrefsJson` das Pokébolas (tema claro/escuro, `menuTransparency` 0–100%, desfoque), sincroniza enquanto menu visível e ao recarregar a WebView local.
- Botões Reportar/Doar/Fechar: eliminada a regra de fundo `--visual-menu-readable-bg` mais escuro; usam **`--visual-menu-button-bg`**, mesmo alpha, borda e sombra do menu principal — também em modo claro.
- **Relato adicional: resultados dos doces cortados.** A janela Android ainda tinha limite fixo de **460dp**, embora dez linhas ocupem ao menos **470dp**. O corte de parte do décimo doce foi eliminado calculando a altura pelo número de doces realmente ativos, sem cap fixo; escolhe a região acima/abaixo que comporte a lista inteira e habilita rolagem vertical quando a tela não dispõe de altura suficiente. `ScrollView` e contêineres deixam de recortar as sprites; largura compacta do sprite ajustada de 48dp para 50dp, preservando espaço para informações opcionais (228dp).
- Mantidas a atualização imediata no toque ↻, 3 minutos padrão ou após copiar os dez doces ativos e ficarem cinza, e os limites/TTL oficiais do PoGoCoordinates. Nada de cooldown local extra.
- Testes: `lt181-candy-menu-parity.test.js`, `lt175-rare-candy-overlay.test.js`, `lt180-candy-cadence-location.test.js`, `lt179-candy-refresh-gestures.test.js`, `lt170-more-tile-unified-transparent.test.js` atualizados; workflow assinado `lt181-menu-parity-signed-qa.yml` recompila candidata `0.01.81 / 54386` a partir do HEAD da PR.
- **Estado de distribuição:** LT180 é a última pública; LT181 está em QA. Não declarar APK, assinatura ou envio aos usuários sem provas dos testes e do workflow.

## Autorização para lançamento público LT181
O proprietário confirmou: **"Certo aplica para versão pública então."** Foi criado o workflow protegido `.github/workflows/lt181-menu-parity-official-release.yml`, versão `0.01.81 / 54386`, para publicar uma nova release estável no GitHub após merge da PR #137. A Action exige tag anterior `v0.01.80-54385`, testes Node/Android e OTA, certificado Android v2 permanente, assets, SHA-256/tamanho e `draft=false`, `prerelease=false`. A última QA assinada validada foi [#40952601562 — SUCCESS](https://github.com/LucianoToscano/PokeSearch/actions/runs/40952601562), artefato #12932805578. A instalação pelo atualizador ainda requer confirmação do Android. O Drive legado não faz parte dessa publicação. **O resultado da Action oficial será registrado somente depois de confirmado.**

## Publicação oficial LT181 — comprovada (29/10/2026)

- PR #137 mesclada por squash em `1b18c6b0cd2ac663b6c29e6a177e28b40bea63bd`.
- Workflow oficial `lt181-menu-parity-official-release.yml`: [Actions #40955101902 — SUCCESS](https://github.com/LucianoToscano/PokeSearch/actions/runs/40955101902). Inclui regressões, compilação R8, assinatura Android v2 e verificação dos bytes do asset.
- Release pública `v0.01.81-54386`: https://github.com/LucianoToscano/PokeSearch/releases/tag/v0.01.81-54386 (`draft=false`, `prerelease=false`, `releases/latest`).
- APK oficial: https://github.com/LucianoToscano/PokeSearch/releases/download/v0.01.81-54386/PokeSearch-v0.01.81-LT.apk — **49.546.158 bytes**, SHA-256 `03567e9cfaa16ad597039cc41ee22ca4ae59f808f51143fc000a33acdb35c98f`. A Action comparou o tamanho e digest remoto com o arquivo original.
- Certificado permanente SHA-256 `34766c15d09013ad65873f9976539c8fa2f826e917dae3af57ea628cad689e8e`, pacote `com.lucianotoscano.pokesearch`, versionCode `54386`.
- Usuários com versão anterior elegível podem ver a atualização na próxima consulta GitHub no app e instalar mediante confirmação do Android. Não há atualização forçada e a ponte Drive não foi modificada.
- Testes reais no Samsung/Moto ainda necessários para confirmar visualmente posição do aviso, aparência dos menus e exibição dos dez resultados na resolução do dispositivo.

## Espelho Drive LT181 para compartilhamento
- APK oficial extraído de artefato Actions `#12933676273`, verificado SHA-256 `03567e9cfaa16ad597039cc41ee22ca4ae59f808f51143fc000a33acdb35c98f` e 49.546.158 bytes.
- [Link compartilhável direto no Drive](https://drive.google.com/file/d/1sOV61y9De_OkPk1Kxqd2jbj2l70AwJGt/view?usp=drivesdk), arquivo ID `1sOV61y9De_OkPk1Kxqd2jbj2l70AwJGt`, na [pasta PokeSearch_App](https://drive.google.com/drive/folders/1fVw93qUDE0YWp6tlJZaNjRmymyhEAUbR). Metadados readback confirmaram o MIME APK, tamanho e `anyone/commenter`.
- Ponte legada `atualizacao.json` não alterada; atualização in-app continua consultando GitHub Releases/latest. Upload feito apenas para compartilhamento manual do instalador.
