interface Document {
  content: string;
  metadata: Record<string, string>;
}

export const documents: Document[] = [
  {
    content:
      'To reset your password on Acme Learning Hub, go to the login page and click "Forgot Password". Enter your registered email address and you will receive a reset link within 5 minutes. The link expires after 24 hours. If you do not receive the email, check your spam folder or contact support@acmelearning.com.',
    metadata: { category: 'account', topic: 'password-reset' },
  },
  {
    content:
      'Acme Learning Hub offers three subscription plans: Free (access to 50+ courses), Pro ($19/month, unlimited courses + certificates), and Team ($49/month per seat, includes admin dashboard and progress tracking). Annual billing gives you 2 months free on Pro and Team plans.',
    metadata: { category: 'billing', topic: 'pricing-plans' },
  },
  {
    content:
      'To cancel your subscription, go to Account Settings → Billing → Cancel Subscription. Your access continues until the end of the current billing period. We do not offer prorated refunds for mid-cycle cancellations. You can resubscribe at any time without losing your course progress.',
    metadata: { category: 'billing', topic: 'cancellation' },
  },
  {
    content:
      'Course completion certificates are available on Pro and Team plans. After finishing all lessons and passing the final quiz with a score of 70% or higher, a certificate is automatically generated under My Profile → Certificates. Certificates include a unique verification ID and can be shared directly to LinkedIn.',
    metadata: { category: 'courses', topic: 'certificates' },
  },
  {
    content:
      'Acme Learning Hub supports offline access through our mobile app (iOS and Android). On a Pro or Team plan, you can download up to 20 course videos for offline viewing. Downloads expire after 30 days and must be renewed while connected to the internet. Free plan users cannot download content.',
    metadata: { category: 'courses', topic: 'offline-access' },
  },
  {
    content:
      'To join a community discussion forum, navigate to any course page and click the "Community" tab. You can post questions, share notes, and reply to other learners. Community moderators are available Monday–Friday 9am–6pm UTC. Please follow the community guidelines: no spam, no self-promotion, and be respectful.',
    metadata: { category: 'community', topic: 'discussion-forums' },
  },
  {
    content:
      'Acme Learning Hub instructors are vetted professionals. To become an instructor, apply at acmelearning.com/teach. Requirements include a portfolio of prior teaching or industry experience, a sample lesson video, and passing a content review. Instructors earn 60% royalty on course sales and get access to analytics.',
    metadata: { category: 'instructors', topic: 'become-instructor' },
  },
  {
    content:
      'If a course video will not play, try the following steps: (1) Clear your browser cache and reload the page. (2) Disable browser extensions, especially ad blockers. (3) Switch to a supported browser: Chrome, Firefox, or Edge. (4) Check your internet speed — we recommend at least 5 Mbps for HD playback. If the issue persists, report it via Help → Report a Problem.',
    metadata: { category: 'technical', topic: 'video-playback' },
  },
  {
    content:
      'Acme Learning Hub provides a 7-day money-back guarantee on new Pro and Team subscriptions. To request a refund, contact support within 7 days of your first charge with your order ID. Refunds are processed within 5–10 business days back to your original payment method. This policy does not apply to renewals.',
    metadata: { category: 'billing', topic: 'refund-policy' },
  },
  {
    content:
      'The Team plan admin dashboard lets you manage seats, track learner progress, assign courses, and export completion reports as CSV. To add a new team member, go to Admin → Members → Invite. Invited users receive an email to join your workspace. Unused seats can be reassigned at any time without extra charge.',
    metadata: { category: 'teams', topic: 'admin-dashboard' },
  },
  {
    content:
      'Acme Learning Hub integrates with Slack, Notion, and GitHub. The Slack integration sends course reminders and completion notifications to your chosen channel. The Notion integration syncs your course notes automatically. The GitHub integration lets instructors embed live code exercises directly in lessons. All integrations are available on Pro and Team plans.',
    metadata: { category: 'integrations', topic: 'third-party-integrations' },
  },
  {
    content:
      'To change the language or subtitle settings on a course video, click the gear icon (⚙) on the video player and select Subtitles/CC. Over 200 courses offer auto-generated subtitles in English, Spanish, French, Portuguese, and German. You can also adjust playback speed between 0.5× and 2×. Subtitle preferences are saved per course.',
    metadata: { category: 'courses', topic: 'subtitles-language' },
  },
  {
    content:
      'Acme Learning Hub uses industry-standard 256-bit SSL encryption for all data in transit. Your payment information is processed by Stripe and never stored on our servers. You can enable two-factor authentication (2FA) under Account Settings → Security using an authenticator app or SMS.',
    metadata: { category: 'account', topic: 'security-2fa' },
  },
  {
    content:
      'To update your billing information, go to Account Settings → Billing → Payment Methods. You can add, remove, or set a default credit or debit card. Visa, Mastercard, American Express, and PayPal are accepted. Changes take effect on your next billing cycle. We will email you a receipt for every charge.',
    metadata: { category: 'billing', topic: 'payment-methods' },
  },
  {
    content:
      'Acme Learning Hub course progress is saved automatically as you complete each lesson. If you leave mid-lesson, a resume prompt will appear the next time you open the course. Progress syncs across all your devices in real time. Resetting your progress is possible under Course Settings → Reset Progress.',
    metadata: { category: 'courses', topic: 'progress-tracking' },
  },
  {
    content:
      'The mobile app for Acme Learning Hub is available for iOS 14+ and Android 8+. Download it from the App Store or Google Play. The app supports offline downloads, push notifications for course deadlines, and Dark Mode. Mobile app features are identical to the web experience for Pro and Team subscribers.',
    metadata: { category: 'technical', topic: 'mobile-app' },
  },
  {
    content:
      'Acme Learning Hub offers a referral program: share your unique referral link from Account Settings → Referrals. When a friend subscribes to a paid plan, you both receive one month free. There is no limit to how many referrals you can make. Referral credits are applied automatically at the next billing date.',
    metadata: { category: 'account', topic: 'referral-program' },
  },
  {
    content:
      'To search for courses on Acme Learning Hub, use the search bar at the top of any page. You can filter results by category, skill level (Beginner, Intermediate, Advanced), duration, rating, and language. Saved searches and wishlisted courses appear under My Library → Saved. New courses are added every week.',
    metadata: { category: 'courses', topic: 'course-search' },
  },
  {
    content:
      'Instructor analytics are available on the Instructor Dashboard under Earnings & Stats. You can view total enrollments, average ratings, revenue by course, and student completion rates. Data is updated daily. You can export reports as CSV for any custom date range.',
    metadata: { category: 'instructors', topic: 'instructor-analytics' },
  },
  {
    content:
      'Acme Learning Hub supports single sign-on (SSO) for Team plan customers. Compatible identity providers include Okta, Azure AD, and Google Workspace. To configure SSO, go to Admin → Security → SSO Configuration and follow the SAML 2.0 setup guide. Contact enterprise@acmelearning.com for assisted setup.',
    metadata: { category: 'teams', topic: 'sso-configuration' },
  },
  {
    content:
      'If you forget your registered email address, contact support@acmelearning.com with a government-issued ID and the name on your account. Our team will verify your identity and recover your account within 2 business days. For Team plan accounts, your workspace admin can also look up your email in Admin → Members.',
    metadata: { category: 'account', topic: 'account-recovery' },
  },
  {
    content:
      'Acme Learning Hub quizzes use a randomized question pool to discourage sharing answers. You may retake a quiz as many times as you like, but only your highest score is recorded. Instant feedback is shown after each attempt. Some advanced courses include proctored assessments that require webcam access.',
    metadata: { category: 'courses', topic: 'quizzes-assessments' },
  },
  {
    content:
      'To download your invoice or billing history, go to Account Settings → Billing → Invoice History. Invoices are available as PDF for the past 24 months. For Team plans, admins can download consolidated invoices for the entire workspace. VAT or GST is applied based on your billing country and is shown on every invoice.',
    metadata: { category: 'billing', topic: 'invoices' },
  },
  {
    content:
      'Acme Learning Hub course content is reviewed annually for accuracy. If you notice outdated or incorrect information in a lesson, click the flag icon beneath the video and submit a content report. Our editorial team reviews reports within 7 business days and notifies the instructor. Verified corrections are deployed within 14 days.',
    metadata: { category: 'courses', topic: 'content-accuracy' },
  },
  {
    content:
      'The learning path feature on Acme Learning Hub groups related courses into structured sequences. Completing a full learning path earns a Path Completion badge visible on your profile. Learning paths are curated by domain experts and updated quarterly. You can enroll in multiple learning paths simultaneously.',
    metadata: { category: 'courses', topic: 'learning-paths' },
  },
  {
    content:
      'Acme Learning Hub offers live Q&A sessions hosted by instructors every month. Upcoming sessions are listed under Community → Live Events. Sessions are recorded and available to replay within 48 hours for enrolled students. You can submit questions in advance through the event page.',
    metadata: { category: 'community', topic: 'live-qa-sessions' },
  },
  {
    content:
      'To change your account email address, go to Account Settings → Profile → Email and enter your new address. A confirmation link is sent to both the old and new email addresses. The change takes effect only after both are confirmed. If you no longer have access to your old email, contact support for manual verification.',
    metadata: { category: 'account', topic: 'change-email' },
  },
  {
    content:
      'Acme Learning Hub accessibility features include keyboard navigation, screen-reader-compatible transcripts for all videos, high-contrast mode, and adjustable font sizes. If you encounter an accessibility barrier, contact accessibility@acmelearning.com. We aim to meet WCAG 2.1 AA standards across the platform.',
    metadata: { category: 'technical', topic: 'accessibility' },
  },
  {
    content:
      'Team plan customers can create custom learning tracks by bundling specific courses into a curated playlist for their employees. Go to Admin → Learning Tracks → Create New Track. Tracks can be assigned to individual members or entire groups. Completion of assigned tracks is tracked in the admin dashboard.',
    metadata: { category: 'teams', topic: 'custom-learning-tracks' },
  },
  {
    content:
      'Acme Learning Hub course ratings are based on verified student reviews submitted after completing at least 30% of a course. The overall rating is a weighted average of all reviews. Instructors may respond publicly to reviews. Reviews violating community guidelines are removed within 48 hours after moderation.',
    metadata: { category: 'courses', topic: 'course-ratings-reviews' },
  },
];
