'use client';

import { useState } from 'react';
import { Upload } from 'lucide-react';
import AnalysisDisplay from '../components/AnalysisDisplay';
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
    <div className="space-y-8">
      {!showAnalysis ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="max-w-xl mx-auto">
            <label htmlFor="file-upload" className="block text-sm font-medium text-gray-700 mb-2">
              Sélectionnez votre PDF
            </label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
              <div className="space-y-1 text-center">
                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                <div className="flex text-sm text-gray-600">
                  <label
                    htmlFor="file-upload"
                    className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500"
                  >
                    <span>Uploader un fichier</span>
                    <input id="file-upload" name="file" type="file" accept=".pdf" className="sr-only" required />
                  </label>
                  <p className="pl-1">ou glisser-déposer</p>
                </div>
                <p className="text-xs text-gray-500">PDF jusqu'à 10MB</p>
              </div>
            </div>
          </div>
          <div className="text-center">
            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex items-center px-4 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-300"
            >
              {isLoading ? 'Analyse en cours...' : 'Analyser le PDF'}
            </button>
          </div>
        </form>
      ) : (
        <div className="flex space-x-4">
          <div className="w-1/2">
            <AnalysisDisplay analysis={analysis} />
          </div>
          <div className="w-1/2">
            <PitchDeckChat analysis={analysis} />
          </div>
        </div>
      )}
    </div>
  );
}

