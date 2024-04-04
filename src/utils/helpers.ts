const sleep = async (miliseconds: number) => {
  new Promise((resolve) => {
    console.log(new Date().toISOString(), `sleeping for ${miliseconds}ms`);
    setTimeout(resolve, miliseconds);
  });
  }

export { sleep }