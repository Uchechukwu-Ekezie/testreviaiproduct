"use client";

import React, { useState } from "react";
import { chatAPI } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/use-toast";

export default function CreateAndFetchChatSession() {
  const [sessionTitle, setSessionTitle] = useState("house");
  const [userId, setUserId] = useState("2b30a7f0-a174-45c2-95b9-ed51f1782c23"); // Default user ID
  const [sessionId, setSessionId] = useState("");
  const [uniqueChatId, setUniqueChatId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sessionDetails, setSessionDetails] = useState<any>(null);

  // Function to create a new chat session
  const handleCreateSession = async () => {
    if (!sessionTitle.trim() || !userId.trim()) {
      toast({
        title: "Error",
        description: "Chat title and user ID are required",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Create session data object
      const sessionData = {
        chat_title: sessionTitle,
        user: userId,
        unique_chat_id: uniqueChatId || undefined // Only include if provided
      };

      // Create the chat session
      const response = await chatAPI.createChatSession(sessionData);
      console.log("Chat session created:", response);

      // Save the session ID
      setSessionId(response.id);

      toast({
        title: "Success",
        description: "Chat session created successfully",
      });
    } catch (error: any) {
      console.error("Failed to create chat session:", error);
      toast({
        title: "Error",
        description: error.response?.data?.detail || "Failed to create chat session",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Function to fetch chat session details
  const handleFetchSession = async () => {
    if (!sessionId) {
      toast({
        title: "Error",
        description: "No session ID available. Create a session first.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Fetch the chat session details
      const response = await chatAPI.getChatSession(sessionId);
      console.log("Chat session details:", response);

      // Save the session details
      setSessionDetails(response);

      toast({
        title: "Success",
        description: "Chat session details retrieved successfully",
      });
    } catch (error: any) {
      console.error("Failed to fetch chat session:", error);
      toast({
        title: "Error",
        description: error.response?.data?.detail || "Failed to fetch chat session",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-lg">
      <h1 className="text-2xl font-bold mb-6">Create and Fetch Chat Session</h1>

      <div className="space-y-4 mb-8">
        <div>
          <label className="block text-sm font-medium mb-1">Chat Title</label>
          <Input
            value={sessionTitle}
            onChange={(e) => setSessionTitle(e.target.value)}
            placeholder="Enter chat title"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">User ID (Required)</label>
          <Input
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            placeholder="Enter user ID"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Unique Chat ID (Optional)</label>
          <Input
            value={uniqueChatId}
            onChange={(e) => setUniqueChatId(e.target.value)}
            placeholder="Enter unique chat ID (optional)"
          />
        </div>

        <Button 
          onClick={handleCreateSession} 
          disabled={isLoading || !sessionTitle || !userId}
          className="w-full bg-gradient-to-r from-[#FFD700] to-[#780991] text-white"
        >
          {isLoading ? "Creating..." : "Create Chat Session"}
        </Button>
      </div>

      {sessionId && (
        <div className="mt-8 p-4 border rounded-md">
          <h2 className="text-lg font-semibold mb-2">Session Created</h2>
          <p className="mb-4"><strong>Session ID:</strong> {sessionId}</p>
          <Button 
            onClick={handleFetchSession} 
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? "Fetching..." : "Fetch Session Details"}
          </Button>
        </div>
      )}

      {sessionDetails && (
        <div className="mt-8 p-4 border rounded-md">
          <h2 className="text-lg font-semibold mb-2">Session Details</h2>
          <pre className="bg-gray-100 p-4 rounded-md overflow-auto text-sm">
            {JSON.stringify(sessionDetails, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
} 