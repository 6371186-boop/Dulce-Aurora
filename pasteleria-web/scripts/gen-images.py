# Genera ilustraciones SVG de ejemplo. Reemplázalas por fotos reales con el mismo nombre o cambia la URL en el admin.
import os
D=os.path.join(os.path.dirname(__file__),'..','public','images')
def wrap(b1,b2,body,w=400,h=500):
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="{b1}"/><stop offset="1" stop-color="{b2}"/></linearGradient></defs><rect width="{w}" height="{h}" fill="url(#g)"/><ellipse cx="200" cy="395" rx="150" ry="22" fill="#000" fill-opacity=".08"/>{body}</svg>'
def plate(): return '<ellipse cx="200" cy="370" rx="150" ry="26" fill="#fff"/><ellipse cx="200" cy="364" rx="130" ry="20" fill="#f3ece2"/>'
def cake(sp,fr,top,b1,b2,tiers=2):
    s=plate();y=340
    for i in range(tiers):
        w=200-i*50;x=200-w/2;h=62
        s+=f'<rect x="{x}" y="{y-h}" width="{w}" height="{h}" rx="10" fill="{sp}"/><rect x="{x}" y="{y-h}" width="{w}" height="14" fill="{fr}" opacity=".9"/>'
        for k in range(5):
            dx=x+14+k*(w-28)/4;s+=f'<path d="M{dx-9} {y-h+10}v{16+(k%2)*10}a9 9 0 0 0 18 0v-{16+(k%2)*10}z" fill="{fr}"/>'
        s+=f'<ellipse cx="200" cy="{y-h}" rx="{w/2}" ry="12" fill="{fr}"/>';y-=h-2
    s+=f'<circle cx="200" cy="{y-8}" r="12" fill="{top}"/><circle cx="170" cy="{y-2}" r="8" fill="{top}"/><circle cx="230" cy="{y-2}" r="8" fill="{top}"/><path d="M200 {y-20}q8-18 20-20" stroke="#2f6b52" stroke-width="3" fill="none"/>'
    return wrap(b1,b2,s)
def cup(fr,top,wr,b1,b2):
    s=plate()+f'<path d="M135 300h130l-16 66h-98z" fill="{wr}"/>'
    for i in range(5): s+=f'<line x1="{150+i*25}" y1="302" x2="{156+i*22}" y2="364" stroke="#fff" stroke-opacity=".35" stroke-width="3"/>'
    s+=f'<ellipse cx="200" cy="296" rx="82" ry="22" fill="{fr}"/><ellipse cx="200" cy="262" rx="64" ry="24" fill="{fr}"/><ellipse cx="200" cy="232" rx="44" ry="20" fill="{fr}"/><ellipse cx="200" cy="210" rx="24" ry="14" fill="{fr}"/><circle cx="200" cy="192" r="11" fill="{top}"/>'
    return wrap(b1,b2,s)
def cookie(dough,chip,b1,b2):
    s=plate()+f'<circle cx="200" cy="300" r="95" fill="{dough}"/><circle cx="200" cy="300" r="95" fill="none" stroke="#000" stroke-opacity=".07" stroke-width="6"/>'
    for x,y,r in [(160,265,13),(225,262,11),(190,310,14),(250,305,12),(150,330,10),(215,345,11),(185,270,8),(240,335,9)]: s+=f'<ellipse cx="{x}" cy="{y}" rx="{r}" ry="{r*.8}" fill="{chip}"/>'
    return wrap(b1,b2,s)
def tart(crust,fill,b1,b2):
    s=plate()+f'<ellipse cx="200" cy="318" rx="118" ry="44" fill="{crust}"/><ellipse cx="200" cy="308" rx="100" ry="34" fill="{fill}"/>'
    for x,y,c in [(150,300,'#c0392b'),(190,290,'#8e44ad'),(235,298,'#c0392b'),(170,320,'#e67e22'),(215,320,'#8e44ad'),(255,315,'#e67e22'),(200,305,'#c0392b')]: s+=f'<circle cx="{x}" cy="{y}" r="13" fill="{c}"/><circle cx="{x-4}" cy="{y-4}" r="3" fill="#fff" fill-opacity=".5"/>'
    return wrap(b1,b2,s)
def roll(sp,fr,b1,b2):
    s=plate()+f'<rect x="90" y="270" width="220" height="90" rx="45" fill="{sp}"/><rect x="90" y="270" width="220" height="30" rx="15" fill="{fr}"/><circle cx="300" cy="315" r="45" fill="{sp}"/><circle cx="300" cy="315" r="32" fill="{fr}"/><circle cx="300" cy="315" r="20" fill="{sp}"/><circle cx="300" cy="315" r="9" fill="{fr}"/>'
    for x in (130,180,230): s+=f'<circle cx="{x}" cy="268" r="9" fill="#c0392b"/>'
    return wrap(b1,b2,s)
P={'p1':cake('#f6e3b4','#fffaf0','#c0392b','#fbe3e8','#f9f1e4'),'p2':cake('#5b3a2e','#7b4a36','#c0392b','#e9d9c8','#f7efe3'),
'p3':cake('#b3243a','#fff8f2','#8e1b2f','#fde2e4','#fbf6ec'),'p4':cup('#fff3f6','#c0392b','#f2b5bf','#fdeef1','#fbf6ec'),
'p5':cup('#f48fb1','#fff','#8cc3a4','#e5f2ea','#fbf6ec'),'p6':cookie('#d9a566','#4a2c2a','#f7e9d2','#fbf6ec'),
'p7':tart('#e0b070','#fff3d6','#e5f2ea','#fbf6ec'),'p8':roll('#e8c27a','#fff3e0','#fbe9d0','#fbf6ec')}
for k,v in P.items(): open(f'{D}/{k}.svg','w').write(v)
hero='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 700"><defs><linearGradient id="h" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f9d3da"/><stop offset="1" stop-color="#f6e7cc"/></linearGradient></defs><rect width="600" height="700" fill="url(#h)"/><circle cx="470" cy="130" r="90" fill="#ffffff66"/><circle cx="90" cy="560" r="120" fill="#ffffff55"/>'+cake('#f6e3b4','#fffaf0','#c0392b','none','none',3).split('</defs>')[1].split('<ellipse cx="200" cy="395"')[0].replace('</rect>','')[0:0]
body=cake('#f6e3b4','#fffaf0','#c0392b','#0000','#0000',3)
inner=body[body.index('<ellipse cx="200" cy="395"'):-6]
hero+=f'<g transform="translate(-40 40) scale(1.7)">{inner}</g></svg>'
open(f'{D}/hero.svg','w').write(hero)
login='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400">'+cake('#f6e3b4','#fffaf0','#f2b5bf','#0000','#0000',3)[0:0]+cake('#fff3f6','#f2b5bf','#c0392b','#0000','#0000',3)[cake('a','b','c','d','e').index('<ellipse'):-6]+'</svg>'
open(f'{D}/login.svg','w').write(login.replace('viewBox="0 0 400 400"','viewBox="0 120 400 300"'))
