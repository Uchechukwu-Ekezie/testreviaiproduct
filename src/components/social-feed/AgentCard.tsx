"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star, BadgeCheck } from "lucide-react";
import { cn } from "@/lib/utils";

interface Agent {
  id: string;
  name?: string;
  avatar?: string | null;
  rating?: number;
  propertiesSold?: number;
  experience?: string;
  location?: string;
  verified?: boolean;
  type?: string;
  first_name?: string;
  last_name?: string;
  username?: string;
}

interface AgentCardProps {
  agent: Agent;
  onViewAgent: (agentId: string) => void;
}

export default function AgentCard({ agent, onViewAgent }: AgentCardProps) {
  const typeValue = agent.type?.toLowerCase().trim();
  const isAgent =
    typeValue === "agent" ||
    agent.verified ||
    typeValue === undefined ||
    typeValue === null;
  const displayName =
    agent.name ||
    `${agent.first_name || ""} ${agent.last_name || ""}`.trim() ||
    agent.username ||
    "Agent";
  const avatarSrc = agent.avatar || undefined;

  return (
    <div className="rounded-2xl p-6 hover:border-primary/50 transition-all duration-300  ">
      {/* Profile Picture */}
      <div className="flex justify-center mb-4 relative">
        <Avatar 
          className="w-20 h-20 cursor-pointer hover:opacity-80 transition-opacity"
          onClick={() => onViewAgent(agent.id)}
        >
          <AvatarImage src={avatarSrc} alt={displayName} />
          <AvatarFallback className="bg-muted text-card-foreground text-lg font-semibold">
            {displayName
              .split(" ")
              .map((n) => n[0])
              .join("")}
          </AvatarFallback>
        </Avatar>

        {/* ⭐ Star Top Right */}
        {/* <Star className="w-5 h-5 text-primary fill-primary " /> */}
        <button className="flex items-center mx-auto justify-center gap-3 bg-[#1A1A1A] px-[15px] py-[6px] rounded-[20px] absolute -top-2 -right-2">
          <span className="text-lg font-semibold text-card-foreground">
            {agent.rating ?? "—"}
          </span>
          <Star className="w-4 h-4 fill-primary text-primary" />
        </button>
      </div>

      {/* Agent Name & Badge */}
      <div className="text-center ">
        <div className="flex items-center justify-center gap-3 mb-2 ">
          <h5
            className="text-[16px] font-semibold text-card-foreground w-"
            onClick={() => onViewAgent(agent.id)}
            style={{ cursor: "pointer" }}
          >
            {displayName}
          </h5>
          {isAgent && (
            <BadgeCheck className="w-5 h-5 text-white fill-blue-500" />
          )}
        </div>
      </div>

      {/* Rating */}
    </div>
  );
}
