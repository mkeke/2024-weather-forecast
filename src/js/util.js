const log = console.log;

// zQuery <3
const z = selector => {
  const el = document.querySelectorAll(selector);
  if (el.length == 1) {
      return el[0];
  } else if (el.length == 0) {
      return false;
  } else {
      return el;
  }
}

export { log, z }