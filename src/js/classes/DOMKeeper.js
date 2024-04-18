import {log, z} from "../util.js";

/*
  DOM Keeper
  Holds all DOM references in one place
*/
export default class DOMKeeper {
  constructor() {
    this.onetime = z("style.onetime");
    this.runtime = z("style.runtime");
    this.layout = z(".layout");

    this.locations = {};
  }
}