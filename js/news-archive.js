(() => {
  const grid = document.getElementById('archiveGrid');
  if (!grid) return;
  const search = document.getElementById('archiveSearch');
  const sort = document.getElementById('archiveSort');
  const status = document.getElementById('archiveStatus');
  const pages = document.getElementById('archivePages');
  const perPage = 12;
  let articles = [], page = 1;
  const formatDate = date => { const d = new Date(`${date}T12:00:00`); return Number.isNaN(d.getTime()) ? date : new Intl.DateTimeFormat('en-GB', {day:'numeric',month:'long',year:'numeric'}).format(d); };
  function node(tag, cls, content) { const el=document.createElement(tag); if(cls)el.className=cls; if(content!==undefined)el.textContent=content; return el; }
  function render() {
    const term=search.value.trim().toLocaleLowerCase();
    const filtered=articles.filter(a=>`${a.title||''} ${a.description||''}`.toLocaleLowerCase().includes(term));
    filtered.sort((a,b)=>sort.value==='az' ? (a.title||'').localeCompare(b.title||'') : sort.value==='oldest' ? (a.date||'').localeCompare(b.date||'') : (b.date||'').localeCompare(a.date||''));
    const count=Math.max(1,Math.ceil(filtered.length/perPage)); page=Math.min(page,count);
    status.textContent=`${filtered.length} ${filtered.length===1?'article':'articles'}${term?' found':''}`;
    grid.replaceChildren(); pages.replaceChildren();
    if(!filtered.length)grid.append(node('p','archive-empty','No articles found. Try another search.'));
    filtered.slice((page-1)*perPage,page*perPage).forEach(a=>{
      const card=node('article','archive-card'), link=node('a'); link.href=a.url;
      if(a.image){const img=node('img');img.src=a.image;img.alt='';img.loading='lazy';link.append(img);}
      const copy=node('div','archive-card-copy'), time=node('time',null,formatDate(a.date));time.dateTime=a.date;
      copy.append(time,node('h2',null,a.title));if(a.description)copy.append(node('p',null,a.description));
      link.append(copy);card.append(link);grid.append(card);
    });
    if(count<=1)return;
    function add(label,target,disabled,current=false){const b=node('button',null,label);b.type='button';b.disabled=disabled;if(current)b.setAttribute('aria-current','page');b.addEventListener('click',()=>{page=target;render();document.querySelector('.archive-intro').scrollIntoView({behavior:'instant'});});pages.append(b);}
    add('Previous',page-1,page===1);
    for(let n=1;n<=count;n++)add(String(n),n,false,n===page);
    add('Next',page+1,page===count);
  }
  search.addEventListener('input',()=>{page=1;render();});sort.addEventListener('change',()=>{page=1;render();});
  fetch('/news/news.json',{cache:'no-cache'}).then(r=>{if(!r.ok)throw Error(`HTTP ${r.status}`);return r.json();}).then(data=>{articles=Array.isArray(data)?data.filter(a=>a.title&&a.url):[];render();}).catch(err=>{console.error('News archive:',err);status.textContent='Could not load news articles. Please try again later.';});
})();
