"use client";

import { FileSearch, FileText } from "lucide-react";
import { Card, CardContent } from "./ui/card";
import { motion } from "framer-motion";
import FileDropper from "./file-dropper";

const NoDocumentSelected = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="w-full h-full "
    >
      <Card className="h-full w-full rounded-2xl border border-dashed border-gray-200 bg-white shadow-sm transition-colors hover:shadow-md">
        <CardContent className="w-full h-full flex flex-col justify-center items-center gap-6 p-8">
          <div className="p-4 bg-gray-50 rounded-full shadow-inner">
            <FileSearch size={60} className="text-gray-300" />
          </div>

          <div className="text-center">
            <p className="text-gray-700 font-semibold text-xl mb-1">
              Select a document to view details
            </p>
            <p className="text-gray-500 text-sm max-w-md mx-auto">
              Upload or choose a document to see its contents, metadata, and
              more.
            </p>
          </div>

          {/* <div className="w-full p-8">
            <FileDropper />
          </div> */}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default NoDocumentSelected;
