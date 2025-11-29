"use client";

import { Ban } from "lucide-react";
import { Card, CardContent } from "./ui/card";

const NotUploadableNotice = () => {
  return (
      <Card className="h-full w-full rounded-2xl border border-dashed border-gray-200 bg-white shadow-sm transition-colors hover:shadow-md">
        <CardContent className="w-full h-full flex flex-col justify-center items-center gap-6 p-8">
          <div className="p-4 bg-gray-50 rounded-full shadow-inner">
            <Ban size={60} className="text-gray-300" />
          </div>

          <div className="text-center">
            <p className="text-gray-700 font-semibold text-xl mb-1">
              Uploads Not Allowed
            </p>
            <p className="text-gray-500 text-sm max-w-md mx-auto leading-relaxed">
              Uploads are not permitted for this folder. Please select another
              folder that allows file uploads or contact your administrator for
              access.
            </p>
          </div>
        </CardContent>
      </Card>
  );
};

export default NotUploadableNotice;
