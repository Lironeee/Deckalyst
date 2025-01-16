'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Loader2, Check, Database } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRouter } from 'next/navigation';
import { useToast } from "@/hooks/use-toast";
import { Toaster } from "@/components/ui/toaster";

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function PitchDeckChat({ analysis }: { analysis: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isPassed, setIsPassed] = useState(false);
  const [isSentToCRM, setIsSentToCRM] = useState(false);

  useEffect(() => {
    if (analysis && messages.length === 0) {
      setMessages([
        { role: 'assistant', content: analysis },
        { role: 'assistant', content: "Hello ! I've analyzed the pitch deck. What do you want to know about this startup?" }
      ]);
    }
  }, [analysis]);

  useEffect(() => {
    if (messagesEndRef.current) {
      const scrollContainer = messagesEndRef.current.parentElement;
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const userMessage = { role: 'user' as const, content: newMessage };
    setMessages(prev => [...prev, userMessage]);
    setNewMessage('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMessage],
        }),
      });

      const data = await response.json();
      if (data.message) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.message }]);
      }
    } catch (error) {
      console.error('Erreur lors de l\'envoi du message:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatMessage = (content: string) => {
    return content
      .replace(/([.:!?])\s*/g, '$1\n')
      .replace(/•/g, '\n•')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  };

  const handlePass = async () => {
    setIsPassed(true);
    // Ajoutez ici votre logique pour marquer comme "passed"
  };

  const handleSendToCRM = async () => {
    try {
      setIsSentToCRM(true);
      
      // Ajoutez ici votre logique d'envoi vers le CRM
      // await sendToCRM();

      // Afficher la notification de succès
      toast({
        title: "Success!",
        description: "Successfully sent to CRM",
        duration: 3000,
        variant: "default",
      });

      // Forcer un refresh complet de la page
      setTimeout(() => {
        window.location.reload();
      }, 1000);

    } catch (error) {
      setIsSentToCRM(false);
      toast({
        title: "Error",
        description: "Failed to send to CRM",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <Card className="flex flex-col h-[600px] bg-gray-800/50 border-gray-700 shadow-lg rounded-lg overflow-hidden backdrop-blur-md">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl font-bold text-gray-100">Chat avec l'IA</CardTitle>
            <div className="flex gap-2">
              <Button
                onClick={handlePass}
                disabled={isPassed}
                className={`${
                  isPassed 
                    ? 'bg-green-600 hover:bg-green-700' 
                    : 'bg-purple-600 hover:bg-purple-700'
                } text-white`}
              >
                {isPassed ? (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Passed
                  </>
                ) : (
                  'Pass'
                )}
              </Button>
              <Button
                onClick={handleSendToCRM}
                disabled={isSentToCRM}
                className={`${
                  isSentToCRM 
                    ? 'bg-green-600 hover:bg-green-700' 
                    : 'bg-purple-600 hover:bg-purple-700'
                } text-white`}
              >
                {isSentToCRM ? (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Sent to CRM
                  </>
                ) : (
                  <>
                    <Database className="w-4 h-4 mr-2" />
                    Send to CRM
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="flex-1 overflow-y-auto p-4 space-y-4" style={{ height: 'calc(100% - 130px)' }}>
          <AnimatePresence initial={false}>
            {messages.map((message, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className={`p-3 rounded-lg ${
                  message.role === 'user'
                    ? 'bg-purple-600 ml-auto'
                    : 'bg-gray-700'
                } max-w-[80%]`}
              >
                <p className="text-sm text-gray-100 whitespace-pre-wrap leading-relaxed">
                  {formatMessage(message.content)}
                </p>
              </motion.div>
            ))}
          </AnimatePresence>
          {isLoading && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gray-700 p-3 rounded-lg"
            >
              <Loader2 className="h-5 w-5 text-gray-400 animate-spin" />
            </motion.div>
          )}
          <div ref={messagesEndRef} />
        </CardContent>
        <CardFooter>
          <form onSubmit={handleSubmit} className="w-full">
            <div className="flex items-center space-x-2">
              <Input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Posez votre question sur le pitch deck..."
                className="flex-1 bg-gray-700 text-gray-100 border-gray-600 focus:ring-purple-500"
                disabled={isLoading}
              />
              <Button
                type="submit"
                disabled={isLoading}
                className="bg-purple-600 text-white hover:bg-purple-700 focus:ring-purple-500"
              >
                <Send size={20} />
              </Button>
            </div>
          </form>
        </CardFooter>
      </Card>
      <Toaster />
    </>
  );
}

