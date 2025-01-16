import PdfUploader from './components/PdfUploader';
import AnimatedBackground from './components/AnimatedBackground';

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-indigo-900 text-white overflow-hidden">
      <AnimatedBackground />
      <div className="relative z-10">
        <header className="bg-transparent">
          <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
            <h1 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600 animate-pulse">
              VCBoost
            </h1>
          </div>
        </header>
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <PdfUploader />
        </div>
      </div>
    </main>
  );
}

