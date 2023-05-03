export function wrapCatch(func, target, type = "creat") {
  try {
    const res = func();
    console.log(`${target} has been ${type}ed!`);
    return res;
  } catch (e) {
    throw `Error: ${e.message}`;
  }
}
