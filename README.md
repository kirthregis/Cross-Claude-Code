# FSG Training Division — Operating Platform (Pilot)

A demonstration and pilot operational platform for **FSG (First Security Group) Training Division**, designed to manage course schedules, seat occupancy, financial reporting, margin costing, and certificates.

## Key Features & Structure
- **Reporting & Dashboard**:
  - Live revenue metrics (Billed this month vs last month, Waiting to be paid invoices)
  - Certificate issuance tracking & Live enquiry pipeline
  - Monthly billing charts and bookings by status (`provisional`, `confirmed`, `delivered`)
- **Bookings & Seat Occupancy**:
  - Course capacity monitoring (`BK-2026-001` to `BK-2026-004`)
  - Color-coded fill-rate progress bars (Green for $\ge 90\%$ occupancy)
  - Interactive "Add New Booking" modal to test scheduling and real-time margin calculation
- **Costing & Profitability ("What each delivered course kept, roughly")**:
  - Costing rules applied automatically:
    - **Crew Cost**: `AED 2,225.00` per day
    - **Feeding Cost**: `AED 90.00` per student per day
    - **Fireground Cost**: `AED 1,100.00` per fireground day
  - Built-in **Course Margin Simulator**: interactively model new course fees, durations, and seat counts to project net margins.
- **Certificate Register**:
  - Verification table of issued unique register numbers (`FSG-CERT-2026-0101` – `0106`).
- **Live Enquiries Pipeline**:
  - Active proposals and quotes (`ENQ-2026-101` – `102`) with estimated AED values.

## Running the Application
Simply open `index.html` in any web browser. It runs seamlessly as a standalone React 18 single-page application styled with Tailwind CSS.
