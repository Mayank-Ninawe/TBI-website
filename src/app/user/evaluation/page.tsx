"use client";

import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useChat } from '@/hooks/useChat';

export default function UserEvaluationPage() {
  // Use shared chatId for both mentor and user
  const chatId = 'mentor-user-evaluation'; // Replace with dynamic value for real app
  const { messages, loading, sendMessage, user } = useChat(chatId);
  const [input, setInput] = useState("");

  const handleSend = () => {
    if (input.trim() === "") return;
    sendMessage(input, 'user');
    setInput("");
  };

  return (
    <div className="space-y-8">
      <Card className="border-gray-200 bg-white shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg text-gray-900">Chat with Mentor</CardTitle>
          <CardDescription className="text-gray-600">
            You can freely communicate with your mentor here.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col space-y-4">
            <div className="h-48 overflow-y-auto border rounded-md p-3 bg-gray-50 mb-2">
              {loading ? (
                <div className="text-gray-400 text-center">Loading chat...</div>
              ) : (
                messages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`mb-2 flex ${msg.senderType === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <span
                      className={`px-3 py-2 rounded-lg text-sm max-w-xs break-words ${
                        msg.senderType === "user"
                          ? "bg-blue-500 text-white"
                          : "bg-gray-200 text-gray-900"
                      }`}
                    >
                      {msg.text}
                    </span>
                  </div>
                ))
              )}
            </div>
            <div className="flex gap-2">
              <Textarea
                className="flex-1 min-h-[40px] max-h-24 resize-none"
                placeholder="Type your message..."
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
              />
              <Button onClick={handleSend} type="button" className="h-10 px-4">Send</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 