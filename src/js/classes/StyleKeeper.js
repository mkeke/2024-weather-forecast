import DOMKeeper from "./DOMKeeper.js";
import SVG from "./SVG.js";
import { conf } from "../conf.js";

const dom = new DOMKeeper();

export default class StyleKeeper {
  constructor() {

    // gather color variables defined in css :root
    this.colors = {};
    const comp = getComputedStyle(document.documentElement);
    [
      "background-color",
      "text-color",
      "wind-color",
    ].map(key => {
      this.colors[key] = comp.getPropertyValue(`--${key}`);
    });

  }

  /*
    set one-time css
  */
  setOnetimeStyle() {
    dom.onetime.innerHTML = `
      span.arrow {
        ${
          new SVG([
            `<path fill="none" stroke="${this.colors["wind-color"]}" stroke-width="8" `,
            'd="M50,95 v-90 l-20,20 M50,5 l20,20"',
            '/>'
          ]).toBgImage()
        }
      }
    `
  }

  /*
    set run-time css
  */
  setRuntimeStyle() {

  }
}
