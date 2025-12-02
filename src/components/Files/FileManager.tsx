import React, { useRef } from 'react';
import { Upload, MoreVertical, Folder, File, FileText, Image, Video, Music, Archive } from 'lucide-react';
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

const getFileIcon = (fileName: string) => {
  const extension = fileName.split('.').pop()?.toLowerCase();
  
  switch (extension) {
    case 'pdf':
      return <FileText className="w-6 h-6 text-red-400" />;
    case 'doc':
    case 'docx':
      return <FileText className="w-6 h-6 text-blue-400" />;
    case 'xls':
    case 'xlsx':
      return <FileText className="w-6 h-6 text-green-400" />;
    case 'jpg':
    case 'jpeg':
    case 'png':
    case 'gif':
    case 'svg':
      return <Image className="w-6 h-6 text-purple-400" />;
    case 'mp4':
    case 'avi':
    case 'mov':
      return <Video className="w-6 h-6 text-orange-400" />;
    case 'mp3':
    case 'wav':
      return <Music className="w-6 h-6 text-pink-400" />;
    case 'zip':
    case 'rar':
    case '7z':
      return <Archive className="w-6 h-6 text-yellow-400" />;
    default:
      return <File className="w-6 h-6 text-gray-400" />;
  }
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
          <div className="relative">
            <div className="w-8 h-8 border-2 border-white/20 border-t-blue-500 rounded-full animate-spin"></div>
            <div className="absolute inset-0 w-8 h-8 border-2 border-transparent border-t-purple-500 rounded-full animate-spin" style={{ animationDelay: '-0.5s' }}></div>
          </div>
        </div>
      );
    }

    if (!selectedProject) {
      return (
        <Card className="glassmorphic-card backdrop-blur-xl bg-white/10 border border-white/20 shadow-lg">
          <CardContent className="flex items-center justify-center h-64">
            <div className="text-center">
              <Folder className="w-16 h-16 mx-auto mb-4 text-white/40" />
              <p className="text-white/60 text-lg">Wybierz projekt, aby zobaczyć pliki.</p>
            </div>
          </CardContent>
        </Card>
      );
    }

    if (!loading && files.length === 0) {
      return (
        <Card className="glassmorphic-card backdrop-blur-xl bg-white/10 border border-white/20 shadow-lg">
          <CardContent className="flex items-center justify-center h-64">
            <div className="text-center">
              <File className="w-16 h-16 mx-auto mb-4 text-white/40" />
              <p className="text-white/60 text-lg">Ten projekt nie ma jeszcze żadnych plików.</p>
            </div>
          </CardContent>
        </Card>
      );
    }

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        {files.map((file, index) => (
          <Card 
            key={file.id} 
            className="glassmorphic-card backdrop-blur-xl bg-white/10 border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 group animate-fade-in"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <CardContent className="p-4 flex flex-col justify-between h-full">
              <div className="flex-grow">
                <div className="flex justify-between items-start">
                  <div className="w-12 h-12 flex items-center justify-center bg-white/10 rounded-lg border border-white/20 backdrop-blur-sm">
                    {getFileIcon(file.name)}
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="p-2 rounded-lg hover:bg-white/20 opacity-0 group-hover:opacity-100 transition-all duration-300 bg-white/10 backdrop-blur-sm">
                        <MoreVertical className="w-4 h-4 text-white/70" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="glassmorphic-card backdrop-blur-xl bg-white/10 border border-white/20">
                      <DropdownMenuItem 
                        onClick={() => downloadFile && downloadFile(file.path, file.name)} 
                        className="cursor-pointer text-white/80 hover:text-white hover:bg-white/20"
                      >
                        Pobierz
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => deleteFile && deleteFile(file.id, file.path)} 
                        className="cursor-pointer text-red-400 hover:text-red-300 hover:bg-red-500/20"
                      >
                        Usuń
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <p className="text-white font-semibold mt-4 truncate" title={file.name}>{file.name}</p>
              </div>
              <div className="mt-4 text-xs text-white/60 space-y-1">
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
    <div className="space-y-8 animate-fadeIn">
      {/* Header and Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">Menedżer Plików</h2>
          <p className="text-white/60 text-lg">Przeglądaj i zarządzaj plikami projektu.</p>
        </div>
        <div className="flex items-center space-x-4">
          <select 
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            className="bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white min-w-[200px] backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50"
            disabled={loading}
          >
            <option value="">Wybierz projekt</option>
            {projects.map(project => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
          <Button 
            onClick={handleUploadClick} 
            disabled={!selectedProject || loading}
            className="bg-blue-500 hover:bg-blue-600 text-white font-semibold px-6 py-2 rounded-lg transition-all duration-300 hover:scale-105 shadow-lg"
          >
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