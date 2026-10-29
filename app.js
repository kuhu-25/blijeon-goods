/* 블리전 굿즈 도감: 굿즈 정보는 goods.js에서만 수정하세요. */
(() => {
  'use strict';
  const $ = (selector) => document.querySelector(selector);
  const GOODS = Array.isArray(window.GOODS) ? window.GOODS : [];
  const state = { day: 'all', category: 'all', status: 'all', search: '', sort: 'recent' };
  const grid = $('#goodsGrid');
  const dialog = $('#detailsDialog');
  const icons = { '아크릴': '✧', '키링': '♧', '인쇄물': '▤', '회지': '▣', '스티커': '✿', '인형': '♡', '의류': '◈', '장패드': '▦', '생활용품': '▧', '패브릭': '▥', '기타': '✦' };
  const palettes = [['#e5edff', '#d8e7ff'], ['#f4e4fb', '#e7dbfa'], ['#e5f6ef', '#d5f0e3'], ['#fff1e5', '#f9e1e4']];
  const node = (tag, className, text) => {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (text != null) el.textContent = String(text);
    return el;
  };
  const safeHref = (value) => {
    if (!value) return '';
    try { const u = new URL(String(value), window.location.href); return ['http:', 'https:'].includes(u.protocol) ? u.href : ''; }
    catch { return ''; }
  };
  const labelDay = (v) => v === '토' ? '토요일' : v === '일' ? '일요일' : v === '양일' ? '양일' : '미확인';
  const labelBooth = (item) => [item.day === '양일' ? '양일' : item.day || '', item.booth || '부스 미정'].join(' ');
  const getImages = item => Array.isArray(item.images) ? item.images.filter(x => typeof x === 'string' && x.trim()) : [];
  const getChars = item => Array.isArray(item.characters) ? item.characters : [];
  const text = (item, key) => String(item[key] || '');
  const hasData = (arr, val) => arr.includes(val);
  const thumbnail = (item, index = 0) => {
    const images = getImages(item);
    const wrapper = node('div', 'card-visual');
    if (images.length && images[index]) {
      const img = document.createElement('img');
      img.src = images[index];
      img.alt = `${text(item, 'name')} 상품 이미지 ${index + 1}`;
      img.loading = 'lazy';
      img.onerror = () => { img.remove(); wrapper.appendChild(placeholder(item)); };
      wrapper.appendChild(img);
    } else wrapper.appendChild(placeholder(item));
    return wrapper;
  };
  const placeholder = item => {
    const el = node('div', 'placeholder-art');
    const colorIndex = Math.abs([...String(item.id || item.name || '')].reduce((a,c)=>a+c.charCodeAt(0),0)) % palettes.length;
    el.style.setProperty('--p1', palettes[colorIndex][0]);
    el.style.setProperty('--p2', palettes[colorIndex][1]);
    el.append(node('span', 'placeholder-icon', icons[item.category] || '✦'), node('small', null, '이미지 준비 중'));
    return el;
  };
  function makeCard(item) {
    const article = node('article', 'goods-card');
    const button = node('button', 'card-open');
    button.type = 'button';
    button.setAttribute('aria-label', `${text(item,'name')} 상세 보기`);
    const visual = thumbnail(item);
    visual.appendChild(node('span', 'day-badge', labelBooth(item)));
    const body = node('div', 'card-body');
    body.appendChild(node('div', 'card-category', text(item, 'category') || '기타'));
    body.appendChild(node('h3', 'card-title', text(item, 'name') || '상품명 미정'));
    body.appendChild(node('p', 'card-artist', text(item, 'artist') || '작가 미정'));
    const bottom = node('div', 'card-bottom');
    bottom.append(node('span', 'card-price', text(item, 'price') || '가격 미정'), node('span', 'card-booth', labelDay(item.day)));
    body.appendChild(bottom);
    body.appendChild(node('span', 'card-status', text(item, 'status') || '정보 확인 중'));
    button.append(visual, body);
    button.addEventListener('click', () => openItem(item));
    article.appendChild(button);
    return article;
  }
  function buildOptions(el, values) {
    [...new Set(values.map(String).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'ko')).forEach(value => {
      const option = document.createElement('option'); option.value = value; option.textContent = value; el.appendChild(option);
    });
  }
  function render() {
    const query = state.search.normalize('NFKC').toLocaleLowerCase('ko').trim();
    const filtered = GOODS.filter(item => {
      if (state.day !== 'all' && item.day !== state.day && item.day !== '양일') return false;
      if (state.category !== 'all' && item.category !== state.category) return false;
      if (state.status !== 'all' && item.status !== state.status) return false;
      const searchable = [item.name, item.artist, item.day, item.booth, item.category, item.status, item.price, item.note, ...getChars(item)].join(' ').normalize('NFKC').toLocaleLowerCase('ko');
      return !query || searchable.includes(query);
    });
    filtered.sort((a,b) => state.sort === 'name' ? text(a,'name').localeCompare(text(b,'name'),'ko') : state.sort === 'artist' ? text(a,'artist').localeCompare(text(b,'artist'),'ko') : text(b,'updated').localeCompare(text(a,'updated')));
    grid.replaceChildren(...filtered.map(makeCard));
    $('#emptyState').hidden = filtered.length !== 0;
    $('#totalCount').textContent = String(GOODS.length);
    $('#resultText').replaceChildren(document.createTextNode('검색 결과 '), node('strong', null, filtered.length + '개'), document.createTextNode('의 굿즈'));
    $('#clearFilters').hidden = state.day === 'all' && state.category === 'all' && state.status === 'all' && !state.search && state.sort === 'recent';
  }
  function reset() {
    Object.assign(state, {day:'all', category:'all', status:'all', search:'', sort:'recent'});
    $('#searchInput').value=''; $('#categoryFilter').value='all'; $('#statusFilter').value='all'; $('#sortSelect').value='recent';
    document.querySelectorAll('[data-day]').forEach(b => {const active=b.dataset.day==='all';b.classList.toggle('is-active',active);b.setAttribute('aria-pressed',String(active));});
    render();
  }
  function fact(dl, key, value) { dl.append(node('dt',null,key), node('dd',null,value || '미확인')); }
  function showDetailImage(item, index) {
    const wrapper = $('#detailImage'); wrapper.replaceChildren();
    const images = getImages(item);
    if (images[index]) {
      const img = document.createElement('img'); img.src = images[index]; img.alt = `${text(item,'name')} 이미지 ${index+1}`;
      img.onerror = () => {wrapper.replaceChildren(placeholder(item));};
      wrapper.appendChild(img);
    } else wrapper.appendChild(placeholder(item));
    document.querySelectorAll('.thumb-list button').forEach((b,i)=>b.setAttribute('aria-pressed',String(i===index)));
  }
  function openItem(item, updateHash = true) {
    $('#detailTitle').textContent = text(item,'name') || '상품명 미정';
    const tags = $('#detailTags'); tags.replaceChildren();
    [item.category, ...getChars(item)].filter(Boolean).forEach(tag=>tags.appendChild(node('span',null,tag)));
    const dl = $('#detailFacts'); dl.replaceChildren();
    fact(dl,'작가',item.artist);fact(dl,'참가 요일',labelDay(item.day));fact(dl,'부스',item.booth);fact(dl,'가격',item.price);fact(dl,'판매 상태',item.status);fact(dl,'업데이트',item.updated);
    $('#detailNote').textContent = text(item,'note');
    const links = $('#detailLinks'); links.replaceChildren();
    const makeLink=(url, title, secondary=false) => {const target=safeHref(url);if(!target)return;const a=node('a', secondary?'secondary':'', title+' ↗');a.href=target;a.target='_blank';a.rel='noopener noreferrer';links.appendChild(a);};
    makeLink(item.sourceUrl,'작가 원본 공지');makeLink(item.preorderUrl,'선입금 페이지',true);
    const thumbs = $('#detailThumbs'); thumbs.replaceChildren();
    const images = getImages(item);
    images.forEach((url,index)=>{const button=node('button');button.type='button';button.setAttribute('aria-label',`이미지 ${index+1} 보기`);const img=document.createElement('img');img.src=url;img.alt='';button.appendChild(img);button.addEventListener('click',()=>showDetailImage(item,index));thumbs.appendChild(button);});
    showDetailImage(item,0);
    $('#shareButton').onclick=async()=>{
      const link=new URL(window.location.href);link.hash='item/'+encodeURIComponent(item.id);
      try { await navigator.clipboard.writeText(link.toString()); $('#shareButton').textContent='복사했어요 ✓'; }
      catch {window.prompt('아래 주소를 복사하세요.',link.toString());}
      setTimeout(()=>{$('#shareButton').textContent='이 굿즈 링크 복사';},1700);
    };
    if(updateHash) history.replaceState(null,'','#item/'+encodeURIComponent(item.id));
    if (!dialog.open) dialog.showModal();
  }
  function findHashItem() {
    if (!window.location.hash.startsWith('#item/')) return;
    const id = decodeURIComponent(window.location.hash.slice(6));
    const item = GOODS.find(g => String(g.id) === id);
    if (item) openItem(item,false);
  }
  buildOptions($('#categoryFilter'), GOODS.map(x=>x.category));
  buildOptions($('#statusFilter'), GOODS.map(x=>x.status));
  $('#searchInput').addEventListener('input',e=>{state.search=e.target.value;render();});
  $('#categoryFilter').addEventListener('change',e=>{state.category=e.target.value;render();});
  $('#statusFilter').addEventListener('change',e=>{state.status=e.target.value;render();});
  $('#sortSelect').addEventListener('change',e=>{state.sort=e.target.value;render();});
  document.querySelectorAll('[data-day]').forEach(button=>button.addEventListener('click',()=>{
    state.day=button.dataset.day;
    document.querySelectorAll('[data-day]').forEach(b=>{const active=b===button;b.classList.toggle('is-active',active);b.setAttribute('aria-pressed',String(active));});
    render();
  }));
  $('#clearFilters').addEventListener('click',reset);$('#emptyReset').addEventListener('click',reset);
  $('#closeDialog').addEventListener('click',()=>dialog.close());
  dialog.addEventListener('click',(e)=>{if(e.target===dialog)dialog.close();});
  dialog.addEventListener('close',()=>{if(window.location.hash.startsWith('#item/')) history.replaceState(null,'',window.location.pathname+window.location.search);});
  window.addEventListener('hashchange',()=>{if(window.location.hash.startsWith('#item/'))findHashItem();else if(dialog.open)dialog.close();});
  render();findHashItem();
})();
