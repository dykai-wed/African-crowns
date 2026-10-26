// AFRICAN CROWNS: EMPIRES OF THE SUN
// In-Game Historical Reference Codex

import React, { useState } from 'react';
import { CIVILIZATIONS } from '../game/constants';
import { CivilizationId } from '../game/types';

interface CodexModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CodexModal: React.FC<CodexModalProps> = ({ isOpen, onClose }) => {
  const [activeCiv, setActiveCiv] = useState<CivilizationId>('mali');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-none">
      <div className="w-full max-w-3xl max-h-[85vh] bg-[#1e1109] border border-amber-600/80 rounded-2xl shadow-2xl flex flex-col text-amber-100 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-amber-800/80 p-4 bg-[#29150b]">
          <div className="flex items-center gap-2">
            <span className="text-xl">📜</span>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-amber-200">
                Historical Codex of African Civilizations
              </h2>
              <p className="text-[11px] text-amber-400/80">
                Documented history, architectural heritage, and gameplay inspirations
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-amber-950 hover:bg-amber-900 border border-amber-700/60 flex items-center justify-center text-amber-200 text-sm transition"
          >
            ✕
          </button>
        </div>

        {/* Civ Navigation Tabs */}
        <div className="flex border-b border-amber-900/60 bg-black/30">
          {(['mali', 'benin', 'egypt'] as CivilizationId[]).map((id) => (
            <button
              key={id}
              onClick={() => setActiveCiv(id)}
              className={`flex-1 py-3 text-xs sm:text-sm font-bold transition flex items-center justify-center gap-1.5 ${
                activeCiv === id
                  ? 'border-b-2 border-amber-400 text-amber-300 bg-amber-950/40'
                  : 'text-amber-400/70 hover:text-amber-200'
              }`}
            >
              <span>{id === 'mali' ? '👑' : id === 'benin' ? '🛡️' : '☀️'}</span>
              <span>{CIVILIZATIONS[id].name}</span>
            </button>
          ))}
        </div>

        {/* Content Body with customized African historical essays */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 text-xs sm:text-sm leading-relaxed">
          {activeCiv === 'mali' && (
            <>
              <div>
                <span className="text-[10px] uppercase tracking-widest text-amber-400 font-bold">
                  Period: c. 1235 – 1600 CE · Sahel & West Africa
                </span>
                <h3 className="text-lg font-bold text-amber-200 mt-0.5">
                  The Mali Empire: Masters of the Trans-Saharan Gold Trade
                </h3>
              </div>

              <div className="space-y-3">
                <div className="p-3 rounded-xl bg-black/40 border border-amber-900/50">
                  <h4 className="font-bold text-amber-300 mb-1">1. Documented History</h4>
                  <p className="text-amber-100/90">
                    Founded in the 13th century by the legendary Mansa Sundiata Keita after the Battle
                    of Kirina (c. 1235), the Mali Empire unified the Mandinka clans and established the
                    oral constitution known as the Kouroukan Fouga. Under the reign of Mansa Musa
                    (r. 1312–1337), Mali’s staggering wealth, drawn from the goldfields of Bambuk and
                    Boure, reached global prominence during his famous pilgrimage to Mecca in 1324. Cities
                    like Timbuktu and Djenné became world-renowned crossroads of Islamic jurisprudence,
                    mathematics, astronomy, and literature at the University of Sankore.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-black/40 border border-amber-900/50">
                  <h4 className="font-bold text-amber-300 mb-1">2. Architectural Heritage</h4>
                  <p className="text-amber-100/90">
                    Mali pioneered the Sudano-Sahelian monumental architectural tradition. Master
                    masons employed sun-baked mud bricks (ferey), organic adobe plaster, and bundled
                    palmyra palm beams known as <em>toron</em>. These projecting beams served as
                    permanent scaffolding for annual community replastering festivals (such as the Crepissage
                    of Djenné). Tapered minarets capped with ostrich eggs symbolized purity and fertility.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-black/40 border border-amber-900/50">
                  <h4 className="font-bold text-amber-300 mb-1">3. Game Mechanics Reflection</h4>
                  <p className="text-amber-100/90">
                    In <em>African Crowns</em>, Mali features specialized trans-Saharan trade caravans,
                    enhanced gold yields from market quarters, and swift Mandekalu cavalry capable of
                    sweeping savannah battlefields.
                  </p>
                </div>
              </div>
            </>
          )}

          {activeCiv === 'benin' && (
            <>
              <div>
                <span className="text-[10px] uppercase tracking-widest text-amber-400 font-bold">
                  Period: c. 1180 – 1897 CE · Edo Heartland & Forest Margin
                </span>
                <h3 className="text-lg font-bold text-amber-200 mt-0.5">
                  The Kingdom of Benin: Earthworks and Bronze Guilds
                </h3>
              </div>

              <div className="space-y-3">
                <div className="p-3 rounded-xl bg-black/40 border border-amber-900/50">
                  <h4 className="font-bold text-amber-300 mb-1">1. Documented History</h4>
                  <p className="text-amber-100/90">
                    The historical Kingdom of Benin (known natively as Edo) was ruled by divine kings
                    (the Oba). Commencing in the 13th century under Oba Eweka I and expanding
                    dramatically under warrior-kings such as Oba Ewuare the Great (c. 1440–1473), Benin
                    organized a complex bureaucratic court, specialized craft guilds, and a powerful
                    infantry army that dominated the coastal rainforest belt.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-black/40 border border-amber-900/50">
                  <h4 className="font-bold text-amber-300 mb-1">2. Architectural Heritage & The Iya</h4>
                  <p className="text-amber-100/90">
                    Benin constructed the <em>Iya</em> (Benin Moat and Earthworks), a monumental network
                    of earthen ramparts and deep ditches spanning an estimated 16,000 kilometers—surpassing
                    the Great Wall of China in total earth moved according to the Guinness Book of Records.
                    Benin City featured wide, straight avenues lit at night by palm-oil lamps and royal
                    palaces embellished with brass snake spires and lost-wax cast commemorative plaques.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-black/40 border border-amber-900/50">
                  <h4 className="font-bold text-amber-300 mb-1">3. Game Mechanics Reflection</h4>
                  <p className="text-amber-100/90">
                    In <em>African Crowns</em>, Benin possesses resilient rammed-earth fortifications with
                    bonus durability, specialized bronze workshops that upgrade combat unit defense, and
                    resolute royal spearmen.
                  </p>
                </div>
              </div>
            </>
          )}

          {activeCiv === 'egypt' && (
            <>
              <div>
                <span className="text-[10px] uppercase tracking-widest text-amber-400 font-bold">
                  Period: c. 1550 – 1077 BCE (New Kingdom) · Nile Valley
                </span>
                <h3 className="text-lg font-bold text-amber-200 mt-0.5">
                  The Egyptian Dynasties: The Nile Flood and Imperial Administration
                </h3>
              </div>

              <div className="space-y-3">
                <div className="p-3 rounded-xl bg-black/40 border border-amber-900/50">
                  <h4 className="font-bold text-amber-300 mb-1">1. Documented History</h4>
                  <p className="text-amber-100/90">
                    Focused specifically on the New Kingdom (18th to 20th Dynasties), Egypt united the
                    Nile Valley under pharaohs like Hatshepsut, Thutmose III, and Ramesses II. Egyptian
                    civilization rested upon the predictable inundation (<em>Akhet</em>) of the Nile,
                    which deposited fertile silt across flood basins, enabling unprecedented agricultural
                    surpluses stored in vast state-managed granaries.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-black/40 border border-amber-900/50">
                  <h4 className="font-bold text-amber-300 mb-1">2. Architectural Heritage</h4>
                  <p className="text-amber-100/90">
                    Settlements utilized durable mud-brick domestic dwellings paired with monumental
                    sandstone gateways (pylons), hypostyle halls, and papyrus-reed capitals. Granaries
                    consisted of vaulted brick silos filled from rooftop hatches and emptied via ground
                    chutes, rigorously inventoried by scribes.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-black/40 border border-amber-900/50">
                  <h4 className="font-bold text-amber-300 mb-1">3. Game Mechanics Reflection</h4>
                  <p className="text-amber-100/90">
                    In <em>African Crowns</em>, Egypt enjoys boosted food production from irrigated farms
                    and granaries, alongside elite Medjay composite archers boasting unmatched range.
                  </p>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-amber-900/60 bg-[#29150b] flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold text-xs transition"
          >
            Return to Kingdom
          </button>
        </div>
      </div>
    </div>
  );
};
