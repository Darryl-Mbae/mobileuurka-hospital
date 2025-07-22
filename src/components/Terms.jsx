import { createPortal } from "react-dom";
import React, {
  useImperativeHandle,
  useRef,
  forwardRef,
  useState,
} from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "../css/Terms.css";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "/pdf.worker.min.mjs",
  import.meta.url
).toString();

const Terms = forwardRef(function Terms({ pdfUrl, onAccept }, ref) {
  const dialog = useRef();
  const [numPages, setNumPages] = useState(null);

  useImperativeHandle(ref, () => ({
    show() {
      dialog.current?.showModal();
    },
    close() {
      dialog.current?.close();
    },
  }));

  const handleLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
  };

  return createPortal(
    <dialog ref={dialog} className="terms-dialog">
      <h2>Terms & Conditions</h2>

      <div className="terms-pdf-scroll">
        <Document file={pdfUrl} onLoadSuccess={handleLoadSuccess}>
          {Array.from(new Array(numPages), (_, index) => (
            <Page
              key={index + 1}
              pageNumber={index + 1}
              renderTextLayer={false}
              renderAnnotationLayer={false}
              scale={1.2}
            />
          ))}
        </Document>
      </div>

      <div className="terms-actions">
        <button
          onClick={() => {
            onAccept();
            dialog.current.close();
          }}
        >
          Accept and Continue
        </button>
      </div>
    </dialog>,
    document.body
  );
});

export default Terms;
