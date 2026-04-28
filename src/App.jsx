import React, { useState, useMemo } from "react";

const NOTES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const FLAT_TO_SHARP = { Db: "C#", Eb: "D#", Gb: "F#", Ab: "G#", Bb: "A#" };

const normalizeNote = (n) => {
  const cleaned = n.trim();
  const head = cleaned[0].toUpperCase() + (cleaned[1] === "b" || cleaned[1] === "#" ? cleaned[1] : "");
  return FLAT_TO_SHARP[head] || head;
};

const noteIdx = (n) => NOTES.indexOf(normalizeNote(n));

const SCALES = {
  "Major (Ionian)": [0, 2, 4, 5, 7, 9, 11],
  "Natural Minor (Aeolian)": [0, 2, 3, 5, 7, 8, 10],
  "Dorian": [0, 2, 3, 5, 7, 9, 10],
  "Phrygian": [0, 1, 3, 5, 7, 8, 10],
  "Lydian": [0, 2, 4, 6, 7, 9, 11],
  "Mixolydian": [0, 2, 4, 5, 7, 9, 10],
  "Locrian": [0, 1, 3, 5, 6, 8, 10],
  "Major Pentatonic": [0, 2, 4, 7, 9],
  "Minor Pentatonic": [0, 3, 5, 7, 10],
  "Blues": [0, 3, 5, 6, 7, 10],
  "Harmonic Minor": [0, 2, 3, 5, 7, 8, 11],
  "Melodic Minor": [0, 2, 3, 5, 7, 9, 11],
};

const CHORD_TYPES = {
  "": [0, 4, 7], "maj": [0, 4, 7], "M": [0, 4, 7],
  "m": [0, 3, 7], "min": [0, 3, 7], "7": [0, 4, 7, 10],
  "maj7": [0, 4, 7, 11], "M7": [0, 4, 7, 11], "m7": [0, 3, 7, 10],
  "min7": [0, 3, 7, 10], "dim": [0, 3, 6], "dim7": [0, 3, 6, 9],
  "m7b5": [0, 3, 6, 10], "aug": [0, 4, 8], "sus2": [0, 2, 7],
  "sus4": [0, 5, 7], "5": [0, 7], "9": [0, 4, 7, 10, 2],
  "m9": [0, 3, 7, 10, 2], "maj9": [0, 4, 7, 11, 2],
  "add9": [0, 4, 7, 2], "6": [0, 4, 7, 9], "m6": [0, 3, 7, 9],
};

const parseChord = (str) => {
  const s = str.trim();
  if (!s) return null;
  const match = s.match(/^([A-G][#b]?)(.*)$/);
  if (!match) return null;
  const root = normalizeNote(match[1]);
  const quality = match[2].trim();
  const formula = CHORD_TYPES[quality];
  if (formula === undefined) return null;
  const rootIdx = noteIdx(root);
  if (rootIdx < 0) return null;
  const tones = formula.map((iv) => NOTES[(rootIdx + iv) % 12]);
  return { raw: s, root, quality, tones, rootIdx };
};

const suggestScales = (chords) => {
  if (!chords.length) return [];
  const allTones = new Set();
  chords.forEach((c) => c.tones.forEach((t) => allTones.add(t)));
  const required = [...allTones].map(noteIdx);
  const candidates = [];
  for (const root of NOTES) {
    for (const [scaleName, formula] of Object.entries(SCALES)) {
      const scaleSet = new Set(formula.map((iv) => (noteIdx(root) + iv) % 12));
      const fits = required.every((t) => scaleSet.has(t));
      if (fits) {
        const rootMatch = chords.some((c) => c.root === root) ? 2 : 0;
        const firstChordMatch = chords[0].root === root ? 3 : 0;
        const compactness = (12 - formula.length) * 0.3;
        candidates.push({
          name: root + " " + scaleName,
          root, scaleName,
          notes: formula.map((iv) => NOTES[(noteIdx(root) + iv) % 12]),
          score: rootMatch + firstChordMatch + compactness,
        });
      }
    }
  }
  candidates.sort((a, b) => b.score - a.score);
  return candidates.slice(0, 8);
};

const TUNING = ["E", "A", "D", "G", "B", "E"];
const FRETS = 15;

const buildFretboard = () => {
  const board = [];
  const visualTuning = [...TUNING].reverse();
  for (let s = 0; s < 6; s++) {
    const openIdx = noteIdx(visualTuning[s]);
    const row = [];
    for (let f = 0; f <= FRETS; f++) row.push(NOTES[(openIdx + f) % 12]);
    board.push(row);
  }
  return board;
};

const FRETBOARD = buildFretboard();
const CHORD_COLORS = ["#ff2e63", "#00f5d4", "#fee440", "#9b5de5", "#f15bb5", "#00bbf9", "#ff6d00", "#06d6a0"];

const Fretboard = ({ chords, scale }) => {
  const noteToChords = useMemo(() => {
    const map = {};
    NOTES.forEach((n) => (map[n] = []));
    chords.forEach((c, i) => { c.tones.forEach((t) => { if (!map[t].includes(i)) map[t].push(i); }); });
    return map;
  }, [chords]);

  const scaleSet = useMemo(() => {
    if (!scale) return null;
    return new Set(scale.notes);
  }, [scale]);

  return (
    <div className="overflow-x-auto pb-2">
      <div className="inline-block min-w-full">
        <div className="flex mb-1 ml-8">
          {Array.from({ length: FRETS + 1 }, (_, f) => (
            <div key={f} className="flex-shrink-0 w-12 text-center text-xs font-mono text-zinc-500">{f === 0 ? "○" : f}</div>
          ))}
        </div>
        {FRETBOARD.map((string, sIdx) => {
          const stringName = ["e", "B", "G", "D", "A", "E"][sIdx];
          return (
            <div key={sIdx} className="flex items-center h-10">
              <div className="w-8 text-right pr-2 font-mono text-sm text-zinc-400">{stringName}</div>
              {string.map((note, fIdx) => {
                const inChords = noteToChords[note] || [];
                const inScale = scaleSet ? scaleSet.has(note) : true;
                const isRoot = chords.some((c) => c.root === note);
                let bg = "transparent", textColor = "text-zinc-700", border = "";
                if (inChords.length > 0 && inScale) {
                  bg = CHORD_COLORS[inChords[0] % CHORD_COLORS.length];
                  textColor = "text-black font-bold";
                  if (isRoot) border = "ring-2 ring-white";
                } else if (inScale && scaleSet) {
                  bg = "rgba(255,255,255,0.08)";
                  textColor = "text-zinc-300";
                }
                return (
                  <div key={fIdx} className="flex-shrink-0 w-12 h-10 flex items-center justify-center relative"
                    style={{ borderRight: fIdx === 0 ? "3px solid #71717a" : "1px solid #3f3f46", backgroundImage: sIdx < 5 ? "linear-gradient(to bottom, transparent 49%, #52525b 49%, #52525b 51%, transparent 51%)" : "none" }}>
                    {sIdx === 2 && [3,5,7,9,15].includes(fIdx) && <div className="absolute w-1.5 h-1.5 rounded-full bg-zinc-700 -bottom-1 left-1/2 -translate-x-1/2" />}
                    {sIdx === 2 && fIdx === 12 && <><div className="absolute w-1.5 h-1.5 rounded-full bg-zinc-700 -bottom-1 left-1/3" /><div className="absolute w-1.5 h-1.5 rounded-full bg-zinc-700 -bottom-1 right-1/3" /></>}
                    {(inChords.length > 0 || (inScale && scaleSet)) && (
                      <div className={"w-8 h-8 rounded-full flex items-center justify-center text-xs " + textColor + " " + border + " z-10"} style={{ backgroundColor: bg }}>{note}</div>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}
        <div className="mt-4 flex flex-wrap gap-2 ml-8">
          {chords.map((c, i) => (
            <div key={i} className="flex items-center gap-2 px-3 py-1 rounded-sm bg-zinc-900 border border-zinc-800">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: CHORD_COLORS[i % CHORD_COLORS.length] }} />
              <span className="font-mono text-sm text-zinc-200">{c.raw}</span>
              <span className="font-mono text-xs text-zinc-500">{c.tones.join("·")}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const generateChordTab = (chords) => {
  const stringNames = ["e", "B", "G", "D", "A", "E"];
  const lines = stringNames.map(() => "");
  chords.forEach((chord) => {
    const positions = FRETBOARD.map((string) => { for (let f = 0; f <= 7; f++) { if (chord.tones.includes(string[f])) return f; } return null; });
    const header = chord.raw;
    const padding = Math.max(0, 4 - header.length);
    lines.forEach((_, sIdx) => { if (sIdx === 0) lines[sIdx] += "|--" + header + "-".repeat(padding) + "--"; else lines[sIdx] += "|" + "-".repeat(header.length + 2 + padding + 2); });
    const order = [5, 4, 3, 2, 1, 0, 1, 2];
    for (let beat = 0; beat < 8; beat++) {
      const playString = order[beat];
      lines.forEach((_, sIdx) => { if (sIdx === playString && positions[sIdx] !== null) lines[sIdx] += positions[sIdx].toString().padEnd(2, "-"); else lines[sIdx] += "--"; });
    }
  });
  lines.forEach((_, i) => (lines[i] += "|"));
  return lines.join("\n");
};

const renderSoloTab = (notes) => {
  if (!Array.isArray(notes) || !notes.length) return "";
  const lines = ["e|", "B|", "G|", "D|", "A|", "E|"];
  notes.forEach((n) => {
    const sIdx = (n.string || 1) - 1;
    const fret = String(n.fret ?? "");
    const tech = n.technique || "";
    const cellWidth = Math.max(3, fret.length + tech.length + 1);
    lines.forEach((_, i) => { if (i === sIdx) lines[i] += fret + tech + "-".repeat(Math.max(1, cellWidth - fret.length - tech.length)); else lines[i] += "-".repeat(cellWidth); });
  });
  lines.forEach((_, i) => (lines[i] += "|"));
  return lines.join("\n");
};

const extractJSON = (text) => {
  if (!text) return null;
  const start = text.indexOf("{");
  if (start < 0) return null;
  let depth = 0, inString = false, escape = false;
  for (let i = start; i < text.length; i++) {
    const ch = text[i];
    if (escape) { escape = false; continue; }
    if (ch === "\\") { escape = true; continue; }
    if (ch === '"') { inString = !inString; continue; }
    if (inString) continue;
    if (ch === "{") depth++;
    else if (ch === "}") { depth--; if (depth === 0) return text.slice(start, i + 1); }
  }
  return null;
};

export default function App() {
  const [input, setInput] = useState("Am | F | C | G");
  const [selectedScaleIdx, setSelectedScaleIdx] = useState(0);
  const [feel, setFeel] = useState("brooding and melancholic, building to an emotional peak");
  const [skill, setSkill] = useState("intermediate");
  const [bars, setBars] = useState(8);
  const [solo, setSolo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [rawResponse, setRawResponse] = useState("");

  const chords = useMemo(() => input.split(/[|,\s]+/).map(s => s.trim()).filter(Boolean).map(parseChord).filter(Boolean), [input]);
  const scales = useMemo(() => suggestScales(chords), [chords]);
  const activeScale = scales[selectedScaleIdx] || scales[0];
  const tab = useMemo(() => generateChordTab(chords), [chords]);

  const generateSolo = async () => {
    if (!chords.length || !activeScale) { setError("Add some chords first."); return; }
    setLoading(true); setError(""); setSolo(null); setRawResponse("");

    const skillCal = skill === "beginner" ? "stay in one pentatonic box, simple rhythms" : skill === "intermediate" ? "bends, position shifts, some chromatic passing" : "wide intervals, fast runs, multiple positions";
    
    const prompt = "Output ONLY a single JSON object. No prose. No markdown fences. Start with { and end with }.\n\nContext: Chord progression: " + chords.map(c => c.raw).join(" | ") + " | Scale: " + activeScale.name + " — notes: " + activeScale.notes.join(", ") + " | Skill: " + skill + " | Feel: " + feel + " | Length: " + bars + " bars\n\nRequired JSON: { \"title\": \"string\", \"description\": \"string\", \"notes\": [{\"string\": 1-6, \"fret\": 0-22, \"technique\": \"\", \"bar\": 1-" + bars + ", \"comment\": \"\"}], \"performance_tips\": [\"string\"] }\n\nEvery note must be in: " + activeScale.notes.join(", ") + " | Skill: " + skillCal + " | Feel: " + feel + "\n\nREMEMBER: Single JSON only.";

    try {
      const apiKey = import.meta.env.VITE_OPENROUTER_KEY || "";
      if (!apiKey) throw new Error("Missing OpenRouter API key. Set VITE_OPENROUTER_KEY in .env");
      
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json", 
          "Authorization": "Bearer " + apiKey,
          "HTTP-Referer": window.location.origin || "https://solo-helper.vercel.app", 
          "X-Title": "Solo Helper" 
        },
        body: JSON.stringify({ 
          model: "openai/gpt-4o-mini", 
          messages: [{ role: "user", content: prompt }], 
          max_tokens: 2000 
        })
      });
      if (!response.ok) { const errText = await response.text(); throw new Error("API " + response.status + ": " + errText.slice(0, 300)); }
      const data = await response.json();
      let text = data.choices?.[0]?.message?.content || "";
      let candidate = text.replace(/```json|```/g, "").trim();
      const jsonStr = extractJSON(candidate) || candidate;
      setRawResponse(candidate);
      let parsed = JSON.parse(jsonStr);
      if (!parsed || typeof parsed !== "object") throw new Error("Response was not an object");
      if (!Array.isArray(parsed.notes) || parsed.notes.length === 0) throw new Error("Response had no notes array");
      
      parsed.notes = parsed.notes.map((n) => ({
        string: Number(n.string),
        fret: Number(n.fret),
        technique: n.technique || "",
        bar: Number(n.bar) || 1,
        comment: n.comment || "",
      })).filter((n) => Number.isInteger(n.string) && n.string >= 1 && n.string <= 6 && Number.isFinite(n.fret) && n.fret >= 0 && n.fret <= 24);
      
      if (parsed.notes.length === 0) throw new Error("All notes were invalid after cleanup");
      parsed.title = parsed.title || "Untitled Solo";
      parsed.description = parsed.description || "";
      parsed.performance_tips = Array.isArray(parsed.performance_tips) ? parsed.performance_tips : [];
      setSolo(parsed);
    } catch (e) {
      setError(e.message || String(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen text-zinc-100 p-4 md:p-8" style={{ backgroundColor: "#0a0a0a", backgroundImage: "radial-gradient(circle at 20% 0%, rgba(255,46,99,0.08) 0%, transparent 40%), radial-gradient(circle at 80% 100%, rgba(0,245,212,0.06) 0%, transparent 40%)", fontFamily: "'JetBrains Mono', 'Courier New', monospace" }}>
      <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&family=Bebas+Neue&display=swap" rel="stylesheet" />
      <div className="max-w-7xl mx-auto">
        <header className="mb-8 border-b-2 border-zinc-800 pb-6">
          <h1 className="text-5xl md:text-7xl tracking-tight leading-none" style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: "0.02em" }}>
            <span style={{ color: "#ff2e63" }}>SOLO</span>
            <span className="text-zinc-100">_</span>
            <span style={{ color: "#00f5d4" }}>HELPER</span>
          </h1>
          <p className="text-zinc-500 text-sm mt-2 max-w-xl">// chord progression → scales, fretboard, ai-generated solos //</p>
        </header>
        
        <section className="mb-8">
          <label className="block text-xs uppercase tracking-widest text-zinc-500 mb-2">01 / Chord Progression</label>
          <input type="text" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Am | F | C | G" className="w-full bg-zinc-900 border-2 border-zinc-800 focus:border-pink-500 outline-none px-4 py-3 text-xl font-mono text-zinc-100 transition-colors" />
          <p className="text-xs text-zinc-600 mt-2">separators: spaces, pipes, commas · supports: maj, m, 7, m7, maj7, dim, aug, sus2, sus4, 5, 9, m9, 6</p>
          {input.trim() && chords.length === 0 && <p className="text-xs text-pink-500 mt-2">no valid chords parsed yet</p>}
        </section>

        {chords.length > 0 && (
          <>
            <section className="mb-8">
              <label className="block text-xs uppercase tracking-widest text-zinc-500 mb-2">02 / Suitable Scales ({scales.length})</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {scales.map((s, i) => (
                  <button key={s.name} onClick={() => setSelectedScaleIdx(i)} className={"p-3 text-left border-2 transition-all " + (i === selectedScaleIdx ? "border-cyan-400 bg-cyan-400/10" : "border-zinc-800 hover:border-zinc-600 bg-zinc-900")}>
                    <div className="font-bold text-sm">{s.name}</div>
                    <div className="text-xs text-zinc-500 mt-1 truncate">{s.notes.join(" ")}</div>
                  </button>
                ))}
              </div>
            </section>

            <section className="mb-8">
              <label className="block text-xs uppercase tracking-widest text-zinc-500 mb-2">03 / Fretboard {activeScale && "· " + activeScale.name}</label>
              <div className="bg-zinc-950 border-2 border-zinc-800 p-4 rounded-sm">
                <Fretboard chords={chords} scale={activeScale} />
              </div>
              <p className="text-xs text-zinc-600 mt-2">solid colors = chord tones (one color per chord) · faded = scale tones · ringed = chord roots</p>
            </section>

            <section className="mb-8">
              <label className="block text-xs uppercase tracking-widest text-zinc-500 mb-2">04 / Chord Tab</label>
              <pre className="bg-zinc-950 border-2 border-zinc-800 p-4 text-xs md:text-sm overflow-x-auto text-zinc-200">{tab}</pre>
            </section>

            <section className="mb-8 border-t-2 border-zinc-800 pt-8">
              <label className="block text-xs uppercase tracking-widest text-zinc-500 mb-4">05 / AI Solo Writer</label>
              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-xs text-zinc-400 mb-1">Skill Level</label>
                  <select value={skill} onChange={(e) => setSkill(e.target.value)} className="w-full bg-zinc-900 border-2 border-zinc-800 px-3 py-2 font-mono text-sm">
                    <option value="beginner">Beginner — pentatonic box, simple</option>
                    <option value="intermediate">Intermediate — bends, position shifts</option>
                    <option value="advanced">Advanced — wide intervals, fast runs</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-zinc-400 mb-1">Bars</label>
                  <input type="number" min={2} max={16} value={bars} onChange={(e) => setBars(parseInt(e.target.value) || 8)} className="w-full bg-zinc-900 border-2 border-zinc-800 px-3 py-2 font-mono text-sm" />
                </div>
              </div>
              <div className="mb-4">
                <label className="block text-xs text-zinc-400 mb-1">Feel / Instructions</label>
                <textarea value={feel} onChange={(e) => setFeel(e.target.value)} rows={3} className="w-full bg-zinc-900 border-2 border-zinc-800 focus:border-pink-500 outline-none px-3 py-2 font-mono text-sm" placeholder="e.g., 'David Gilmour-style, slow bends, melodic, breathing space between phrases'" />
              </div>
              <button onClick={generateSolo} disabled={loading || !chords.length} className="px-6 py-3 font-bold uppercase tracking-wider text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed" style={{ backgroundColor: loading ? "#3f3f46" : "#ff2e63", color: loading ? "#a1a1aa" : "#000", fontFamily: "'Bebas Neue', sans-serif", letterSpacing: "0.15em" }}>
                {loading ? "▓▒░ Generating..." : "▶ Write Solo"}
              </button>
              
              {error && (
                <div className="mt-4 p-3 border-2 border-red-500 bg-red-500/10 text-red-300 text-sm">
                  <div className="font-bold mb-1">Couldn't generate solo</div>
                  <div className="text-xs opacity-80">{error}</div>
                  {rawResponse && (
                    <details className="mt-2">
                      <summary className="cursor-pointer text-xs opacity-60 hover:opacity-100">show raw response</summary>
                      <pre className="mt-2 text-xs whitespace-pre-wrap opacity-70 max-h-40 overflow-y-auto">{rawResponse.slice(0, 1500)}</pre>
                    </details>
                  )}
                </div>
              )}

              {solo && (
                <div className="mt-6 space-y-4">
                  <div>
                    <h3 className="text-3xl" style={{ fontFamily: "'Bebas Neue', sans-serif", color: "#fee440" }}>{solo.title}</h3>
                    <p className="text-zinc-400 text-sm mt-1">{solo.description}</p>
                  </div>
                  <div>
                    <label className="block text-xs uppercase tracking-widest text-zinc-500 mb-2">Solo Tab</label>
                    <pre className="bg-zinc-950 border-2 border-zinc-800 p-4 text-xs md:text-sm overflow-x-auto text-zinc-200">{renderSoloTab(solo.notes)}</pre>
                    <p className="text-xs text-zinc-600 mt-2">legend: h=hammer · p=pull · b=bend · /=slide up · \=slide down · ~=vibrato</p>
                  </div>
                  {solo.performance_tips && (
                    <div>
                      <label className="block text-xs uppercase tracking-widest text-zinc-500 mb-2">Performance Tips</label>
                      <ul className="space-y-1">
                        {solo.performance_tips.map((tip, i) => (
                          <li key={i} className="text-sm text-zinc-300 flex gap-2"><span style={{ color: "#00f5d4" }}>→</span> {tip}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {solo.notes.some((n) => n.comment) && (
                    <details className="text-sm">
                      <summary className="cursor-pointer text-zinc-400 hover:text-zinc-200">Note-by-note commentary</summary>
                      <div className="mt-2 space-y-1 font-mono text-xs">
                        {solo.notes.filter((n) => n.comment).map((n, i) => (
                          <div key={i} className="text-zinc-400"><span className="text-pink-400">bar {n.bar} · str{n.string} fret{n.fret} {n.technique}</span> — {n.comment}</div>
                        ))}
                      </div>
                    </details>
                  )}
                </div>
              )}
            </section>
          </>
        )}
        <footer className="text-center text-xs text-zinc-700 mt-12 pb-4">▓▒░ standard tuning · EADGBe ░▒▓</footer>
      </div>
    </div>
  );
}
