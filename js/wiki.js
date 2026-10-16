(() => {
 const button=document.getElementById('wiki-share');
 const label=document.getElementById('wiki-share-label');
 const status=document.getElementById('wiki-share-status');
 async function copyLink(){
   const url=location.href;
   try{
     if(!navigator.clipboard || !window.isSecureContext) throw new Error('Clipboard API unavailable');
     await navigator.clipboard.writeText(url);
   }catch(e){
     const field=document.createElement('textarea');
     field.value=url;field.style.position='fixed';field.style.opacity='0';
     document.body.appendChild(field);field.select();
     const success=document.execCommand('copy');field.remove();
     if(!success){ if(status) status.textContent='Could not copy automatically. Copy the URL from your address bar.';return; }
   }
   if(label) label.textContent='Copied!';
   if(status) status.textContent='Link copied to clipboard';
   window.setTimeout(()=>{if(label)label.textContent='Share';if(status)status.textContent='';},2200);
 }
 if(button) button.addEventListener('click',copyLink);
 const links=[...document.querySelectorAll('.wiki-contents a, .wiki-tabs a')];
 const sections=[...document.querySelectorAll('.wiki-section[id]')];
 function activate(id){
   links.forEach(a=>{
     const active=a.getAttribute('href')==='#'+id;
     a.classList.toggle('active',active);
     if(a.closest('.wiki-tabs'))a.classList.toggle('is-current',active);
   });
 }
 if('IntersectionObserver' in window){
   const observer=new IntersectionObserver(entries=>{
     for(const entry of entries) if(entry.isIntersecting)activate(entry.target.id);
   },{rootMargin:'-100px 0px -65% 0px',threshold:0});
   sections.forEach(s=>observer.observe(s));
 }
 links.forEach(a=>a.addEventListener('click',()=>activate(a.hash.slice(1))));
})();
