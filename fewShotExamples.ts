// Each example pair shows the model: expected context format → ideal response style.
// These are prepended to every real request so the model learns by demonstration,
// not just instruction.

interface FewShotMessage {
  role: 'user' | 'assistant';
  content: string;
}

export const FEW_SHOT_EXAMPLES: FewShotMessage[] = [
  // Example 1: clear KB answer — synthesise concisely, no filler
  {
    role: 'user',
    content: `Context:
[Source 1 - Knowledge Base]
Acme Learning Hub offers three subscription plans: Free (access to 50+ courses), Pro ($19/month, unlimited courses + certificates), and Team ($49/month per seat, includes admin dashboard and progress tracking). Annual billing gives you 2 months free on Pro and Team plans.

Question: How much is the Pro plan?`,
  },
  {
    role: 'assistant',
    content: `The Pro plan is $19/month and includes unlimited courses and certificates. If you switch to annual billing you get 2 months free, which works out to about $15.83/month.`,
  },

  // Example 2: context gap — stay helpful, suggest next step, never just say "I don't know"
  {
    role: 'user',
    content: `Context:


Question: Does Acme Learning Hub support offline downloads on Windows?`,
  },
  {
    role: 'assistant',
    content: `I don't have details on Windows-specific offline support in my current sources. Offline downloading is available through the mobile app on Pro and Team plans — if you need desktop access, I'd suggest reaching out to the support team directly so they can confirm whether a desktop option is on the roadmap.`,
  },

  // Example 3: GitHub issue found — reference it naturally, offer a workaround
  {
    role: 'user',
    content: `Context:
[Source 1 - GitHub Issue #4 (open)]
Title: Offline course downloads failing with network error
Videos fail to download when switching between WiFi and mobile data mid-download. Affects iOS and Android. Error: "Network connection lost during download."

Question: My downloads keep failing whenever I switch from WiFi to mobile data`,
  },
  {
    role: 'assistant',
    content: `This is a known open issue (#4) — downloads drop when you switch between WiFi and mobile data mid-download on both iOS and Android. For now, start downloads only when you're on a stable connection and avoid switching networks partway through. The team is actively tracking it.`,
  },

  // Example 4: multi-source answer — blend KB + web without citing sources awkwardly
  {
    role: 'user',
    content: `Context:
[Source 1 - Knowledge Base]
To reset your password, go to the login page and click "Forgot password". Enter your registered email and you'll receive a reset link within a few minutes.

[Source 2 - Web: Acme Help Centre]
If the reset email doesn't arrive, check your spam folder or try re-requesting after 5 minutes.

Question: I'm not receiving my password reset email`,
  },
  {
    role: 'assistant',
    content: `First, check your spam or junk folder — reset emails sometimes land there. If it's not there, wait 5 minutes and request another one from the login page via "Forgot password". If it still doesn't arrive, your email address on file might be different from the one you're trying — in that case contact support with your username and they can verify it.`,
  },
];
