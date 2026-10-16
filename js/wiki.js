(() => {
 const button = document.getElementById('wiki-share');
 const label = document.getElementById('wiki-share-label');
 const status = document.getElementById('wiki-share-status');
 const fallbackCopy = (value) => {
   const field = document.createElement('textarea');
   field.value = value;
   field.setAttribute('readonly', '');
   field.style.cssText = 'position:fixed;top:-9999px;left:-9999px;opacity:0';
   document.body.appendChild(field);
   field.select();
   let copied = false;
   try { copied = document.execCommand('copy'); } catch (_) {}
   field.remove();
   return copied;
 };
 if (button && label) {
   let resetHandle;
   button.addEventListener('click', async () => {
     const url = window.location.href;
     let copied = false;
     if (navigator.clipboard && window.isSecureContext) {
       try { await navigator.clipboard.writeText(url); copied = true; } catch (_) {}
     }
     if (!copied) copied = fallbackCopy(url);
     if (copied) {
       label.textContent = 'Copied!';
       if (status) status.textContent = 'Page URL copied to clipboard.';
     } else {
       label.textContent = 'Select link';
       if (status) {
         status.textContent = 'Copy this URL: ';
         const link = document.createElement('input');
         link.type = 'text'; link.value = url; link.readOnly = true;
         link.className = 'wiki-copy-fallback';
         status.appendChild(link);
         link.focus(); link.select();
       }
     }
     clearTimeout(resetHandle);
     resetHandle = setTimeout(() => {
       label.textContent = 'Copy link';
       if (copied && status) status.textContent = '';
     }, 2200);
   });
 }
 const links = [...document.querySelectorAll('.wiki-contents a')];
 if ('IntersectionObserver' in window && links.length) {
   const observer = new IntersectionObserver(entries => {
     for (const entry of entries) if (entry.isIntersecting) {
       links.forEach(a => a.classList.toggle('active', a.hash === '#' + entry.target.id));
     }
   }, {rootMargin: '-100px 0px -65% 0px'});
   document.querySelectorAll('.wiki-section[id]').forEach(s => observer.observe(s));
 }
})();
