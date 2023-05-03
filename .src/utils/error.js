export function wrapCatch(func, target) {
  try {
    const res = func();
    console.log(`${target} has been created!`);
    return res;
  } catch (e) {
    console.log(`Error: while creating ${target}`);
    return console.log(e);
  }
}
