/* LT175: read the official PoGoCoordinates Rare Candy search UI only.
 * No external API, no token extraction, no bypass of logged-in result caps.
 * Invoked only on https://pogocoordinates.com/search.
 */
(function () {
  "use strict";
  const coordRe = /^(-?\d{1,2}\.\d+)\s*,\s*(-?\d{1,3}\.\d+)$/;
  function buttons() {
    return [...document.querySelectorAll("button,[role=button]")];
  }
  function exactButton(label) {
    return buttons().find(b =>
      (b.textContent || "").replace(/\s+/g, " ").trim().toLowerCase() === label);
  }
  function runSearch(coords, radius) {
    if (!location.hostname.endsWith("pogocoordinates.com") ||
        !location.pathname.startsWith("/search")) return "wrong-origin";
    const tab = exactButton("rare candy");
    if (tab && !tab.getAttribute("aria-selected")?.includes("true")) tab.click();
    const scope = [...document.querySelectorAll("section,form,div")].find(el => {
      const t = (el.innerText || "").slice(0, 450);
      return t.includes("Location") && /Search/.test(t) &&
          el.querySelectorAll("input").length >= 2 &&
          el.querySelectorAll("input").length <= 4;
    });
    const inputs = (scope || document).querySelectorAll("input");
    const loc = [...inputs].find(el =>
      (el.placeholder || "").toLowerCase().includes("coord") ||
      (el.value || "").trim().match(coordRe)) || inputs[0];
    const km = [...inputs].find(el =>
      el !== loc && (el.placeholder || "").toLowerCase().includes("radius")) ||
      [...inputs].find(el => el !== loc && /^(?:1000|[1-9]\d{0,3})$/.test(el.value || ""));
    function input(el, value) {
      if (!el) return;
      const proto = el instanceof HTMLTextAreaElement ?
        HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
      Object.getOwnPropertyDescriptor(proto, "value").set.call(el, value);
      el.dispatchEvent(new Event("input", { bubbles: true }));
      el.dispatchEvent(new Event("change", { bubbles: true }));
    }
    if (coords && coordRe.test(coords)) input(loc, coords);
    if (km) input(km, String(radius));
    const search = exactButton("search");
    if (search && !search.disabled) { search.click(); return "submitted"; }
    return "not-ready";
  }
  function read() {
    if (!location.hostname.endsWith("pogocoordinates.com") ||
        !location.pathname.startsWith("/search")) return JSON.stringify({ok:false, reason:"wrong-origin"});
    const entries = [];
    const seen = new Set();
    const nodes = [...document.querySelectorAll("button, a, p, span, div")];
    for (const node of nodes) {
      const text = (node.innerText || node.textContent || "").trim();
      if (text.length > 85) continue;
      const match = text.match(coordRe);
      if (!match) continue;
      const lat = Number(match[1]), lng = Number(match[2]);
      if (!(lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180)) continue;
      const point = lat.toFixed(6) + "," + lng.toFixed(6);
      if (seen.has(point)) continue;
      let card = node;
      for (let step = 0; step < 9 && card.parentElement; step++) {
        const value = card.innerText || "";
        if (/rare candy/i.test(value) && /despawn/i.test(value) &&
            value.length < 1000) break;
        card = card.parentElement;
      }
      const info = (card.innerText || "").replace(/\r/g, "");
      if (!/rare candy/i.test(info) || !/despawn/i.test(info) ||
          info.length > 1200) continue;
      const time = info.match(/despawns?\s*in\s*:?\s*(\d{1,2}):(\d{2})/i);
      const loc = info.match(/location\s*:?\s*\n\s*([^\n]+)/i);
      const distance = info.match(/(\d+(?:[.,]\d+)?)\s*(km|m)\s*away/i);
      const seconds = time ? Math.min(3600, Number(time[1])*60+Number(time[2])) : -1;
      seen.add(point);
      entries.push({
        coords: match[1] + "," + match[2],
        location: loc ? loc[1].trim().slice(0, 110) : "",
        seconds: seconds,
        distance: distance ? distance[1].replace(",",".")+" "+distance[2] : ""
      });
      if (entries.length >= 10) break;
    }
    const text = document.body ? (document.body.innerText || "") : "";
    return JSON.stringify({ok:true, ready:/rare candy search/i.test(text),
      count: entries.length, items:entries});
  }
  window.PokeSearchCandy = { runSearch, read };
})();