import { StaticImageData } from "next/image";
import Image from "next/image";

interface TestimonialCardProps {
  content: string;
  avatar: string | StaticImageData;
}

export default function TestimonialCard({ content, avatar }: TestimonialCardProps) {
  return (
    <div className="bg-black/80 backdrop-blur-sm rounded-[15px] p-4 text-white border border-white/10 max-w-[90%] sm:max-w-[400px] lg:max-w-[500px] mx-auto sm:ml-0 lg:ml-24">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 p-2 text-center sm:text-left">
        {/* Avatar at the top on small screens, side on larger screens */}
        <Image
          src={avatar}
          alt="User avatar"
          className="w-[35px] h-[35px] rounded-full border-2 border-white/20 mx-auto sm:mx-0"
        />

        {/* Testimonial Content */}
        <p className="font-[400] text-[15px] leading-[20px] text-[#CCCCCC]">
          {content}
        </p>
      </div>
    </div>
  );
}
