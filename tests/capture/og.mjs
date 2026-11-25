// Renders the social card (site/og.html) to site/og.jpg at 1200x630.
// Serve the repo root, then: $env:BASE='http://127.0.0.1:4181/'; node tests/cdp.mjs tests/capture/og.mjs
export default async (p) => {
  await p.viewport(1200, 630);
  await p.goto('site/og.html');
  for (let i = 0; i < 40 && !(await p.eval(`document.documentElement.dataset.ready === '1'`)); i++) await p.sleep(150);
  await p.sleep(2200);
  const file = await p.shot('og.jpg', { format: 'jpeg', quality: 86, path: process.env.OUT || 'site/og.jpg' });
  p.expect(!!file, 'wrote ' + file);
};
