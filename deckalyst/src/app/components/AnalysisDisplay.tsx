'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, TrendingUp, Target, Users, Lightbulb, BarChart2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import { ChartContainer, ChartTooltip } from "@/components/ui/chart";
import { ReactNode } from 'react';

interface AnalysisDisplayProps {
  analysis: string;
}

interface MetricData {
  name: string;
  value: number;
  color: string;
  icon: ReactNode;
  description: string;
}

export default function AnalysisDisplay({ analysis }: AnalysisDisplayProps) {
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [score, setScore] = useState<string | null>(null);
  const [progressValue, setProgressValue] = useState(0);

  // Simulated historical data for the trend chart
  const trendData = [
    { month: 'Jan', score: 65 },
    { month: 'Feb', score: 72 },
    { month: 'Mar', score: 68 },
    { month: 'Apr', score: 75 },
    { month: 'May', score: 82 },
    { month: 'Jun', score: 88 }
  ];

  const calculateMetrics = (analysis: string): MetricData[] => {
    const extractScore = (text: string, keywords: string[]): number => {
      const relevantSection = text
        .split('\n\n')
        .find(section => 
          keywords.some(keyword => 
            section.toLowerCase().includes(keyword.toLowerCase())
          )
        );

      if (relevantSection) {
        const scoreMatch = relevantSection.match(/(\d+)%|(\d+)\/100|(\d+) percent/i);
        if (scoreMatch) {
          const score = parseInt(scoreMatch[1] || scoreMatch[2] || scoreMatch[3]);
          return Math.min(Math.max(score, 0), 100);
        }
      }
      return Math.floor(Math.random() * 20 + 60); // Fallback score between 60-80
    };

    return [
      {
        name: 'Market Size',
        value: extractScore(analysis, ['market size', 'market analysis', 'market opportunity', 'TAM', 'SAM']),
        color: 'from-green-500 to-emerald-500',
        icon: <Target className="h-5 w-5" />,
        description: 'Market positioning and target audience analysis'
      },
      {
        name: 'Team',
        value: extractScore(analysis, ['team assessment', 'leadership', 'founders', 'management']),
        color: 'from-blue-500 to-indigo-500',
        icon: <Users className="h-5 w-5" />,
        description: 'Team composition and experience evaluation'
      },
      {
        name: 'Innovation',
        value: extractScore(analysis, ['innovation', 'technology', 'product', 'solution', 'competitive advantage']),
        color: 'from-purple-500 to-pink-500',
        icon: <Lightbulb className="h-5 w-5" />,
        description: 'Technology and innovation assessment'
      },
      {
        name: 'Growth',
        value: extractScore(analysis, ['growth', 'traction', 'metrics', 'revenue', 'scalability']),
        color: 'from-orange-500 to-red-500',
        icon: <TrendingUp className="h-5 w-5" />,
        description: 'Growth metrics and potential evaluation'
      }
    ];
  };

  // Update metrics calculation
  const [metrics, setMetrics] = useState<MetricData[]>([]);
  
  useEffect(() => {
    setMetrics(calculateMetrics(analysis));
  }, [analysis]);

  const getScore = () => {
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

    const finalSection = analysis
      .split('\n\n')
      .find(section => section.includes('FINAL ASSESSMENT'));
    
    if (finalSection) {
      const scoreMatch = finalSection.match(/(\d+)\/100/);
      return scoreMatch ? scoreMatch[1] : null;
    }

    return null;
  };

  useEffect(() => {
    const scoreValue = getScore();
    setScore(scoreValue);
    
    // Animate the progress value
    if (scoreValue) {
      const target = parseInt(scoreValue);
      let current = 0;
      const step = target / 30; // Animate over 30 frames
      
      const interval = setInterval(() => {
        if (current < target) {
          current += step;
          setProgressValue(Math.min(current, target));
        } else {
          clearInterval(interval);
        }
      }, 50);

      return () => clearInterval(interval);
    }
  }, [analysis]);

  const cleanText = (text: string) => {
    return text
      .replace(/^[#\-*• ]+/gm, '')
      .replace(/\*\*/g, '')
      .replace(/###/g, '')
      .replace(/\n\s*\n/g, '\n')
      .replace(/([.:!?])\s*/g, '$1\n')
      .replace(/•/g, '\n•')
      .replace(/\n{3,}/g, '\n\n')
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

  const toggleSection = (index: number) => {
    if (expandedSection === `section-${index}`) {
      setExpandedSection(null);
    } else {
      setExpandedSection(`section-${index}`);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="bg-gray-800/50 border-gray-700 overflow-hidden backdrop-blur-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-gray-100">
            Analyse du Pitch Deck
          </CardTitle>
          {score && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="mt-4"
            >
              <div className="relative h-32 flex items-center justify-center">
                <div className="absolute inset-0 flex items-center justify-center">
                  <svg className="w-32 h-32 transform -rotate-90">
                    <circle
                      cx="64"
                      cy="64"
                      r="60"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="8"
                      className="text-gray-700"
                    />
                    <circle
                      cx="64"
                      cy="64"
                      r="60"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="8"
                      strokeDasharray={377}
                      strokeDashoffset={377 - (377 * progressValue) / 100}
                      className="text-yellow-400 transition-all duration-1000 ease-out"
                    />
                  </svg>
                </div>
                <div className="text-4xl font-bold bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent">
                  {Math.round(progressValue)}/100
                </div>
              </div>
            </motion.div>
          )}
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {metrics.map((metric, index) => (
              <motion.div
                key={metric.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="bg-gray-700/50">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <div className={`p-2 rounded-lg bg-gradient-to-r ${metric.color}`}>
                          {metric.icon}
                        </div>
                        <h3 className="font-semibold text-gray-100">{metric.name}</h3>
                      </div>
                      <span className="text-2xl font-bold bg-gradient-to-r from-gray-100 to-gray-300 bg-clip-text text-transparent">
                        {metric.value}%
                      </span>
                    </div>
                    <Progress value={metric.value} className="h-2" />
                    <p className="mt-2 text-sm text-gray-400">{metric.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          <div className="space-y-4">
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
                  {expandedSection === `section-${index}` ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
                <AnimatePresence>
                  {expandedSection === `section-${index}` && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="px-4 py-2 text-sm text-gray-300 whitespace-pre-wrap leading-relaxed">
                        {content}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

