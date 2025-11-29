import React from 'react';
import { FolderSearch } from 'lucide-react';
import { Card, CardContent } from '../../ui/card';

const NoFolderSelected = () => {
  return (
    <Card className="flex flex-col h-full rounded-2xl shadow-none p-1 w-full min-w-sm  lg:min-w-md border">
      <CardContent className="flex flex-col items-center justify-center h-full text-center p-8 bg-gray-50">
        <div className="flex items-center justify-center w-22 h-22 bg-gray-100 shadow-inner rounded-full mb-6">
          <FolderSearch size={46} className="text-gray-400" />
        </div>
        <h2 className="text-xl font-custom text-gray-700 mb-2">Select a Folder to Begin</h2>
        <p className="text-sm text-gray-500 max-w-md">
          Please choose a folder from the client workspace on the left to upload your documents.
        </p>
      </CardContent>
    </Card>
  );
};

export default NoFolderSelected;
