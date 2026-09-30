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
      gist: 'The common key steps run: notice of intent to use entitlement funds, advertisement for bids, opening of bids, submission of the grant application, acceptance of the grant offer, then award of the contract. It is FAA policy that the application incorporates actual bid or negotiated agreement amounts; an application built on estimates is possible but described as suboptimal. Early indications from the ADO are for planning only, and whether and when to start is the sponsor’s decision.',
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
      label: 'Handbook · Table U-3', source: HB, ref: 'Appendix U, Table U-3, items 2 and 7',
      gist: 'Sponsors must have written protest procedures in place before starting a procurement funded with AIP. The Handbook’s examples of intergovernmental agreements are several small airports buying the same weather system, and a state aviation department running task orders for pavement maintenance.',
      edition: HB_ED, checked: '2026-07-16',
    },
    c318e: {
      label: '2 CFR 200.318(e)', source: '2 CFR Part 200 as reproduced in the ' + HB, ref: 'Appendix U, U-10: General Procurement Standards, paragraph (e)',
      gist: 'Recipients and subrecipients are encouraged to enter state and local intergovernmental agreements or inter-entity agreements for procurement. This is an encouragement; it does not by itself establish that a given cooperative contract meets AIP competition expectations.',
      edition: HB_ED + '; paragraph (e) and its lettering confirmed against the current eCFR on 2026-09-30', checked: '2026-09-30',
    },
    t367: {
      label: 'Handbook · Table 3-67', source: HB, ref: 'Chapter 3, §3-101, Table 3-67, row b',
      gist: 'For equipment bought with adequate competition (two or more sealed bids), the cost-reasonableness file includes a price analysis above the simplified acquisition threshold, an engineer’s estimate, a signed sponsor statement that the cost is reasonable, and bid tabulations.',
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

  const candidates = [
    { id: 'npc', contract: 'NPC-4471', consortium: 'Northern Plains Cooperative Purchasing', vendor: 'Ridgeline Airfield Equipment', scope: 'Airfield brooms and sweeper-blowers', termEnds: 'Feb 2027', validate: 'Timing against the grant · original competition · Buy American path · specification match', fictional: true },
    { id: 'mrc', contract: 'MRC-2210', consortium: 'Midland Regional Purchasing Alliance', vendor: 'Summit Runway Systems', scope: 'Multi-task snow equipment', termEnds: 'Feb 2028', validate: 'Configuration against the Snow and Ice Control Plan · price support · ADO view', fictional: true },
  ];

  const draftNote = 'Review draft for a fictional airport. Not a purchase authorization.';

  const artifacts = {
    memo: {
      title: 'Route memo', sub: 'Runway broom replacement · Northfield Regional Airport (fictional) · Draft for procurement and grants review',
      sources: ['t47', 's3105', 't360', 't54', 't332', 'ga1', 'ga3', 'ga13', 'ga19', 'ga30', 'ga33', 'ga34'],
      sections: [
        { h: 'What the airport told us', items: [
          'Replacing a 2009 runway broom with about 4,100 hours, for snow and ice control.',
          'Planning allowance of $650,000. This is an allowance, not an independent estimate or a vendor price.',
          'AIP funding is planned and the airport has not yet applied for the grant. Local match is not yet set.',
          'Small hub, 14 CFR Part 139 airport. Local policy requires formal competition above $100,000.'] },
        { h: 'What the documents show', items: [
          'Capital plan line: $610,000. This differs from the $650,000 allowance and needs to be reconciled.',
          'The Snow and Ice Control Plan lists runway broom equipment. Count and specification still need to be checked against the advisory circulars.',
          'The FAA Form 5100-141 on file is dated March 2024. A current inventory will be needed.',
          'Purchasing policy allows a cooperative purchase with the purchasing director’s written sign-off.'] },
        { h: 'Likely buying path', items: [
          'Formal competition, with a specification written to the Snow and Ice Control Plan and the current FAA advisory circulars.',
          'Cooperative candidates NPC-4471 and MRC-2210 (both fictional) stay open as candidates that need validation.'] },
        { h: 'What would change the path', items: [
          'An ADO position that supports a cooperative purchase for this equipment.',
          'A candidate whose original competition, specification and Buy American position hold up.',
          'Only one bid received, which can bring ADO pre-award review options into play.'] },
        { h: 'Funding', items: [
          'A small hub’s normal federal share is 90% of allowable costs, unless an exception applies.',
          'Illustration only: if the whole $650,000 were allowable, that would be up to $585,000 federal and about $65,000 local. The ADO decides allowable costs and the grant agreement sets the maximum.',
          'Local match and the funds to operate and maintain the unit need to be identified.',
          'Timing: AIP generally reimburses only costs incurred after the grant is executed; entitlement funds are the main exception. Which funds pay decides whether the airport could commit before the grant and still be reimbursed, by any route.',
          'The grant is programmed from the capital plan estimate; the application itself should carry actual bid or negotiated amounts.'] },
        { h: 'Grant Assurances that may be implicated', items: [
          'Numbering follows the April 2025 set. Confirm against the assurances in the grant offer for this project.',
          '1 General Federal Requirements: brings in 2 CFR Part 200 and required contract provisions.',
          '3 Sponsor Fund Availability: local match, and funds to operate and maintain the unit.',
          '13 Accounting, Audit, and Record Keeping: a file that traces funds, decisions and costs.',
          '19 Operation and Maintenance: safe, serviceable winter operations are the reason for the unit.',
          '30 Civil Rights: current FAA-required solicitation and contract language.',
          '33 Foreign Market Restrictions: check the origin of the equipment against current restrictions.',
          '34 Policies, Standards, and Specifications: fix the FAA standards, including advisory circular editions, that apply at application.'] },
        { h: 'Not decided', items: [
          'No vendor is selected, no award is made and no funds are obligated. Everything here needs validation with the ADO, the grants administrator and airport counsel.',
          draftNote] },
      ],
    },
    checklist: {
      title: 'Pre-solicitation readiness checklist', sub: 'Evidence file for the runway broom replacement · Northfield Regional Airport (fictional)',
      sources: ['m1d', 'c3', 's312', 'u21', 'u3', 't328', 't367', 't360', 't54', 'x1', 's567', 'ga30', 'ga33'],
      sections: [
        { h: 'Eligibility file', items: [
          'Current FAA Form 5100-141 inventory (on file: March 2024).',
          'Snow and Ice Control Plan and the number and type of pieces, checked against AC 150/5220-20A and AC 150/5200-30D.',
          'Useful-life documentation for the 2009 unit: age, about 4,100 hours, condition.',
          'Number of pieces limited to the minimum the advisory circulars recommend, unless the ADO accepts a traffic-volume justification for more.',
          'Nothing in the specification sized for areas that are not priority 1 areas.'] },
        { h: 'Competition and cost', items: [
          'Independent estimate, made before any bids, proposals or cooperative quotes are received.',
          'Cooperative route: ADO view and purchasing director’s sign-off obtained, or the route closed, before the solicitation is released.',
          'Written protest procedures in place before the solicitation starts.',
          'Specification reviewed for requirements that could narrow the bidder pool, such as highway-vehicle standards.',
          'Plan for the engineer’s estimate, bid tabulation, price analysis and signed sponsor statement.'] },
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
      sources: ['m1d', 's312', 'c318e', 'x1', 't47', 't360', 't54'],
      sections: [
        { h: 'Eligibility', items: [
          'Please confirm the current Form 5100-141 you want on file and any updates to the March 2024 version.',
          'Does the ADO agree that the count and type of pieces for this replacement follow the two advisory circulars and our Snow and Ice Control Plan, or is more detail needed?',
          'For the 2009 unit, what useful-life documentation do you want: age and hours, condition, or both?'] },
        { h: 'Procurement', items: [
          'Would the ADO consider a cooperative purchase for this equipment? If so, what would we need to show about the original competition?',
          'Are any candidate units on the Nationwide Buy American conformance list? If a waiver is needed, which type do you expect?'] },
        { h: 'Funding and timing', items: [
          'Is this project in our ACIP submission, and in which fiscal year? Which AIP funds, entitlement or discretionary, do you expect, and when is our notice of intent to use entitlements due?',
          'If entitlement funds are used and we place an order or sign a contract before the grant is executed, what would you need to see for those costs to remain reimbursable?',
          draftNote] },
      ],
    },
    coop: {
      title: 'Cooperative validation checklist', sub: 'Two fictional candidates · validate before any reliance',
      sources: ['c318e', 'u3', 'u21', 't367', 't332', 'x1', 'm1d'],
      sections: [
        { h: 'NPC-4471 · Northern Plains Cooperative Purchasing · Ridgeline Airfield Equipment (fictional)', items: [
          'Original solicitation and competition record obtained and reviewed.',
          'Scope covers runway snow equipment matching our Snow and Ice Control Plan and the current advisory circulars.',
          'Term ends February 2027: compare with the grant timeline and award timing.',
          'Buy American path for the exact unit: conformance list, certification or waiver.',
          'Independent estimate prepared before requesting a quote; a cooperative discount is not a price analysis.',
          'Ask the ADO whether this order is treated as competitive, or needs a cost analysis and the quote as for a procurement without adequate competition.',
          'Required federal contract provisions can be added.',
          'ADO position obtained. Purchasing director’s written sign-off obtained.'] },
        { h: 'MRC-2210 · Midland Regional Purchasing Alliance · Summit Runway Systems (fictional)', items: [
          'Original solicitation and competition record obtained and reviewed.',
          'Multi-task configuration matches the Snow and Ice Control Plan; note that a multi-task unit counts as two pieces.',
          'Term ends February 2028: compare with the grant timeline and award timing.',
          'Buy American path for the exact unit: conformance list, certification or waiver.',
          'Independent estimate prepared before requesting a quote.',
          'Ask the ADO whether this order is treated as competitive, or needs a cost analysis and the quote as for a procurement without adequate competition.',
          'Required federal contract provisions can be added.',
          'ADO position obtained. Purchasing director’s written sign-off obtained.',
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
          { text: 'One sequencing point before you commit to any route: AIP generally reimburses only costs incurred after the grant is executed. Costs paid from entitlement funds are the main exception, if every other AIP requirement is met. So which funds pay for this decides whether an order or contract signed before the grant could still be reimbursed, by any route. Committing early is at your own risk, so confirm the funding plan with your ADO first.' },
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
          { text: 'Your purchasing policy confirms formal competition above $100,000 and allows a cooperative purchase with your purchasing director’s written sign-off.' },
          { text: 'On the file, I’ve sorted what’s open. Before any solicitation goes out you’ll need an independent estimate and written protest procedures. After bids are in, the bid tabulation, price analysis and your local-share source go into the grant application, because the FAA expects the application to carry actual bid amounts. A Buy American path is needed before award.' },
        ],
        sources: ['u21', 't54', 'x1'],
      },
      file: [
        { at: 0.12, op: 'known', key: 'cip', label: 'Capital plan line', value: '$610,000', tag: 'Capital plan', flag: 'Differs from the $650,000 allowance' },
        { at: 0.28, op: 'known', key: 'sicp', label: 'Snow and Ice Control Plan', value: 'Lists runway broom equipment · count to confirm', tag: 'Snow and Ice Control Plan' },
        { at: 0.42, op: 'known', key: 'form5100', label: 'FAA Form 5100-141', value: 'Dated March 2024', tag: 'Form 5100-141', flag: 'Needs a current version' },
        { at: 0.55, op: 'known', key: 'policy', label: 'Local formal-competition threshold', value: 'Above $100,000 · cooperative purchase needs the purchasing director’s written sign-off', tag: 'Purchasing policy' },
        { at: 0.7, op: 'open', key: 'form', group: 'now', text: 'Current Form 5100-141 (on file: March 2024)' },
        { at: 0.75, op: 'open', key: 'estimate', group: 'solicitation', text: 'Independent estimate, made before bids, proposals or a cooperative quote' },
        { at: 0.8, op: 'open', key: 'protest', group: 'solicitation', text: 'Written protest procedures' },
        { at: 0.86, op: 'open', key: 'buyam', group: 'award', text: 'Buy American path: certification, conformance list or waiver' },
        { at: 0.9, op: 'open', key: 'price', group: 'application', text: 'Bid tabulation and cost or price analysis' },
        { at: 0.98, op: 'open', key: 'match', group: 'application', text: 'Local match and operating funds' },
        { at: 1, op: 'next', value: 'Reconcile the $610,000 and $650,000 figures' },
      ],
    },
    {
      id: 'cooperative', stage: 2, label: 'Cooperative option',
      user: 'Could a cooperative contract save us running a solicitation? Show me what’s out there.',
      reply: {
        paras: [
          { lead: 'Two candidate agreements have a runway equipment scope.', text: 'They’re candidates, not a path. I haven’t established that either one fits this purchase.' },
          { text: 'Federal rules encourage intergovernmental agreements where they make sense for shared goods and services, but that encouragement doesn’t settle whether a particular cooperative contract meets AIP competition expectations. The Handbook’s own examples are a multi-airport equipment purchase and state-run task orders, not a catalog purchase like this one, so I’d raise it with your ADO before relying on it.' },
        ],
        sources: ['c318e', 'u3'],
        table: 'candidates',
      },
      file: [
        { when: 'send', op: 'phase', value: 'Route · Find the path' },
        { at: 1, op: 'open', key: 'coop', group: 'solicitation', text: 'Get the ADO’s view on the cooperative candidates before the solicitation is released' },
        { at: 1, op: 'next', value: 'Decide whether to test the cooperative candidates alongside formal competition' },
      ],
    },
    {
      id: 'fit', stage: 3, label: 'Poor-fit risks',
      user: 'What could make those a bad fit for us?',
      reply: {
        paras: [
          { lead: 'Timing, configuration and price support matter more than the catalog match.', text: 'Start with how the base contract was competed, and whether that competition supports the federal expectations for your purchase. Then Buy American: a catalog listing doesn’t establish it, so the exact unit needs its own path: certification that it’s wholly U.S.-produced, a place on the FAA’s conformance list, or a waiver. The configuration also has to match your Snow and Ice Control Plan.' },
          { text: 'Timing counts too. One candidate ends in February 2027 and the other in February 2028, and you haven’t applied for the grant yet. A cooperative discount also isn’t a price analysis: at this value you still need the independent estimate and a documented cost or price analysis.' },
          { text: 'The ADO can choose to review before award in some cases, such as a brand-name specification above the federal simplified acquisition threshold. That threshold is currently $350,000. The Handbook edition I’m reading still shows $150,000, so I’m flagging the difference. Your own $100,000 policy is lower, so that’s the one that drives when you compete.' },
        ],
        sources: ['x1', 't332', 'sat'],
      },
      file: [
        { when: 'send', op: 'phase', value: 'Check · Validate the route' },
        { at: 0.5, op: 'open', key: 'terms', group: 'solicitation', text: 'Candidate term dates (Feb 2027, Feb 2028) against grant timing' },
        { at: 1, op: 'open', key: 'spec', group: 'solicitation', text: 'Candidate specifications against the Snow and Ice Control Plan' },
      ],
    },
    {
      id: 'path', stage: 4, label: 'The path and the file',
      user: 'Keep formal competition as our working path while we check the candidates. Give procurement and our grants team something they can use.',
      thinkLabel: 'Preparing the file',
      reply: {
        paras: [
          { lead: 'Formal competition is the likely buying path, and the cooperative candidates stay open until your ADO weighs in, before any solicitation is released.', text: 'That fits your $100,000 policy threshold, and equipment bought with adequate competition has a well-defined cost-reasonableness file, which your grant application will carry. What would change the path: an ADO position that supports a cooperative purchase, a candidate whose competition, specification and Buy American position hold up, or only one bid coming in.' },
          { text: 'I’ve prepared four review drafts for your procurement and grants teams. They separate what you told me, what your documents show, and what’s still unresolved. They’re drafts for review, not a purchase authorization.' },
        ],
        sources: ['t367', 'ga13', 'ga3'],
        artifacts: ['memo', 'checklist', 'ado', 'coop'],
      },
      file: [
        { when: 'send', op: 'known', key: 'path', label: 'Working path', value: 'Formal competition · cooperative candidates kept open for validation', tag: 'You said' },
        { when: 'send', op: 'phase', value: 'Ready · Build the record' },
        { at: 1, op: 'next', value: 'Update the Form 5100-141 inventory and prepare the independent estimate before any solicitation is released' },
      ],
    },
  ];

  return {
    banner: 'Illustrative demonstration · fictional airport, documents and contracts · scripted, not live AI',
    airport: { name: 'Northfield Regional Airport (fictional)' },
    citations, candidates, artifacts, stages, beats,
  };
});
