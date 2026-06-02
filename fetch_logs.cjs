const fs = require('fs');

async function main() {
  const r1 = await fetch('https://api.github.com/repos/rudrodeb029/Jxm-Tour-Club/actions/runs?per_page=1');
  const d1 = await r1.json();
  const r2 = await fetch(d1.workflow_runs[0].jobs_url);
  const d2 = await r2.json();
  const job = d2.jobs[0];
  const r3 = await fetch('https://api.github.com/repos/rudrodeb029/Jxm-Tour-Club/actions/jobs/' + job.id + '/logs');
  const text = await r3.text();
  fs.writeFileSync('logs.txt', text);
  console.log('Saved to logs.txt');
  console.log(text.split('\n').filter(l => l.includes('error TS')).join('\n'));
}

main().catch(console.error);
