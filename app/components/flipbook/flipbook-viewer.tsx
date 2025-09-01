"use client";

import { Loader } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Suspense, useEffect, useState } from "react";
import { FlipbookExperience } from "./flipbook-experience";
import { FlipbookUI } from "./flipbook-ui";
import { pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import type { Flipbook } from "@/lib/types";

// Set up PDF.js worker for react-pdf
if (typeof window !== 'undefined') {
  pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
}

interface FlipbookViewerProps {
  flipbook: Flipbook;
}

export function FlipbookViewer({ flipbook }: FlipbookViewerProps) {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pdfPages, setPdfPages] = useState<string[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load PDF and render each page to a canvas, then extract as image
  useEffect(() => {
    async function loadPdf() {
      setLoading(true);
      setPdfPages(null);
      setError(null);
      
      try {
        const pdfUrl = flipbook.pdf_url;
        if (!pdfUrl) {
          throw new Error('No PDF URL provided');
        }

        const loadingTask = pdfjs.getDocument({ url: pdfUrl, withCredentials: false });
        const pdf = await loadingTask.promise;
        setNumPages(pdf.numPages);
        
        const images: string[] = [];
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const viewport = page.getViewport({ scale: 2 });
          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d');
          if (!context) {
            throw new Error('Failed to get canvas context');
          }
          
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          
          await page.render({ canvasContext: context, viewport }).promise;
          images.push(canvas.toDataURL('image/jpeg', 0.92));
        }
        setPdfPages(images);
      } catch (e) {
        console.error('PDF loading error:', e);
        setError(e instanceof Error ? e.message : 'Failed to load PDF. Please check the URL or CORS settings.');
        setPdfPages([]);
      }
      setLoading(false);
    }
    
    loadPdf();
  }, [flipbook.pdf_url]);

  return (
    <>
      <FlipbookUI totalSheets={pdfPages ? Math.ceil(pdfPages.length / 2) : 0} />
      <Loader />
      {loading || !pdfPages ? (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-80">
          <span className="text-white text-2xl">{error ? error : 'Loading PDF...'}</span>
        </div>
      ) : (
        <Canvas
          className="w-full h-full"
          dpr={[1, Math.min(window?.devicePixelRatio || 1, 2)]}
          shadows={false}
          camera={{ position: [0, 0, 4], fov: 28 }}
          gl={{ alpha: true, antialias: true }}
          onCreated={({ gl }) => gl.setClearAlpha(0)}
          style={{ background: 'transparent' }}
        >
          <Suspense fallback={null}>
            <FlipbookExperience pdfPages={pdfPages} />
          </Suspense>
        </Canvas>
      )}
    </>
  );
}