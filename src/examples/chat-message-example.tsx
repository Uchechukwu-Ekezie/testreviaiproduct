"use client";

import React, { useState } from "react";
import { chatAPI } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/use-toast";

export default function ChatMessageExample() {
  const [sessionTitle, setSessionTitle] = useState("house");
  const [userId, setUserId] = useState("2b30a7f0-a174-45c2-95b9-ed51f1782c23");
  const [sessionId, setSessionId] = useState("");
  const [chatMessage, setChatMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [chatMessages, setChatMessages] = useState<any[]>([]);

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
        user: userId
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

  // Function to post a new chat message
  const handlePostChat = async () => {
    if (!chatMessage.trim()) {
      toast({
        title: "Error",
        description: "Please enter a message",
        variant: "destructive",
      });
      return;
    }

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
      // Post the new chat message
      const response = await chatAPI.postNewChat(chatMessage, sessionId);
      console.log("Chat message posted:", response);

      // Add the new message to the list
      setChatMessages(prev => [...prev, response]);
      setChatMessage(""); // Clear input

      toast({
        title: "Success",
        description: "Message sent successfully",
      });
    } catch (error: any) {
      console.error("Failed to post chat message:", error);
      toast({
        title: "Error",
        description: error.response?.data?.detail || "Failed to send message",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Function to fetch chat messages for the session
  const handleGetChats = async () => {
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
      // Fetch the chat messages
      const response = await chatAPI.getChatsBySession(sessionId);
      console.log("Chat messages:", response);

      // Save the messages
      setChatMessages(response.results || []);

      toast({
        title: "Success",
        description: "Chat messages retrieved successfully",
      });
    } catch (error: any) {
      console.error("Failed to fetch chat messages:", error);
      toast({
        title: "Error",
        description: error.response?.data?.detail || "Failed to fetch messages",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-lg">
      <h1 className="text-2xl font-bold mb-6">Chat Session Message Example</h1>

      {/* Create Session Section */}
      <div className="space-y-4 mb-8 p-4 border rounded-md">
        <h2 className="text-lg font-semibold">Step 1: Create a Chat Session</h2>
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

        <Button 
          onClick={handleCreateSession} 
          disabled={isLoading || !sessionTitle || !userId}
          className="w-full bg-gradient-to-r from-[#FFD700] to-[#780991] text-white"
        >
          {isLoading ? "Creating..." : "Create Chat Session"}
        </Button>
      </div>

      {/* Session ID Display */}
      {sessionId && (
        <div className="mt-4 p-4 border rounded-md bg-gray-50">
          <h2 className="text-lg font-semibold mb-2">Session Created</h2>
          <p className="mb-2"><strong>Session ID:</strong> {sessionId}</p>
          <Button 
            onClick={handleGetChats} 
            disabled={isLoading}
            className="w-full mb-2"
          >
            {isLoading ? "Loading..." : "Load Chat Messages"}
          </Button>
        </div>
      )}

      {/* Chat Messages Section */}
      {sessionId && (
        <div className="mt-4 p-4 border rounded-md">
          <h2 className="text-lg font-semibold mb-4">Step 2: Send Chat Messages</h2>
          
          <div className="flex space-x-2 mb-4">
            <Input
              value={chatMessage}
              onChange={(e) => setChatMessage(e.target.value)}
              placeholder="Type your message"
              className="flex-1"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handlePostChat();
                }
              }}
            />
            <Button 
              onClick={handlePostChat} 
              disabled={isLoading || !chatMessage.trim()}
              className="bg-primary"
            >
              Send
            </Button>
          </div>

          {/* Display Messages */}
          <div className="mt-4">
            <h3 className="text-md font-medium mb-2">Messages:</h3>
            <div className="border rounded-md overflow-y-auto max-h-60 p-2">
              {chatMessages.length > 0 ? (
                chatMessages.map((msg, index) => (
                  <div key={index} className="mb-3">
                    <div className="bg-blue-100 p-2 rounded-md mb-1">
                      <p className="font-medium">User:</p>
                      <p>{msg.prompt}</p>
                    </div>
                    <div className="bg-green-100 p-2 rounded-md">
                      <p className="font-medium">AI:</p>
                      <p>{msg.response}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center p-4">No messages yet</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 