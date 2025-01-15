'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface AnalysisDisplayProps {
  analysis: string;
}

export default function AnalysisDisplay({ analysis }: AnalysisDisplayProps) {
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const getScore = () => {
    // Chercher le score dans différents formats possibles
    const patterns = [
      /Investment Score: \[(\d+)\/100\]/,
      /Score Global: (\d+)\/100/,
      /Score: (\d+)\/100/,
      /(\d+)\/100/
    ];

    for (const pattern of patterns) {
      const match = analysis.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }

    // Si aucun score n'est trouvé, chercher dans la section FINAL ASSESSMENT
    const finalSection = analysis
      .split('\n\n')
      .find(section => section.includes('FINAL ASSESSMENT'));
    
    if (finalSection) {
      const scoreMatch = finalSection.match(/(\d+)\/100/);
      return scoreMatch ? scoreMatch[1] : null;
    }

    return null;
  };

  const cleanText = (text: string) => {
    return text
      .replace(/^[#\-*• ]+/gm, '')
      .replace(/\*\*/g, '')
      .replace(/###/g, '')
      .trim();
  };

  const sections = analysis
    .split('\n\n')
    .filter(section => section.trim() !== '')
    .map(section => {
      const [title, ...content] = section.split('\n');
      return {
        title: cleanText(title),
        content: content.map(line => cleanText(line)).join('\n')
      };
    });

  const score = getScore();

  const toggleSection = (index: number) => {
    if (expandedSection === `section-${index}`) {
      setExpandedSection(null);
    } else {
      setExpandedSection(`section-${index}`);
    }
  };

  return (
    <Card className="bg-gray-800/50 border-gray-700 overflow-hidden backdrop-blur-md">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-gray-100">
          Analyse du Pitch Deck
        </CardTitle>
        {score && (
          <div className="mt-2 flex items-center justify-center">
            <div className="text-4xl font-bold bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent">
              Score Global: {score}/100
            </div>
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {sections.map(({ title, content }, index) => (
          <motion.div
            key={index}
            initial={false}
            animate={{ backgroundColor: expandedSection === `section-${index}` ? 'rgba(107, 114, 128, 0.1)' : 'rgba(31, 41, 55, 0)' }}
            transition={{ duration: 0.3 }}
            className="rounded-lg overflow-hidden"
          >
            <Button
              variant="ghost"
              className="w-full justify-between text-left font-medium text-gray-200 hover:text-gray-100 focus:outline-none"
              onClick={() => toggleSection(index)}
            >
              {title}
              {expandedSection === `section-${index}` ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
            <AnimatePresence>
              {expandedSection === `section-${index}` && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="px-4 py-2 text-sm text-gray-300 whitespace-pre-wrap">
                    {content}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </CardContent>
    </Card>
  );
}

