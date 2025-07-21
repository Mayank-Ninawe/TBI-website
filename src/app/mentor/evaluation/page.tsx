// src/app/mentor/evaluation/page.tsx
"use client";

import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { ClipboardCheck, Star, TrendingUp, Award } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useChat } from '@/hooks/useChat';

export default function MentorEvaluationPage() {
  // Move questions to a variable for reuse
  const prerequisiteQuestions = [
    "Have you completed the assigned tasks from the last session?",
    "What challenges did you face this week?",
    "Did you reach out for help when needed?",
    "What are your goals for the upcoming week?",
    "Is there any resource or support you need from me?",
  ];

  // Use shared chatId for both mentor and user
  const chatId = 'mentor-user-evaluation'; // Replace with dynamic value for real app
  const { messages, loading, sendMessage, user } = useChat(chatId);

  // Handler to send a message as mentor
  const sendMentorMessage = (text) => {
    sendMessage(text, 'mentor');
  };

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Evaluation Center
            </h1>
            <p className="text-gray-600 text-lg">
              Review and provide feedback on your mentees' progress.
            </p>
          </div>
          <div className="flex items-center space-x-2 text-gray-600">
            <ClipboardCheck className="h-5 w-5" />
            <span className="text-sm">Evaluation Tools</span>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">Pending Evaluations</CardTitle>
            <ClipboardCheck className="h-5 w-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-700 mb-1">3</div>
            <div className="flex items-center text-xs text-gray-500">
              <span>evaluations pending</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">Average Rating</CardTitle>
            <Star className="h-5 w-5 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-600 mb-1">4.8</div>
            <div className="flex items-center text-xs text-gray-500">
              <span>out of 5 stars</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">Completed Reviews</CardTitle>
            <Award className="h-5 w-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-700 mb-1">12</div>
            <div className="flex items-center text-xs text-gray-500">
              <span>reviews completed</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Prerequisite Questions Section */}
      <Card className="border-gray-200 bg-white shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg text-gray-900">Prerequisite Questions</CardTitle>
          <CardDescription className="text-gray-600">
            Ask your mentee the following questions to assess their progress:
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="list-disc pl-6 space-y-2 text-gray-800">
            {prerequisiteQuestions.map((q, idx) => (
              <li
                key={idx}
                className="cursor-pointer hover:underline hover:text-blue-600 transition-colors"
                onClick={() => sendMentorMessage(q)}
                tabIndex={0}
                onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') sendMentorMessage(q); }}
                role="button"
                aria-label={`Send question: ${q}`}
              >
                {q}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Chatbox Section */}
      <Card className="border-gray-200 bg-white shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg text-gray-900">Chat with Mentee</CardTitle>
          <CardDescription className="text-gray-600">
            Use the chatbox below to communicate with your mentee in real-time.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChatBox
            messages={messages}
            loading={loading}
            sendMessage={sendMessage}
            user={user}
          />
        </CardContent>
      </Card>

      {/* Coming Soon Notice */}
      <Card className="border-gray-200 bg-white shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl text-gray-900">Evaluation System</CardTitle>
          <CardDescription className="text-gray-600">
            Comprehensive mentee evaluation and feedback tools
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center py-12">
          <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-6">
            <TrendingUp className="h-8 w-8 text-blue-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Enhanced Evaluation Tools Coming Soon</h3>
          <p className="text-gray-600 max-w-md mx-auto">
            We're developing advanced evaluation features to help you better assess and guide your mentees' progress. Stay tuned for updates!
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

// Update ChatBox to accept messages and setMessages as props
function ChatBox({ messages, loading, sendMessage, user }) {
  const [input, setInput] = useState("");

  const handleSend = () => {
    if (input.trim() === "") return;
    sendMessage(input, 'mentor');
    setInput("");
  };

  return (
    <div className="flex flex-col space-y-4">
      <div className="h-48 overflow-y-auto border rounded-md p-3 bg-gray-50 mb-2">
        {loading ? (
          <div className="text-gray-400 text-center">Loading chat...</div>
        ) : (
          messages.map((msg, idx) => (
            <div
              key={idx}
              className={`mb-2 flex ${msg.senderType === "mentor" ? "justify-end" : "justify-start"}`}
            >
              <span
                className={`px-3 py-2 rounded-lg text-sm max-w-xs break-words ${
                  msg.senderType === "mentor"
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
  );
}
