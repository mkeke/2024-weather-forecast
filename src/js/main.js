import { z, log } from "./util.js";
import { conf } from "./conf.js";
import StyleKeeper from "./classes/StyleKeeper.js";
import DOMKeeper from "./classes/DOMKeeper.js";
import MET from "./classes/MET.js";

// javascript modules are loaded and executed after DOM is completely loaded
// no need for event listener on DOMContentLoaded

const dom = new DOMKeeper();
const style = new StyleKeeper();

const domReady = cb => {
  document.readyState !== "loading" ?
      cb() : document.addEventListener("DOMContentLoaded", cb);
}

domReady(() => {
  style.setOnetimeStyle();

  // localStorage.clear();

  // add sections for each location
  for(const loc of conf.locations) {
    const section = document.createElement("section");
    section.innerHTML = loc.label;

    // populate section with weather data
    new MET(loc, section);

    // add section to page
    dom.layout.appendChild(section);

    // add section to DOM object for later reference
    dom.locations[loc.label] = section;
  }

  /*
    old iOS web apps added to home screen are not completely refreshed.
    (only changes to the index.html is detected, other files are kept)
    Applying a quick fix to force evaluating the expiry time in localStorage
    once every minute. Not too elegant but it works.
  */
  setInterval(()=>{
    conf.locations.map(loc => {
      new MET(loc, dom.locations[loc.label])
    });
  }, 60000);
});

