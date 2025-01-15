'use client';

import { useState } from 'react';
import { Upload, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import AnalysisDisplay from './AnalysisDisplay';
import PitchDeckChat from './PitchDeckChat';

export default function PdfUploader() {
  const [isLoading, setIsLoading] = useState(false);
  const [analysis, setAnalysis] = useState<string>('');
  const [showAnalysis, setShowAnalysis] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);

    try {
      const response = await fetch('/api/analyze-pdf', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      if (data.analysis) {
        setAnalysis(data.analysis);
        setShowAnalysis(true);
      }
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence mode="wait">
      {!showAnalysis ? (
        <motion.div
          key="uploader"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="max-w-xl mx-auto bg-gray-800/50 border-gray-700 backdrop-blur-md">
            <CardContent className="p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="website" className="text-lg font-medium text-gray-200">
                    Site web de l'entreprise (optionnel)
                  </Label>
                  <Input
                    id="website"
                    name="website"
                    type="url"
                    placeholder="https://example.com"
                    className="bg-gray-700 text-gray-100 border-gray-600 focus:ring-purple-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="file-upload" className="text-lg font-medium text-gray-200">
                    Sélectionnez votre PDF
                  </Label>
                  <motion.div
                    className="flex justify-center px-6 pt-5 pb-6 border-2 border-gray-600 border-dashed rounded-md"
                    whileHover={{ scale: 1.02, borderColor: '#9333ea' }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="space-y-1 text-center">
                      <Upload className="mx-auto h-12 w-12 text-gray-400" />
                      <div className="flex text-sm text-gray-400">
                        <Label
                          htmlFor="file-upload"
                          className="relative cursor-pointer rounded-md font-medium text-purple-400 hover:text-purple-300 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-purple-500"
                        >
                          <span>Uploader un fichier</span>
                          <Input id="file-upload" name="file" type="file" accept=".pdf" className="sr-only" required />
                        </Label>
                        <p className="pl-1">ou glisser-déposer</p>
                      </div>
                      <p className="text-xs text-gray-400">PDF jusqu'à 10MB</p>
                    </div>
                  </motion.div>
                </div>
                <div className="text-center">
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 transition-all duration-300"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Analyse en cours...
                      </>
                    ) : (
                      'Analyser le PDF'
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      ) : (
        <motion.div
          key="analysis"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4"
        >
          <div className="w-full md:w-1/2">
            <AnalysisDisplay analysis={analysis} />
          </div>
          <div className="w-full md:w-1/2">
            <PitchDeckChat analysis={analysis} />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

