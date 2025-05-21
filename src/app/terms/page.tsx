"use client"

import Image from "next/image"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import logo from "../../../public/Image/logo reviai.png"

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#121212] py-12 px-8">
      {/* Header */}
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-2 mb-12">
          <Image src={logo || "/placeholder.svg"} alt="Revi AI Logo" width={46} height={34} />
          <span className="text-sm text-white">Revi AI</span>
        </div>

        <Button variant="link" asChild className="p-0 mb-8 text-zinc-400 hover:text-zinc-300">
          <Link href="/">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Login
          </Link>
        </Button>

        <h1 className="mb-6 text-2xl font-semibold text-white">Terms of Use</h1>

        <div className="mb-8 text-xs text-zinc-400">Last Updated: {new Date().toLocaleDateString()}</div>

        <div className="space-y-8 text-sm leading-relaxed text-zinc-400">
          <p>
            Welcome to REVIAI, an application provided by REVIAI Technologies Limited (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;). These
            Terms of Use (&quot;Terms&quot;) govern your access to and use of the REVIAI app, including any content, features, and
            services offered through it (collectively, the &quot;Service&quot;). By accessing or using the Service, you agree to
            be bound by these Terms. If you do not agree, please do not use the Service.
          </p>

          <section>
            <h2 className="mb-4 text-lg font-medium text-white">1. Acceptance of Terms</h2>
            <p>
              By downloading, installing, or using the REVIAI app, you acknowledge that you have read, understood, and
              agree to be bound by these Terms, as well as our Privacy Policy, which is incorporated herein by
              reference. These Terms form a legally binding agreement between you (&quot;User,&quot; &quot;you,&quot; or &quot;your&quot;) and REVIAI
              Technologies Limited. If you are using the Service on behalf of an organization, you represent that you
              have the authority to bind that organization to these Terms.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-lg font-medium text-white">2. Description of Service</h2>
            <p>
              The REVIAI app is an AI-powered platform designed to assist home renters, buyers, and tenants by providing
              transparent insights into properties, landlords, developers and real estate agents. Reviai does not act as
              a broker, advisor, or intermediary in property transactions and retains no custody or control over user
              funds or assets.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-lg font-medium text-white">3. Eligibility</h2>
            <p className="mb-3">To use the Service, you must:</p>
            <ul className="pl-5 space-y-2 list-disc">
              <li>Be at least 13 years old or the age of majority in your jurisdiction, whichever is higher;</li>
              <li>Have the legal capacity to enter into a binding agreement; and</li>
              <li>Not be prohibited from using the Service under applicable laws.</li>
            </ul>
            <p className="mt-3">
              We reserve the right to refuse access to the Service to anyone for any reason at our sole discretion.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-lg font-medium text-white">4. License to Use the Service</h2>
            <p className="mb-3">
              Subject to your compliance with these Terms, REVIAI Technologies Limited grants you a limited,
              non-exclusive, non-transferable, revocable license to access and use the Service for personal,
              non-commercial purposes. This license does not permit you to:
            </p>
            <ul className="pl-5 space-y-2 list-disc">
              <li>Modify, reverse-engineer, decompile, or disassemble the Service;</li>
              <li>Distribute, sublicense, or otherwise transfer the Service to third parties;</li>
              <li>Use the Service for any unlawful purpose or in violation of these Terms.</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-4 text-lg font-medium text-white">5. User Accounts</h2>
            <p className="mb-3">
              To access certain features of the Service, you may need to create an account. You agree to:
            </p>
            <ul className="pl-5 space-y-2 list-disc">
              <li>Provide accurate, current, and complete information during registration;</li>
              <li>Maintain the security of your account credentials; and</li>
              <li>Notify us immediately of any unauthorized use of your account.</li>
            </ul>
            <p className="mt-3">
              You are solely responsible for all activities that occur under your account. We may suspend or terminate
              your account if we suspect any breach of these Terms.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-lg font-medium text-white">6. User Conduct</h2>
            <p className="mb-3">You agree not to:</p>
            <ul className="pl-5 space-y-2 list-disc">
              <li>
                Use the Service to transmit harmful, false, intentionally inaccurate, offensive, or illegal content;
              </li>
              <li>Interfere with or disrupt the Service, including through hacking or introducing malicious code;</li>
              <li>Collect or harvest data from the Service without our express consent;</li>
              <li>Impersonate any person or entity or misrepresent your affiliation with any party.</li>
              <li>Use the App to harass, defame, or discriminate against individuals or entities.</li>
            </ul>
            <p className="mt-3">
              We reserve the right to investigate and take appropriate action, including legal action, against any User
              who violates this section.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-lg font-medium text-white">7. Intellectual Property</h2>
            <p>
              All content, trademarks, and other intellectual property within the Service are owned by REVIAI
              Technologies Limited or its licensors. You may not reproduce, distribute, or create derivative works from
              any part of the Service without our prior written permission, except as expressly permitted under these
              Terms.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-lg font-medium text-white">8. Privacy</h2>
            <p>
              Your use of the Service is subject to our Privacy Policy, which explains how we collect, use, and protect
              your personal information. By using the Service, you consent to such processing as described therein.
              Personal data will be anonymized to comply with extant regulations. You acknowledge that data provided by
              the App (e.g trust scores, predictions) is for informational purposes only and not guaranteed to be
              error-free.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-lg font-medium text-white">9. Third-Party Links and Services</h2>
            <p>
              The Service may contain links to third-party websites or services that are not controlled by us. We are
              not responsible for the content, policies, or practices of these third parties, and you access them at
              your own risk.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-lg font-medium text-white">10. Termination</h2>
            <p>
              We may terminate or suspend your access to the Service at any time, with or without notice, for any
              reason, including if we believe you have violated these Terms. Upon termination, your license to use the
              Service ends, and you must cease all use of it. Sections 7, 11, 12, and 13 will survive termination.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-lg font-medium text-white">11. Disclaimer of Warranties</h2>
            <p>
              The Service is provided &quot;as is&quot; and &quot;as available&quot; without warranties of any kind, express or implied,
              including but not limited to warranties of merchantability, fitness for a particular purpose, or
              non-infringement. We do not guarantee that the Service will be uninterrupted, error-free, or secure.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-lg font-medium text-white">12. Limitation of Liability</h2>
            <p>
              To the fullest extent permitted by law, REVIAI Technologies Limited, its affiliates, officers, directors,
              employees, and agents will not be liable for any indirect, incidental, special, consequential, or punitive
              damages arising from your use of the Service, even if advised of the possibility of such damages. Our
              total liability to you for any claim will not exceed the amount you paid us, if any, to use the Service in
              the preceding 12 months.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-lg font-medium text-white">13. Governing Law and Dispute Resolution</h2>
            <p>
              These Terms are governed by the laws of The Federal Republic of Nigeria, without regard to its conflict of
              law principles. You agree to attempt informal resolution of disputes with Reviai Technologies Limited
              before initiating legal action. If unresolved, either party may then seek injunctive relief in a court of
              competent jurisdiction.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-lg font-medium text-white">14. Changes to the Terms</h2>
            <p>
              We may update these Terms from time to time. We will notify you of material changes by posting the updated
              Terms within the Service or via email. Your continued use of the Service after such changes constitutes
              your acceptance of the revised Terms.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-lg font-medium text-white">15. Contact Us</h2>
            <p>
              If you have questions about these Terms, please contact us at:{" "}
              <a href="mailto:support@reviai.com" className="text-blue-400 hover:underline">
              Info@reviai.ai
              </a>
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
