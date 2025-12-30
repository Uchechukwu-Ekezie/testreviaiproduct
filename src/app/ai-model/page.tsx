import { Metadata } from "next";
import Link from "next/link";
import { siteConfig } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "AI Real Estate Model | Advanced Property Intelligence Platform",
  description:
    "Experience our cutting-edge AI model that revolutionizes real estate. Get intelligent property recommendations, automated valuations, and smart market insights powered by machine learning algorithms.",
  keywords: [
    "AI real estate model",
    "property intelligence AI",
    "real estate machine learning",
    "AI property valuation",
    "intelligent property recommendations",
    "automated real estate analysis",
    "AI housing market predictions",
    "smart property insights",
    "machine learning real estate",
    "AI apartment finder",
    "intelligent property search algorithm",
    "real estate prediction model",
    "AI property matching",
    "automated property scoring",
    "intelligent real estate analytics",
  ],
  alternates: {
    canonical: "/ai-model",
  },
  openGraph: {
    title: "AI Real Estate Model | Advanced Property Intelligence",
    description:
      "Discover how our AI model transforms property search with intelligent recommendations and automated insights.",
    url: `${siteConfig.url}/ai-model`,
    siteName: siteConfig.name,
    images: [
      {
        url: siteConfig.ogImage,
        width: 1200,
        height: 630,
        alt: "AI Real Estate Model - ReviAI",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "AI Real Estate Model | ReviAI Technology",
    description:
      "Revolutionary AI model for intelligent property search and automated real estate insights.",
    images: [siteConfig.ogImage],
    creator: "@ReviAiTech",
  },
};

export default function AIModelPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 to-purple-900/20"></div>
        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            AI Real Estate Model
          </h1>
          <p className="text-xl md:text-2xl mb-8 text-gray-300">
            Revolutionary artificial intelligence transforming property search
            and real estate insights
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/properties"
              className="px-8 py-4 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition-colors text-center"
            >
              Try AI Model
            </Link>
            <button className="px-8 py-4 border border-white/20 hover:bg-white/10 rounded-lg font-semibold transition-colors">
              Learn More
            </button>
          </div>
        </div>
      </section>

      {/* AI Features Section */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-16">
            AI-Powered Real Estate Intelligence
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-gray-900 p-8 rounded-xl">
              <div className="w-16 h-16 bg-blue-600 rounded-lg flex items-center justify-center mb-6">
                <svg
                  className="w-8 h-8"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold mb-4">
                Smart Property Matching
              </h3>
              <p className="text-gray-400">
                Our AI analyzes your preferences, budget, and lifestyle to find
                the perfect property matches with 95% accuracy.
              </p>
            </div>

            <div className="bg-gray-900 p-8 rounded-xl">
              <div className="w-16 h-16 bg-purple-600 rounded-lg flex items-center justify-center mb-6">
                <svg
                  className="w-8 h-8"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold mb-4">Predictive Analytics</h3>
              <p className="text-gray-400">
                Advanced machine learning predicts property values, rental
                yields, and market trends with real-time data analysis.
              </p>
            </div>

            <div className="bg-gray-900 p-8 rounded-xl">
              <div className="w-16 h-16 bg-green-600 rounded-lg flex items-center justify-center mb-6">
                <svg
                  className="w-8 h-8"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold mb-4">Automated Insights</h3>
              <p className="text-gray-400">
                Get instant property scores, neighborhood analysis, and
                investment potential reports generated by AI.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* AI Technology Section */}
      <section className="py-20 px-6 bg-gray-900">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-16">
            Cutting-Edge AI Technology
          </h2>

          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h3 className="text-3xl font-bold mb-6">
                Machine Learning Algorithms
              </h3>
              <p className="text-gray-400 mb-6">
                Our proprietary AI model uses advanced neural networks and deep
                learning to understand complex real estate patterns, market
                dynamics, and user preferences.
              </p>

              <ul className="space-y-4">
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                  Natural Language Processing for property descriptions
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                  Computer Vision for property image analysis
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                  Predictive modeling for market trends
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                  Recommendation engines for personalized results
                </li>
              </ul>
            </div>

            <div className="bg-black p-8 rounded-xl">
              <div className="text-green-400 font-mono text-sm">
                <div>$ Initializing AI Model...</div>
                <div>$ Loading neural networks... ✓</div>
                <div>$ Analyzing market data... ✓</div>
                <div>$ Processing user preferences... ✓</div>
                <div>$ Generating recommendations... ✓</div>
                <div className="mt-4 text-white">
                  &gt; AI Model Status:{" "}
                  <span className="text-green-400">ACTIVE</span>
                </div>
                <div className="text-white">
                  &gt; Properties Analyzed:{" "}
                  <span className="text-blue-400">2,847,392</span>
                </div>
                <div className="text-white">
                  &gt; Accuracy Rate:{" "}
                  <span className="text-green-400">95.7%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-6">
            Ready to Experience AI-Powered Real Estate?
          </h2>
          <p className="text-xl text-gray-400 mb-8">
            Join thousands of users who have discovered their perfect property
            with our AI technology.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/properties"
              className="px-8 py-4 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition-colors text-center"
            >
              Start Property Search
            </Link>
            <Link
              href="/signup"
              className="px-8 py-4 border border-white/20 hover:bg-white/10 rounded-lg font-semibold transition-colors text-center"
            >
              Create Account
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
