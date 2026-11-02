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
// Datos del cliente guardados en este dispositivo (solo comodidad; el pedido y el cliente se guardan en Neon)
const PK='da_perfil',getP=()=>{try{return JSON.parse(localStorage.getItem(PK))||null}catch{return null}},setP=p=>{try{localStorage.setItem(PK,JSON.stringify(p))}catch{}},delP=()=>{try{localStorage.removeItem(PK)}catch{}};
function profile(edit){
 const p=getP(),f=$('#cf');if(p){f.nombre.value=p.nombre||'';f.telefono.value=p.telefono||'';f.direccion.value=p.direccion||''}
 const show=p&&!edit;$('#fields').classList.toggle('hidden',!!show);$('#saved').classList.toggle('hidden',!show);
 if(show){$('#saved').innerHTML=`<div class="bg-[#e9f3ee] rounded-xl p-3 text-sm flex justify-between gap-3"><div>👤 <b>${esc(p.nombre)}</b><br>📞 ${esc(p.telefono)}<br>📍 ${esc(p.direccion||'Sin dirección')}</div><div class="flex flex-col gap-1 text-xs"><button type="button" id="ed" class="underline">Editar</button><button type="button" id="fg" class="underline text-red-700">Olvidar</button></div></div>`;
  $('#ed').onclick=()=>profile(true);$('#fg').onclick=()=>{delP();f.reset();profile()}}
}
function fillE(){const p=getP(),f=$('#ef');if(p){f.nombre.value=p.nombre||'';f.telefono.value=p.telefono||''}}
const view=pay=>{['#items','#cf','#totalRow'].forEach(s=>$(s).classList.toggle('hidden',pay));$('#pay').classList.toggle('hidden',!pay)};
$('#cf').onsubmit=async e=>{e.preventDefault();const f=Object.fromEntries(new FormData(e.target));
 const items=Object.entries(cart).map(([id,cantidad])=>({id,cantidad}));if(!items.length)return $('#cm').textContent='Agrega productos al carrito';
 try{const r=await api('pedidos',{method:'POST',body:{cliente:{nombre:f.nombre,telefono:f.telefono,direccion:f.direccion},items,metodo:f.metodo}});
  cart={};cartDraw();setP({nombre:f.nombre,telefono:f.telefono,direccion:f.direccion});e.target.reset();profile();showPay({id:r.id,total:r.total,metodo:f.metodo},f.telefono)}catch(x){$('#cm').textContent=x.message}};
// Pasarela de pago SIMULADA. Los datos de tarjeta se validan solo en el navegador y NUNCA se envían ni se guardan.
const TEST={'4242424242424242':'aprobado','5555555555554444':'aprobado','4000000000000002':'rechazado'};
const fmt=(el,f)=>el.oninput=()=>{el.value=f(el.value.replace(/\D/g,''))};
function showPay(o,tel){
 view(true);let met=o.metodo;
 const info={Efectivo:'Pagarás al recibir tu pedido. El pago queda <b>Pendiente</b> hasta que el negocio lo confirme.',Tarjeta:'Modo simulación: usa una <b>tarjeta de prueba</b>. Los datos se validan en tu navegador y <b>no se envían ni se guardan</b>.',Transferencia:`Banco Ejemplo · Cuenta ficticia 000-000-000-0<br>A nombre de Dulce Aurora · Referencia: <b>PED-${o.id}</b>`};
 const draw=()=>{$('#pay').innerHTML=`<p class="eyebrow mb-1">Paso 2 de 2</p><h3 class="text-2xl text-[var(--g)] mb-1">Pago simulado</h3><p class="text-sm text-stone-500 mb-4">Pedido #${o.id} · Total <b>${m(o.total)}</b></p>
 <div class="grid grid-cols-3 gap-2 mb-3 text-sm">${['Efectivo','Tarjeta','Transferencia'].map(x=>`<button data-m="${x}" class="rounded-xl border p-3 ${x==met?'border-[var(--g)] bg-[#e9f3ee] font-semibold':''}">${{Efectivo:'💵',Tarjeta:'💳',Transferencia:'🏦'}[x]}<br>${x}</button>`).join('')}</div>
 <p class="text-sm bg-[#fbf6ec] rounded-xl p-3 mb-3">${info[met]}</p>
 ${met==='Tarjeta'?`<div class="space-y-2 mb-3 text-sm"><input id="cname" placeholder="Nombre del titular" autocomplete="off"><input id="cnum" placeholder="Número de tarjeta" inputmode="numeric" maxlength="19" autocomplete="off"><div class="grid grid-cols-2 gap-2"><input id="cexp" placeholder="MM/AA" inputmode="numeric" maxlength="5" autocomplete="off"><input id="ccvc" placeholder="CVV" inputmode="numeric" maxlength="3" type="password" autocomplete="off"></div>
 <p class="text-[11px] text-stone-500">Tarjetas de prueba (fecha futura y CVV de 3 dígitos): <button type="button" data-t="4242424242424242" class="underline">4242 4242 4242 4242</button> aprueba · <button type="button" data-t="4000000000000002" class="underline">4000 0000 0000 0002</button> rechaza. Otros números no se aceptan.</p></div>`:''}
 ${met==='Transferencia'?`<div class="space-y-2 mb-3 text-sm"><input id="ccomp" placeholder="N° de comprobante de la transferencia" maxlength="20" autocomplete="off"><label class="block text-xs text-stone-500">Resultado de la simulación<select id="res" class="mt-1"><option value="aprobado">Aprobado</option><option value="rechazado">Rechazado</option></select></label></div>`:''}
 <p id="perr" class="text-red-700 text-sm mb-2 min-h-5"></p>
 <button id="go" class="btn w-full">${met==='Efectivo'?'Confirmar pago en efectivo':'Pagar '+m(o.total)+' (simulado)'}</button><p class="text-[11px] text-stone-400 mt-3 text-center">No se realiza ninguna transacción financiera real.</p>`;
  $('#pay').querySelectorAll('[data-m]').forEach(b=>b.onclick=()=>{met=b.dataset.m;draw()});
  if(met==='Tarjeta'){fmt($('#cnum'),v=>v.replace(/(.{4})/g,'$1 ').trim());fmt($('#cexp'),v=>v.length>2?v.slice(0,2)+'/'+v.slice(2):v);fmt($('#ccvc'),v=>v);
   $('#pay').querySelectorAll('[data-t]').forEach(b=>b.onclick=()=>{$('#cnum').value=b.dataset.t.replace(/(.{4})/g,'$1 ').trim();$('#cexp').value='12/30';$('#ccvc').value='123';if(!$('#cname').value)$('#cname').value='Cliente de Prueba'})}
  $('#go').onclick=go};
 const done=h=>{$('#pay').innerHTML=h+`<button class="btn w-full mt-4" id="back">Seguir comprando</button>`;$('#back').onclick=()=>{view(false);open_(false)}};
 const go=async()=>{let res,comp;const err=t=>$('#perr').textContent=t;
  if(met==='Tarjeta'){const n=$('#cnum').value.replace(/\D/g,''),ex=$('#cexp').value,mm=+ex.slice(0,2),yy=2000+(+ex.slice(3,5)),d=new Date();
   if(!$('#cname').value.trim())return err('Ingresa el nombre del titular');
   if(!TEST[n])return err('Modo simulación: usa una tarjeta de prueba (4242 4242 4242 4242)');
   if(!(mm>=1&&mm<=12)||yy<d.getFullYear()||(yy==d.getFullYear()&&mm<d.getMonth()+1))return err('Fecha de vencimiento inválida');
   if(!/^\d{3}$/.test($('#ccvc').value))return err('El CVV debe tener 3 dígitos');
   res=TEST[n]}
  if(met==='Transferencia'){comp=$('#ccomp').value.trim();if(comp.length<4)return err('Ingresa el número de comprobante');res=$('#res').value}
  $('#pay').innerHTML='<div class="text-center py-16"><div class="w-12 h-12 mx-auto mb-4 rounded-full border-4 border-[var(--g)] border-t-transparent animate-spin"></div><p class="text-stone-600">Procesando pago simulado…</p></div>';
  await new Promise(r=>setTimeout(r,1600));
  try{const r=await api(`pedidos/${o.id}/pagar`,{method:'POST',body:{metodo:met,tel,resultado:res,comprobante:comp}});
   const fac=`<a class="btn btn2 w-full text-center mt-4" target=_blank href="/factura.html?id=${o.id}&tel=${encodeURIComponent(tel)}">Ver factura</a>`;
   if(r.estado==='Pagado')done(`<div class="text-center"><div class="text-5xl mb-2">✅</div><h3 class="text-2xl text-[var(--g)]">¡Pago aprobado!</h3><p class="text-sm text-stone-600 mt-2">Pedido #${o.id} · ${m(r.monto)}<br>Referencia: <b>${esc(r.referencia)}</b><br>Tu pedido pasó a <b>En preparación</b>.</p></div>`+fac);
   else if(r.estado==='Pendiente')done(`<div class="text-center"><div class="text-5xl mb-2">🧾</div><h3 class="text-2xl text-[var(--g)]">Pedido registrado</h3><p class="text-sm text-stone-600 mt-2">Pago en efectivo <b>pendiente</b> contra entrega.<br>Referencia: <b>${esc(r.referencia)}</b></p></div>`+fac);
   else{$('#pay').innerHTML=`<div class="text-center"><div class="text-5xl mb-2">❌</div><h3 class="text-2xl text-red-700">Pago rechazado</h3><p class="text-sm text-stone-600 mt-2">La simulación rechazó la operación (ref. ${esc(r.referencia)}). Puedes intentarlo de nuevo o elegir otro método.</p><button class="btn w-full mt-4" id="retry">Intentar de nuevo</button></div>`;$('#retry').onclick=draw}
  }catch(x){$('#pay').innerHTML=`<p class="text-red-700 mb-3">${esc(x.message)}</p><button class="btn" id="retry">Volver</button>`;$('#retry').onclick=draw}};
 draw()}
$('#ef').onsubmit=async e=>{e.preventDefault();const f=Object.fromEntries(new FormData(e.target));
 try{const r=await api('encargos',{method:'POST',body:{...f,cliente:{nombre:f.nombre,telefono:f.telefono}}});setP({...(getP()||{}),nombre:f.nombre,telefono:f.telefono});e.target.reset();fillE();$('#em').textContent='✅ Encargo #'+r.id+' enviado. ¡Te contactaremos pronto!'}catch(x){$('#em').textContent=x.message}};
profile();fillE();
load();setInterval(load,10000); // actualización automática del catálogo
