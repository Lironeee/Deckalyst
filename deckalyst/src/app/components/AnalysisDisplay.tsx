import { useState } from 'react';

interface AnalysisDisplayProps {
  analysis: string;
}

export default function AnalysisDisplay({ analysis }: AnalysisDisplayProps) {
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const sections = analysis.split('\n\n').filter(section => section.trim() !== '');

  const toggleSection = (index: number) => {
    if (expandedSection === `section-${index}`) {
      setExpandedSection(null);
    } else {
      setExpandedSection(`section-${index}`);
    }
  };

  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-lg">
      <div className="px-4 py-5 sm:px-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900">Analyse du Pitch Deck</h3>
      </div>
      <div className="border-t border-gray-200">
        {sections.map((section, index) => (
          <div key={index} className="px-4 py-5 sm:p-6 border-b border-gray-200">
            <h4
              className="text-md font-medium text-gray-900 cursor-pointer flex justify-between items-center"
              onClick={() => toggleSection(index)}
            >
              {section.split('\n')[0]}
              <span className="text-indigo-600">{expandedSection === `section-${index}` ? '−' : '+'}</span>
            </h4>
            {expandedSection === `section-${index}` && (
              <div className="mt-2 text-sm text-gray-500 whitespace-pre-wrap">
                {section.split('\n').slice(1).join('\n')}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

