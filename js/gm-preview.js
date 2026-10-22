// Güvenli GM taslağı: Supabase'e veya gerçek GM API'sine hiçbir istek göndermez.
// Canlı çok oyunculu senkronizasyon için bu yerel kayıtlar ileride sunucu olaylarına taşınacaktır.
const STORAGE_KEY = 'ih_gm_preview_v1';
const CHANNEL_NAME = 'ih-gm-preview-sync';
const MAX_LOGS = 1200;
const $ = selector => document.querySelector(selector);
const uid = () => typeof crypto !== 'undefined' && crypto.randomUUID
  ? crypto.randomUUID() : `local-${Date.now()}-${Math.random().toString(36).slice(2)}`;
const empty = () => ({ version: 1, characters: [], library: [], logs: [], updatedAt: 0 });
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const number = (value, min, max) => Math.max(min, Math.min(max, Number(value) || 0));
let data = readState();
let selectedId = data.characters[0]?.id || '';
let channel;
let toastTimer;

function readState() {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    if (raw?.version === 1 && Array.isArray(raw.characters) && Array.isArray(raw.library) && Array.isArray(raw.logs)) return raw;
  } catch {}
  return empty();
}

function notify(message) {
  const toast = $('#previewStatus');
  toast.textContent = message;
  toast.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { toast.hidden = true; }, 3200);
}

function record(state, category, action, title, detail = '') {
  state.logs.push({id: uid(), at: new Date().toISOString(), actor: 'GM · Taslak', category, action, title, detail, deletedAt: null});
  if (state.logs.length > MAX_LOGS) state.logs.splice(0, state.logs.length - MAX_LOGS);
}

function mutate(callback) {
  // Yeni işlemi diğer sekmeden gelen en güncel sürümün üstüne uygula.
  const next = readState();
  const result = callback(next);
  if (result === false) return;
  next.updatedAt = Date.now();
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    notify('Tarayıcı depolamasına yazılamadı. Özel mod veya dolu depolamayı kontrol et.');
    return;
  }
  data = next;
  channel?.postMessage({updatedAt: next.updatedAt});
  render();
  if (typeof result === 'string') notify(result);
}

function activeCharacter(state = data) {
  return state.characters.find(c => c.id === selectedId) || null;
}

function requireCharacter(state = data) {
  const char = activeCharacter(state);
  if (!char) notify('Önce bir karakter oluştur veya seç.');
  return char;
}

function createCharacter(event) {
  event.preventDefault();
  const name = $('#characterName').value.trim();
  const player = $('#playerName').value.trim();
  if (!name) return;
  mutate(state => {
    const character = {id: uid(), name, player, focus: 5, maxFocus: 5, wounds: 0, prepared: 0, maxPrepared: 5, glyphs: [], items: []};
    state.characters.push(character);
    selectedId = character.id;
    record(state, 'character', 'character.create', 'Karakter oluşturuldu', `${name}${player ? ` · Oyuncu: ${player}` : ''}`);
    return `${name} oluşturuldu.`;
  });
  $('#characterForm').reset();
}

function deleteCharacter() {
  const char = requireCharacter();
  if (!char || !confirm(`${char.name} karakteri ve taslak envanteri silinsin mi?`)) return;
  mutate(state => {
    state.characters = state.characters.filter(c => c.id !== char.id);
    record(state, 'character', 'character.delete', 'Karakter silindi', `${char.name} · ${char.glyphs.length} Glif, ${char.items.length} eşya kaldırıldı`);
    selectedId = state.characters[0]?.id || '';
    return `${char.name} silindi.`;
  });
}

function createGlyph(event) {
  event.preventDefault();
  const name = $('#glyphName').value.trim();
  const kind = $('#glyphKind').value;
  const effect = $('#glyphEffect').value.trim();
  if (!name) return;
  if (data.library.some(g => g.name.toLocaleLowerCase('tr') === name.toLocaleLowerCase('tr'))) return notify('Bu adda bir Glif zaten kütüphanede var.');
  mutate(state => {
    const glyph = {id: uid(), name, kind, effect};
    state.library.push(glyph);
    record(state, 'glif', 'glyph.create', `${kind} Glif oluşturuldu`, `${name}${effect ? ` · ${effect}` : ''}`);
    return `${name} kütüphaneye kaydedildi.`;
  });
  $('#glyphForm').reset();
}

function assignGlyph() {
  const char = requireCharacter();
  const glyphId = $('#librarySelect').value;
  const glyph = data.library.find(g => g.id === glyphId);
  if (!char || !glyph) return notify('Önce karakter ve Glif seç.');
  if (char.glyphs.some(g => g.sourceId === glyphId)) return notify('Bu Glif seçili karakterde zaten var.');
  mutate(state => {
    const current = requireCharacter(state);
    if (!current) return false;
    current.glyphs.push({...glyph, id: uid(), sourceId: glyph.id});
    record(state, 'glif', 'glyph.assign', 'Glif oyuncuya verildi', `${glyph.name} → ${current.name}`);
    return `${current.name} karakterine ${glyph.name} verildi.`;
  });
}

function removeLibraryGlyph() {
  const glyph = data.library.find(g => g.id === $('#librarySelect').value);
  if (!glyph || !confirm(`${glyph.name} kütüphaneden silinsin mi? Karakterlere verilmiş kopyalar kalır.`)) return;
  mutate(state => {
    state.library = state.library.filter(g => g.id !== glyph.id);
    record(state, 'glif', 'glyph.delete', 'Glif kütüphaneden silindi', glyph.name);
    return `${glyph.name} kütüphaneden silindi.`;
  });
}

function removeAssignedGlyph(id) {
  const char = requireCharacter();
  const glyph = char?.glyphs.find(g => g.id === id);
  if (!glyph || !confirm(`${glyph.name} Glifi ${char.name} karakterinden kaldırılsın mı?`)) return;
  mutate(state => {
    const current = activeCharacter(state);
    current.glyphs = current.glyphs.filter(g => g.id !== id);
    record(state, 'glif', 'glyph.unassign', 'Glif oyuncudan kaldırıldı', `${glyph.name} · ${current.name}`);
    return `${glyph.name} kaldırıldı.`;
  });
}

function createItem(event) {
  event.preventDefault();
  const char = requireCharacter();
  const name = $('#itemName').value.trim();
  const qty = number($('#itemQty').value, 1, 999);
  if (!char || !name) return;
  mutate(state => {
    const current = activeCharacter(state);
    current.items.push({id: uid(), name, qty});
    record(state, 'inventory', 'item.add', 'Eşya eklendi', `${name} ×${qty} → ${current.name}`);
    return `${name} envantere eklendi.`;
  });
  $('#itemForm').reset();
}

function changeItem(id, delta) {
  const char = requireCharacter();
  const item = char?.items.find(i => i.id === id);
  if (!item) return;
  const nextQty = number(item.qty + delta, 0, 999);
  if (nextQty === item.qty) return;
  mutate(state => {
    const current = activeCharacter(state);
    const target = current.items.find(i => i.id === id);
    const before = target.qty;
    target.qty = nextQty;
    record(state, 'inventory', 'item.adjust', 'Eşya adedi değiştirildi', `${target.name} · ${current.name}: ${before} → ${nextQty}`);
    return `${target.name} adedi ${nextQty} oldu.`;
  });
}

function removeItem(id) {
  const char = requireCharacter();
  const item = char?.items.find(i => i.id === id);
  if (!item || !confirm(`${item.name} envanterden silinsin mi?`)) return;
  mutate(state => {
    const current = activeCharacter(state);
    current.items = current.items.filter(i => i.id !== id);
    record(state, 'inventory', 'item.delete', 'Eşya kaldırıldı', `${item.name} ×${item.qty} · ${current.name}`);
    return `${item.name} kaldırıldı.`;
  });
}

function changeResource(key, delta) {
  const char = requireCharacter();
  if (!char) return;
  const limits = {focus: char.maxFocus, wounds: 4, prepared: char.maxPrepared};
  const after = number(char[key] + delta, 0, limits[key]);
  if (after === char[key]) return;
  const labels = {focus: 'Focus', wounds: 'Yara', prepared: 'Hazır Glif'};
  mutate(state => {
    const current = activeCharacter(state);
    const before = current[key];
    current[key] = after;
    record(state, 'resource', `resource.${key}`, `${labels[key]} değiştirildi`, `${current.name}: ${before} → ${after}`);
    return `${labels[key]}: ${after}`;
  });
}

function deleteLog(id) {
  const entry = data.logs.find(x => x.id === id && !x.deletedAt);
  if (!entry || !confirm('Bu kayıt listeden kaldırılsın mı? Silme işlemi ayrıca kaydedilir.')) return;
  mutate(state => {
    const target = state.logs.find(x => x.id === id);
    if (!target || target.deletedAt) return false;
    target.deletedAt = new Date().toISOString();
    record(state, 'system', 'log.delete', 'Log kaydı silindi', `Silinen kayıt: ${target.title} · ${target.id.slice(0,8)}`);
    return 'Kayıt listeden kaldırıldı; silme izi korundu.';
  });
}

function loadExamples() {
  if (data.characters.length && !confirm('Mevcut taslağa örnek karakterler eklensin mi?')) return;
  mutate(state => {
    const arin = {id: uid(), name: 'Arin', player: 'Örnek Oyuncu 1', focus: 4, maxFocus: 5, wounds: 1, prepared: 2, maxPrepared: 5, glyphs: [], items: [{id: uid(), name: 'Can İksiri', qty: 3}]};
    const mira = {id: uid(), name: 'Mira', player: 'Örnek Oyuncu 2', focus: 5, maxFocus: 5, wounds: 0, prepared: 1, maxPrepared: 5, glyphs: [], items: []};
    const glyph = {id: uid(), name: 'Ateş Mührü', kind: 'Kök', effect: 'Örnek ateş glifi'};
    arin.glyphs.push({...glyph, id: uid(), sourceId: glyph.id});
    state.characters.push(arin, mira);
    if (!state.library.some(g => g.name === glyph.name)) state.library.push(glyph);
    selectedId = arin.id;
    record(state, 'system', 'demo.seed', 'Örnek içerik yüklendi', 'Arin, Mira, Ateş Mührü ve Can İksiri');
    return 'Örnek karakterler hazır.';
  });
}

function render() {
  if (!data.characters.some(c => c.id === selectedId)) selectedId = data.characters[0]?.id || '';
  const char = activeCharacter();
  $('#statCharacters').textContent = data.characters.length;
  $('#statGlyphs').textContent = data.library.length;
  $('#statAssigned').textContent = data.characters.reduce((sum, c) => sum + c.glyphs.length, 0);
  const activeLogs = data.logs.filter(l => !l.deletedAt);
  $('#statLogs').textContent = activeLogs.length;
  $('#characterList').innerHTML = data.characters.length ? data.characters.map(c =>
    `<button class="character-row ${c.id === selectedId ? 'active' : ''}" data-select-character="${esc(c.id)}"><b>${esc(c.name)}</b><span>${esc(c.player || 'Oyuncu atanmadı')} · ${c.glyphs.length} Glif</span></button>`).join('') : '<div class="placeholder">Karakter oluştur veya örnek verileri yükle.</div>';
  $('#selectedName').textContent = char?.name || 'Karakter seç';
  $('#selectedMeta').textContent = char?.player ? `Oyuncu: ${char.player}` : char ? 'Oyuncu atanmadı' : 'İşlem yapmak için karakter oluştur.';
  $('#characterBadge').textContent = char ? 'Taslak karakter' : 'Hazır değil';
  $('#focusValue').textContent = char ? `${char.focus}/${char.maxFocus}` : '—';
  $('#woundsValue').textContent = char ? `${char.wounds}/4` : '—';
  $('#preparedValue').textContent = char ? `${char.prepared}/${char.maxPrepared}` : '—';
  $('#assignedCount').textContent = `${char?.glyphs.length || 0} Glif`;
  const chosenLibrary = $('#librarySelect').value;
  $('#librarySelect').innerHTML = data.library.length ? data.library.map(g => `<option value="${esc(g.id)}">${esc(g.name)} · ${esc(g.kind)}</option>`).join('') : '<option value="">Önce glif oluştur.</option>';
  if (data.library.some(g => g.id === chosenLibrary)) $('#librarySelect').value = chosenLibrary;
  $('#assignedGlyphs').innerHTML = char?.glyphs.length ? char.glyphs.map(g =>
    `<div class="resource-row"><div><strong>${esc(g.name)}</strong><small>${esc(g.kind)} Glif · ${esc(g.effect || 'Etki belirtilmedi')}</small></div><button class="btn danger mini" data-remove-glyph="${esc(g.id)}" type="button">Kaldır</button></div>`).join('') : '<div class="placeholder">Bu karakterde Glif yok.</div>';
  $('#itemList').innerHTML = char?.items.length ? char.items.map(i =>
    `<div class="resource-row"><div><strong>${esc(i.name)}</strong><small>${i.qty} adet</small></div><div class="preview-row-actions"><div class="counter"><button type="button" data-item-minus="${esc(i.id)}" aria-label="${esc(i.name)} azalt">−</button><b>${i.qty}</b><button type="button" data-item-plus="${esc(i.id)}" aria-label="${esc(i.name)} artır">+</button></div><button class="btn danger mini" data-remove-item="${esc(i.id)}" type="button">Sil</button></div></div>`).join('') : '<div class="placeholder">Envanter boş.</div>';
  renderLogs(activeLogs);
}

function renderLogs(activeLogs) {
  const category = $('#logCategory').value;
  const query = $('#logSearch').value.trim().toLocaleLowerCase('tr');
  const filtered = activeLogs.filter(entry =>
    (category === 'all' || entry.category === category) &&
    (!query || `${entry.title} ${entry.detail} ${entry.actor} ${entry.action}`.toLocaleLowerCase('tr').includes(query)));
  $('#logCount').textContent = `${filtered.length} kayıt`;
  $('#logList').innerHTML = filtered.length ? [...filtered].reverse().slice(0, 150).map(entry =>
    `<div class="preview-log-row"><span class="preview-log-dot ${esc(entry.category)}"></span><div><strong>${esc(entry.title)}</strong><p>${esc(entry.detail)}</p><div class="preview-log-meta"><span>${new Date(entry.at).toLocaleString('tr-TR', {day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'})}</span><span class="preview-tag">${esc(entry.category)}</span><span>${esc(entry.actor)}</span></div></div><button class="btn danger mini" type="button" data-delete-log="${esc(entry.id)}" aria-label="${esc(entry.title)} kaydını sil">Sil</button></div>`).join('') : '<div class="preview-empty">Bu filtrede henüz kayıt yok.</div>';
}

$('#characterForm').addEventListener('submit', createCharacter);
$('#deleteCharacter').addEventListener('click', deleteCharacter);
$('#glyphForm').addEventListener('submit', createGlyph);
$('#assignGlyph').addEventListener('click', assignGlyph);
$('#removeLibraryGlyph').addEventListener('click', removeLibraryGlyph);
$('#itemForm').addEventListener('submit', createItem);
$('#loadExamples').addEventListener('click', loadExamples);
$('#logCategory').addEventListener('change', render);
$('#logSearch').addEventListener('input', render);
document.addEventListener('click', event => {
  const el = event.target.closest('button[data-select-character],button[data-remove-glyph],button[data-remove-item],button[data-item-plus],button[data-item-minus],button[data-delete-log],button[data-resource]');
  if (!el) return;
  if (el.dataset.selectCharacter) { selectedId = el.dataset.selectCharacter; render(); }
  if (el.dataset.removeGlyph) removeAssignedGlyph(el.dataset.removeGlyph);
  if (el.dataset.removeItem) removeItem(el.dataset.removeItem);
  if (el.dataset.itemPlus) changeItem(el.dataset.itemPlus, 1);
  if (el.dataset.itemMinus) changeItem(el.dataset.itemMinus, -1);
  if (el.dataset.deleteLog) deleteLog(el.dataset.deleteLog);
  if (el.dataset.resource) changeResource(el.dataset.resource, Number(el.dataset.delta));
});
window.addEventListener('storage', event => {
  if (event.key === STORAGE_KEY) { data = readState(); render(); }
});
if ('BroadcastChannel' in window) {
  channel = new BroadcastChannel(CHANNEL_NAME);
  channel.onmessage = () => { data = readState(); render(); };
}
window.addEventListener('focus', () => { data = readState(); render(); });
render();
