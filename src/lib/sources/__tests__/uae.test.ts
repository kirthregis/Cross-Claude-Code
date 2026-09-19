import { describe, it, expect, vi, afterEach } from "vitest";
import { fetchUAELeads } from "../uae";

const ROW_TEMPLATE = (title: string, employer: string, href: string) => `
<tr bgcolor='#FFFFFF'>
<td class=" " nowrap>
<b><span class="job_list_title">
<a class="job_list_title" href="${href}" >${title}</a>
</span>
<br><span class="job_list_small_print">
<b>Job Posted By:</b>
<a href="https://careersingulf.com/profile/1"><i>${employer}</i></a>
</span>
</b></td>
</tr>`;

function mockPage(rows: string): string {
  return `<table class="list">${rows}</table>`;
}

describe("fetchUAELeads (CareersInGulf adapter)", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("keeps a real resident DJ listing", async () => {
    const html = mockPage(ROW_TEMPLATE("Resident DJ - Entertainment &amp; Events", "W Dubai", "https://careersingulf.com/job/1"));
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, text: async () => html }));
    const leads = await fetchUAELeads();
    expect(leads).toHaveLength(2); // same row matched from both category pages fetched
    expect(leads[0].title).toBe("Resident DJ - Entertainment & Events");
    expect(leads[0].sourceUrl).toBe("https://careersingulf.com/job/1");
    expect(leads[0].body).toContain("W Dubai");
  });

  it("drops unrelated corporate roles even when the employer name contains 'Entertainment'", async () => {
    const html = mockPage(
      ROW_TEMPLATE("Cinema Service Engineer", "Majid Al Futtaim Entertainment", "https://careersingulf.com/job/2") +
      ROW_TEMPLATE("Director of Technical Facilities", "Majid Al Futtaim Entertainment", "https://careersingulf.com/job/3")
    );
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, text: async () => html }));
    const leads = await fetchUAELeads();
    expect(leads).toHaveLength(0);
  });

  it("returns nothing (not fake data) when the source is unreachable", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false }));
    expect(await fetchUAELeads()).toEqual([]);
  });
});

const COCONUT_LISTING = (venue: string, url: string, pay: string, location: string, status: "open" | "closed") => `
<a href="${url}"><strong>${venue}</strong></a><br /><small>Posted 1 month ago | 5 members applied</small><br/>Hiring 1 Full Time&nbsp;<strong>DJ</strong>, to work in <strong>${location}</strong>. The pay is <strong>${pay}</strong>&nbsp;per Month. Contract period is 3 Months.</p>
${status === "open"
  ? `<a href="${url}" class="btn btn-xs btn-primary">Apply now</a>`
  : `<a href="${url}">View Job</a>&nbsp;<span class="btn btn-danger btn-xs">Closed</span>`}
`;

describe("fetchUAELeads (Coconut Jobs adapter)", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("keeps an open listing with pay, location and a real apply link", async () => {
    const html = COCONUT_LISTING("Nammos Dubai", "https://www.coconutjobs.com/job/nammos", "$4000", "Dubai, United Arab Emirates", "open");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, text: async () => html }));
    const leads = await fetchUAELeads();
    expect(leads).toHaveLength(1);
    expect(leads[0].title).toBe("DJ — Nammos Dubai");
    expect(leads[0].sourceUrl).toBe("https://www.coconutjobs.com/job/nammos");
    expect(leads[0].body).toContain("$4000");
    expect(leads[0].body).not.toMatch(/&nbsp;|<strong>/); // decoded and tag-stripped, not raw HTML
  });

  it("drops a closed listing — a DJ chasing it would be applying to a filled role", async () => {
    const html = COCONUT_LISTING("Old Venue", "https://www.coconutjobs.com/job/old", "$1000", "Muscat, Oman", "closed");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, text: async () => html }));
    expect(await fetchUAELeads()).toHaveLength(0);
  });
});
