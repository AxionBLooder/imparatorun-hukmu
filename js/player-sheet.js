import { backendConfigured } from './config.js';

const setText = (selector, value) => {
  const el = document.querySelector(selector);
  if (el) el.textContent = value;
};

if (!backendConfigured()) {
  setText('#characterName', 'Canlı bağlantı bekleniyor');
  setText('#characterRace', '—');
  setText('#playerName', '—');
  setText('#characterConcept', '—');
  setText('#focusValue', '0 / 0');
  setText('#glyphCapacityValue', '0 / 0');
}

document.querySelector('#useFocus')?.addEventListener('click', () => {
  if (!backendConfigured()) {
    setText('#focusValue', 'Supabase bağlantısından sonra aktif');
  }
});
