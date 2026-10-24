#!/usr/bin/env python3
"""Empacotamento auditável de uma revisão Git real; nunca compila ou altera fonte."""
import argparse
import hashlib
import os
import pathlib
import re
import shutil
import subprocess
import sys
import zipfile
from datetime import datetime, timezone

ROOTNAME = "PokeSearch-Auditoria-Completa-Fonte"
SKIP_PARTS = {".git", ".gradle", ".idea", "node_modules", "__pycache__", "build", ".cache"}
SKIP_SUFFIXES = (".apk",".aab",".dex",".odex",".vdex",".jks",".keystore",
 ".p12",".pfx",".pem",".key",".env",".log",".tmp",".bak",".class",".so")
SKIP_NAMES = {"local.properties", "google-services.json", "credentials.json", "id_rsa", "id_ed25519"}
PATTERNS = [
 ("private-key", re.compile(rb"-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----")),
 ("github-token", re.compile(rb"\bgh[pousr]_[A-Za-z0-9]{32,}\b")),
 ("google-api-key", re.compile(rb"\bAIza[0-9A-Za-z_-]{30,}\b")),
 ("bearer-jwt", re.compile(rb"Bearer\s+eyJ[A-Za-z0-9_-]{15,}\.eyJ[A-Za-z0-9_-]{15,}\.[A-Za-z0-9_-]{10,}")),
 ("jwt-value", re.compile(rb"\beyJ[A-Za-z0-9_-]{20,}\.eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{10,}\b")),
]
def sha256(file):
 h=hashlib.sha256()
 with open(file,"rb") as f:
  for b in iter(lambda:f.read(1024*1024),b""):h.update(b)
 return h.hexdigest()
def git(root,*args):
 return subprocess.check_output(["git","-C",str(root),*args],stderr=subprocess.PIPE)
def textfile(path,text):
 path.write_text(text,encoding="utf-8",newline="\n")
def main():
 p=argparse.ArgumentParser()
 p.add_argument("--source",required=True)
 p.add_argument("--staging",required=True)
 p.add_argument("--output",required=True)
 p.add_argument("--sha",required=True)
 args=p.parse_args()
 src=pathlib.Path(args.source).resolve()
 stage=pathlib.Path(args.staging).resolve()
 out=pathlib.Path(args.output).resolve()
 commit=git(src,"rev-parse","HEAD").decode().strip()
 if commit!=args.sha:raise RuntimeError("REVISÃO DIVERGENTE: origem não está no SHA imutável fixado")
 tracked=[x.decode("utf-8") for x in git(src,"ls-files","-z").split(b"\0") if x]
 if not tracked:raise RuntimeError("Nenhum arquivo Git rastreado")
 if len(set(tracked))!=len(tracked):raise RuntimeError("Nomes Git duplicados")
 root=stage/ROOTNAME
 if root.exists():shutil.rmtree(root)
 root.mkdir(parents=True)
 excluded=[];copied=[];danger=[]
 for raw in sorted(tracked):
  path=pathlib.PurePosixPath(raw)
  if path.is_absolute() or ".." in path.parts or str(path)!=raw or "\x00" in raw:
   raise RuntimeError("Caminho não seguro no Git")
  file=src/raw
  if any(part in SKIP_PARTS for part in path.parts) or path.suffix.lower() in SKIP_SUFFIXES or path.name.lower() in SKIP_NAMES:
   excluded.append((raw,"gerado/binário/sensível ou configuração local"));continue
  if file.is_symlink():
   excluded.append((raw,"symlink: revisão manual necessária"));continue
  if not file.is_file():
   excluded.append((raw,"ausente ou não regular"));continue
  if file.stat().st_size>100*1024*1024:
   excluded.append((raw,"arquivo maior que 100 MiB, precisa revisão"));continue
  data=file.read_bytes()
  if b"\x00" not in data[:4096] and file.stat().st_size<=6*1024*1024:
   for name,regex in PATTERNS:
    if regex.search(data):
     danger.append((raw,name))
  dest=root/raw
  dest.parent.mkdir(parents=True,exist_ok=True)
  shutil.copyfile(file,dest)
  copied.append(raw)
 if danger:
  # Do not redistribute any suspicious tracked secret and do not print its value.
  raise RuntimeError("SEGREDO POTENCIAL: revisar antes de exportar: "+str(danger))
 required=[
 "docs/GUIA_MESTRE.md",
 "docs/auditoria/LT77_AUDITORIA_CONSOLIDADA_20261024.md",
 "app/src/main/java/com/lucianotoscano/pokesearchoverlay/MainActivity.java",
 "app/src/main/java/com/lucianotoscano/pokesearchoverlay/OverlayService.java",
 "app/src/main/assets/dock.html",
 "app/src/main/assets/probe.js",
 "app/src/main/assets/api_result_contract.js",
 "app/src/main/assets/api_reveal_contract.js",
 "app/src/main/assets/api_browser_transport.js",
 "app/src/main/AndroidManifest.xml",
 "app/build.gradle.kts","build.gradle.kts","settings.gradle.kts",
 ".github/workflows/lt77-authorized-api-contract-qa.yml",
 ]
 missing=[x for x in required if x not in copied]
 if missing:raise RuntimeError("Faltam arquivos críticos reais: "+repr(missing))
 stamp=datetime.now(timezone.utc).isoformat(timespec="seconds")
 prov=f"""# PROVENIÊNCIA — PACOTE PARA AUDITORIA INDEPENDENTE

- Modo: AUDITORIA_FONTE_REAL (cópia, sem reconstrução, compilação ou publicação).
- Data da coleta (UTC): {stamp}
- Repositório: LucianoToscano/PokeSearch
- Origem congelada: feature/lt77-authorized-api-contract-20261024
- SHA da revisão original incluída: {commit}
- Fonte do APK LT76 distribuído: 6916be5b2d0e13ddcb94f38baa993980cebad854
- Branch main documentada no checkpoint: caea98b7b57b9e45d5218e907eb392d76953dd53
- Release LT76: PokeSearch-v0.00.76-LT.apk, versionCode 54276; GitHub Actions #40125870288 SUCCESS.
- LT77: protótipo experimental presente nesta revisão; testes Node #40133524298 SUCCESS 38/38; SEM APK LT77 nem integração real comprovada.
- Seleção de snapshot: o usuário pediu a fonte auditável INCLUINDO mudanças LT77 descritas na conversa. Por isso esta coleta usa uma única revisão imutável da branch LT77, ainda não mesclada; NÃO é correto chamá-la de última versão publicada ou homologada. A última release publicada confirmada é LT76.
- Fonte documental complementar externa consultada para o escopo: PROMPT_MESTRE_POKESEARCH_ULTIMA_VERSAO_AUDITORIA_FONTE.md no Drive (não copiado ao ZIP; usado como instrução, não prova de implementação).
- Arquivos de fonte rastreados copiados byte a byte sem editar; relatórios de auditoria claramente GERADOS.
- Não misturar PvPPokeGo nem material não versionado de proveniência não demonstrada.
"""
 textfile(root/"PROVENIENCIA.md",prov)
 missing_optional=[x for x in ["gradlew","gradlew.bat","gradle/wrapper/gradle-wrapper.jar","gradle/wrapper/gradle-wrapper.properties"] if x not in copied]
 lac=f"""# RELATÓRIO DE LACUNAS — AUDITORIA FONTE

## CRÍTICO
- Homologação física da LT76/LT77 em Samsung NÃO realizada nesta coleta; não declarar concluída.
- Endpoint /reveal, GET sem JWT, CORS, autenticação real e formato JSON continuam sem validação em sessão autorizada do app.
## ALTO
- Integração da API não está conectada ao runtime Android (OverlayService/probe.js continuam com DOM); LT77 é experimental.
- Não há build ou APK gerado por esta exportação; a verificação de 38/38 abrange contratos Node com mocks.
## MÉDIO
- Arquivos de bootstrap do Gradle não existentes no snapshot: {", ".join(missing_optional) or "nenhum ausente"}.
- O cabeçalho histórico de docs/GUIA_MESTRE.md pode mencionar edições anteriores; a última seção da documentação prevalece como cronologia, sujeita a comparação com Git.
- Versão Gradle default e versão release podem divergir devido à injeção de parâmetros CI.
- Termos/licença/rate limits de uso da API precisam conferência específica; autorização declarada pelo proprietário não comprova cada permissão técnica.
## BAIXO
- Arquivos externos do Google Drive não foram misturados com o snapshot de código Git; verificar sua correspondência de versão antes de inclusão futura.
## EXCLUSÕES APURADAS
"""+"\n".join(f"- {p}: {why}" for p,why in excluded)+("\n" if excluded else "- Nenhuma entre os arquivos Git rastreados.\n")
 textfile(root/"RELATORIO-LACUNAS.md",lac)
 integ=f"""# RELATÓRIO DE INTEGRIDADE

- Coleta: {stamp}
- SHA fonte congelada: {commit}
- Arquivos rastreados no commit: {len(tracked)}
- Originais copiados sem alteração: {len(copied)}
- Excluídos com motivo: {len(excluded)}
- Sanitizados: 0 (se fosse detectado segredo forte, a exportação seria bloqueada).
- Scanner de indicadores de segredo privado: sem detecção nos arquivos textuais rastreados avaliados.
- Marcadores de estrutura comprovados: GUIA_MESTRE, AndroidManifest, MainActivity, OverlayService, dock.html, probe.js, contratos LT77, testes, Gradle Kotlin DSL.
- Diretórios Git, cache, APK, AAB, keystores privados e local.properties: não incluídos.
- Verificação de CRC, caminhos relativos, lista e hashes: realizada pelo próprio exportador após gerar o ZIP.
- LIMITAÇÃO: varredura automatizada não equivale a auditoria de segurança exaustiva. Deve haver revisão humana das configurações/recursos no pacote antes de disponibilização pública ampla.
- O ZIP não comprova que a LT77 compile nem que a API responda realmente.
"""
 textfile(root/"RELATORIO-INTEGRIDADE.md",integ)
 readme=f"""# PokeSearch — entrega de código-fonte para auditoria

**MODO:** AUDITORIA_FONTE_REAL; **snapshot experimental LT77** (última publicação confirmada: LT76).
**Fonte:** GitHub LucianoToscano/PokeSearch @{commit}
**Coletado:** {stamp}

Abra o projeto com Android Studio e JDK 17. O projeto original utiliza Gradle Kotlin DSL; confira os arquivos build.gradle.kts e app/build.gradle.kts. Alguns arquivos de wrapper podem não estar versionados; consulte RELATORIO-LACUNAS.md e configure seu ambiente sem substituir código silenciosamente.

Aplicação Android Overlay + WebView + evaluateJavascript + probe.js.
O projeto inclui autenticação da sessão do site, filtros, Shiny, PvP, favoritos, notificações, UI de resultados e editor; o código de API LT77 está isolado e desligado do Android. Consulte docs/GUIA_MESTRE.md para cronologia real e docs/auditoria/LT77_AUDITORIA_CONSOLIDADA_20261024.md para detalhes técnicos, limites e testes. Não assuma homologação Samsung.

Identidade do APK distribuído LT76 informada e confirmada anteriormente: applicationId com.lucianotoscano.pokesearch; namespace com.lucianotoscano.pokesearchoverlay; versionName 0.00.76; versionCode 54276. Verifique defaults Gradle e CI separadamente. Fonte do APK publicado: 6916be5b2d0e13ddcb94f38baa993980cebad854, diferente da revisão experimental deste pacote.

Testes anteriores: Actions #40133524298, 38/38 Node com mocks; nenhum HTTP ao vivo e nenhum build Android. Não compilar, assinar ou publicar sem autorização explícita.

ARQUIVOS ORIGINAIS COPIADOS SEM ALTERAÇÕES. OS RELATÓRIOS NA RAIZ DESTE ZIP FORAM GERADOS PARA AUDITORIA. NÃO É UMA RECONSTRUÇÃO DO ZERO.

Verificação: sha256sum -c CHECKSUMS-SHA256.txt; o arquivo de checksums exclui a si mesmo. LISTA-ARQUIVOS.txt registra classificação e tamanho dos arquivos e os arquivos autorreferentes.
"""
 textfile(root/"LEIA-ME-AUDITORIA.md",readme)
 # LISTA-ARQUIVOS itself and CHECKSUMS are marked auto-referential
 originals=set(copied)
 paths=sorted(p.relative_to(root).as_posix() for p in root.rglob("*") if p.is_file())
 listing=["LISTA DE ARQUIVOS DO ZIP — caminhos relativos à pasta raiz",
  "O tamanho de arquivos autorreferentes LISTA-ARQUIVOS.txt e CHECKSUMS-SHA256.txt não é auto-hasheado para evitar recursividade.",
  "CATEGORIA | BYTES | ARQUIVO"]
 for x in paths:
  listing.append(f"{'ORIGINAL' if x in originals else 'GERADO'} | {(root/x).stat().st_size} | {x}")
 listing.extend(["GERADO | autorreferente | LISTA-ARQUIVOS.txt",
                 "GERADO | autorreferente | CHECKSUMS-SHA256.txt"])
 textfile(root/"LISTA-ARQUIVOS.txt","\n".join(listing)+"\n")
 hashes=["# SHA-256 de todos os arquivos exceto este CHECKSUMS-SHA256.txt."]
 for file in sorted(p for p in root.rglob("*") if p.is_file() and p.name!="CHECKSUMS-SHA256.txt"):
  rel=file.relative_to(root).as_posix()
  hashes.append(f"{sha256(file)}  {rel}")
 textfile(root/"CHECKSUMS-SHA256.txt","\n".join(hashes)+"\n")
 out.mkdir(parents=True,exist_ok=True)
 final=out/(ROOTNAME+".zip")
 if final.exists():final.unlink()
 source_files=sorted(x.relative_to(root).as_posix() for x in root.rglob("*") if x.is_file())
 with zipfile.ZipFile(final,"w",compression=zipfile.ZIP_DEFLATED,compresslevel=6,allowZip64=True) as archive:
  for rel in source_files:
   archive.write(root/rel,arcname=ROOTNAME+"/"+rel)
 with zipfile.ZipFile(final) as archive:
  if archive.testzip() is not None:raise RuntimeError("CRC inválido")
  names=archive.namelist()
  expected=[ROOTNAME+"/"+rel for rel in source_files]
  if sorted(names)!=sorted(expected):raise RuntimeError("ZIP incompleto")
  for name in names:
   p=pathlib.PurePosixPath(name)
   if name.startswith("/") or ".." in p.parts or p.parts[0]!=ROOTNAME:raise RuntimeError("ZIP com path inseguro")
  for row in hashes[1:]:
   expectedhash,name=row.split("  ",1)
   if hashlib.sha256(archive.read(ROOTNAME+"/"+name)).hexdigest()!=expectedhash:
    raise RuntimeError("Inconsistência checksum: "+name)
 if len(copied)!=len(tracked)-len(excluded):raise RuntimeError("Contagem fonte inconsistente")
 result=f"""PACOTE_VALIDADO
nome={final.name}
arquivo_fonte_commit={commit}
arquivo_fonte_branch=feature/lt77-authorized-api-contract-20261024
arquivos_git_rastreados={len(tracked)}
arquivos_git_copiados={len(copied)}
excluidos={len(excluded)}
arquivos_gerados={len(source_files)-len(copied)}
arquivos_total_zip={len(source_files)}
bytes_zip={final.stat().st_size}
sha256_zip_local={sha256(final)}
guia_mestre_bytes={(root/"docs/GUIA_MESTRE.md").stat().st_size}
zip_crc=PASS
zip_manifesto_hashes=PASS
zip_caminhos=PASS
modo=AUDITORIA_FONTE_REAL_SNAPSHOT_LT77_EXPERIMENTAL
apk_gerado=NAO
"""
 textfile(out/"RESULTADO_EXPORTACAO.txt",result)
 print(result)
if __name__=="__main__":
 try:main()
 except Exception as e:
  print("EXPORTACAO_FALHOU: "+str(e),file=sys.stderr)
  sys.exit(1)
