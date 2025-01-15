'use client';

import { useState } from 'react';
import { Upload, Loader2, LoaderCircle, CheckCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import AnalysisDisplay from './AnalysisDisplay';
import PitchDeckChat from './PitchDeckChat';

export default function PdfUploader() {
  const [isLoading, setIsLoading] = useState(false);
  const [isDeckLoaded, setIsDeckLoaded] = useState(false);
  const [deckData, setDeckData] = useState<string>('');


  const [isHarmonicLoaded, setIsHarmonicLoaded] = useState(false);
  const [harmonicData, setHarmonicData] =  useState<string>('');

  const [analysis, setAnalysis] = useState<string>('');
  const [showAnalysis, setShowAnalysis] = useState(false);

  const next = async (e) => {
    // Add a text field
  
    const formData = new FormData();

    // Append the form data (both text and file)
    formData.append('harmonicData', harmonicData);  // assuming harmonicData is a string
    formData.append('fileData', deckData);            // assuming fileData is a string (you can also append files here)
  
    // Send the POST request
    const response = await fetch('/api/combine-data', {
      method: 'POST',
      body: formData,  // stringify the object to send as JSON
    });

    response.json().then(e => {
      setAnalysis(e.analysis);
      setIsLoading(false);
      setShowAnalysis(true);
    })
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);

    try {
      // Call both APIs in parallel
      const [ pdfResponse, harmonicResponse] = await Promise.all([
        fetch('/api/analyze-pdf', {
          method: 'POST',
          body: formData,
        }),
        fetch('/api/harmonic', {
          method: 'POST',
          body: formData,
        }),
      ]);

      // Parse both responses
      pdfResponse.json().then((pdfData => {
        console.log(pdfData);
        setDeckData(pdfData);
        setIsDeckLoaded(true);
      })).catch((err => {
        console.error(err);
      }))

      harmonicResponse.json().then((harmonicData => {
        console.log(harmonicData);
        setHarmonicData(harmonicData);
        setIsHarmonicLoaded(true);
      })).catch((err => {
        console.error(err);
      }))
      
      //setIsDeckLoaded(true);

    } catch (error) {
      console.error('Error:', error);
    } finally {

     // setIsLoading(false);
    }
  };

  return (
    <AnimatePresence mode="wait">
      {isLoading ? (
        <>
          <div className="relative z-10" aria-labelledby="modal-title" role="dialog" aria-modal="true">
            <div className="fixed inset-0 bg-gray-500/75 transition-opacity" aria-hidden="true"></div>

            <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
              <div className="flex min-h-full items-center justify-center p-4 text-center sm:items-center sm:p-0">
                <div className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg md:max-w-xl lg:max-w-2xl">
                  <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
                    <div className="sm:flex sm:items-start">
                      <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
                        <h3 className="text-base font-semibold text-gray-900" id="modal-title">Analyzing</h3>
                        <div className="mt-4">
                          <ol className="flex flex-wrap items-center w-full text-sm font-medium text-center text-gray-500 dark:text-gray-400 sm:text-base">
                            {/* Step 1: Parsing Deck */}
                            <li className="flex items-center w-full sm:w-auto text-blue-600 dark:text-blue-500">
                              <span className="flex items-center">
                                {isDeckLoaded ? (
                                  <CheckCheck className="w-4 h-4 me-2" />
                                ) : (
                                  <LoaderCircle className="w-4 h-4 me-2" />
                                )}
                                Parsing Deck
                              </span>
                            </li>
                            <li className="flex items-center w-full sm:w-auto text-blue-600 dark:text-blue-500">
                              <span className="mx-2 text-gray-200 dark:text-gray-500">/</span>
                            </li>

                            {/* Step 2: Getting Data from Harmonic */}
                            <li className="flex items-center w-full sm:w-auto text-blue-600 dark:text-blue-500">
                              <span className="flex items-center">
                                {isHarmonicLoaded ? (
                                  <CheckCheck className="w-4 h-4 me-2" />
                                ) : (
                                  <LoaderCircle className="w-4 h-4 me-2" />
                                )}
                                Getting Data from Harmonic
                              </span>
                            </li>
                            <li className="flex items-center w-full sm:w-auto text-blue-600 dark:text-blue-500">
                              <span className="mx-2 text-gray-200 dark:text-gray-500">/</span>
                            </li>

                            {/* Step 3: Confirmation */}
                            <li className="flex items-center w-full sm:w-auto">
                              <span className="me-2">3</span>Confirmation
                            </li>
                          </ol>
                          ``
                          <Button
                          onClick={next}
                          >next</Button>

                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      ) : (
        <></>
      )}

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
                  <Label htmlFor="website-name" className="text-lg font-medium text-gray-200">
                    Website Name
                  </Label>
                  <Input id="website" name="website" required></Input>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="file-upload" className="text-lg font-medium text-gray-200">
                    Upload Startup Deck
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
                          <span>Upload a file</span>
                          <Input id="file-upload" name="file" type="file" accept=".pdf" className="sr-only" required />
                        </Label>
                        <p className="pl-1">or drag and drop</p>
                      </div>
                      <p className="text-xs text-gray-400">PDF up to 10MB</p>
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
                        Analyzing...
                      </>
                    ) : (
                      'Analyze PDF'
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
