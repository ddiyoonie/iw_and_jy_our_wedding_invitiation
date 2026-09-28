// ============================================================
// LETTERS OF LOVE — EDIT THESE VALUES FIRST
// ============================================================
const weddingDate = new Date("2027-08-22T15:00:00+09:00");
const calendarYear = 2027;
const calendarMonth = 7; // January = 0, December = 11
const calendarDay = 22;

// Your folder structure:
// wedding/
//   index.html
//   style.css
//   script.js
//   images/
//     gallery1.jpg
//     gallery2.jpg
//     gallery3.jpg ...
const GALLERY_BASE_PATH = "images/";
const GALLERY_PREFIX = "gallery";
const GALLERY_EXTENSION = ".jpg";
const MAX_GALLERY_IMAGES = 200;
const PREVIEW_COUNT = 3;

// ============================================================
// D-DAY
// ============================================================
function updateDday(){
  const now = new Date();
  const diff = Math.ceil((weddingDate - now) / 86400000);
  const el = document.getElementById("dday");
  if(!el) return;
  if(diff > 0) el.textContent = `ෆ D-${diff} ෆ`;
  else if(diff === 0) el.textContent = "D-DAY ෆ";
  else el.textContent = `D+${Math.abs(diff)}일 ෆ`;
}
updateDday();

// ============================================================
// CALENDAR
// ============================================================
function makeCalendar(){
  const root = document.getElementById("calendar");
  if(!root) return;
  root.innerHTML = "";

  ["S","M","T","W","T","F","S"].forEach(day=>{
    const el = document.createElement("div");
    el.className = "cal-head";
    el.textContent = day;
    root.appendChild(el);
  });

  const firstWeekday = new Date(calendarYear, calendarMonth, 1).getDay();
  const lastDate = new Date(calendarYear, calendarMonth + 1, 0).getDate();

  for(let i=0;i<firstWeekday;i++){
    const blank = document.createElement("div");
    blank.className = "cal-day empty";
    root.appendChild(blank);
  }

  for(let day=1;day<=lastDate;day++){
    const el = document.createElement("div");
    el.className = `cal-day${day === calendarDay ? " selected" : ""}`;
    el.textContent = day;
    root.appendChild(el);
  }
}
makeCalendar();

// ============================================================
// COPY
// ============================================================
async function safeCopy(text, successMessage){
  try{
    if(navigator.clipboard && window.isSecureContext){
      await navigator.clipboard.writeText(text);
    }else{
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      document.execCommand("copy");
      textarea.remove();
    }
    alert(successMessage);
  }catch(error){
    alert("복사에 실패했습니다.");
  }
}
function copyAccount(account){ safeCopy(account, "계좌번호가 복사되었습니다."); }
function copyText(text){ safeCopy(text, "주소가 복사되었습니다."); }

// ============================================================
// GIFT TABS
// ============================================================
document.querySelectorAll(".gift-tabs button").forEach(button=>{
  button.addEventListener("click",()=>{
    document.querySelectorAll(".gift-tabs button").forEach(btn=>btn.classList.remove("active"));
    document.querySelectorAll(".account-panel").forEach(panel=>panel.classList.remove("active"));
    button.classList.add("active");
    document.getElementById(button.dataset.target)?.classList.add("active");
  });
});

// ============================================================
// SCROLL REVEAL
// ============================================================
const observer = new IntersectionObserver(entries=>{
  entries.forEach(entry=>{
    if(entry.isIntersecting){
      entry.target.classList.add("show");
      observer.unobserve(entry.target);
    }
  });
},{threshold:.1});
document.querySelectorAll(".reveal").forEach(el=>observer.observe(el));

// ============================================================
// GALLERY AUTO DISCOVERY
// gallery1.jpg -> gallery2.jpg -> gallery3.jpg -> ...
// The first missing number ends discovery.
// ============================================================
const galleryPreview = document.getElementById("galleryPreview");
const modal = document.getElementById("galleryModal");
const track = document.getElementById("galleryTrack");
const counter = document.getElementById("galleryCounter");
const closeBtn = document.getElementById("galleryClose");
const prevBtn = document.getElementById("galleryPrev");
const nextBtn = document.getElementById("galleryNext");
const viewport = document.getElementById("galleryViewport");

let galleryImages = [];
let current = 0;
let touchStartX = null;
let touchDeltaX = 0;

function gallerySrc(index){
  return `${GALLERY_BASE_PATH}${GALLERY_PREFIX}${index}${GALLERY_EXTENSION}`;
}

function imageExists(src){
  return new Promise(resolve=>{
    const img = new Image();
    img.onload = ()=>resolve(true);
    img.onerror = ()=>resolve(false);
    img.src = `${src}?gallery-check=${Date.now()}`;
  });
}

async function discoverGalleryImages(){
  const found = [];
  for(let i=1;i<=MAX_GALLERY_IMAGES;i++){
    const src = gallerySrc(i);
    if(!(await imageExists(src))) break;
    found.push(src);
  }
  return found;
}

function buildGallery(){
  if(!galleryPreview || !track) return;
  galleryPreview.innerHTML = "";
  track.innerHTML = "";

  if(galleryImages.length === 0){
    const notice = document.createElement("div");
    notice.style.cssText = "padding:26px 20px;text-align:center;font-size:9px;line-height:1.8;opacity:.65";
    notice.innerHTML = "images/gallery1.jpg 파일을 찾지 못했습니다.<br>index.html 옆의 images 폴더를 확인해 주세요.";
    galleryPreview.appendChild(notice);
    return;
  }

  galleryImages.slice(0,PREVIEW_COUNT).forEach((src,index)=>{
    const button = document.createElement("button");
    button.type = "button";
    button.className = "gallery-card";
    button.setAttribute("aria-label",`갤러리 사진 ${index+1} 크게 보기`);

    const img = document.createElement("img");
    img.src = src;
    img.alt = `Wedding gallery ${index+1}`;
    img.loading = index === 0 ? "eager" : "lazy";

    button.appendChild(img);
    button.addEventListener("click",()=>openGallery(index));
    galleryPreview.appendChild(button);
  });

  galleryImages.forEach((src,index)=>{
    const figure = document.createElement("figure");
    const img = document.createElement("img");
    img.src = src;
    img.alt = `Wedding gallery ${index+1}`;
    img.loading = index < 2 ? "eager" : "lazy";
    figure.appendChild(img);
    track.appendChild(figure);
  });

  renderGallery();
}

function renderGallery(){
  if(!galleryImages.length) return;
  track.style.transform = `translateX(-${current * 100}%)`;
  counter.textContent = `${current+1} / ${galleryImages.length}`;
  prevBtn.style.visibility = current === 0 ? "hidden" : "visible";
  nextBtn.style.visibility = current === galleryImages.length-1 ? "hidden" : "visible";
}

function openGallery(index){
  if(!galleryImages.length) return;
  current = index;
  renderGallery();
  modal.hidden = false;
  document.body.classList.add("modal-open");
}
function closeGallery(){
  modal.hidden = true;
  document.body.classList.remove("modal-open");
}
function previousGallery(){
  if(current > 0){ current--; renderGallery(); }
}
function nextGallery(){
  if(current < galleryImages.length - 1){ current++; renderGallery(); }
}

closeBtn?.addEventListener("click",closeGallery);
prevBtn?.addEventListener("click",previousGallery);
nextBtn?.addEventListener("click",nextGallery);

document.addEventListener("keydown",event=>{
  if(modal.hidden) return;
  if(event.key === "Escape") closeGallery();
  if(event.key === "ArrowLeft") previousGallery();
  if(event.key === "ArrowRight") nextGallery();
});

viewport?.addEventListener("touchstart",event=>{
  touchStartX = event.touches[0].clientX;
  touchDeltaX = 0;
},{passive:true});
viewport?.addEventListener("touchmove",event=>{
  if(touchStartX === null) return;
  touchDeltaX = event.touches[0].clientX - touchStartX;
},{passive:true});
viewport?.addEventListener("touchend",()=>{
  if(Math.abs(touchDeltaX) > 42){
    touchDeltaX < 0 ? nextGallery() : previousGallery();
  }
  touchStartX = null;
  touchDeltaX = 0;
});

(async function initGallery(){
  galleryImages = await discoverGalleryImages();
  buildGallery();
})();


const bgMusic = document.getElementById("bgMusic");

// 페이지 열자마자 재생 시도
window.addEventListener("load", async () => {
  try {
    await bgMusic.play();
  } catch (e) {
    console.log("자동재생 차단됨 - 첫 터치 시 재생");
  }
});

// 자동재생이 막힌 폰에서는 첫 터치 순간 바로 재생
async function forceStartMusic() {
  if (!bgMusic.paused) return;

  try {
    await bgMusic.play();
  } catch (e) {
    console.log("음악 재생 실패");
  }
}

document.addEventListener("touchstart", forceStartMusic, { once: true });
document.addEventListener("click", forceStartMusic, { once: true });
