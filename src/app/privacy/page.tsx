"use client"

import Image from "next/image"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import logo from "../../../public/Image/logo reviai.png"

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#121212] py-12 px-8">
      {/* Header */}
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-2 mb-12">
          <Image
            src={logo}
            alt="Revi AI Logo"
            width={46}
            height={34}
           
          />
          <span className="text-sm text-white">Revi AI</span>
        </div>

        <Button variant="link" asChild className="p-0 mb-8 text-zinc-400 hover:text-zinc-300">
          <Link href="/">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Login
          </Link>
        </Button>

        <h1 className="mb-6 text-2xl font-semibold text-white">Privacy Policy</h1>

        <div className="mb-8 text-xs text-zinc-400">Last Updated: {new Date().toLocaleDateString()}</div>

        <div className="space-y-8 text-sm leading-relaxed text-zinc-400">
          <p>
            Welcome to Revi.ai! Your privacy is important to us. This Privacy Policy explains how we collect, use, and
            protect your personal information when you use our platform. By using Revi.ai, you agree to the practices
            described in this policy.
          </p>

          <section>
            <h2 className="mb-4 text-lg font-medium text-white">1. Information We Collect</h2>
            <p className="mb-3">
              When you use Revi.ai, we collect different types of information to enhance your experience and provide
              personalized service:
            </p>
            <ul className="pl-5 space-y-2 list-disc">
              <li>Personal Information: Name, email, and contact details</li>
              <li>Account Details: Name, email, phone number, and password when you sign up</li>
              <li>User Profile: Location (city, state, country), user role (Tenant, Buyer, Landlord, or Agent)</li>
              <li>Property Preferences: Your housing needs, budget, and preferred locations</li>
              <li>Communication Data: Messages, reviews, and interactions with landlords or agents</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-4 text-lg font-medium text-white">2. How We Use Your Information</h2>
            <p className="mb-3">We use the collected data to:</p>
            <ul className="pl-5 space-y-2 list-disc">
              <li>Provide personalized property suggestions</li>
              <li>Improve AI-powered property insights and local scores</li>
              <li>Process cases with landlords and agents</li>
              <li>Send relevant updates and notifications</li>
              <li>Enhance platform security and prevent fraudulent activities</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-4 text-lg font-medium text-white">3. How We Protect Your Information</h2>
            <p className="mb-3">
              We implement industry-standard security measures to protect your information. These include:
            </p>
            <ul className="pl-5 space-y-2 list-disc">
              <li>Data Encryption: Your data is encrypted during transmission and storage</li>
              <li>Access Controls: Only authorized personnel can access personal data</li>
              <li>Regular Security Updates: Continuous monitoring and system data protection</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-4 text-lg font-medium text-white">4. Who We Share Your Data With</h2>
            <p className="mb-3">We do not sell your personal data. However, we may share certain information with:</p>
            <ul className="pl-5 space-y-2 list-disc">
              <li>Service Providers: To facilitate property search and transactions</li>
              <li>Business Partners: For analytics and improving our services</li>
              <li>Legal Authorities: If required by law or compliance with regulations</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-4 text-lg font-medium text-white">5. Your Rights & Choices</h2>
            <p className="mb-3">As a user, you have control over your data:</p>
            <ul className="pl-5 space-y-2 list-disc">
              <li>Access & Modify: You can review and update your personal information in your account settings</li>
              <li>Data Deletion: Request removal of your information and data</li>
              <li>Marketing Preferences: Opt-out of marketing communications</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-4 text-lg font-medium text-white">6. Changes to This Privacy Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. Any changes will be communicated through our platform
              and/or via email when applicable.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-lg font-medium text-white">7. Contact Us</h2>
            <p className="mb-3">If you have any questions about this Privacy Policy, reach out to us at:</p>
            <ul className="pl-5 space-y-2 list-disc">
              <li>Email: [Your Contact Email]</li>
              <li>Address: [Your Company Address]</li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  )
}

