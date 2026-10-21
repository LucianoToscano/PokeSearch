# PokeSearch — GUIA MESTRE

## Base ZERO — 20/10/2026

Decisão: reiniciar o aplicativo do zero, sem reaproveitar lógica de versões anteriores. Implementar novas funções somente conforme instrução explícita do usuário.

- Branch nova: `rebuild/zero-20261020`
- Backup integral do código anterior: `backup/pre-restart-20261020`
- Commit da base preservada: `3fc3e38fb5fb95034210ee907c5705946e8e471a`
- Repositório único: `LucianoToscano/PokeSearch` (não confundir com PvPPokeGo)
- Nome exibido: `PokeSearch`
- Identidade única (`applicationId`): `com.lucianotoscano.pokesearch`
- Namespace original: `com.lucianotoscano.pokesearchoverlay`
- Certificado SHA-256 de assinatura **permanente de testes**: `34766c15d09013ad65873f9976539c8fa2f826e917dae3af57ea628cad689e8e`
- O arquivo da chave privada NÃO é salvo no Git: continua armazenado nos secrets do GitHub Actions.
- Ícone: PNG original `app/src/main/res/drawable-nodpi/ic_launcher.png` e gerador original `app/scripts/RoundIcon.java`.
- versionCode: 53000 + número da execução do workflow (maior que o APK de teste anterior); versionName `3.00-zero.test.XXXXX`.
- Interface: tela preta vazia, nenhuma ação, rede, overlay, serviço, filtro, WebView ou permissão declarada.
- Esta branch é isolada; não alterar nem apagar o backup, a branch antiga, a main ou seus APKs históricos.
- Para instalar sobre o APK anterior, requer mesmo `applicationId`, mesmo certificado de teste e versionCode superior.

## Próximas etapas

Esperar pedidos sucessivos do usuário, acrescentando recursos um por um. Documentar neste mesmo arquivo.


## HOME-001 — Interface inicial com ícones e importação/exportação (20/10/2026)

Pedido atual: criar uma HOME nova (sem filtros, sem recuperação do OverlayService anterior), usando integralmente os arquivos originais `Background PokeSearch Escuro.png` e `Background PokeSearch Claro.png` obtidos no Google Drive. Preserve PNGs originais nos recursos Android `ps_home_background_dark.png` e `ps_home_background_light.png`. Reutilizada também a arte oficial `ps_home_brand_transparent.png` como logo central; ícone do APK e identidade/assinatura permanecem os mesmos.

Controles HOME:
- Menu: abre navegação simplificada para as ações da HOME.
- Tema: alterna claro/escuro imediatamente, salvo localmente em SharedPreferences.
- Login: ícone com aviso transparente de que a implementação virá na etapa correspondente; ainda sem autenticação.
- Doar: recuperado exclusivamente o recurso PixSupport já verificado; não recupera demais módulos legados.
- Reportar bug: abre compartilhamento Android com texto básico para o usuário preencher, sem envio automático.
- Overlay: ícone com aviso de funcionalidade a implementar; não requer ou inicia permissão/serviço ainda.
- Exportar dados: salva JSON de preferências atuais via seletor de documentos do Android, sem pedir permissão de armazenamento.
- Importar dados: lê e valida JSON PokeSearch de até 64 KiB, aceita apenas `schema=1` e `theme=dark/light`, não executa código e mantém as preferências se inválido.

Nenhum login, overlay, dados de Pokémon ou filtros são adicionados nesta etapa. A importação/exportação contempla **apenas as preferências implementadas** (tema), não dados inexistentes do antigo app.

Código: `MainActivity.java`, vetores `res/drawable/ps_*.xml`, `PixSupport.java` e os PNGs originais. Manter `applicationId=com.lucianotoscano.pokesearch` e certificado teste `34766c15d09013ad65873f9976539c8fa2f826e917dae3af57ea628cad689e8e`.

Versionamento HOME: `3.01-home.test.<versionCode>`; versionCode incremental mantido no CI. Sem merge na main.
