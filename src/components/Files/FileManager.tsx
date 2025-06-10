import React, { useRef } from 'react';
import { Upload, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useFiles } from '@/hooks/useFiles';
import { useProjects } from '@/hooks/useProjects';
import { WorkflowTriggers } from '../../lib/workflow/WorkflowTriggers';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { format } from 'date-fns';

const formatBytes = (bytes: number | null, decimals = 2): string => {
  if (bytes === null || bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

const FileManager = () => {
  const [selectedProject, setSelectedProject] = React.useState<string | undefined>();
  const { files, loading, uploadFile, deleteFile, downloadFile } = useFiles(selectedProject);
  const { projects } = useProjects();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && selectedProject) {
      try {
        // Upload the file
        await uploadFile(file, selectedProject);
        
        // Trigger workflow for file upload
        try {
          await WorkflowTriggers.onFileUploaded(
            'temp-file-id', // This should be the actual file ID returned from upload
            selectedProject,
            file.name,
            file.type,
            'current-user-id' // This should come from auth context
          );
        } catch (workflowError) {
          console.error('Workflow trigger failed:', workflowError);
          // Don't fail the upload if workflow triggers fail
        }
      } catch (error) {
        console.error('File upload failed:', error);
      }
    }
  };

  const renderContent = () => {
    if (loading && files.length === 0) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      );
    }

    if (!selectedProject) {
      return (
        <div className="flex items-center justify-center h-64 bg-card rounded-lg">
            <p className="text-gray-400">Wybierz projekt, aby zobaczyć pliki.</p>
        </div>
      );
    }

    if (!loading && files.length === 0) {
      return (
        <div className="flex items-center justify-center h-64 bg-card rounded-lg">
            <p className="text-gray-400">Ten projekt nie ma jeszcze żadnych plików.</p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        {files.map((file) => (
          <Card key={file.id} className="bg-card border-gray-800 hover:border-blue-500 transition-all group">
            <CardContent className="p-4 flex flex-col justify-between h-full">
              <div className="flex-grow">
                <div className="flex justify-between items-start">
                  <div className="w-10 h-10 flex items-center justify-center bg-gray-700 rounded-lg text-gray-400">
                    {file.icon}
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="p-1 rounded-full hover:bg-gray-700 opacity-0 group-hover:opacity-100 transition-opacity">
                        <MoreVertical className="w-4 h-4 text-gray-400" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="bg-gray-800 border-gray-700 text-white">
                      <DropdownMenuItem onClick={() => downloadFile && downloadFile(file.path, file.name)} className="cursor-pointer hover:bg-gray-700">Pobierz</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => deleteFile && deleteFile(file.id, file.path)} className="cursor-pointer hover:bg-gray-700 text-red-500 hover:text-red-400">Usuń</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <p className="text-white font-semibold mt-4 truncate" title={file.name}>{file.name}</p>
              </div>
              <div className="mt-2 text-xs text-gray-400 space-y-1">
                <p>{formatBytes(file.size)}</p>
                <p>{format(new Date(file.created_at), 'yyyy-MM-dd')}</p>
                <p>Dodał: {file.uploader_name}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header and Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Menedżer Plików</h2>
          <p className="text-gray-400">Przeglądaj i zarządzaj plikami projektu.</p>
        </div>
        <div className="flex items-center space-x-4">
          <select 
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white min-w-[200px]"
            disabled={loading}
          >
            <option value="">Wybierz projekt</option>
            {projects.map(project => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
          <Button onClick={handleUploadClick} disabled={!selectedProject || loading}>
            <Upload className="w-4 h-4 mr-2" />
            {loading ? 'Przesyłanie...' : 'Prześlij plik'}
          </Button>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange}
            className="hidden"
            disabled={loading}
          />
        </div>
      </div>

      {/* File Grid */}
      {renderContent()}
    </div>
  );
};

export default FileManager; 