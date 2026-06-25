async function check() {
  const urls = [
    'http://127.0.0.1:55659/src/labs/facecap/FacecapLab.tsx',
    'http://127.0.0.1:55659/src/labs/facecap/engine.js',
    'http://127.0.0.1:55659/src/labs/facecap/local/FacecapModel.js'
  ];
  for (const url of urls) {
    try {
      const res = await fetch(url);
      const text = await res.text();
      if (!res.ok || text.includes('Error: ')) {
        console.log(`Failed at ${url}: Status ${res.status}`);
        console.log(text.substring(0, 1000));
      } else {
        console.log(`OK: ${url}`);
      }
    } catch(err) {
      console.log(`Fetch err: ${err}`);
    }
  }
}
check();
