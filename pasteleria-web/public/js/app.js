const $=s=>document.querySelector(s),m=n=>'$'+Number(n).toFixed(2);
const esc=t=>String(t??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let prods=[],cats=[],cat=0,cart={}; // carrito en memoria; el pedido se guarda en Neon al confirmar
const api=async(u,o={})=>{const r=await fetch('/api/'+u,{headers:{'Content-Type':'application/json'},...o,body:o.body&&JSON.stringify(o.body)});const d=await r.json();if(!r.ok)throw new Error(d.error||'Error');return d};
const img=p=>p.imagen_url?`<img src="${esc(p.imagen_url)}" alt="${esc(p.nombre)}" loading="lazy" class="w-full h-full object-cover">`:'<span class="text-6xl">🧁</span>';
async function load(){try{prods=await api('productos');cats=await api('categorias');draw()}catch{}}
function draw(){
 $('#cats').innerHTML=[{id:0,nombre:'Todos'},...cats].map(c=>`<button data-c="${c.id}" class="tab ${cat==c.id?'on':''}">${esc(c.nombre)}</button>`).join('');
 $('#cats').onclick=e=>{if(e.target.dataset.c!=null){cat=+e.target.dataset.c;draw()}};
 $('#grid').innerHTML=prods.filter(p=>!cat||p.categoria_id==cat).map(p=>`<div class="card flex flex-col"><div class="aspect-square overflow-hidden bg-[#f6e3e6] flex items-center justify-center relative">${img(p)}${p.categoria?`<span class="absolute top-3 left-3 bg-white/90 text-[var(--g)] text-[11px] font-semibold px-3 py-1 rounded-full">${esc(p.categoria)}</span>`:''}</div><div class="p-4 text-center flex-1 flex flex-col"><h3 class="text-base md:text-lg text-[var(--g)] leading-snug">${esc(p.nombre)}</h3><p class="text-xs text-stone-500 my-2 flex-1">${esc(p.descripcion)}</p><b class="serif text-lg mb-3">${m(p.precio)}</b><button class="btn" onclick="add(${p.id})">Agregar</button></div></div>`).join('')||'<p class="col-span-full text-center text-stone-500">Aún no hay productos disponibles.</p>';
 cartDraw();
}
function open_(v){$('#drawer').classList.toggle('hidden',!v);$('#ov').classList.toggle('hidden',!v)}
function add(id){cart[id]=(cart[id]||0)+1;cartDraw();open_(true)}
function cartDraw(){
 let t=0,n=0;
 $('#items').innerHTML=Object.entries(cart).map(([id,q])=>{const p=prods.find(x=>x.id==id);if(!p)return'';t+=p.precio*q;n+=q;return`<div class="flex gap-3 items-center py-3 border-b"><div class="w-16 h-16 rounded-xl overflow-hidden bg-[#f6e3e6] shrink-0">${img(p)}</div><div class="flex-1 text-sm"><b>${esc(p.nombre)}</b><br>${m(p.precio)}</div><div class="flex items-center gap-2 text-sm"><button class="w-7 h-7 rounded-full border" onclick="chg(${id},-1)">−</button>${q}<button class="w-7 h-7 rounded-full border" onclick="chg(${id},1)">+</button><button onclick="chg(${id},-99)" title="Quitar">🗑</button></div></div>`}).join('')||'<p class="text-stone-500 text-center py-8">Tu carrito está vacío</p>';
 $('#total').textContent=m(t);$('#cnt').textContent=n;
}
function chg(id,d){cart[id]=(cart[id]||0)+d;if(cart[id]<=0)delete cart[id];cartDraw()}
$('#cartBtn').onclick=()=>open_($('#drawer').classList.contains('hidden'));$('#close').onclick=$('#ov').onclick=()=>open_(false);
$('#cf').onsubmit=async e=>{e.preventDefault();const f=Object.fromEntries(new FormData(e.target));
 const items=Object.entries(cart).map(([id,cantidad])=>({id,cantidad}));if(!items.length)return $('#cm').textContent='Agrega productos al carrito';
 try{const r=await api('pedidos',{method:'POST',body:{cliente:{nombre:f.nombre,telefono:f.telefono,direccion:f.direccion},items,metodo:f.metodo}});
  cart={};cartDraw();$('#cm').innerHTML=`✅ Pedido #${r.id} registrado. Pago: <b>${r.pago}</b>. <a class="underline" target=_blank href="/factura.html?id=${r.id}&tel=${encodeURIComponent(f.telefono)}">Ver factura</a>`}catch(x){$('#cm').textContent=x.message}};
$('#ef').onsubmit=async e=>{e.preventDefault();const f=Object.fromEntries(new FormData(e.target));
 try{const r=await api('encargos',{method:'POST',body:{...f,cliente:{nombre:f.nombre,telefono:f.telefono}}});e.target.reset();$('#em').textContent='✅ Encargo #'+r.id+' enviado. ¡Te contactaremos pronto!'}catch(x){$('#em').textContent=x.message}};
load();setInterval(load,10000); // actualización automática del catálogo
