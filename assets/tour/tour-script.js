(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.TOUR_SCRIPT = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const HB = 'AIP Handbook, FAA Order 5100.38D, Change 1';
  const HB_ED = 'Change 1 edition, checked 2026-07-16';
  const GA = 'FAA Grant Assurances, airport sponsors, April 2025 set';
  const GA_ED = 'April 2025 set; confirm against the assurances in the grant offer for this project';

  const citations = {
    m1d: {
      label: 'Handbook · Table M-1 (d)', source: HB, ref: 'Appendix M, Table M-1, row d: Acquire Snow Removal Equipment',
      gist: 'At a Part 139 airport, equipment that clears snow and ice from runways, principal taxiways, aprons and emergency access roads may be eligible. It is justified against the current versions of the two advisory circulars the Handbook names (AC 150/5220-20A and AC 150/5200-30D in TarmacSync’s advisory circular registry) and the airport’s Snow and Ice Control Plan. The number of eligible pieces is limited to the minimum those documents recommend unless the ADO accepts a showing that traffic volume requires more, and the sponsor gives the ADO a current FAA Form 5100-141. A multi-task unit counts as two pieces.',
      edition: HB_ED, checked: '2026-07-16',
    },
    l2i: {
      label: 'Handbook · Table L-2 (i)', source: HB, ref: 'Appendix L, Table L-2, row i (§L-9); Table C-3, item 43',
      gist: 'A power vacuum sweeper for the control of foreign object debris may be eligible, limited by FAA policy: one power sweeper where the primary areas are under 500,000 square yards and annual operations are 40,000 or fewer, and two where primary areas are 500,000 square yards or more or annual operations exceed 40,000. Towed FOD sweepers are not considered eligible power sweepers.',
      edition: HB_ED, checked: '2026-07-16',
    },
    t33: {
      label: 'Handbook · Table 3-3', source: HB, ref: 'Chapter 3, Table 3-3, row d',
      gist: 'Sweeping airfield pavement as an activity is listed as maintenance and is not eligible at any airport. This concerns the work itself, not the purchase of equipment the Handbook treats as eligible.',
      edition: HB_ED, checked: '2026-07-16',
    },
    c3: {
      label: 'Handbook · Table C-3', source: HB, ref: 'Appendix C, Table C-3, item 39',
      gist: 'Snow removal equipment cannot be sized or given extra functionality to clear areas that are not priority 1 areas, such as parking lots or space between hangars.',
      edition: HB_ED, checked: '2026-07-16',
    },
    s312: {
      label: 'Handbook · §3-12', source: HB, ref: 'Chapter 3, §3-12: Useful Life Test for Equipment and Facilities',
      gist: 'The useful life of equipment being replaced must have been met for the project to be funded, unless the ADO determines the replacement is necessary for safety reasons.',
      edition: HB_ED, checked: '2026-07-16',
    },
    t47: {
      label: 'Handbook · Table 4-7', source: HB, ref: 'Chapter 4, §4-9, Table 4-7 (rows c and d, small hub and nonhub primary)',
      gist: 'The normal federal share for a small hub is 90% of allowable project costs. The Handbook’s older temporary 95% increase expired. Exceptions include public-land-state adjustments and a 95% share for smaller airports that receive Essential Air Service and sit in economically distressed areas. Since this Handbook edition, the FAA Reauthorization Act of 2024 added a temporary 95% share for nonhub and nonprimary airports in fiscal years 2025 and 2026; small hubs stay at 90%.',
      edition: HB_ED + '; statute checked against 49 USC 47109 on 2026-09-30', checked: '2026-09-30',
    },
    t54: {
      label: 'Handbook · Table 5-4', source: HB, ref: 'Chapter 5, §5-4 Table 5-4 (key steps) and §5-19 Table 5-6 (application contents)',
      gist: 'Among the common key steps the table lists are notice of intent to use entitlement funds, advertisement for bids, opening of bids, submission of the grant application, acceptance of the grant offer and award of the contract. The list also includes earlier steps such as environmental review documents, final specifications and a DBE plan. It is FAA policy that the application incorporates actual bid or negotiated agreement amounts; an application built on estimates is possible but described as suboptimal. Early indications from the ADO are for planning only, and whether and when to start is the sponsor’s decision.',
      edition: HB_ED, checked: '2026-09-30',
    },
    t360: {
      label: 'Handbook · Table 3-60', source: HB, ref: 'Chapter 3, §3-100 and Table 3-60 (rows a and b)',
      gist: 'Unless the law specifically allows it, project costs must be incurred after the grant is executed (49 USC 47110(b)(2)). Costs paid with passenger, cargo or nonprimary entitlement funds may be reimbursed even if incurred before the grant is executed, as long as all other applicable AIP requirements have been met. For discretionary and state apportionment funds the exceptions are narrow and statutory.',
      edition: HB_ED + '; statute confirmed against 49 USC 47110(b)(2) on 2026-09-30', checked: '2026-09-30',
    },
    s3105: {
      label: 'Handbook · §3-105', source: HB, ref: 'Chapter 3, §3-105: Allowable Federal Share Requirement',
      gist: 'Total allowable federal costs cannot exceed the maximum federal cost stated in the grant agreement, except as the amendment rules allow.',
      edition: HB_ED, checked: '2026-07-16',
    },
    u21: {
      label: '2 CFR 200.324', source: '2 CFR Part 200 (current eCFR), as reproduced in the ' + HB, ref: 'Contract cost and price. The Handbook edition reproduces this as 2 CFR 200.323 (Appendix U, U-21); the current eCFR numbers it 200.324',
      gist: 'The recipient must make independent estimates before receiving bids or proposals, and must perform a cost or price analysis for procurements above the simplified acquisition threshold.',
      edition: HB_ED + '; section number updated to the current eCFR (200.324), confirmed 2026-09-30', checked: '2026-09-30',
    },
    u3: {
      label: 'Handbook · Table U-3', source: HB, ref: 'Appendix U, Table U-3, item 7',
      gist: 'Sponsors must have written protest procedures in place before starting a procurement funded with AIP. The procedures define how protests are handled and resolved, and information about a protest is disclosed to the ADO.',
      edition: HB_ED, checked: '2026-07-16',
    },
    u15: {
      label: '2 CFR 200.320', source: '2 CFR Part 200 (current eCFR), as reproduced in the ' + HB, ref: 'Sealed bids (formal advertising); Handbook Appendix U, U-15',
      gist: 'Bids are publicly solicited and a firm fixed price contract is awarded in writing to the lowest responsive and responsible bidder. The recipient must document and justify any bid it rejects. Sealed bidding works when there is a complete, adequate and realistic specification, two or more responsible bidders are willing and able to compete, and selection can be made principally on price. Bids are publicly opened at the time and place in the invitation.',
      edition: HB_ED + '; current eCFR places these at 200.320(b)(1)(ii)(D) and (E), confirmed 2026-09-30 (the Handbook edition reproduces older lettering)', checked: '2026-09-30',
    },
    u8: {
      label: 'Handbook · Table U-8', source: HB, ref: 'Appendix U, Table U-8 (clarifications of sealed bidding), items 2, 5 to 7',
      gist: 'If the procurement is expected to exceed the simplified acquisition threshold, the sponsor must notify the ADO in writing before award when the award will be made without competition, only one bid is received, or the award will go to other than the apparent low bidder. The apparent low bidder is simply the lowest-priced bid, before any finding on responsiveness or responsibility. A responsible bidder can perform successfully, considering integrity, compliance with public policy, past performance and financial and technical resources. Bid documents must state how the successful bid will be determined, which may include bid alternates and availability of federal funding; with alternates, the solicitation must set the base bid and the order of alternates based on available funding.',
      edition: HB_ED, checked: '2026-09-30',
    },
    u10a: {
      label: '2 CFR 200.318(a)', source: '2 CFR Part 200 (current eCFR), as reproduced in the ' + HB, ref: 'General procurement standards, paragraph (a); Handbook Appendix U, U-10',
      gist: 'The recipient must maintain and use documented procurement procedures that align with State, local and tribal laws and regulations and the federal standards. The Handbook edition adds that the procurements must conform to applicable Federal law. In practice the airport follows both its own state and local rules and the federal ones.',
      edition: HB_ED + '; current eCFR wording confirmed 2026-10-01', checked: '2026-10-01',
    },
    u24: {
      label: '2 CFR 200.327', source: '2 CFR Part 200 (current eCFR), as reproduced in the ' + HB, ref: 'Contract provisions and Appendix II. The Handbook edition reproduces this as 2 CFR 200.326 (Appendix U, U-24); the current eCFR numbers it 200.327, confirmed 2026-09-30',
      gist: 'The sponsor’s contracts must contain the applicable provisions in Appendix II to Part 200, in addition to other provisions the federal agency requires. For AIP, that means the FAA’s required contract provisions go into the bid package.',
      edition: HB_ED, checked: '2026-09-30',
    },
    t367: {
      label: 'Handbook · Table 3-67', source: HB, ref: 'Chapter 3, §3-101, Table 3-67, rows b and c',
      gist: 'For equipment bought with adequate competition (two or more sealed bids), the cost-reasonableness file includes a price analysis above the simplified acquisition threshold, an engineer’s estimate, a signed sponsor statement that the cost is reasonable and that a price analysis was performed, and bid tabulations. Without adequate competition, such as a single bidder, the sponsor performs a cost analysis and submits the engineer’s estimate, a signed statement recommending the FAA accept it, and the bid tabulation.',
      edition: HB_ED, checked: '2026-07-16',
    },
    x1: {
      label: 'Handbook · Table X-1', source: HB, ref: 'Appendix X: X-1, X-3, X-4, Table X-1, Table X-2; §3-47',
      gist: 'Under 49 USC 50101 the sponsor must do one of three things: certify that all products are wholly produced in the United States, certify that the equipment is on the Nationwide Buy American conformance list, or request a waiver. For a single unit such as a snow plow, the vehicle itself is the equipment. Type III waivers, based on final assembly and content percentage, are delegated to the ADO. A change order needs its own review.',
      edition: HB_ED, checked: '2026-07-16',
    },
    sat: {
      label: 'Federal thresholds', source: 'TarmacSync source registry (2 CFR Part 200 and FAR thresholds)', ref: 'Simplified acquisition ceiling and micro-purchase threshold',
      gist: 'The current federal simplified acquisition ceiling is $350,000 and the micro-purchase threshold is $15,000. The Handbook edition on file still shows $150,000 for the simplified acquisition threshold, so TarmacSync uses the current figure and flags the difference. A recipient may adopt a lower threshold, and the airport’s own $100,000 policy threshold is lower.',
      edition: 'Registry values verified 2026-07-13; Handbook Change 1 edition figure is out of date', checked: '2026-07-13',
    },
    t332: {
      label: 'Handbook · Table 3-32', source: HB, ref: 'Chapter 3, §3-51, Table 3-32',
      gist: 'The ADO has the option to conduct a pre-award review in situations such as a procurement expected to exceed the simplified acquisition threshold that is awarded without competition, receives only one bid, or specifies a brand-name product.',
      edition: HB_ED, checked: '2026-07-16',
    },
    t328: {
      label: 'Handbook · Table 3-28', source: HB, ref: 'Chapter 3, §3-40, Table 3-28',
      gist: 'Specifying snow removal equipment built to highway-vehicle standards is an example of a requirement that may reduce the number of potential bidders.',
      edition: HB_ED, checked: '2026-07-16',
    },
    s567: {
      label: 'Handbook · §5-67', source: HB, ref: 'Chapter 5, §5-67 and Table 5-38',
      gist: 'Disposing of AIP-funded equipment that is being replaced follows Table 5-38. Fair market value is found by advertising the equipment or using an accredited appraiser. Advertising is allowed; soliciting specific buyers is not.',
      edition: HB_ED, checked: '2026-07-16',
    },
    ga1: { label: 'Grant Assurance 1', source: GA, ref: 'Assurance 1: General Federal Requirements', gist: 'Incorporates applicable federal statutes, executive orders and regulations into the grant agreement.', edition: GA_ED, checked: '2026-07-13' },
    ga3: { label: 'Grant Assurance 3', source: GA, ref: 'Assurance 3: Sponsor Fund Availability', gist: 'Requires sufficient non-federal project funds and funds to operate and maintain the funded item.', edition: GA_ED, checked: '2026-07-13' },
    ga13: { label: 'Grant Assurance 13', source: GA, ref: 'Assurance 13: Accounting System, Audit, and Record Keeping Requirements', gist: 'Requires project accounts and records, audit access, and required audit submissions.', edition: GA_ED, checked: '2026-07-13' },
    ga19: { label: 'Grant Assurance 19', source: GA, ref: 'Assurance 19: Operation and Maintenance', gist: 'Requires safe, serviceable operation and maintenance of the airport and necessary aeronautical facilities.', edition: GA_ED, checked: '2026-07-13' },
    ga30: { label: 'Grant Assurance 30', source: GA, ref: 'Assurance 30: Civil Rights', gist: 'Requires nondiscrimination measures, solicitation notice and contract provisions described in the assurance.', edition: GA_ED, checked: '2026-07-13' },
    ga33: { label: 'Grant Assurance 33', source: GA, ref: 'Assurance 33: Foreign Market Restrictions', gist: 'Restricts use of grant funds for products or services from countries listed by USTR as denying fair and equitable procurement market opportunities.', edition: GA_ED, checked: '2026-07-13' },
    ga34: { label: 'Grant Assurance 34', source: GA, ref: 'Assurance 34: Policies, Standards, and Specifications', gist: 'Requires AIP projects to follow FAA policies, standards and specifications, including the current advisory circulars as of the project application date.', edition: GA_ED, checked: '2026-07-13' },
  };

  // Rendered as a table under the "route" reply. Steps and order follow AIP Handbook Table 5-4.
  const tables = {
    sequence: {
      caption: 'Common key steps from notice of intent to award',
      note: 'Selected steps from AIP Handbook Table 5-4, in the order the Handbook lists them. The table also lists earlier steps such as environmental review documents, final specifications and a DBE plan. It is not a mandated sequence; confirm your schedule with your ADO.',
      columns: ['Step', 'What happens', 'What it needs'],
      rows: [
        ['1', 'Notice of intent to use entitlement funds', 'If entitlement funds are used: by the deadline in the annual Federal Register notice'],
        ['2', 'Advertise for bids', 'Specification, required federal contract provisions, Buy American certificate'],
        ['3', 'Open bids', 'Public opening and bid tabulation; confirm the low bidder is responsive and responsible'],
        ['4', 'Submit the grant application', 'Actual bid amount, cost-reasonableness file, local-share source'],
        ['5', 'Accept the grant offer', 'The grant agreement sets the federal maximum'],
        ['6', 'Award the contract', 'To the lowest responsive and responsible bidder'],
      ],
    },
  };

  const draftNote = 'Review draft for a fictional airport. Not a purchase authorization.';

  const artifacts = {
    memo: {
      title: 'Route memo', sub: 'Runway broom replacement · Northfield Regional Airport (fictional) · Draft for procurement and grants review',
      sources: ['u15', 'u10a', 'u8', 't47', 's3105', 't360', 't54', 'ga1', 'ga3', 'ga13', 'ga19', 'ga30', 'ga33', 'ga34'],
      sections: [
        { h: 'What the airport told us', items: [
          'Replacing a 2009 runway broom with about 4,100 hours, for snow and ice control.',
          'Planning allowance of $650,000. This is an allowance, not an independent estimate or a vendor price.',
          'AIP funding is planned and the airport has not yet applied for the grant. Local match is not yet set.',
          'Small hub, 14 CFR Part 139 airport. Local policy requires formal competition above $100,000.',
          'State public-bidding law and local policy apply alongside the federal rules (2 CFR 200.318(a)); the state statute is not in this file and needs confirming.'] },
        { h: 'What the documents show', items: [
          'Capital plan line: $610,000. This differs from the $650,000 allowance and needs to be reconciled.',
          'The Snow and Ice Control Plan lists runway broom equipment. Count and specification still need to be checked against the advisory circulars.',
          'The FAA Form 5100-141 on file is dated March 2024. A current inventory will be needed.'] },
        { h: 'Likely buying path', items: [
          'Sealed competitive bids (2 CFR 200.320), with a specification written to the Snow and Ice Control Plan and the current FAA advisory circulars.',
          'Award in writing to the lowest responsive and responsible bidder.',
          'Common key steps (Handbook Table 5-4): notice of intent to use entitlements, advertise, open bids, submit the grant application with actual bid amounts, accept the grant offer, award.'] },
        { h: 'What would change the plan', items: [
          'Only one bid received: a cost analysis instead of a price analysis, and written notice to the ADO before award.',
          'Award to other than the apparent low bidder: written notice to the ADO before award.',
          'Bids above the $610,000 capital plan line: fund the gap locally, reject all bids with a documented reason and re-bid, or use funding-ordered bid alternates set up in the solicitation. Settle this with the ADO before advertising.'] },
        { h: 'Funding', items: [
          'A small hub’s normal federal share is 90% of allowable costs, unless an exception applies.',
          'Illustration only: if the whole $650,000 were allowable, that would be up to $585,000 federal and about $65,000 local. The ADO decides allowable costs and the grant agreement sets the maximum.',
          'Local match and the funds to operate and maintain the unit need to be identified.',
          'Timing: AIP generally reimburses only costs incurred after the grant is executed; entitlement funds are the main exception. Which funds pay decides whether the airport could commit before the grant and still be reimbursed.',
          'Planning figures come from the capital plan; the application itself should carry actual bid or negotiated amounts.'] },
        { h: 'Grant Assurances that may be implicated', items: [
          'Numbering follows the April 2025 set. Confirm against the assurances in the grant offer for this project.',
          '1 General Federal Requirements: brings in 2 CFR Part 200 and required contract provisions.',
          '3 Sponsor Fund Availability: local match, and funds to operate and maintain the unit.',
          '13 Accounting, Audit, and Record Keeping: a file that traces funds, decisions and costs.',
          '19 Operation and Maintenance: safe, serviceable winter operations are the reason for the unit.',
          '30 Civil Rights: current FAA-required solicitation and contract language.',
          '33 Foreign Market Restrictions: check the origin of the equipment against current restrictions.',
          '34 Policies, Standards, and Specifications: fix the FAA standards, including advisory circular editions, that apply at application.',
          '37 Disadvantaged Business Enterprises: confirm the sponsor’s DBE program and whether this contract carries a goal or a race-neutral approach.'] },
        { h: 'Not decided', items: [
          'No vendor is selected, no award is made and no funds are obligated. Everything here needs validation with the ADO, the grants administrator and airport counsel.',
          draftNote] },
      ],
    },
    checklist: {
      title: 'Pre-solicitation readiness checklist', sub: 'Evidence file for the runway broom replacement · Northfield Regional Airport (fictional)',
      sources: ['m1d', 'c3', 's312', 'u21', 'u3', 'u15', 'u10a', 'u24', 'u8', 't328', 't360', 't54', 'x1', 's567', 'ga30', 'ga33'],
      sections: [
        { h: 'Eligibility file', items: [
          'Current FAA Form 5100-141 inventory (on file: March 2024).',
          'Snow and Ice Control Plan and the number and type of pieces, checked against AC 150/5220-20A and AC 150/5200-30D.',
          'Useful-life documentation for the 2009 unit: age, about 4,100 hours, condition.',
          'Number of pieces limited to the minimum the advisory circulars recommend, unless the ADO accepts a traffic-volume justification for more.',
          'Nothing in the specification sized for areas that are not priority 1 areas.'] },
        { h: 'Competition and cost', items: [
          'Independent (engineer’s) estimate, made before bids are received.',
          'Bid validity period long enough to cover the grant application and offer, and a statement that award is subject to the availability of federal funding.',
          'Written protest procedures in place before the solicitation starts.',
          'Specification complete and realistic, and reviewed for requirements that could narrow the bidder pool, such as highway-vehicle standards.',
          'Required federal contract provisions in the bid package (2 CFR 200.327).',
          'If bid alternates are used, the basis for award stated in the solicitation.',
          'Your state public-bidding law and local policy reflected in the bid package (for example advertising, bid security and governing-body approval), confirmed with your procurement office or counsel.',
          'How bids above the $610,000 capital plan line would be funded, settled before advertising.'] },
        { h: 'Buy American', items: [
          'Include the Buy American provision and certificate in the solicitation.',
          'Choose the path: certify 100% U.S. production, use a unit on the Nationwide conformance list, or request a waiver.',
          'If a waiver is needed, plan for the ADO’s Type III review (final assembly and content percentage).'] },
        { h: 'Funding and records', items: [
          'Reconcile the $610,000 capital plan line with the $650,000 allowance.',
          'Confirm which AIP funds (entitlement or discretionary) pay for this, and whether any cost committed before the grant could be reimbursed.',
          'Bid tabulation, price or cost analysis and the local-share source ready for the grant application, which should carry actual bid or negotiated amounts.',
          'Local match and operating funds identified.',
          'Grant file that traces funds, decisions and costs.',
          'Plan to dispose of the 2009 unit: advertise the sale, do not solicit specific buyers.'] },
        { h: 'Contract provisions', items: [
          'The FAA’s current required contract provisions, including civil rights language.',
          'Origin check against current foreign market restrictions.',
          draftNote] },
      ],
    },
    ado: {
      title: 'Questions for the ADO', sub: 'Focused set for the runway broom replacement · Northfield Regional Airport (fictional)',
      sources: ['m1d', 's312', 'u8', 'x1', 't47', 't360', 't54'],
      sections: [
        { h: 'Eligibility', items: [
          'Please confirm the current Form 5100-141 you want on file and any updates to the March 2024 version.',
          'Does the ADO agree that the count and type of pieces for this replacement follow the two advisory circulars and our Snow and Ice Control Plan, or is more detail needed?',
          'For the 2009 unit, what useful-life documentation do you want: age and hours, condition, or both?'] },
        { h: 'Procurement', items: [
          'Do you want to review the specification or bid package before we advertise?',
          'If only one bid is received, or we award to other than the apparent low bidder, what do you want in our written notice?',
          'Are units in this equipment class on the Nationwide Buy American conformance list? If a waiver is needed, which type do you expect?'] },
        { h: 'Funding and timing', items: [
          'Is this project in our ACIP submission, and in which fiscal year? Which AIP funds, entitlement or discretionary, do you expect, and when is our notice of intent to use entitlements due?',
          'If entitlement funds are used and we place an order or sign a contract before the grant is executed, what would you need to see for those costs to remain reimbursable?',
          draftNote] },
      ],
    },
    bideval: {
      title: 'Bid evaluation and grant application checklist', sub: 'After bid opening · Northfield Regional Airport (fictional)',
      sources: ['u15', 'u8', 'sat', 't367', 't332', 't54', 's3105', 'x1', 'ga3'],
      sections: [
        { h: 'Evaluate the bids', items: [
          'Bid tabulation for every bid received.',
          'Confirm the low bid conforms to the material terms of the invitation for bids (responsive).',
          'Confirm the low bidder can perform: integrity, past performance, financial and technical resources (responsible).',
          'Buy American certificate submitted and consistent with the chosen path.',
          'Document the reason for any bid that is rejected.'] },
        { h: 'Cost reasonableness', items: [
          'Two or more bids: price analysis, engineer’s estimate, a signed sponsor statement that the cost is reasonable and that a price analysis was performed, and the bid tabulation.',
          'Only one bid: cost analysis against the engineer’s estimate, a signed statement recommending the FAA accept it, and the bid tabulation.'] },
        { h: 'Notify the ADO before award', items: [
          'Above the federal simplified acquisition threshold, notify the ADO in writing before award if only one bid was received, the award goes to other than the apparent low bidder, or there was no competition. This includes rejecting the lowest-priced bid as nonresponsive or its bidder as not responsible. The ADO may choose to review before award.'] },
        { h: 'Grant application', items: [
          'Actual bid amount, the cost-reasonableness file and the source of the local share.',
          'If the low bid is above the $610,000 capital plan line: confirm with the ADO how much AIP funding is available, then fund the gap locally or reject all bids with a documented reason.',
          'Planned sequence: submit the application, accept the grant offer, then award the contract (Handbook Table 5-4).',
          draftNote] },
      ],
    },
  };

  // The same five stages, in the same words, as "How TarmacSync works" on the homepage.
  // A test compares these against index.html so the two cannot drift apart.
  const stages = [
    { key: 'START', label: 'Describe the need' },
    { key: 'UNDERSTAND', label: 'Apply context' },
    { key: 'ROUTE', label: 'Find the path' },
    { key: 'CHECK', label: 'Validate the route' },
    { key: 'READY', label: 'Build the record' },
  ];

  const beats = [
    {
      id: 'ask', stage: 0, label: 'The purchase',
      user: 'We need to replace our runway sweeper. Planning allowance is $650,000. We’d like AIP to cover most of it, but we haven’t applied for the grant yet.',
      reply: {
        paras: [
          { lead: 'One question decides how this is treated: what will the sweeper be used for?', text: 'The AIP Handbook tests a sweeper differently depending on its purpose. Broom equipment that clears snow and ice from runways, taxiways and aprons at a Part 139 airport may be eligible as snow removal equipment, justified against your Snow and Ice Control Plan. A power vacuum sweeper for controlling foreign object debris is a separate category with its own limit on how many units may be eligible. Towed FOD sweepers are excluded, and sweeping as an activity is treated as maintenance.' },
          { text: 'So is this replacement for snow and ice control, or for debris and FOD control? I’m also treating the $650,000 as a planning allowance, not an independent estimate or a vendor price.' },
        ],
        sources: ['m1d', 'l2i', 't33'],
      },
      file: [
        { when: 'send', op: 'purchase', value: 'Runway sweeper replacement' },
        { when: 'send', op: 'phase', value: 'Start · Describe the need' },
        { when: 'send', op: 'known', key: 'allowance', label: 'Planning allowance', value: '$650,000', tag: 'You said', note: 'An allowance, not an estimate' },
        { when: 'send', op: 'known', key: 'funding', label: 'Funding', value: 'AIP planned · not yet applied', tag: 'You said' },
        { at: 0.8, op: 'open', key: 'use', group: 'now', text: 'What the sweeper is used for' },
        { at: 1, op: 'next', value: 'Confirm whether this is snow and ice equipment' },
      ],
    },
    {
      id: 'purpose', stage: 1, label: 'Snow and ice',
      user: 'Snow and ice. It replaces our 2009 broom, about 4,100 hours on it. We’re a small hub, and our purchasing policy requires formal competition over $100,000.',
      reply: {
        paras: [
          { lead: 'That puts this in the snow removal equipment category, and nothing is decided yet.', text: 'At a Part 139 airport the Handbook treats snow removal equipment as potentially eligible, so the file now has to show why this unit is needed.' },
          { text: 'Three things will carry it. The unit being replaced has to have reached the end of its useful life, so its age and hours need documenting. The number and type of pieces are tested against the two FAA advisory circulars and your Snow and Ice Control Plan, and the ADO will want a current Form 5100-141 equipment inventory. And your $100,000 policy threshold applies alongside the federal procurement standards, not instead of them.' },
          { text: 'On funding, a small hub’s normal federal share is 90% of allowable costs, unless an exception applies, such as a public-land-state adjustment. If the whole $650,000 were allowable, that would be up to $585,000 federal and about $65,000 local. That’s arithmetic on an allowance, not a grant amount: the ADO decides which costs are allowable, and the grant agreement sets the maximum.' },
          { text: 'One sequencing point before you commit to anything: AIP generally reimburses only costs incurred after the grant is executed. Costs paid from entitlement funds are the main exception, if every other AIP requirement is met. So which funds pay for this decides whether an order or contract signed before the grant could still be reimbursed. Committing early is at your own risk, so confirm the funding plan with your ADO first.' },
        ],
        sources: ['s312', 't47', 't360'],
      },
      file: [
        { when: 'send', op: 'known', key: 'purpose', label: 'Purpose', value: 'Snow and ice control (runway broom)', tag: 'You said' },
        { when: 'send', op: 'known', key: 'unit', label: 'Unit being replaced', value: '2009 broom · about 4,100 hours', tag: 'You said' },
        { when: 'send', op: 'known', key: 'category', label: 'Airport category', value: 'Small hub · Part 139', tag: 'You said' },
        { when: 'send', op: 'known', key: 'policy', label: 'Local formal-competition threshold', value: 'Above $100,000', tag: 'You said' },
        { when: 'send', op: 'close', key: 'use' },
        { when: 'send', op: 'phase', value: 'Understand · Apply context' },
        { at: 0.6, op: 'open', key: 'life', group: 'now', text: 'Useful-life documentation for the 2009 unit' },
        { at: 0.65, op: 'open', key: 'form', group: 'now', text: 'Current Form 5100-141' },
        { at: 0.97, op: 'open', key: 'funds', group: 'now', text: 'Which AIP funds pay for this, since that decides whether costs committed before the grant could be reimbursed' },
        { at: 0.9, op: 'known', key: 'share', label: 'Normal federal share', value: '90% of allowable costs', tag: 'Handbook · Table 4-7', note: 'Unless an exception applies' },
        { at: 0.95, op: 'known', key: 'illus', label: 'Illustration only', value: 'Up to $585,000 federal · about $65,000 local, if the full allowance were allowable', tag: 'Arithmetic, not a grant amount' },
        { at: 1, op: 'next', value: 'Share the capital plan, purchasing policy and Snow and Ice Control Plan' },
      ],
    },
    {
      id: 'documents', stage: 1, label: 'The documents',
      user: 'Here are our capital plan extract, purchasing policy, Snow and Ice Control Plan and our last equipment inventory.',
      thinkLabel: 'Reading four documents',
      docs: [
        { name: 'Northfield_CIP_FY27-31_extract.pdf', kind: 'PDF' },
        { name: 'Purchasing_Policy_Section4.pdf', kind: 'PDF' },
        { name: 'Snow_and_Ice_Control_Plan_2025.pdf', kind: 'PDF' },
        { name: 'FAA_Form_5100-141_Mar2024.pdf', kind: 'PDF' },
      ],
      reply: {
        paras: [
          { lead: 'I’ve read all four. Most of it lines up, but three things need your attention.', text: 'The capital plan carries this project at $610,000, while your allowance is $650,000. I’ve recorded both and left the difference for you to reconcile. The Snow and Ice Control Plan lists runway broom equipment, but the count and specification still need to be checked against the advisory circulars. And the inventory form is dated March 2024, so the ADO will want a current one.' },
          { text: 'Your purchasing policy confirms formal competition above $100,000, and the capital plan shows this as AIP with a local match.' },
          { text: 'On the file, I’ve sorted what’s open. Before any solicitation goes out you’ll need an independent estimate and written protest procedures. After bids are in, the bid tabulation, price analysis and your local-share source go into the grant application, because the FAA expects the application to carry actual bid amounts. A Buy American path is needed before award.' },
        ],
        sources: ['u21', 't54', 'x1'],
      },
      file: [
        { at: 0.12, op: 'known', key: 'cip', label: 'Capital plan line', value: '$610,000', tag: 'Capital plan', flag: 'Differs from the $650,000 allowance' },
        { at: 0.28, op: 'known', key: 'sicp', label: 'Snow and Ice Control Plan', value: 'Lists runway broom equipment · count to confirm', tag: 'Snow and Ice Control Plan' },
        { at: 0.42, op: 'known', key: 'form5100', label: 'FAA Form 5100-141', value: 'Dated March 2024', tag: 'Form 5100-141', flag: 'Needs a current version' },
        { at: 0.55, op: 'known', key: 'policy', label: 'Local formal-competition threshold', value: 'Above $100,000', tag: 'Purchasing policy' },
        { at: 0.7, op: 'open', key: 'form', group: 'now', text: 'Current Form 5100-141 (on file: March 2024)' },
        { at: 0.75, op: 'open', key: 'estimate', group: 'solicitation', text: 'Independent estimate, made before bids are received' },
        { at: 0.8, op: 'open', key: 'protest', group: 'solicitation', text: 'Written protest procedures' },
        { at: 0.86, op: 'open', key: 'buyam', group: 'award', text: 'Buy American path: certification, conformance list or waiver' },
        { at: 0.9, op: 'open', key: 'price', group: 'application', text: 'Bid tabulation and cost or price analysis' },
        { at: 0.98, op: 'open', key: 'match', group: 'application', text: 'Local match and operating funds' },
        { at: 1, op: 'next', value: 'Reconcile the $610,000 and $650,000 figures' },
      ],
    },
    {
      id: 'route', stage: 2, label: 'Sealed bids',
      user: 'How should we put this out to bid?',
      reply: {
        paras: [
          { lead: 'Sealed bids fit this purchase: a defined unit, a firm fixed price, and a value above your $100,000 threshold.', text: 'Under 2 CFR 200.320, bids are publicly solicited and the contract is awarded in writing to the lowest responsive and responsible bidder. That works when the specification is complete and realistic and you expect two or more bidders, so write it to your Snow and Ice Control Plan and FAA standards without narrowing the field. Requiring highway-vehicle standards, for example, can reduce the number of bidders.' },
          { text: 'The bid package carries the required federal contract provisions, including the Buy American certificate. If you use bid alternates, the solicitation has to state how the award will be made.' },
          { text: 'These federal rules sit alongside your own. Under 2 CFR 200.318(a) you use your documented procurement procedures, which follow your state’s public-bidding law and your local policy, so requirements such as advertising, bid security and governing-body approval come from those too. I don’t have your state’s statute in this file, so confirm those with your procurement office or counsel. Here are the common key steps the Handbook lays out from here.' },
        ],
        sources: ['u15', 'u10a', 'u24'],
        table: 'sequence',
      },
      file: [
        { when: 'send', op: 'phase', value: 'Route · Find the path' },
        { at: 0.5, op: 'known', key: 'method', label: 'Procurement method', value: 'Sealed competitive bids', tag: '2 CFR 200.320' },
        { at: 0.8, op: 'open', key: 'provisions', group: 'solicitation', text: 'Required federal contract provisions and Buy American certificate in the bid package' },
        { at: 0.75, op: 'open', key: 'statelaw', group: 'solicitation', text: 'State public-bidding and local requirements reflected in the bid package' },
        { at: 0.85, op: 'open', key: 'basis', group: 'solicitation', text: 'Basis for award stated, if bid alternates are used' },
        { at: 1, op: 'next', value: 'Finish the specification and the independent estimate before advertising' },
      ],
    },
    {
      id: 'bids', stage: 3, label: 'When bids come in',
      user: 'What could go wrong once bids come in?',
      reply: {
        paras: [
          { lead: 'Three situations are worth planning for before you advertise.', text: 'If only one bid arrives, or you’d award to someone other than the apparent low bidder, and the award is above the federal simplified acquisition threshold, you notify the ADO in writing before award. That threshold is currently $350,000. The Handbook edition I’m reading still shows $150,000, so I’m flagging the difference; at this value you’re above either figure.' },
          { text: 'A single bid also changes the paperwork: instead of a price analysis you document a cost analysis against your engineer’s estimate. And if you reject a bid, 2 CFR 200.320 requires you to document the reason.' },
          { text: 'If bids come in above the capital plan’s $610,000, you have three options. Fund the gap locally: the application carries the actual bid, the ADO decides which costs are allowable and how much AIP funding is available, and the grant agreement sets the federal maximum. Reject all bids for a documented reason and re-advertise. Or, planned before you advertise, bid a base unit with alternates ordered by available funding, with the basis for award stated in the solicitation. Settle which you’d use with your ADO before advertising.' },
        ],
        sources: ['u8', 't367', 's3105'],
      },
      file: [
        { when: 'send', op: 'phase', value: 'Check · Validate the route' },
        { at: 0.35, op: 'open', key: 'adonotice', group: 'award', text: 'Written notice to the ADO before award if only one bid, or not the apparent low bidder' },
        { at: 1, op: 'open', key: 'budget', group: 'solicitation', text: 'How bids above $610,000 would be funded' },
      ],
    },
    {
      id: 'path', stage: 4, label: 'The path and the file',
      user: 'Go with sealed bids. Give procurement and our grants team something they can use.',
      thinkLabel: 'Preparing the file',
      reply: {
        paras: [
          { lead: 'Sealed competitive bidding is the likely buying path.', text: 'It fits your $100,000 policy threshold, and with two or more bids the cost-reasonableness file is well defined: engineer’s estimate, bid tabulation, price analysis and a signed statement, which your grant application will carry. What would change the plan: only one bid, bids well above the budget, or an ADO view on funding that shifts the timing.' },
          { text: 'I’ve prepared four review drafts for your procurement and grants teams. They separate what you told me, what your documents show, and what’s still unresolved. They’re drafts for review, not a purchase authorization.' },
        ],
        sources: ['t367', 'ga13', 'ga3'],
        artifacts: ['memo', 'checklist', 'ado', 'bideval'],
      },
      file: [
        { when: 'send', op: 'known', key: 'path', label: 'Working path', value: 'Sealed competitive bids · AIP with local match', tag: 'You said' },
        { when: 'send', op: 'phase', value: 'Ready · Build the record' },
        { at: 1, op: 'next', value: 'Update the Form 5100-141 inventory and prepare the independent estimate before any solicitation is released' },
      ],
    },
  ];

  return {
    banner: 'Illustrative demonstration · fictional airport and documents · scripted, not live AI',
    airport: { name: 'Northfield Regional Airport (fictional)' },
    citations, tables, artifacts, stages, beats,
  };
});
