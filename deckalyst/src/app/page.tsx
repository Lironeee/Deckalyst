import PdfUploader from './components/PdfUploader';

export default function Home() {
  return (
    <main className="container mx-auto">
      <h1 className="text-2xl font-bold my-8">Analyseur de Pitch Deck</h1>
      <PdfUploader />
    </main>
  );
} 