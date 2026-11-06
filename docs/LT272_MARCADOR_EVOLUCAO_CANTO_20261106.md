# LT272 — Marcador de evolução pequeno sem deslocar bandeiras

- **Mudança visual solicitada:** substituir o `↳` que ocupava espaço ao lado de `#rank` pelo **ícone original branco/verde enviado pelo usuário**, em PNG transparente de 128×128, sem fundo preto. `ui-icons/ps-evolution-lt272.png`, SHA-256 `67a26f134fbe41a38d75bd4a0e13de526379a029dc904a7cd0e26701c7c78aa5`. Fonte original entregue no chat, recortada e otimizada, sem mudar desenho.
- **Geometria:** canto inferior direito `right:5px; bottom:5px` dentro do botão, ícone 15×15 CSS px (13×13 no viewport estreito), ~1 mm de afastamento visual da borda; nenhum toque no contorno. `#rank` permanece na linha superior e bandeiras centrais originais **não são reposicionadas nem reduzidas**. Marcador não intercepta toques.
- **Aplicação:** Raides projetadas, GL, UL, ML e Rank Geral com `evolves` confirmado, inclusive ao trocar liga no explorador RG. Sem emblema se não houver evolução; apenas dados verificados. As duas Pokébolas, Modos, golpes por liga, fontes e mecanismo OTA não foram modificados.
- **Validação prevista:** contrato Node com SHA do PNG e sem seta, screenshot P/M/G verificando pelo DOM margem direita/inferior, distância vertical do rank, bandeira centralizada e sem cortes. Teste físico Samsung ainda pendente; não anunciar APK até CI, assinatura e publicação confirmadas.
- **Versionamento solicitado ao CI:** LT272 `0.02.72` / `versionCode 54476`; rollback LT271 `v0.02.71-54475`.

