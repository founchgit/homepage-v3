import './style.css';
import { profile, entries, categories } from './cv.js';
import { covers } from './covers.js';

const escape = (value) => String(value).replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]);
const assets = new Map(covers.map((cover) => [cover.id, cover]));
assets.set('three-leaf-clover', { image:'https://i.ytimg.com/vi/RvGOFLYTYX0/hqdefault.jpg' });
assets.set('humanoid-billy', { image:'https://i.ytimg.com/vi/ZdZdz524-B0/hqdefault.jpg' });
assets.set('hexnut-fragments', { image:'https://i.ytimg.com/vi/NHQVm3LUUVc/hqdefault.jpg' });
const safeUrl = (value) => {
  try { const url = new URL(value); return url.protocol === 'https:' ? url.href : ''; }
  catch { return ''; }
};
const projectLabel = (entry) => `${entry.year}_${entry.title.replaceAll(' — ', '_').replaceAll(' ', '_')}`;
const projectLink = (entry) => `<a href="#work/${entry.id}" data-work="${entry.id}">${escape(projectLabel(entry))}</a>`;
let activeCategory = 'all';
let search = '';
let returnFocus;

document.querySelector('#app').innerHTML = `
  <header><a class="identity" href="#home" aria-label="DAWN 홈">DAWN</a><nav aria-label="주 메뉴"><a href="#about">About</a><a href="#archive">Archive <sup>${entries.length}</sup></a><a href="https://www.instagram.com/jeongdawn/" target="_blank" rel="noopener noreferrer">Instagram ↗</a></nav></header>
  <main id="main"><aside class="index" aria-label="작업 인덱스"><div class="index-tools"><div class="mode"><button data-category="all" aria-pressed="true">All works (${entries.length})</button></div><label class="sr-only" for="search">작업 검색</label><input id="search" type="search" placeholder="Search / 작업 검색" autocomplete="off"><div class="categories">${categories.map((category) => `<button data-category="${category.id}" aria-pressed="false">${escape(category.label)}</button>`).join('')}</div></div><div id="index-list"></div><p id="index-status" class="sr-only" role="status" aria-live="polite"></p><div class="index-foot"><p>정다운 · 새벽소리</p><p>Sound art, composition,<br>production & sound engineering.</p></div></aside><section class="gallery" aria-label="작업 이미지와 링크" aria-live="polite"></section></main>
  <dialog class="project-dialog" aria-labelledby="project-title"><button class="close" type="button" aria-label="상세 닫기">Close ×</button><div id="project-content"></div></dialog>
  <dialog class="about-dialog" aria-labelledby="about-title"><button class="close" type="button" aria-label="소개 닫기">Close ×</button><div class="about-body"><h1 id="about-title">DAWN</h1><p class="korean-name">정다운 · 새벽소리</p><p>사운드 아티스트 · 작곡가<br>프로듀서 · 사운드 엔지니어</p><div class="education">${profile.education.map((item) => `<p>${escape(item.school)}<br>${escape(item.detail)}</p>`).join('')}</div><p class="award">2015_김광석 노래부르기<br>학전 · 기타상 수상</p><a href="https://www.instagram.com/jeongdawn/" target="_blank" rel="noopener noreferrer">Instagram @jeongdawn ↗</a></div></dialog>`;

const projectDialog = document.querySelector('.project-dialog');
const aboutDialog = document.querySelector('.about-dialog');
const searchInput = document.querySelector('#search');
// 기존 작업 URL에서 영상 ID를 추출해 해당 작업의 썸네일만 연결합니다.
for (const entry of entries) {
  if (assets.has(entry.id) || !entry.url) continue;
  try {
    const url = new URL(entry.url);
    let videoId;
    if (url.hostname === 'youtu.be') videoId = url.pathname.slice(1);
    if (['youtube.com', 'www.youtube.com'].includes(url.hostname)) videoId = url.searchParams.get('v');
    if (videoId && /^[A-Za-z0-9_-]{11}$/.test(videoId)) {
      assets.set(entry.id, {image: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`});
    }
  } catch { /* 유효하지 않은 링크에는 썸네일을 추가하지 않습니다. */ }
}
function renderGallery(matches) {
  const gallery = document.querySelector('.gallery');
  gallery.innerHTML = matches.length ? matches.map((entry, index) => {
    const asset = assets.get(entry.id);
    const url = safeUrl(entry.url || asset?.source);
    const media = asset
      ? `<a href="#work/${entry.id}" data-work="${entry.id}" aria-label="${escape(entry.title)} 상세 보기"><img src="${asset.image}" alt="${escape(entry.title)} 작업 이미지" ${index ? 'loading="lazy"' : 'fetchpriority="high"'}></a>`
      : `<a class="project-title-sheet" href="#work/${entry.id}" data-work="${entry.id}"><span>${escape(entry.year)}</span><h2>${escape(entry.title)}</h2><p>${escape(entry.description)}</p></a>`;
    return `<article class="work-image ${asset ? 'has-image' : 'no-image'}" id="image-${entry.id}">${media}<div class="image-caption">${projectLink(entry)}<span>${escape(entry.description)}</span></div><div class="work-links"><a href="#work/${entry.id}" data-work="${entry.id}">크레딧 보기 ↗</a>${url ? `<a href="${url}" target="_blank" rel="noopener noreferrer">관련 작업 보기 ↗</a>` : ''}</div></article>`;
  }).join('') : '<p class="gallery-empty">일치하는 작업이 없습니다.</p>';
  gallery.querySelectorAll('img').forEach((image) => image.addEventListener('error', () => {
    image.replaceWith(Object.assign(document.createElement('span'), {className:'image-unavailable',textContent:'이미지를 불러올 수 없습니다. 아래 작업 링크를 확인해 주세요.'}));
  }, {once:true}));
}

function renderIndex() {
  const candidates = entries;
  const terms = search.trim().toLocaleLowerCase('ko').split(/\s+/).filter(Boolean);
  const matches = candidates.filter((entry) => {
    const inCategory = activeCategory === 'all' || entry.categories.includes(activeCategory);
    const text = `${entry.year} ${entry.title} ${entry.description}`.toLocaleLowerCase('ko');
    return inCategory && terms.every((term) => text.includes(term));
  });
  document.querySelector('#index-list').innerHTML = matches.length ? matches.map((entry) => `<p>${projectLink(entry)}</p>`).join('') : '<p class="no-results">일치하는 작업이 없습니다.</p>';
  document.querySelector('#index-status').textContent = `${matches.length}개 작업`;
  renderGallery(matches);
  document.querySelectorAll('[data-category]').forEach((button) => button.setAttribute('aria-pressed',String(button.dataset.category === activeCategory)));
}
function setCategory(category) {
  activeCategory = category;
  renderIndex();
  if (window.matchMedia('(min-width: 551px)').matches) window.scrollTo({top:0,behavior:'auto'});
}
searchInput.addEventListener('input', () => {
  search = searchInput.value;
  renderIndex();
});
document.querySelectorAll('[data-category]').forEach((button) => button.addEventListener('click', () => setCategory(button.dataset.category)));

function closeDialogs() {
  projectDialog.close();
  aboutDialog.close();
}
function openProject(entry) {
  const asset = assets.get(entry.id);
  const url = safeUrl(entry.url || asset?.source);
  const category = entry.categories.map((id) => categories.find((item) => item.id === id)?.label).filter(Boolean).join(' · ');
  document.querySelector('#project-content').innerHTML = `<div class="project-information"><span>${escape(entry.year)}</span><h1 id="project-title">${escape(entry.title)}</h1><p>${escape(entry.description)}</p><p class="project-category">${escape(category)}</p>${url ? `<a class="external-link" href="${url}" target="_blank" rel="noopener noreferrer">관련 작업 보기 ↗</a>` : ''}</div>${asset ? `<img class="detail-image" src="${asset.image}" alt="${escape(entry.title)} 작업 이미지">` : ''}`;
  projectDialog.classList.toggle('text-project', !asset);
  projectDialog.showModal();
}
function route() {
  closeDialogs();
  const hash = location.hash;
  if (hash.startsWith('#work/')) {
    const entry = entries.find((item) => item.id === hash.slice(6));
    if (entry) openProject(entry);
  } else if (hash === '#about') {
    aboutDialog.showModal();
  } else if (hash === '#archive') {
    setCategory('all');
    document.querySelector('.index').scrollIntoView({behavior:'auto',block:'start'});
  } else if (hash === '#home') {
    window.scrollTo({top:0,behavior:'auto'});
  }
  document.querySelectorAll('[data-work]').forEach((link) => link.classList.toggle('current',hash === `#work/${link.dataset.work}`));
}
document.addEventListener('click', (event) => {
  const link = event.target.closest('a[href^="#"]');
  if (!link) return;
  returnFocus = link;
  if (location.hash === link.getAttribute('href')) route();
});
function dismiss() {
  closeDialogs();
  history.replaceState(null,'',location.pathname + location.search);
  document.querySelectorAll('.current').forEach((item) => item.classList.remove('current'));
  if (returnFocus?.isConnected) returnFocus.focus({preventScroll:true});
}
[projectDialog,aboutDialog].forEach((dialog) => {
  dialog.querySelector('.close').addEventListener('click', dismiss);
  dialog.addEventListener('cancel',(event) => {event.preventDefault();dismiss();});
  dialog.addEventListener('click',(event) => {if(event.target === dialog) dismiss();});
});
window.addEventListener('hashchange',route);
renderIndex();
route();
