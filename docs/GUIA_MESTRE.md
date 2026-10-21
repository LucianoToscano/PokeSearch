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
