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
          <Image src={logo || "/placeholder.svg"} alt="Revi AI Logo" width={46} height={34} />
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
          <section>
            <h2 className="mb-4 text-lg font-medium text-white">INTRODUCTION</h2>
            <p className="mb-3">
              REVIAI Technologies Limited (hereafter referred to as &quot;REVIAI&quot;, &quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) is a real estate
              virtual artificial intelligence platform, committed to safeguarding the privacy rights of our users (&quot;Data
              Subjects&quot;). REVIAI helps people stay informed about their real estate rights and find a reliable home
              through AI-driven insights, verified reviews and secure transactions, empowering people with full
              confidence to make informed rental decisions.
            </p>
            <p className="mb-3">
              This Privacy Policy outlines our practices regarding the collection, use, and protection of personal data
              in compliance with Section 37 of the Constitution of the Federal Republic of Nigeria (CFRN) 1999 (as
              amended), the Nigeria Data Protection Act (NDPA) 2023, and other relevant legal instruments.
            </p>
            <p>
              We may change this Privacy Policy from time to time. If we make changes, we will notify you by revising
              the date at the top of this policy. If we make material changes, we will provide you with additional
              notice (such as by adding a statement to the Website, App, or sending you a notification). We encourage
              you to review this Privacy Policy regularly to stay informed about our information practices and the
              choices available to you.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-lg font-medium text-white">OUR GUIDING PRINCIPLES ON DATA PROCESSING</h2>
            <p className="mb-3">
              In processing your personal data, we adhere strictly to the principles set out under Section 24 of the
              NDPA. Our obligations include ensuring that personal data is:
            </p>
            <ul className="pl-5 space-y-2 list-disc">
              <li>Processed in a fair, lawful, and transparent manner;</li>
              <li>
                Collected for specified, explicit, and legitimate purposes, and not further processed in a way
                incompatible with these purposes;
              </li>
              <li>
                Adequate, relevant, and limited to the minimum necessary for the purposes for which it was collected;
              </li>
              <li>Retained for no longer than necessary to achieve the lawful bases for which it was collected;</li>
              <li>Accurate, complete, not misleading, and, where necessary, kept up to date; and</li>
              <li>
                Processed in a manner that ensures appropriate security, including protection against unauthorised or
                unlawful processing, access, loss, destruction, damage, or any form of data breach.
              </li>
            </ul>
            <p className="mt-3">
              We are also committed to ensuring accountability, demonstrating duty of care to you, and upholding data
              confidentiality, integrity, and availability.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-lg font-medium text-white">SCOPE OF DATA PROCESSING</h2>
            <p className="mb-3">
              Depending on your interaction with us, we may process various types of personal data for different
              purposes and lawful bases, including:
            </p>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-zinc-700">
                    <th className="py-2 pr-4 text-left text-white">S/N</th>
                    <th className="py-2 pr-4 text-left text-white">Purpose</th>
                    <th className="py-2 pr-4 text-left text-white">Type of Data</th>
                    <th className="py-2 text-left text-white">Lawful Basis</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-zinc-700">
                    <td className="py-2 pr-4">1.</td>
                    <td className="py-2 pr-4">Service Provision</td>
                    <td className="py-2 pr-4">Name, Phone, Email Address, Contact Address</td>
                    <td className="py-2">Contractual necessity to provide our services effectively</td>
                  </tr>
                  <tr className="border-b border-zinc-700">
                    <td className="py-2 pr-4">2.</td>
                    <td className="py-2 pr-4">Notifications</td>
                    <td className="py-2 pr-4">Name, Phone, Email Address</td>
                    <td className="py-2">Consent (to inform you about updates or changes to our services)</td>
                  </tr>
                  <tr className="border-b border-zinc-700">
                    <td className="py-2 pr-4">3.</td>
                    <td className="py-2 pr-4">Data Analytics</td>
                    <td className="py-2 pr-4">Cookies, Usage data, IP Address</td>
                    <td className="py-2">Consent (to improve our services and user experience)</td>
                  </tr>
                  <tr className="border-b border-zinc-700">
                    <td className="py-2 pr-4">4.</td>
                    <td className="py-2 pr-4">Security</td>
                    <td className="py-2 pr-4">IP Address, Device Information</td>
                    <td className="py-2">Legal obligation to ensure the security of our platforms and services</td>
                  </tr>
                  <tr className="border-b border-zinc-700">
                    <td className="py-2 pr-4">5.</td>
                    <td className="py-2 pr-4">Employment</td>
                    <td className="py-2 pr-4">Name, Contact Details, Educational and Professional Records</td>
                    <td className="py-2">Contractual necessity for employment purposes</td>
                  </tr>
                  <tr className="border-b border-zinc-700">
                    <td className="py-2 pr-4">6.</td>
                    <td className="py-2 pr-4">Contractual Matters</td>
                    <td className="py-2 pr-4">Name, Contact Details, Vendor Details, Vendor Payment Information</td>
                    <td className="py-2">Contractual necessity to manage our business relationships</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="mt-3">
              Please note that these categories are not exhaustive, and we may process additional data as required by
              law or best practices, always ensuring your rights as a data subject are protected.
            </p>
            <p className="mt-3">
              In addition, you are free to revoke consent at any given time, however in some cases, it may affect your
              usage of our platform.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-lg font-medium text-white">RIGHTS OF DATA SUBJECTS</h2>
            <p className="mb-3">We uphold your privacy rights, including but not limited to:</p>
            <ul className="pl-5 space-y-2 list-disc">
              <li>Right to be Informed</li>
              <li>Right to Access Information</li>
              <li>Right to Rectification</li>
              <li>Right to Object to Processing</li>
              <li>Right to Restriction of Processing</li>
              <li>Right to Data Portability</li>
              <li>Right to be Forgotten</li>
              <li>Right to Object to Automated Decision Making (entitling you to human intervention)</li>
            </ul>
            <p className="mt-3">
              You also have the right to lodge a complaint with the Nigeria Data Protection Commission as outlined in
              Part VI of the NDPA.
            </p>
            <p className="mt-3">
              To exercise your rights as a data subject, email our Data Protection Officer at info@reviai.org.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-lg font-medium text-white">TRANSFER OF DATA TO THIRD PARTIES AND COUNTRIES</h2>
            <p className="mb-3">
              REVIAI Technologies Limited is committed to safeguarding your privacy. To provide our services
              effectively, we may engage third-party service providers in the following areas:
            </p>
            <ul className="pl-5 space-y-2 list-disc">
              <li>
                AI-Driven Insights: Utilising artificial intelligence to analyse and provide comprehensive property and
                landlord information
              </li>
              <li>
                Data Analytics: Processing user interactions and feedback to enhance our services and user experience
              </li>
              <li>
                Digital Marketing: Promoting our services through various online channels to reach and inform potential
                users
              </li>
              <li>Web Development: Maintaining and improving our website to ensure a seamless user experience</li>
              <li>
                Cybersecurity: Protecting our platform and user data from unauthorised access and potential threats
              </li>
              <li>Cloud service providers: Storing our data on secure cloud storage servers</li>
            </ul>
            <p className="mt-3">
              In transferring your data to these third parties, and in some instances third countries, we comply with
              the Nigeria Data Protection Act (NDPA) 2023, ensuring that appropriate safeguards are in place to protect
              your data.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-lg font-medium text-white">DISCLOSURE OF INFORMATION</h2>
            <p className="mb-3">We disclose the categories of information described above as follows:</p>
            <ul className="pl-5 space-y-2 list-disc">
              <li>
                <strong>Vendors:</strong> we disclose information to vendors, service providers, contractors, and
                consultants that need this information to provide services to us, such as companies that assist us with
                web and app hosting, payment processing, customer service, analytics, and marketing and advertising
              </li>
              <li>
                <strong>Regulatory Authorities:</strong> we may disclose information to Regulatory Authorities and
                others for Compliance purposes. In certain instances, disclosure is in accordance with, or required by,
                any applicable law, legal process, or legal obligation including lawful requests by public authorities
                to meet law enforcement requirements
              </li>
              <li>
                <strong>Affiliates:</strong> we reserve the right to disclose information between and among REVIAI and
                any current or future parents, affiliates, subsidiaries, and other companies under common control and
                ownership
              </li>
              <li>
                <strong>Consent:</strong> we may disclose information when we have your explicit consent
              </li>
            </ul>
            <p className="mt-3">
              We may also disclose de-identified information that cannot reasonably be used to identify you.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-lg font-medium text-white">TECHNICAL INFORMATION AND COOKIES</h2>
            <p className="mb-3">
              Our website collects certain technical information, such as your IP address and browser details, to
              enhance your user experience. We also use cookies—small text files stored on your device—to remember your
              preferences and provide personalised services. These cookies are secured and not vulnerable to misuse.
            </p>
            <p className="mb-3">
              By using our website, you consent to our use of cookies in accordance with this Privacy Policy. When you
              first visit our website, you will be presented with a cookie banner requesting your consent. You have the
              right to accept or decline cookies.
            </p>
            <ul className="pl-5 space-y-2 list-disc">
              <li>
                <strong>Essential Cookies:</strong> Required for the website to function properly. These cannot be
                disabled.
              </li>
              <li>
                <strong>Analytics Cookies:</strong> Help us understand how visitors interact with our site, improving
                user experience.
              </li>
              <li>
                <strong>Marketing Cookies:</strong> Used to deliver relevant advertisements based on your interactions
                with our services.
              </li>
            </ul>
            <p className="mt-3">
              You can manage your cookie preferences at any time by adjusting your browser settings or using our cookie
              management tool available on the website.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-lg font-medium text-white">DATA SECURITY AND INTEGRITY</h2>
            <p className="mb-3">
              We employ industry-standard technical, administrative, and organisational measures to safeguard Personal
              Data from loss, misuse, and unauthorised access, disclosure, alteration, or destruction. This includes
              data encryption, role-based access control, back ups, data resilience, amongst others.
            </p>
            <p>
              In the event of a data breach, REVIAI will notify the Nigeria Data Protection Commission within 72 hours
              of discovery, as well as affected data subjects without undue delay if their rights and freedoms are
              impacted by the breach.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-lg font-medium text-white">PURPOSE AND STORAGE LIMITATION</h2>
            <p>
              We collect and store personal data only as long as necessary to fulfill the purposes for which it was
              collected, in accordance with legal requirements and best practices. This ensures your privacy rights are
              respected under the NDPA and other applicable data protection legislation.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-lg font-medium text-white">DATA RETENTION</h2>
            <p className="mb-3">
              We retain your Personal Data for only as long as we need in order to provide our Services to you, or for
              other legitimate business purposes such as resolving disputes, safety and security reasons, or complying
              with our legal obligations. How long we retain Personal Data is defined in our Data Retention Schedule,
              and depends on a number of factors, such as:
            </p>
            <ul className="pl-5 space-y-2 list-disc">
              <li>Our purpose for processing the data (whether we need to retain the data to provide our Services);</li>
              <li>The amount, nature, and sensitivity of the information;</li>
              <li>The potential risk of harm from unauthorised use or disclosure;</li>
              <li>Any statutory retention requirements that we are subject to.</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-4 text-lg font-medium text-white">CHILDREN</h2>
            <p>
              Our Services are not directed to, or intended for, children under 13. We do not knowingly collect Personal
              Data from children under 13. If you have reason to believe that a child under 13 has provided Personal
              Data to REVIAI through the Services, please email us at info@reviai.org⁠. We will investigate any
              notification and, if appropriate, delete the Personal Data from our systems. Users under 18 must have
              permission from their parent or guardian to use our Services.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-lg font-medium text-white">USE OF AI AND PRIVACY</h2>
            <p className="mb-3">
              We use Artificial Intelligence (AI) to enhance our services, improve user experience, and automate
              decision-making processes. When AI is used to process personal data, we ensure that it complies with
              applicable data protection laws and maintains the confidentiality, integrity, and security of your
              information.
            </p>
            <p className="mb-3">Potential privacy risks related to the use of AI include:</p>
            <ul className="pl-5 space-y-2 list-disc">
              <li>
                <strong>Automated Decision-Making:</strong> AI may be used to make decisions based on personal data.
                Where such decisions have a legal or negative significant impact, you have the right to request human
                intervention, express your views, and contest the decision.
              </li>
              <li>
                <strong>Data Accuracy:</strong> We take reasonable steps to ensure that AI-generated insights and
                decisions are based on accurate and up-to-date data, with data validation checks in place.
              </li>
              <li>
                <strong>Bias and Fairness:</strong> We regularly monitor and audit AI systems to prevent bias and
                discrimination in automated decision-making.
              </li>
              <li>
                <strong>Transparency:</strong> We are committed to providing clear information about how AI processes
                your personal data and the logic involved in automated decisions.
              </li>
            </ul>
            <p className="mt-3">
              If you have concerns about how our AI processes your personal data or the impact of automated decisions,
              you have the right to contact us and request clarification or intervention.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-lg font-medium text-white">CONTACT INFORMATION</h2>
            <p className="mb-3">
              For any questions or concerns regarding this Privacy Policy or our data processing practices, please
              contact our Data Protection Officer at:
            </p>
            <p>Email: Info@reviai.ai</p>
            <p>Effective Date: March 15, 2025</p>
          </section>
        </div>
      </div>
    </div>
  )
}
