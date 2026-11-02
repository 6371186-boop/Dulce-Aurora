const $=s=>document.querySelector(s),m=n=>'$'+Number(n).toFixed(2);
const esc=t=>String(t??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let prods=[],cats=[],cat=0,cart={}; // carrito solo en memoria; el pedido se guarda en Neon al confirmar
const api=async(u,o={})=>{const r=await fetch('/api/'+u,{headers:{'Content-Type':'application/json'},...o,body:o.body&&JSON.stringify(o.body)});const d=await r.json();if(!r.ok)throw new Error(d.error||'Error');return d};
async function load(){try{prods=await api('productos');cats=await api('categorias');draw()}catch{}}
function draw(){
 $('#cats').innerHTML=[{id:0,nombre:'Todos'},...cats].map(c=>`<button data-c="${c.id}" class="tab ${cat==c.id?'on':''}">${esc(c.nombre)}</button>`).join('');
 $('#cats').onclick=e=>{if(e.target.dataset.c!=null){cat=+e.target.dataset.c;draw()}};
 $('#grid').innerHTML=prods.filter(p=>!cat||p.categoria_id==cat).map(p=>`<div class="card fade flex flex-col"><div class="aspect-[4/5] bg-[#f6e3e6] flex items-center justify-center text-6xl">${p.imagen_url?`<img src="${esc(p.imagen_url)}" alt="${esc(p.nombre)}" class="w-full h-full object-cover">`:'🧁'}</div><div class="p-4 text-center flex-1 flex flex-col"><h3 class="text-base md:text-lg text-[var(--g)]">${esc(p.nombre)}</h3><p class="text-xs text-stone-500 my-1 flex-1">${esc(p.descripcion)}</p><b class="mb-3">${m(p.precio)}</b><button class="btn" onclick="add(${p.id})">Agregar</button></div></div>`).join('')||'<p class="col-span-full text-center">Sin productos disponibles.</p>';
 cartDraw();
}
function add(id){cart[id]=(cart[id]||0)+1;cartDraw();$('#drawer').classList.remove('hidden')}
function cartDraw(){
 let t=0,n=0;
 $('#items').innerHTML=Object.entries(cart).map(([id,q])=>{const p=prods.find(x=>x.id==id);if(!p)return'';t+=p.precio*q;n+=q;return`<div class="flex justify-between items-center py-2 border-b"><span class="text-sm">${esc(p.nombre)}<br>${m(p.precio)}</span><span><button onclick="chg(${id},-1)">−</button> ${q} <button onclick="chg(${id},1)">+</button> <button onclick="chg(${id},-99)">🗑</button></span></div>`}).join('')||'<p>Vacío</p>';
 $('#total').textContent=m(t);$('#cnt').textContent=n;
}
function chg(id,d){cart[id]=(cart[id]||0)+d;if(cart[id]<=0)delete cart[id];cartDraw()}
$('#cartBtn').onclick=()=>$('#drawer').classList.toggle('hidden');$('#close').onclick=()=>$('#drawer').classList.add('hidden');
$('#cf').onsubmit=async e=>{e.preventDefault();const f=Object.fromEntries(new FormData(e.target));
 const items=Object.entries(cart).map(([id,cantidad])=>({id,cantidad}));if(!items.length)return $('#cm').textContent='Agrega productos';
 try{const r=await api('pedidos',{method:'POST',body:{cliente:{nombre:f.nombre,telefono:f.telefono,direccion:f.direccion},items,metodo:f.metodo}});
  cart={};cartDraw();$('#cm').innerHTML=`Pedido #${r.id} registrado. Pago: <b>${r.pago}</b>. <a class="underline" target=_blank href="/factura.html?id=${r.id}&tel=${encodeURIComponent(f.telefono)}">Ver factura</a>`}catch(x){$('#cm').textContent=x.message}};
$('#ef').onsubmit=async e=>{e.preventDefault();const f=Object.fromEntries(new FormData(e.target));
 try{const r=await api('encargos',{method:'POST',body:{...f,cliente:{nombre:f.nombre,telefono:f.telefono}}});e.target.reset();$('#em').textContent='Encargo #'+r.id+' enviado. ¡Te contactaremos!'}catch(x){$('#em').textContent=x.message}};
load();setInterval(load,10000); // actualización automática del catálogo
