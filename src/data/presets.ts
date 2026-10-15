export interface EmailPreset {
  id: string;
  name: string;
  intent: string;
  recipient: string;
  senderRole: string;
  tone: string;
  length: string;
  callToAction: string;
  keyPoints: string;
  context: string;
}

export interface MeetingPreset {
  id: string;
  title: string;
  meetingType: string;
  attendees: string;
  transcript: string;
}

export interface TaskPreset {
  id: string;
  name: string;
  goal: string;
  timeframe: string;
  teamCapacity: string;
  priorityFocus: string;
  methodology: string;
  customConstraints: string;
}

export const EMAIL_PRESETS: EmailPreset[] = [
  {
    id: 'client_delay',
    name: 'Client Delivery Delay Notice',
    intent: 'escalation',
    recipient: 'Marcus Vance, Enterprise Account Director at Acme Corp',
    senderRole: 'Senior Solutions Architect',
    tone: 'diplomatic',
    length: 'standard',
    callToAction: 'Approval of the revised Phase 2 deployment date of Nov 12th by Thursday 5 PM',
    keyPoints: `- Security penetration audit surfaced 2 critical token validation vulnerabilities that must be patched before production.
- Core milestone delivery pushed back by 7 business days from Nov 3rd to Nov 12th.
- Zero extra billing charges will be incurred by Acme Corp for the remediation engineering.
- QA team will provide daily sandbox verification logs starting Monday morning.`,
    context: `Acme Corp enterprise rollout was scheduled for live release on Nov 3rd. Yesterday's third-party pentest flagged CVE-style authentication replay weaknesses in the OAuth callback flow. Launching without fixing introduces compliance risk under SOC-2. We need to reset expectations without losing account trust.`,
  },
  {
    id: 'vendor_negotiation',
    name: 'Cloud Vendor Contract Pushback',
    intent: 'negotiation',
    recipient: 'Sarah Chen, Strategic Enterprise Rep at CloudMatrix Technologies',
    senderRole: 'VP of Technology Infrastructure',
    tone: 'executive',
    length: 'brief',
    callToAction: 'Counter-offer review meeting this Wednesday at 2:00 PM EST or formal written waiver of the 14% platform indexation fee',
    keyPoints: `- Received renewal quote reflecting an unbudgeted 14% annual increase ($42,000 delta).
- Our committed annual compute consumption increased 35% year-over-year, which warrants volume tier discounting, not fee expansion.
- Competitor evaluated via pilot offering 18% lower egress fees.
- Ready to sign a 24-month multi-year commitment if baseline rates are held flat.`,
    context: `CloudMatrix has been our database hosting provider for 2 years. Contract auto-renews in 30 days unless countered. Their account team sent an automated uplift notice citing general inflation.`,
  },
  {
    id: 'graceful_rejection',
    name: 'Executive Candidate Courteous Rejection',
    intent: 'rejection',
    recipient: 'David Reynolds, Senior Product Management Finalist',
    senderRole: 'Head of Talent & Organizational Growth',
    tone: 'empathetic',
    length: 'standard',
    callToAction: 'Permission to retain portfolio on file for upcoming Principal Platform Product openings in Q1',
    keyPoints: `- Genuine appreciation for time invested throughout the 4-stage interview panel and the deep system design presentation.
- Team was thoroughly impressed by David's user-centric discovery methods and product analytics acumen.
- Final decision came down to direct enterprise ERP migration experience, which the selected hire had previously executed.
- Offer constructive interview feedback if David would like a brief 15-minute call.`,
    context: `David was in the final 2 candidates for the Director of Product role. He performed exceptionally well. We want to treat him with utmost dignity, avoid boilerplate HR language, and build a lasting relationship for future talent pipelines.`,
  },
];

export const MEETING_PRESETS: MeetingPreset[] = [
  {
    id: 'product_launch_sync',
    title: 'Q4 Product Release Go/No-Go Alignment',
    meetingType: 'leadership',
    attendees: 'Elena Rostova (VP Product), Tariq Al-Mansoor (Lead Architect), Rachel Green (Director of QA), Devlin Cole (DevOps Lead)',
    transcript: `Elena: Alright everyone, let's look at the launch checklist for the v3.4 Checkout engine. Target live date is November 10th. Rachel, where do we stand on automated regression suites?
Rachel: We executed 1,420 test cases over the weekend. 98.4% pass rate. However, there's one blocker: Safari on iOS 18 crashes intermittently when handling multi-currency Stripe 3D-Secure redirects. It happened 4 times out of 50 test transactions.
Elena: That is a blocker. 22% of our checkout traffic originates on iOS Safari. We cannot launch with a 8% checkout failure rate on Apple devices. Tariq, what is causing the redirect drop?
Tariq: We investigated the webkit iframe sandbox policy. Safari's latest update enforces strict cross-origin cookie restrictions on the redirect payload. We need to swap the iframe modal for a top-level popup redirect or pass an ephemeral session ticket in the query params.
Rachel: How long to implement and re-verify?
Tariq: My team needs 48 hours to rewrite the handshake. We can have it in staging by Wednesday 2 PM.
Rachel: If you get it to me Wednesday by 2 PM, QA will do a 24-hour dedicated regression run on iOS test devices. I can give final sign-off by Thursday 4 PM.
Elena: Agreed. That is our official decision. Tariq owns the Safari OAuth redirect fix by Wednesday 2 PM. Rachel will complete regression testing by Thursday 4 PM. Devlin, what about database migration locks?
Devlin: We tested the zero-downtime database migration in the staging mirror yesterday. The schema partition took 4 minutes with zero query queue buildup. Read replicas handled traffic seamlessly. We are 100% green on infra.
Elena: Fantastic. Next, marketing communication: Sarah isn't here, but I will ping her to hold the public press release until Thursday at 5 PM after Rachel's QA sign-off.
Devlin: One minor note: we noticed error logging volume in Datadog is running 3x higher due to debug flags left on in the payment gateway connector. Someone should turn off verbose logging before production.
Tariq: I will add that to the Wednesday patch. It will take 5 minutes.
Elena: Excellent. Let's recap: Launch holds for November 10th if Thursday 4 PM QA sign-off passes. Next check-in is Thursday 4:30 PM for final Go/No-Go button press. Meeting adjourned.`,
  },
  {
    id: 'incident_postmortem',
    title: 'Incident 409 Post-Mortem: Payment Gateway Timeout Surge',
    meetingType: 'incident_postmortem',
    attendees: 'Tariq Al-Mansoor (Principal Architect), Maya Lin (Site Reliability), Carlos Ortiz (Billing Engineer), Elena Rostova (VP Product)',
    transcript: `Maya: Starting the Incident 409 post-mortem. On Tuesday at 14:15 UTC, checkout latency jumped from 220ms to 9,800ms, causing 314 dropped transactions over a 28-minute window. Total estimated revenue impact is $18,400.
Elena: What triggered the cascade?
Carlos: At 14:10, our scheduled batch cron job for customer renewal invoices ran simultaneously with the peak European lunch-hour checkout traffic. Both services shared the primary PostgreSQL connection pool.
Tariq: Specifically, the default connection pool limit was capped at 100 connections. The batch billing job grabbed 72 connections to execute bulk read queries, starving the front-facing API server. Incoming web checkouts piled up and timed out at the reverse proxy.
Maya: I initiated the mitigation at 14:38 by killing the batch worker process and restarting the web pods. Latency normalized within 3 minutes.
Elena: How do we guarantee this architectural vulnerability never recurs?
Tariq: Two immediate architectural decisions: First, isolate the batch processing jobs to use the Read-Only replica database pool with strict 15-connection max caps. Second, implement an active circuit breaker on the web API that rejects non-critical background jobs if database pool utilization exceeds 75%.
Carlos: I will take the replica connection pool separation. I can deploy that to production by Friday noon.
Maya: I will configure the Datadog alert rule to page PagerDuty whenever connection pool usage breaches 65% for more than 2 consecutive minutes. I will have that in place today by 6 PM.
Elena: Carlos, please also draft the customer-facing incident statement for affected enterprise clients by tomorrow 10 AM so customer success can reach out proactively.
Tariq: Action items are crystal clear. Good work on rapid mitigation, let's ship these preventative safeguards.`,
  },
];

export const TASK_PRESETS: TaskPreset[] = [
  {
    id: 'soc2_compliance',
    name: 'Enterprise SOC-2 Type II Compliance Program',
    goal: 'Achieve formal SOC-2 Type II compliance readiness across cloud infrastructure, access control, and employee security policies within 60 days.',
    timeframe: '60 days',
    teamCapacity: '1 Security Officer, 1 Senior DevOps Engineer, 1 Operations Lead',
    priorityFocus: 'Audit rigor and automated evidence collection',
    methodology: 'milestones_first',
    customConstraints: 'Must not disrupt ongoing Q4 engineering roadmap sprints; budget capped at $25,000 for compliance monitoring software.',
  },
  {
    id: 'customer_referral',
    name: 'Viral Customer Referral & Reward Engine',
    goal: 'Design, build, and deploy an automated in-app referral program that delivers unique invite links, fraud detection, and instant bill credits to boost viral expansion.',
    timeframe: '30 days',
    teamCapacity: '1 Full-Stack Engineer, 1 Product Designer, 1 Growth Marketer',
    priorityFocus: 'Rapid customer onboarding and tamper-proof fraud prevention',
    methodology: 'agile',
    customConstraints: 'Integrates with existing Stripe billing webhooks; design must match modern design system.',
  },
  {
    id: 'customer_support_ai',
    name: 'AI Knowledge Base & Support Workflow Automation',
    goal: 'Integrate automated AI resolution workflows for tier-1 support tickets, cutting median customer wait time from 4 hours to under 3 minutes.',
    timeframe: '45 days',
    teamCapacity: '1 ML/Prompt Engineer, 1 Support Director, 1 Backend Developer',
    priorityFocus: 'High accuracy, zero hallucination of policy terms, and human-in-the-loop escalations',
    methodology: 'agile',
    customConstraints: 'Every AI reply must pass ethical tone and policy validation before showing to customers.',
  },
];
