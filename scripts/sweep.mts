/** Manual/cron sweep runner: `npm run sweep` */
import { sweep } from "../src/lib/ingest";
const r = await sweep();
console.log(JSON.stringify({ found: r.found, newGigs: r.newGigs, alerted: r.alerted, errors: r.errors }, null, 2));
