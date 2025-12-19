"use client"

import { useEffect } from "react"
import AOS from "aos"
import "aos/dist/aos.css"
import { HiSearch, HiStar, HiUser } from "react-icons/hi"

export default function WhyChooseUs() {
  useEffect(() => {
    AOS.init({ duration: 1000, once: true })
  }, [])

  return (
    <section className="text-white py-20 px-4">
      <div className="container mx-auto max-w-7xl">
        <div className="grid md:grid-cols-2 gap-12 mb-24">
          <div className="space-y-4" data-aos="fade-right" data-aos-delay="200">
            <h2 className="text-3xl md:text-4xl font-bold text-white">What We Do</h2>
            <p className="text-[18px] text-white/80 leading-relaxed">
              Revi.ai is your trusted guide for renting and buying in Nigeria. We help you check landlord reputations,
              uncover hidden property issues, and stay informed about your rights—so you can make safe, smart, and
              stress-free housing decisions.
            </p>
          </div>

          <div className="space-y-4" data-aos="fade-left" data-aos-delay="400">
            <h2 className="text-3xl md:text-4xl font-bold text-white">Why Choose Us</h2>
            <p className="text-[18px] text-white/80 leading-relaxed">
              Finding the right home shouldn&apos;t be a gamble. We combine AI-driven insights, verified reviews, and
              secure transactions to give you the confidence you need in your rental decisions.
            </p>
          </div>
        </div>

        <div className="text-center space-y-12">
          <div className="max-w-2xl mx-auto space-y-4" data-aos="fade-up" data-aos-delay="600">
            <h2 className="text-3xl md:text-4xl font-bold text-white">How It Works</h2>
            <p className="text-[18px] text-white/80 leading-relaxed">
              Finding a reliable home has never been easier. Follow these simple steps to discover trusted landlords,
              verify properties, and rent with confidence—all powered by AI-driven insights.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-zinc-900/50 p-8 flex flex-col items-center space-y-4 rounded-[15px]" data-aos="fade-up" data-aos-delay="800">
              <div className="w-12 h-12 rounded-full bg-gradient-to-r from-[#FFD700] to-[#780991] flex items-center justify-center">
                <HiSearch className="w-8 h-8 text-white" />
              </div>
              <p className="text-zinc-300">Search for address</p>
            </div>

            <div className="bg-zinc-900/50 rounded-[15px] p-8 flex flex-col items-center space-y-4" data-aos="fade-up" data-aos-delay="1000">
              <div className="w-12 h-12 rounded-full bg-gradient-to-r from-[#FFD700] to-[#780991] flex items-center justify-center">
                <HiStar className="w-8 h-8 text-white" />
              </div>
              <p className="text-zinc-300">View trust scores & reviews</p>
            </div>

            <div className="bg-zinc-900/50 rounded-[15px] p-8 flex flex-col items-center space-y-4" data-aos="fade-up" data-aos-delay="1200">
              <div className="w-12 h-12 rounded-full bg-gradient-to-r from-[#FFD700] to-[#780991] flex items-center justify-center">
                <HiUser className="w-8 h-8 text-white" />
              </div>
              <p className="text-zinc-300">Connect & rent with confidence</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
