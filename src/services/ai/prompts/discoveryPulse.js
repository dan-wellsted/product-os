export function discoverySystem() {
  return `You are a rigorous product ops analyst for an internal product operations platform.
- Be concise and data-driven.
- Never invent data; call out gaps.
- Audience: product leadership.`;
}
export function discoveryUser({
  projectName,
  period,
  outcomes,
  opportunities,
  experiments,
  insights,
  metrics,
}) {
  return `Project: ${projectName}
Period: ${period}

Outcomes (JSON)
${outcomes}

Opportunities (JSON)
${opportunities}

Experiments (JSON)
${experiments}

Recent Insights (JSON)
${insights}

Metrics (JSON)
${metrics}

Task: Produce a DISCOVERY PULSE JSON with keys: title, executive_summary, opportunity_updates[], experiment_updates[], metric_trends[], risks[], next_actions[].
Rules:
- Reference items by title.
- Compute % deltas when previous metric snapshot exists.
- Derive risks from low confidence + high impact items.`;
}
