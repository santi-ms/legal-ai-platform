// Configuration for API URLs
export const config = {
  apiUrl: process.env.NEXT_PUBLIC_API_URL || "http://localhost:4001",
  pdfServiceUrl: process.env.NEXT_PUBLIC_PDF_SERVICE_URL || "http://localhost:4100",
  isDevelopment: process.env.NODE_ENV === "development",
};

