#!/usr/bin/env python3
"""Edu LT320: auditoria conservadora, separação 68 quadros e ZIP reproduzível."""
import base64,csv,hashlib,io,json,math,re,shutil,zipfile
from pathlib import Path
from collections import Counter
from PIL import Image,ImageDraw,ImageFont,ImageFilter,ImageChops
ROOT=Path(__file__).resolve().parents[1]
ASSETS=ROOT/"app/src/main/assets"
NAME="EDU_68_SPRITES_LT320_AUDITORIA_2026-11-08"
OUT=ROOT/"exports/edu_sprite_audit"
NAMES={
 0:"pokebola_01",1:"pokebola_02",2:"pokebola_03",3:"pokebola_04",
 4:"alerta",5:"caminhada_frente_01",6:"caminhada_frente_02",7:"caminhada_frente_03",8:"caminhada_frente_04",
 9:"arrastado_01",10:"arrastado_02",11:"arrastado_03",12:"arrastado_04",13:"arrastado_05",
 14:"arrastado_06",15:"arrastado_07",16:"arrastado_08",17:"arrastado_09",18:"arrastado_final",
 19:"fechar_reabrir_jogo",20:"iniciar_reide",21:"captura_informada",22:"conferir_passes",23:"confirmando",
 24:"caminhada_direita_01",25:"caminhada_direita_02",26:"caminhada_direita_03",27:"caminhada_direita_04",
 28:"esperar_batalha_reide",29:"esperar_mapa_01",30:"esperar_mapa_02",31:"esperar_mapa_03",
 32:"caminhada_esquerda_01",33:"caminhada_esquerda_02",34:"caminhada_esquerda_03",35:"caminhada_esquerda_04",
 36:"evento_encerrado",37:"evento_iniciado",38:"evento_nao_comecou",39:"passe_extra_confirmado",
 40:"ir_local_evento",41:"resumo_concluido",42:"parado_apresentacao",43:"passe_gratuito",44:"perguntando",
 45:"pokemon_fugiu",46:"reide_perdida",47:"repetir_ciclo",48:"reide_abandonada",49:"sem_passe",
 50:"guardar_passe_vespera",51:"softban_aviso",
 52:"teleporte_01",53:"teleporte_02",54:"teleporte_03",55:"teleporte_04",56:"teleporte_05",
 57:"teleporte_06",58:"teleporte_07",59:"teleporte_08",60:"teleporte_09",61:"falha_relato",
 62:"shiny",63:"jogando_01",64:"jogando_02",65:"armadura_mewtwo",
 66:"armadura_mewtwo_shiny",67:"sombria_ansioso"
}
RETOQUES={20,28,30,36,49}
# Parâmetros extraídos de EduSpriteManualRetouch.java, sem modificar código do app.
RETOUCH={
 20:dict(poly=[(22,15),(70,15),(78,23),(79,44),(90,63),(91,84),(85,117),(26,124),(16,100),(15,55)],scale=1.115,head=56.97,feet=117,props=[(83,73,107,108)]),
 28:dict(poly=[(26,23),(76,19),(85,36),(89,55),(87,83),(85,122),(27,124),(22,84),(21,49)],scale=1.155,head=58.60,feet=118,props=[(91,59,122,84)]),
 30:dict(poly=[(25,20),(78,19),(89,35),(91,58),(90,86),(87,124),(28,124),(22,86),(21,48)],scale=1.135,head=61.66,feet=118,props=[(96,68,119,99)]),
 36:dict(poly=[(23,19),(69,18),(79,35),(81,58),(83,89),(79,124),(25,124),(19,86),(18,45)],scale=1.165,head=55.66,feet=119,props=[(81,9,112,46),(84,54,122,112)]),
 49:dict(poly=[(25,18),(78,16),(88,34),(93,57),(92,81),(89,108),(82,124),(25,124),(18,86),(17,48)],scale=1.090,head=55.68,feet=116,props=[(93,10,128,54),(93,54,128,119)])
}
assert len(NAMES)==68
def retouch_approx_android(source,i):
    """Aproxima máscara de polígono, escala do corpo e reposição de props
    usados pelo Java; Android Canvas é referência final, não Pillow."""
    q=RETOUCH[i]
    mask=Image.new("L",(128,128),0)
    ImageDraw.Draw(mask).polygon(q["poly"],fill=255)
    body=source.copy()
    body.putalpha(ImageChops.multiply(source.getchannel("A"),mask))
    width=round(128*q["scale"])
    body=body.resize((width,width),Image.Resampling.NEAREST)
    dx=round(64-q["head"]*q["scale"])
    dy=round(119-q["feet"]*q["scale"])
    result=source.copy()
    result.putalpha(ImageChops.multiply(
        source.getchannel("A"),ImageChops.invert(mask)))
    layer=Image.new("RGBA",(128,128))
    layer.paste(body,(dx,dy))
    result=Image.alpha_composite(result,layer)
    for box in q["props"]:
        result.paste(source.crop(box),(box[0],box[1]))
    return result
def digest(data):return hashlib.sha256(data).hexdigest()
def font(size,bold=False):
    path="/usr/share/fonts/truetype/dejavu/DejaVuSans"+("-Bold" if bold else "")+".ttf"
    try:return ImageFont.truetype(path,size)
    except OSError:return ImageFont.load_default()
def crop_name(i):return ("%02d_"%i)+NAMES[i]+".png"
def preview_sheet(frames,indices,dest,columns,slot,header):
    rows=math.ceil(len(indices)/columns)
    width=columns*slot
    height=56+rows*(slot+48)
    sheet=Image.new("RGB",(width,height),"#111d2c")
    draw=ImageDraw.Draw(sheet)
    draw.text((16,14),header,fill="white",font=font(20,True))
    for n,i in enumerate(indices):
        x=(n%columns)*slot+8
        y=56+(n//columns)*(slot+48)
        panel=Image.new("RGBA",(slot-16,slot-16),"#344454")
        pdraw=ImageDraw.Draw(panel)
        for yy in range(0,slot-16,24):
            for xx in range(0,slot-16,24):
                if (xx//24+yy//24)%2==0:
                    pdraw.rectangle((xx,yy,xx+23,yy+23),fill="#405065")
        size=slot-28
        frame=frames[i].resize((size,size),Image.Resampling.NEAREST)
        panel.alpha_composite(frame,(6,6))
        sheet.paste(panel.convert("RGB"),(x,y))
        draw.text((x,y+slot-9),("%02d "%i)+NAMES[i][:25],
                  fill="#eaf3f7",font=font(12,True))
    dest.parent.mkdir(parents=True,exist_ok=True)
    sheet.save(dest,optimize=True)
def main():
    if OUT.exists():shutil.rmtree(OUT)
    OUT.mkdir(parents=True)
    raw64=(ASSETS/"edu_avatar_uniform_68_lt316.b64").read_bytes()
    raw=base64.b64decode(re.sub(rb"\s+",b"",raw64),validate=True)
    atlas=Image.open(io.BytesIO(raw)).convert("RGBA")
    if atlas.size!=(1024,1152):raise RuntimeError("Atlas corrigido não tem 1024x1152")
    folders={
      "base":OUT/"01_Fontes_originais",
      "128":OUT/"02_PNG_128_originais",
      "512px":OUT/"03_PNG_512_pixel_art_derivado",
      "512soft":OUT/"04_PNG_512_amostragem_derivada",
      "retoque":OUT/"05_Retoques_LT316_referencia",
      "prev":OUT/"06_Previas",
      "audit":OUT/"07_Auditoria"
    }
    for p in folders.values():p.mkdir()
    folders["base"].joinpath("atlas_corrigido_LT316.webp").write_bytes(raw)
    for f in ("edu_avatar_uniform_68_lt316.b64","edu_avatar_uniform_68.webp",
              "edu_avatar_atlas_62.webp","edu_avatar_extra_5.webp",
              "edu_avatar_idle_consistent_22.webp","edu_sombria_68.b64"):
        original=ASSETS/f
        if original.exists():shutil.copy2(original,folders["base"]/f)
    frames=[]
    audit=[]
    for i in range(68):
        x=(i%8)*128;y=(i//8)*128
        image=atlas.crop((x,y,x+128,y+128))
        frames.append(image)
        name=crop_name(i)
        image.save(folders["128"]/name,optimize=True)
        image.resize((512,512),Image.Resampling.NEAREST).save(
            folders["512px"]/name,optimize=True)
        # Alternativa apenas de exibição. Não recria detalhes/olhos 512.
        image.resize((512,512),Image.Resampling.LANCZOS).filter(
            ImageFilter.UnsharpMask(radius=.6,percent=60,threshold=2)
        ).save(folders["512soft"]/name,optimize=True)
        alpha=image.getchannel("A")
        visible=alpha.point(lambda a:255 if a>15 else 0)
        bbox=visible.getbbox()
        coverage=round(sum(visible.histogram()[16:])/(128*128)*100,1)
        near_edge=bool(bbox and (bbox[0]<=1 or bbox[1]<=1 or
                         bbox[2]>=127 or bbox[3]>=127))
        note=[]
        if bbox is None:note.append("TOTALMENTE_VAZIO")
        if coverage<6:note.append("BAIXA_COBERTURA")
        if near_edge:note.append("PIXEL_JUNTO_A_BORDA")
        if 52<=i<=60:note.append("TELEPORTE_EFEITO_VARIACAO_INTENCIONAL")
        if i in RETOQUES:note.append("RETOQUE_ANDROID_APLICADO_EM_RUNTIME")
        if i in (36,37,38,49,50,51,67):note.append("REVISAR_ROSTO_E_ACESSORIOS")
        audit.append({
            "indice":i,"nome":NAMES[i],"tamanho":"128x128",
            "bbox_px":str(bbox),"cobertura_pct":coverage,
            "proximo_borda":near_edge,"sha256_rgba":digest(image.tobytes()),
            "avisos":";".join(note),
            "estado":"REVISAR" if note else "SEM_ALERTA_GEOMETRICO"
        })
    # Antes/depois dos cinco retoques de acessórios da LT316.
    # São APROXIMAÇÕES em Pillow; o Java/Android é a referência exata.
    for i in sorted(RETOQUES):
        frame=frames[i]
        fixed=retouch_approx_android(frame,i)
        nm=crop_name(i)
        frame.save(folders["retoque"]/("ANTES_"+nm),optimize=True)
        fixed.save(folders["retoque"]/("DEPOIS_aproximado_"+nm),optimize=True)
        fixed.resize((512,512),Image.Resampling.NEAREST).save(
            folders["retoque"]/("DEPOIS_512_derivado_"+nm),optimize=True)
    preview_sheet(frames,list(range(68)),
        folders["prev"]/"PAINEL_68_QUADROS.png",8,174,
        "EDU 68 SPRITES - ATLAS LT316 (128 pixels por quadro)")
    preview_sheet(frames,list(range(34)),
        folders["prev"]/"LEITURA_00_A_33.png",5,224,
        "EDU 00 A 33 - REF AZUL ESCURO")
    preview_sheet(frames,list(range(34,68)),
        folders["prev"]/"LEITURA_34_A_67.png",5,224,
        "EDU 34 A 67 - REF AZUL ESCURO")
    # Simulação de escala dos principais estados e acessórios.
    for size in (100,150,200):
        subset=[42,38,37,36,44,67,62,20,28,49]
        canvas=Image.new("RGB",(5*215,2*250+50),"#101b2b")
        d=ImageDraw.Draw(canvas)
        d.text((14,12),f"Edu tamanho {size} px (prévia derivada)",
               font=font(21,True),fill="white")
        for j,i in enumerate(subset):
            xx=(j%5)*215+8; yy=55+(j//5)*250
            frame=frames[i].resize((size,size),Image.Resampling.NEAREST)
            canvas.paste(frame,(xx+(195-size)//2,yy),frame)
            d.text((xx,yy+210),f"{i:02d} {NAMES[i][:21]}",
                   font=font(12,True),fill="#e7eef8")
        canvas.save(folders["prev"]/f"ESCALA_{size}px.png",optimize=True)
    with (folders["audit"]/"inventario_status_68.csv").open(
        "w",encoding="utf-8-sig",newline="") as f:
        writer=csv.DictWriter(f,fieldnames=list(audit[0]))
        writer.writeheader();writer.writerows(audit)
    h=Counter(x["sha256_rgba"] for x in audit)
    duplicates=[x["indice"] for x in audit if h[x["sha256_rgba"]]>1]
    alerts=[x["indice"] for x in audit if x["avisos"]]
    result={
        "atlas_sha256":digest(raw),"atlas_size":[1024,1152],
        "total_quadros":68,"origem_cada_quadro":[128,128],
        "quadros_sem_pixels":[x["indice"] for x in audit if x["bbox_px"]=="None"],
        "quadros_alerta":alerts,"quadros_duplicados_por_pixels":duplicates,
        "cinco_retoques_runtime":sorted(RETOQUES),
        "teleporte_variavel":list(range(52,61))
    }
    (folders["audit"]/"resumo.json").write_text(
        json.dumps(result,indent=2,ensure_ascii=False),encoding="utf8")
    report=[
        "# Auditoria EDU LT320 - 68 sprites",
        "",
        "Origem: atlas LT316, 1024x1152, 68 células de 128x128.",
        "SHA-256 dos bytes WebP: "+digest(raw),
        "Quadros totalmente vazios: "+str(result["quadros_sem_pixels"]),
        "Quadros com alertas técnicos/contextuais: "+str(alerts),
        "Quadros de pixels duplicados: "+str(duplicates),
        "",
        "## Limitações essenciais",
        "- NÃO EXISTEM mestres originais de 512px por quadro no repositório atual.",
        "- As duas pastas 512px são AMPLIAÇÕES derivadas, nunca fontes novas nem recriação fiel de olhos.",
        "- A auditoria automatizada verifica integridade, geometria, bordas e transparência; NÃO comprova perfeição artística, identidade facial ou nitidez de origem.",
        "- Quadros 52 a 60 de teleporte têm escala/opacidade intencionalmente variáveis.",
        "- Quadros 20, 28, 30, 36 e 49 recebem retoques Android; pasta 05 contém ANTES, DEPOIS aproximado e 512 derivado. A aproximação Pillow NÃO é pixel a pixel igual ao Canvas Android.",
        "- Inspecionar visualmente especialmente olhos/óculos e acessórios nos índices 36,37,38,42,49,50,51,67.",
        "",
        "## O que fazer para melhorar de verdade",
        "- Conferir ambas as opções derivadas lado a lado nos tamanhos P100/M150/G200.",
        "- Não trocar fontes em produção sem QA visual real no aparelho.",
        "- Obter arquivos mestres de 512px para refazer a qualidade sem inventar detalhes.",
        "- CSV inclui medidas de todos os 68 índices; status SEM_ALERTA_GEOMETRICO não significa aprovação artística.",
        ""
    ]
    (folders["audit"]/"RELATORIO.md").write_text(
        "\n".join(report),encoding="utf8")
    (OUT/"LEIA_PRIMEIRO.txt").write_text(
        "Pacote de auditoria dos 68 sprites Edu LT320.\n"
        "Pasta 02 = originais 128. Pastas 03 e 04 = DERIVADOS 512, não originais.\n"
        "Pasta 05 = cinco retoques em comparações ANTES/DEPOIS aproximadas (não idênticas ao Android).\n"
        "Painéis e relatórios nas pastas 06 e 07.\n",encoding="utf8")
    zip_path=OUT.parent/(NAME+".zip")
    with zipfile.ZipFile(zip_path,"w",zipfile.ZIP_DEFLATED,compresslevel=7) as z:
        for f in sorted(OUT.rglob("*")):
            if f.is_file():z.write(f,arcname=NAME+"/"+str(f.relative_to(OUT)))
    summary={
        "zip":str(zip_path.relative_to(ROOT)),
        "bytes":zip_path.stat().st_size,
        "sha256":digest(zip_path.read_bytes()),
        "quadros_png_128":len(list(folders["128"].glob("*.png"))),
        "quadros_512_pixel":len(list(folders["512px"].glob("*.png"))),
        "quadros_512_amostrados":len(list(folders["512soft"].glob("*.png"))),
        "avisos":len(alerts)
    }
    (OUT.parent/(NAME+"_RESUMO.json")).write_text(
        json.dumps(summary,indent=2,ensure_ascii=False),encoding="utf8")
    print(json.dumps(summary,indent=2,ensure_ascii=False))
if __name__=="__main__":main()
