"use client";

import Button from "../ui/Button";
import {
  PaperclipIcon,
  ImageIcon,
  Search,
  RefreshCcw,
  MessageCircle,
  Shield,
  Home,
} from "lucide-react";
import arrow from "../../public/Image/arrow down.png";
import Image from "next/image";
import FadeIn from "./FadeIn";

export default function HeroSection() {
  const questionsWithIcons = [
    {
      text: "Has anyone had issues with this agent?",
      icon: (
        <MessageCircle className="w-[22px] h-[22px] text-[#7F7F7F] lg:ml-3" />
      ),
    },
    {
      text: "Does the house actually match the pictures?",
      icon: <Search className="w-[22px] h-[22px] text-[#7F7F7F] lg:ml-3" />,
    },
    {
      text: "Will I be asked to pay unexpected service fees after moving in?",
      icon: <Shield className="w-[22px] h-[22px] text-[#7F7F7F] lg:ml-3" />,
    },
    {
      text: "Have past tenants had issues? Hidden fees? Delayed repairs?",
      icon: <Home className="w-[22px] h-[22px] text-[#7F7F7F] lg:ml-3" />,
    },
  ];
  return (
    <div className="container px-4 md:px-8 lg:px-[115.5px] pt-[80px] md:pt-[120px] pb-6">
      <div className="max-w-full mx-auto space-y-6">
        <FadeIn direction="bottom" delay={0.7}>
          {/* Title & Subtitle */}
          <div className="text-center text-white md:text-left lg:pt-14">
            <h1 className="text-[30px] md:text-[45px] font-bold leading-tight">
              Renting in Nigeria Shouldn’t Be a Gamble!
            </h1>
            <p className="text-[16px] md:text-[20px] text-[#afadad] font-light max-w-[380px] mx-auto md:mx-0 pt-[8px]">
              What questions do you have today? Here to help you.
            </p>
          </div>
          {/* Question Buttons (Grid) */}
          <div className="grid grid-cols-1 gap-4 mt-8 sm:grid-cols-2 lg:grid-cols-4">
            {questionsWithIcons.map(({ text, icon }, index) => (
              <div
                key={index}
                className="flex justify-between items-center px-4 py-3 rounded-[15px] bg-black/40 text-[16px] backdrop-blur-sm border border-white/10 text-[#7F7F7F] hover:bg-black/50 lg:flex-col lg:items-start lg:py-4 lg:space-y-4"
              >
                <Button label={text} onClick={() => {}} className="text-left" />
                {icon}
              </div>
            ))}
          </div>
          {/* Refresh Button */}
          <div className="flex items-center justify-center md:justify-start space-x-2 text-[#7F7F7F] mt-2 ">
            <RefreshCcw className="w-[22px] h-[22px]" />
            <Button label="Refresh Prompts" onClick={() => {}} />
          </div>
          {/* Input Box with Actions */}
          <div className="relative mt-8 h-auto bg-black/40 backdrop-blur-sm border border-white/10 rounded-[15px] p-4 lg:space-y-11">
            <input
              type="text"
              placeholder="Ask me anything"
              disabled
              className="w-full bg-transparent text-[#7F7F7F] placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-[#F5B041]/50 p-3"
            />
            <div className="flex flex-row items-center justify-between mt-4 md:flex-row">
              {/* Attachments */}
              <div className="flex flex-col gap-2 sm:flex-row">
                <button
                  disabled
                  className="flex items-center gap-2 p-2 transition-colors rounded-md"
                >
                  <PaperclipIcon className="w-5 h-5 text-[#7F7F7F]" />
                  <span className="text-[#7F7F7F] text-[15px]">
                    Add Attachment
                  </span>
                </button>
                <button
                  disabled
                  className="flex items-center gap-2 p-2 transition-colors rounded-md"
                >
                  <ImageIcon className="w-5 h-5 text-[#7F7F7F]" />
                  <span className="text-[#7F7F7F] text-[15px]">Use Images</span>
                </button>
              </div>

              {/* Submit Button */}
              {/* overlay on the button */}
              <div className="relative inline-block">
                <Button
                  label="AI Chat"
                  onClick={() => {}}
                  disabled
                  className="relative bg-gradient-to-r from-[#FFD700] to-[#780991] text-white rounded-[15px] mt-4 md:mt-0 overflow-hidden"
                />
                <div className="absolute top-4 md:top-0  left-0 inset-0 bg-black opacity-70 rounded-[15px] pointer-events-none"></div>
              </div>
            </div>
          </div>
        </FadeIn>
      </div>
      {/* Animated Arrows */}
      <div className="max-w-[1400px] flex pt-4  justify-between">
        <Image
          src={arrow}
          alt="arrow down"
          width={44} // Set appropriate width
          height={24} // Set appropriate height
          className="mt-4 animate-bounce"
        />
        <Image
          src={arrow}
          alt="arrow down"
          width={44} // Set appropriate width
          height={24} // Set appropriate height
          className="mt-4 animate-bounce"
        />
      </div>
    </div>
  );
}
