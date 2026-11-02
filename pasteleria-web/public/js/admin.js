const $=s=>document.querySelector(s),m=n=>'$'+Number(n).toFixed(2);
const esc=t=>String(t??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const api=async(u,o={})=>{const r=await fetch('/api/'+u,{headers:{'Content-Type':'application/json'},...o,body:o.body&&JSON.stringify(o.body)});const d=await r.json().catch(()=>({}));if(!r.ok)throw Object.assign(new Error(d.error||'Error'),{status:r.status});return d};
const EST=['Pendiente','En preparación','Listo','Entregado','Cancelado'];
const opts=(l,v)=>l.map(x=>`<option ${x==v?'selected':''}>${x}</option>`).join('');
let tab='dash',timer,chart,cats=[];
const inp='class="border rounded-xl p-2 w-full"';
async function boot(){try{await api('me');shell()}catch{login()}}
function login(){$('#app').innerHTML=`<form id=f class="max-w-sm mx-auto mt-24 bg-white p-8 rounded-3xl shadow space-y-3"><h1 class="text-2xl font-bold text-center">🧁 Dulce Aurora · Admin</h1><input name=username placeholder=Usuario ${inp} required><input name=password type=password placeholder=Contraseña ${inp} required><button class="w-full bg-pink-400 text-white rounded-xl p-2">Entrar</button><p id=e class="text-red-600 text-sm"></p></form>`;
 $('#f').onsubmit=async e=>{e.preventDefault();try{await api('login',{method:'POST',body:Object.fromEntries(new FormData(e.target))});shell()}catch(x){$('#e').textContent=x.message}}}
function shell(){
 $('#app').innerHTML=`<div class="md:flex min-h-screen"><nav class="md:w-56 bg-[#4a2c2a] text-pink-100 p-4 flex md:flex-col gap-2 overflow-x-auto">${[['dash','📊 Resumen'],['orders','🧾 Pedidos'],['prods','🍰 Productos'],['custom','🎂 Encargos'],['clients','👥 Clientes']].map(([k,l])=>`<button data-t="${k}" class="text-left px-3 py-2 rounded-xl whitespace-nowrap hover:bg-pink-300/30">${l}</button>`).join('')}<button id=out class="px-3 py-2 md:mt-auto">Salir</button></nav><main id=main class="flex-1 p-5 overflow-x-auto"></main></div>`;
 document.querySelector('nav').onclick=e=>{if(e.target.dataset.t){tab=e.target.dataset.t;go()}};
 $('#out').onclick=async()=>{await api('logout',{method:'POST'});clearInterval(timer);login()};go();
}
async function go(){clearInterval(timer);await view(true);if(tab!=='prods')timer=setInterval(()=>view(false),5000)} // auto-actualización
async function view(first){
 try{
 if(tab==='dash'){const s=await api('stats');
  const c=(l,v)=>`<div class="bg-white rounded-2xl p-4 shadow"><p class="text-sm text-stone-500">${l}</p><p class="text-2xl font-bold">${v}</p></div>`;
  $('#main').innerHTML=`<div class="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-5">${c('Pedidos',s.pedidos)}${c('Pendientes',s.pendientes)}${c('Productos',s.productos)}${c('Clientes',s.clientes)}${c('Ingresos',m(s.ingresos))}</div><div class="grid lg:grid-cols-2 gap-5"><div class="bg-white rounded-2xl p-4 shadow"><h3 class="font-bold mb-2">Ventas (7 días)</h3><canvas id=ch></canvas></div><div class="bg-white rounded-2xl p-4 shadow"><h3 class="font-bold mb-2">Más vendidos</h3>${s.top.map(t=>`<p>${esc(t.nombre)} — <b>${t.vendidos}</b></p>`).join('')||'Sin ventas'}</div></div>`;
  chart=new Chart($('#ch'),{type:'bar',data:{labels:s.dias.map(d=>d.dia),datasets:[{label:'Ingresos $',data:s.dias.map(d=>d.total),backgroundColor:'#f4a5b5'}]}});
 }
 if(tab==='orders'){const o=await api('pedidos');
  $('#main').innerHTML=`<table class="w-full bg-white rounded-2xl shadow text-sm"><tr class="text-left"><th class=p-2>#<th>Cliente<th>Total<th>Pago<th>Estado<th></tr>${o.map(p=>`<tr class="border-t"><td class=p-2>${p.id}<td>${esc(p.nombre)}<br><span class="text-xs">${esc(p.telefono)}</span><td>${m(p.total)}<td>${p.metodo}: ${p.pago_estado} ${p.pago_estado!=='Pagado'?`<button class="underline text-xs" onclick="pay(${p.pago_id})">Marcar pagado</button>`:''}<td><select onchange="setEst('pedidos',${p.id},this.value)">${opts(EST,p.estado)}</select><td><a class="underline" target=_blank href="/factura.html?id=${p.id}">Factura</a></tr>`).join('')}</table>`}
 if(tab==='custom'){const o=await api('encargos');
  $('#main').innerHTML=o.map(e=>`<div class="bg-white rounded-2xl p-4 shadow mb-3 text-sm"><b>#${e.id} ${esc(e.nombre)}</b> (${esc(e.telefono)}) · entrega ${String(e.fecha_entrega).slice(0,10)}<br>${esc(e.tamano)}, ${e.porciones} porciones, ${esc(e.sabor)}, relleno ${esc(e.relleno)}, cobertura ${esc(e.cobertura)}<br>Diseño: ${esc(e.diseno)} · Dedicatoria: ${esc(e.dedicatoria)}<br>${esc(e.observaciones)} ${e.imagen_url?`<a class=underline target=_blank href="${esc(e.imagen_url)}">Referencia</a>`:''}<br><select onchange="setEst('encargos',${e.id},this.value)">${opts(EST,e.estado)}</select></div>`).join('')||'Sin encargos'}
 if(tab==='clients'){const o=await api('clientes');
  $('#main').innerHTML=`<table class="w-full bg-white rounded-2xl shadow text-sm"><tr class=text-left><th class=p-2>Nombre<th>Teléfono<th>Dirección<th>Pedidos<th>Registro</tr>${o.map(c=>`<tr class="border-t"><td class=p-2>${esc(c.nombre)}<td>${esc(c.telefono)}<td>${esc(c.direccion)}<td>${c.pedidos}<td>${String(c.creado).slice(0,10)}</tr>`).join('')}</table>`}
 if(tab==='prods')await prods(first);
 }catch(e){if(e.status===401){clearInterval(timer);login()}}
}
async function prods(first){
 if(first){cats=await api('categorias');
  $('#main').innerHTML=`<form id=pf class="bg-white rounded-2xl p-4 shadow grid sm:grid-cols-2 gap-2 mb-5"><input type=hidden name=id><input name=nombre placeholder=Nombre ${inp} required><input name=precio type=number step=0.01 min=0 placeholder=Precio ${inp} required><select name=categoria_id ${inp}><option value="">Sin categoría</option>${cats.map(c=>`<option value=${c.id}>${esc(c.nombre)}</option>`).join('')}</select><input name=imagen_url placeholder="URL de la foto (Cloudinary u otra)" ${inp}><textarea name=descripcion placeholder=Descripción ${inp+' sm:col-span-2'}></textarea><label><input type=checkbox name=activo checked> Activo</label><button class="bg-pink-400 text-white rounded-xl p-2">Guardar producto</button><p id=pm class="text-sm"></p></form><div id=pl></div>`;
  $('#pf').onsubmit=async e=>{e.preventDefault();const f=new FormData(e.target),id=f.get('id');
   const body={nombre:f.get('nombre'),precio:f.get('precio'),categoria_id:f.get('categoria_id')||null,imagen_url:f.get('imagen_url'),descripcion:f.get('descripcion'),activo:f.get('activo')==='on'};
   try{await api('productos'+(id?'/'+id:''),{method:id?'PUT':'POST',body});e.target.reset();e.target.activo.checked=true;$('#pm').textContent='Guardado';prods()}catch(x){$('#pm').textContent=x.message}}}
 const p=await api('productos?all=1');window._p=p;
 $('#pl').innerHTML=`<table class="w-full bg-white rounded-2xl shadow text-sm"><tr class=text-left><th class=p-2>Producto<th>Categoría<th>Precio<th>Estado<th></tr>${p.map(x=>`<tr class="border-t"><td class=p-2>${esc(x.nombre)}<td>${esc(x.categoria)}<td>${m(x.precio)}<td><button class=underline onclick="tog(${x.id})">${x.activo?'Activo':'Inactivo'}</button><td><button onclick="edit(${x.id})">✏️</button> <button onclick="del(${x.id})">🗑</button></tr>`).join('')}</table>`;
}
function edit(id){const x=_p.find(p=>p.id==id),f=$('#pf');for(const k of['id','nombre','precio','categoria_id','imagen_url','descripcion'])f[k].value=x[k]??'';f.activo.checked=x.activo;scrollTo(0,0)}
async function tog(id){const x=_p.find(p=>p.id==id);await api('productos/'+id,{method:'PUT',body:{...x,activo:!x.activo}});prods()}
async function del(id){if(!confirm('¿Eliminar producto?'))return;try{await api('productos/'+id,{method:'DELETE'});prods()}catch(e){alert(e.message)}}
async function setEst(t,id,estado){await api(t+'/'+id,{method:'PATCH',body:{estado}})}
async function pay(id){await api('pagos/'+id,{method:'PATCH',body:{estado:'Pagado'}});view()}
boot();
