"use client";
import React, { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import "react-pdf/dist/esm/Page/TextLayer.css";
import "react-pdf/dist/esm/Page/AnnotationLayer.css";
import { Button } from "@/components/ui/button";
import Actions from "../../components/actions";

const PDFView = ({ data }) => {
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [PDFComponent, setPDFComponent] = useState(null);
  const [scale, setScale] = useState(1.0);
  const containerRef = useRef(null);

  useEffect(() => {
    // console.log("File prop:", data);
    import("react-pdf").then((module) => {
      const { Document, Page, pdfjs } = module;
      pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
      setPDFComponent(() => ({ Document, Page }));
    });
  }, []);

  useEffect(() => {
    const updateScale = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.clientWidth;
        setScale(Math.min((containerWidth - 40) / 600, 1)); // 600 is the default width
      }
    };

    window.addEventListener("resize", updateScale);
    updateScale();

    return () => window.removeEventListener("resize", updateScale);
  }, []);

  function onDocumentLoadSuccess({ numPages }) {
    setNumPages(numPages);
  }

  function onDocumentLoadError(error) {
    console.error("Error loading PDF:", error);
  }

  if (!PDFComponent) {
    return <div>Loading PDF viewer...</div>;
  }

  const { Document, Page } = PDFComponent;

  return (
    <div className="flex flex-col p-4" ref={containerRef}>
      <div className="flex overflow-y-auto">
        {data && data.fileId ? (
          <Document
            file={`${data.downloadUrl}`}
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={onDocumentLoadError}
            className="flex-grow justify-center overflow-auto"
          >
            <Page
              pageNumber={pageNumber}
              width={650}
              scale={scale}
              renderAnnotationLayer={false}
            />
          </Document>
        ) : (
          <div className="flex flex-col p-4">No PDF file specified</div>
        )}
      </div>
      <div className="grid grid-flow-row grid-cols-3 justify-between items-center border-t border-gray-200 pt-2">
        <div className="grid-cols-1">
          <Actions data={data} />
        </div>
        <>
          {numPages && (
            <div className="flex gap-2 items-center">
              <Button
                onClick={() => setPageNumber((page) => Math.max(page - 1, 1))}
                disabled={pageNumber <= 1}
              >
                Previous
              </Button>
              <p className="text-center">
                {pageNumber} of {numPages}
              </p>
              <Button
                onClick={() =>
                  setPageNumber((page) => Math.min(page + 1, numPages))
                }
                disabled={pageNumber >= numPages}
              >
                Next
              </Button>
            </div>
          )}
        </>
      </div>
    </div>
  );
};

export default dynamic(() => Promise.resolve(PDFView), {
  ssr: false,
});
