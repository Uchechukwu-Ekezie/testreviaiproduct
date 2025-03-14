import Image from "next/image";
import React from "react";
import logo from "../../public/Image/logo reviai.png";

export default function Logo() {
  return (
    <div className="flex items-center justify-center">
      <Image
        src={logo || "/placeholder.svg"}
        alt="Revi AI Logo"
        width={46}
        height={34}
      />
      <span className="ml-2 text-[24px] font-[510] text-white font-sf-pro ">
        Revi Ai
      </span>
    </div>
  );
}
