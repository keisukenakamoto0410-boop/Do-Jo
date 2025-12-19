export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-[#F8FAFB] py-12 px-4">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-lg p-8">
        <div className="mb-8">
          <div className="w-14 h-14 bg-gradient-to-br from-primary to-primary-dark rounded-2xl flex items-center justify-center mb-4 shadow-lg">
            <span className="text-white font-bold text-xl">道</span>
          </div>
          <h1 className="text-3xl font-bold text-[#1A2332] mb-2">
            Privacy Policy
          </h1>
          <p className="text-[#566573]">
            Last updated: December 18, 2025
          </p>
        </div>

        <div className="prose prose-lg max-w-none text-[#1A2332]">

          <h2 className="text-2xl font-bold text-[#00A8CC] mt-8 mb-4">
            1. Information We Collect
          </h2>
          <p className="text-[#566573] leading-relaxed mb-4">
            We collect information you provide directly to us, including:
          </p>
          <ul className="list-disc pl-6 text-[#566573] space-y-2 mb-4">
            <li>Account information (name, email, password)</li>
            <li>Profile information (bio, interests, language skills, career/education history)</li>
            <li>Study logs and learning progress data</li>
            <li>Session booking and payment information</li>
            <li>Communication with us or other users</li>
          </ul>

          <h2 className="text-2xl font-bold text-[#00A8CC] mt-8 mb-4">
            2. How We Use Your Information
          </h2>
          <p className="text-[#566573] leading-relaxed mb-4">
            We use collected information to:
          </p>
          <ul className="list-disc pl-6 text-[#566573] space-y-2 mb-4">
            <li>Provide and improve the Service</li>
            <li>Match learners with appropriate hosts</li>
            <li>Process payments and payouts</li>
            <li>Send service-related notifications</li>
            <li>Analyze usage patterns to improve the platform</li>
            <li>Enforce our Terms of Service</li>
          </ul>

          <h2 className="text-2xl font-bold text-[#00A8CC] mt-8 mb-4">
            3. Information Sharing
          </h2>
          <p className="text-[#566573] leading-relaxed mb-4">
            We may share your information with:
          </p>
          <ul className="list-disc pl-6 text-[#566573] space-y-2 mb-4">
            <li>Other users (profile information visible on the platform)</li>
            <li>Service providers who assist in operating the platform</li>
            <li>Legal authorities when required by law</li>
          </ul>
          <p className="text-[#566573] leading-relaxed mb-4">
            We do not sell your personal information to third parties.
          </p>

          <h2 className="text-2xl font-bold text-[#00A8CC] mt-8 mb-4">
            4. Data Security
          </h2>
          <p className="text-[#566573] leading-relaxed mb-4">
            We implement appropriate security measures to protect your personal information.
            However, no method of transmission over the Internet is 100% secure.
          </p>

          <h2 className="text-2xl font-bold text-[#00A8CC] mt-8 mb-4">
            5. Data Retention
          </h2>
          <p className="text-[#566573] leading-relaxed mb-4">
            We retain your information for as long as your account is active or as needed
            to provide services. You may request deletion of your account and associated data.
          </p>

          <h2 className="text-2xl font-bold text-[#00A8CC] mt-8 mb-4">
            6. Your Rights
          </h2>
          <p className="text-[#566573] leading-relaxed mb-4">
            You have the right to:
          </p>
          <ul className="list-disc pl-6 text-[#566573] space-y-2 mb-4">
            <li>Access your personal data</li>
            <li>Correct inaccurate data</li>
            <li>Request deletion of your data</li>
            <li>Object to processing of your data</li>
            <li>Export your data in a portable format</li>
          </ul>

          <h2 className="text-2xl font-bold text-[#00A8CC] mt-8 mb-4">
            7. Cookies and Tracking
          </h2>
          <p className="text-[#566573] leading-relaxed mb-4">
            We use cookies and similar technologies to maintain sessions, remember preferences,
            and analyze usage. You can control cookies through your browser settings.
          </p>

          <h2 className="text-2xl font-bold text-[#00A8CC] mt-8 mb-4">
            8. Children&apos;s Privacy
          </h2>
          <p className="text-[#566573] leading-relaxed mb-4">
            Our Service is not directed to individuals under 18. We do not knowingly
            collect personal information from children.
          </p>

          <h2 className="text-2xl font-bold text-[#00A8CC] mt-8 mb-4">
            9. International Data Transfer
          </h2>
          <p className="text-[#566573] leading-relaxed mb-4">
            Your information may be transferred to and processed in countries other than
            your own. We ensure appropriate safeguards are in place for such transfers.
          </p>

          <h2 className="text-2xl font-bold text-[#00A8CC] mt-8 mb-4">
            10. Changes to This Policy
          </h2>
          <p className="text-[#566573] leading-relaxed mb-4">
            We may update this Privacy Policy from time to time. We will notify you of
            any changes by posting the new policy on this page.
          </p>

          <h2 className="text-2xl font-bold text-[#00A8CC] mt-8 mb-4">
            11. Contact Us
          </h2>
          <p className="text-[#566573] leading-relaxed mb-4">
            If you have questions about this Privacy Policy, please contact us at:{" "}
            <a href="mailto:privacy@dojo.com" className="text-[#00A8CC] hover:underline">
              privacy@dojo.com
            </a>
          </p>

        </div>
      </div>
    </div>
  );
}
