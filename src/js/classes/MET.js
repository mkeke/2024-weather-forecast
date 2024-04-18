import { conf } from "../conf.js";
import { log } from "../util.js";

export default class MET {

  constructor(location, container) {
    this.location = location;
    this.container = container;
    this.latlon = `lat=${location.lat}&lon=${location.lon}`;
    // this.url = `https://api.met.no/weatherapi/locationforecast/2.0/complete?${this.latlon}`;
    this.url = `https://api.met.no/weatherapi/locationforecast/2.0/compact?${this.latlon}`;
    this.weather; // obj that will contain ts and data

    // log("url", this.url);
    container.innerHTML = "Loading " + location.label + "..";
    this.getWeatherData();
  }

  getWeatherData() {
    // get data from local storage, ex ["weatherDataSandefjord"]
    const lost = localStorage.getItem(conf.storageKey + this.location.label);

    if(lost === null) {
      // log("localStorage is null. creating empty object");
      // weather storage does not exist. Create empty (expired) object
      this.weather = { ts: 0, data: [] };
    } else {
      // log("localStorage exists");
      // weather storage exists. convert storage to object
      this.weather = JSON.parse(lost);
    }

    // fetch + update local storage if expired
    // check expiration
    if(this.hasExpired(this.weather.ts)) {
      log(`${this.location.label}: data expired`);
      // fetch new data
      fetch(this.url)
        .then(response => {
          return response.json();
        })
        .then(data => {
          this.weather = { ts: new Date().getTime(), data: data.properties.timeseries };
          localStorage.setItem(conf.storageKey+this.location.label, JSON.stringify(this.weather));
          log(`${this.location.label}: fetched new data`);
          this.handleDataReady();
        });
    } else {
      log(`${this.location.label}: data still valid`);
      this.handleDataReady();
    }
  }

  hasExpired(ts) {
    /*
      we want to refresh every hour
      if hour or larger quantities have changed then update
    */

    const then = new Date(ts);
    const now = new Date();

    return (
      then.getHours() !== now.getHours() || 
      then.getDate() !== now.getDate() || 
      then.getMonth() !== now.getMonth() ||
      then.getFullYear() !== now.getFullYear()
    );
  }

  handleDataReady() {

    this.era = {
      today: [],
      tomorrow: [],
    }

    let i = 0; // data pointer
    let today = new Date(this.weather.data[0].time);

    // get status chunks for the rest of today
    while (i < this.weather.data.length) {
      if(new Date(this.weather.data[i].time).getDate() === today.getDate()) {
        this.era.today.push(this.getDataChunk(this.weather.data[i]));
        i++
      } else {
        break;
      }
    }

    // get status tomorrow
    if (i < this.weather.data.length) {
      // log("tomorrow index", i);
      let tomorrow = new Date(this.weather.data[i].time);

      while (i < this.weather.data.length) {
        if(new Date(this.weather.data[i].time).getDate() === tomorrow.getDate()) {
          this.era.tomorrow.push(this.getDataChunk(this.weather.data[i]));
          i++;
        } else {
          break;
        }
      }
    }

    this.render();
  }

  // get interesting parameters for a single timeseries index
  getDataChunk(el) {
    const chunk = {
      // 2024-02-19T18:36:08Z
      time: new Date(el.time),

      air_temperature: el.data.instant.details.air_temperature,
      wind_speed: el.data.instant.details.wind_speed,
      wind_from_direction: el.data.instant.details.wind_from_direction,
    };

    // next_1_hours is not available from index 53
    if(el.data.next_1_hours !== undefined) {
      chunk.symbol_code_1 = el.data.next_1_hours.summary.symbol_code;
      chunk.precipitation_amount_1 = el.data.next_1_hours.details.precipitation_amount;
    }

    if(el.data.next_6_hours !== undefined) {
      chunk.symbol_code_6 = el.data.next_6_hours.summary.symbol_code;
      chunk.precipitation_amount_6 = el.data.next_6_hours.details.precipitation_amount;
    }

    if(el.data.next_12_hours !== undefined) {
      chunk.symbol_code_12 = el.data.next_12_hours.summary.symbol_code;
      chunk.precipitation_amount_12 = el.data.next_12_hours.details.precipitation_amount;
    }

    return chunk;
  }

  render() {

    this.container.innerHTML = `

      <h1>${this.location.label}</h1>

      ${this.renderDateHeading(new Date(this.era.today[0].time))}
      ${this.renderDay(this.era.today, "today")}

      ${this.renderDateHeading(new Date(this.era.tomorrow[0].time))}
      ${this.renderDay(this.era.tomorrow, "tomorrow")}

    `;
  }

  renderDateHeading(date) {
    return `<h2>${["søn","man","tirs","ons","tors","fre","lør"][date.getDay()]}dag
      ${date.getDate()}.
      ${["januar","februar","mars","april","mai","juni","juli","august","september","oktober","november","desember"][date.getMonth()]}
      ${date.getFullYear()}</h2>`;
  }

  renderDay(day, className) {
    // calculate if there is room to fill in more indexes from the start of the list
    const max = 8;  // max hour chunks to display
    const step = 3; // always show every 3rd chunk
    const reserved = Math.ceil(day.length/step);
    const fills = max - reserved;
    const gaps = Math.ceil(fills / (step-1));
    const maxFill = fills + gaps;

    return `<div class="day ${className}">${day.map((el,i) => i%step===0 || i<maxFill?`<p><span class="hour">${el.time.getHours()}</span><img class="icon" src="images/icons/png/${el.symbol_code_1}.png" /><span class="arrow" style="transform: rotate(${el.wind_from_direction}deg)"></span><span class="wind">${el.wind_speed}</span><span class="temperature ${el.air_temperature > 0 ? "plus":"minus"}">${el.air_temperature}&deg;</span>${el.precipitation_amount_1 > 0 ? `<span class="downfall">${el.precipitation_amount_1}<span class="smol">mm</span></span>` : ``}</p>`:'').join("")}</div>`;
  }
}