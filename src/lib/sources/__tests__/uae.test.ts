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
