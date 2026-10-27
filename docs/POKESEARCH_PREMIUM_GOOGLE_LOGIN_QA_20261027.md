# PokeSearch Premium — login Google no Android (somente QA)
Data: 27/10/2026 | Base: `feature/premium-pix-remote-control-qa-20261027`

## Escopo e isolamento
- Adiciona **Entrar com Google para Premium** e **Sair da conta Premium** somente no fluxo controlado da segunda Pokébola.
- A mesma conta Google da **Central Premium Deus Ivern** produz o mesmo UID Firebase, inclusive após reinstalar o APK e iniciar sessão outra vez.
- Firebase Auth separado com app nomeado `PokeSearchPremiumIdentity`; a instância `PokeSearchStats` continua anônima para instalações e presença online.
- PoGoCoordinates (Google/Discord, cookies e WebViews) **não é alterado**.
- `CONTROLLED_DISTRIBUTION=false` permanece o padrão, portanto APKs oficiais não passam a exigir login/pagamento/bloqueio.
- O backend em uso no APK controlado de QA é `https://pokesearch-premium-ivern.netlify.app/api/premium`.
- **Sem cobranças e sem habilitar `distribution/globalEnabled` ou `premium/config/salesEnabled`**.

## Configuração obrigatória antes de assinar APK controlado
1. No Firebase **pokesearch-lt**, confirme Authentication → Sign-in method → Google habilitado.
2. Firebase → Project settings → General → Your apps: registre/selecionе Android `com.lucianotoscano.pokesearch` no projeto **pokesearch-lt**, e configure SHA-1 e SHA-256 do **mesmo certificado com que o APK de QA será assinado**. Não misture certificados de Android e nem altere a configuração de outros aplicativos.
3. Google Cloud → APIs e serviços → Credenciais: no mesmo projeto `pokesearch-lt`, obtenha o **ID do cliente OAuth 2.0 do tipo Aplicativo da Web** (termina em `.apps.googleusercontent.com`). É um identificador público, **não um access token e nem uma chave privada**.
4. Configure `POKE_GOOGLE_WEB_CLIENT_ID` como variável de ambiente **do build Android assinado**, por exemplo no ambiente protegido do GitHub Actions. O Gradle falha de propósito quando `POKE_CONTROLLED_DISTRIBUTION=true` e a variável está ausente.
5. Preserve a assinatura permanente do PokeSearch. **Não é necessário trocar o arquivo `google-services.json` de produção:** o app já possui a inicialização pública e nomeada do Firebase LT, reutilizada pela conta Premium.

Documentação do Google: https://firebase.google.com/docs/auth/android/google-signin
Credential Manager: https://developer.android.com/identity/sign-in/credential-manager-siwg-implementation

## Teste em um aparelho Samsung (depois da assinatura QA e liberação controlada)
1. Instale **somente** a edição de QA protegida. Verifique que os contadores, login PoGoCoordinates e a Pokébola 1 continuam intactos.
2. Na Home, toque na Pokébola 2. Quando não estiver autenticado, deverá aparecer o painel Premium e o botão **Entrar com Google para Premium**.
3. Escolha exatamente a conta usada no painel Netlify Deus Ivern. O app deve mostrar o e-mail conectado. **Não copia tokens nem senhas**.
4. Com versão/control `distribution` ainda desativados, o login pode ser testado, mas as Pokébolas controladas continuam bloqueadas por padrão. Esta é a proteção esperada; não habilitar flags antes da homologação.
5. Com aprovação explícita e um `versionCode` isolado de QA, libere no servidor apenas essa versão; confirme que a licença de 15 dias da conta Google permite a Pokébola 2 e que outra conta não tem o mesmo direito.
6. Teste revogação, expiração, dispositivo offline, troca de conta e reinicialização sem gravar concessões de Premium localmente.
7. **Sair da conta Premium** deve invalidar imediatamente a autorização em cache. A licença continua no Firebase e pode ser recuperada após novo login na mesma conta Google.

## Restrições
- Uma licença já emitida para UID Google não é automaticamente migrada de um UID anônimo antigo. A nova integração evita usar o UID anônimo como identidade de compra/resgate.
- Não há autenticação via WebView: o SDK nativo Credential Manager realiza a seleção de conta e o Firebase valida a credencial.
- `POKE_GOOGLE_WEB_CLIENT_ID` é apenas um identificador público no APK; NUNCA incluir `POKE_FIREBASE_PRIVATE_KEY`, `POKE_PREMIUM_KEY_SECRET` ou tokens Mercado Pago no Android.
- Os testes unitários estáticos não substituem a validação de login real no aparelho (SHA-1, OAuth e conta configurados).
- Não publicar na main, não gerar release nem alterar flags do Firebase sem autorização expressa.
