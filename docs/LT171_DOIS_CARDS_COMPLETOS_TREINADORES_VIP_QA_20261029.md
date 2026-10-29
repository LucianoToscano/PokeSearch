# PokeSearch LT171 — dois cards completos e seleção VIP por Pokébola

Data: 29/10/2026. **Base real**: LT170 `0.01.70 / versionCode 54375`, Release `v0.01.70-54375`. Não reiniciar da LT169.

## Solicitação e escopo
Usuário pediu que a Home apresente **dois cartões de conta PoGoCoordinates iguais**, não o antigo cartão resumido da Conta 2, e permita:
- Conta 1 VIP com dois treinadores: P1 = Conta 1 / Treinador 1 e P2 = Conta 1 / Treinador 2, ou ambos no mesmo treinador.
- Conta 1 com dois treinadores e Conta 2 com um: combinações P1/P2 individuais por conta e treinador.
- Conta 2 também com dois treinadores quando o site comprovar o vínculo VIP, sem inventar treinador extra.
- Conta 1 e Conta 2 com login Google/Discord e cookies WebView isolados como na LT170, sessões e quotas independentes conforme o provedor.

## Código implementado
- `MainActivity.java`: card da Conta 2 agora replica dimensões/hierarquia do card da Conta 1: avatar circular, identidade e provedor, saída, linha Treinador vinculado com ícone discreto só em contas com 2+, equipe (Mystic/Valor/Instinct), nível, nome, código 12 dígitos, copiar e gerenciamento/remover no perfil oficial.
- Ambos os cards usam as preferências `homeShowPogoAccountName`, `homeShowTrainerName` e `homeShowTrainerCode`. Anônimo e `XXXX XXXX XXXX` são máscaras visuais; a cópia continua usando código real.
- Avatar da Conta 2 usa somente imagem pública Google CDN allowlisted, sem cookies, cabeçalhos JWT ou acesso à sessão da Conta 1. Se rede falhar, mantém ícone neutro.
- `showPokeballAccountChoice` mostra quantidade de treinadores verificados por conta; `choosePokeballTrainer` identifica Treinador 1/2/… por conta, sem cruzar códigos, sem Shiny se explicitamente "Sem treinador". P1/P2 armazenam vínculo independente já implementado na LT170 (`PogoAccountSlots`).
- Ícone de troca da Conta 2 altera somente o treinador selecionado **no cartão da própria Conta 2**, não altera os vínculos explícitos das duas Pokébolas. Se 0/1 vinculados, ícone ausente sem espaço.
- O perfil WebView `MULTI_PROFILE` é obrigatório para Conta 2 e nenhum fallback pode compartilhar cookies; sem suporte no aparelho, mensagem explicativa substitui controles de login.
- Preservados Premium, acesso a resultados, GL/UL, Shiny, sprites, alertas, localização, cards de detalhes, chat e as duas Pokébolas. Nenhuma alteração em Firebase Rules, cookies do provedor ou certificados.

## QA e publicação
- Testes `lt171-vip-two-trainers-per-account.test.js` (parser oficial 2/2 + 1/1 e seletor por Pokébola) e `lt171-two-mirrored-profile-cards.test.js` (card completo, privacidade, avatar, ações e separação de treinadores).
- Workflow oficial reservado para merge autorizado: `.github/workflows/lt171-full-cards-vip-official-release.yml`. Somente após passar Node, Java, R8, ZIP, certificado Android v2 permanente e guard de `releases/latest=v0.01.70-54375`, poderá gerar tag `v0.01.71-54376` e disponibilizar APK aos usuários por GitHub Releases.
- **QA físico pendente**: Samsung, contas A/B, P1 e P2 trocando treinador VIP, avatar, privacy, cópia do código, logout de Conta 2 sem derrubar Conta 1. CI não equivale a teste no dispositivo.
- **Status durante implementação**: a LT170 continua latest até a release LT171 ser efetivamente publicada. Não alegar distribuição antecipadamente.
