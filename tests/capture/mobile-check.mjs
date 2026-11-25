// Phone screenshots of every example, for a visual check. Not part of tests/run.mjs.
export default async (p) => {
  await p.viewport(390, 844, true);
  for (const name of ['wet-ink-save', 'ember-delete', 'frost-privacy', 'marble-choice', 'vapor-suggest', 'paper-export']) {
    await p.goto(`skills/stringless/assets/examples/${name}.html`);
    await p.sleep(400);
    const overflow = await p.eval(`document.documentElement.scrollWidth - document.documentElement.clientWidth`);
    p.expect(overflow <= 0, `${name}: no horizontal scroll (${overflow}px)`);
    await p.shot(`mobile-${name}`);
  }
};
