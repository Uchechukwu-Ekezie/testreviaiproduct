interface AiScoreCardProps {
  description: string;
}

import Image from "next/image";
import aiImg from "../../public/Image/Frame 1618874087.png";

export default function AiScoreCard({ description }: AiScoreCardProps) {
  return (
    <div className="bg-black/80 backdrop-blur-sm rounded-[15px] p-4 text-white border border-white/10 max-w-[90%] sm:max-w-[400px] lg:max-w-[500px] mx-auto sm:mr-0 lg:mr-24">
      {/* Responsive Layout */}
      <div className="flex flex-col sm:flex-row sm:space-x-5 items-center sm:items-start mb-2">
        {/* Image at the Top on Small Screens, Side on Larger Screens */}
        <Image src={aiImg} alt="" className="w-[30px] h-[30px] sm:w-[35px] sm:h-[35px] sm:mt-2 mb-3 sm:mb-0" />
        
        {/* Text Content */}
        <p className="text-sm leading-relaxed text-white/80 text-center sm:text-left">
          {description}
        </p>
      </div>
    </div>
  );
}
