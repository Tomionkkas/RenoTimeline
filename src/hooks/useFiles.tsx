import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { type User } from '@supabase/supabase-js';
import { FileText, Image as ImageIcon, Video, Music, Archive, File as FileIcon } from 'lucide-react';
import { toast } from "sonner";
import { v4 as uuidv4 } from 'uuid';

// This is a mock implementation. It will be replaced with Supabase integration.

export interface ProjectFile {
  id: string; // Changed to string (UUID)
  created_at: string;
  name: string;
  path: string;
  file_type: string | null;
  size: number | null; // Changed to number (bytes)
  project_id: string;
  user_id: string | null;
  uploader_name: string | null; // For display
  icon: JSX.Element;
}

const getFileIcon = (fileType: string | null): JSX.Element => {
  if (!fileType) return <FileIcon />;
  if (fileType.startsWith('image/')) return <ImageIcon />;
  if (fileType.startsWith('video/')) return <Video />;
  if (fileType.startsWith('audio/')) return <Music />;
  if (fileType.includes('zip') || fileType.includes('archive')) return <Archive />;
  if (fileType.includes('pdf') || fileType.includes('document')) return <FileText />;
  return <FileIcon />;
};

export const useFiles = (projectId?: string) => {
  const [files, setFiles] = useState<ProjectFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    }
    fetchUser();
  }, []);

  const fetchFiles = useCallback(async () => {
    if (!projectId) {
      setFiles([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('files')
        .select(`
          id,
          created_at,
          name,
          path,
          file_type,
          size,
          project_id,
          user_id,
          profiles (
            first_name,
            last_name
          )
        `)
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedFiles: ProjectFile[] = data.map((file: any) => ({
        ...file,
        uploader_name: file.profiles ? `${file.profiles.first_name || ''} ${file.profiles.last_name || ''}`.trim() : 'Unknown User',
        icon: getFileIcon(file.file_type),
      }));
      setFiles(formattedFiles);
    } catch (error) {
      console.error('Error fetching files:', error);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  const uploadFile = async (file: File, pId: string) => {
    if (!user) {
      toast.error('Błąd: Użytkownik nie jest uwierzytelniony.');
      return;
    }
    if (!pId) {
      toast.error('Błąd: Brak identyfikatora projektu.');
      return;
    }

    const fileExt = file.name.split('.').pop();
    const newName = `${uuidv4()}-${file.name}`;
    const filePath = `${pId}/${newName}`;

    setLoading(true);
    const toastId = toast.loading(`Przesyłanie pliku: ${file.name}...`);

    try {
      const { error: uploadError } = await supabase.storage
        .from('renotl_project_files')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { error: dbError } = await supabase
        .from('files')
        .insert({
          name: file.name,
          path: filePath,
          file_type: file.type,
          size: file.size,
          project_id: pId,
          user_id: user.id,
        });
      
      if (dbError) throw dbError;

      toast.success("Plik został pomyślnie przesłany!", { id: toastId });
      await fetchFiles();
    } catch (error: any) {
      console.error('Error uploading file:', error);
      toast.error(`Błąd podczas przesyłania pliku: ${error.message}`, { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  const deleteFile = async (fileId: string, filePath: string) => {
    const toastId = toast.loading("Usuwanie pliku...");
    try {
      setLoading(true);
      const { error: storageError } = await supabase.storage
        .from('renotl_project_files')
        .remove([filePath]);

      if (storageError) throw storageError;

      const { error: dbError } = await supabase
        .from('files')
        .delete()
        .eq('id', fileId);
      
      if (dbError) throw dbError;

      toast.success("Plik został usunięty.", { id: toastId });
      await fetchFiles();
    } catch (error: any) {
      console.error('Error deleting file:', error);
      toast.error(`Błąd podczas usuwania pliku: ${error.message}`, { id: toastId });
    } finally {
      setLoading(false);
    }
  };
  
  const downloadFile = async (filePath: string, fileName: string) => {
    const toastId = toast.loading("Pobieranie pliku...");
    try {
      const { data, error } = await supabase.storage
        .from('renotl_project_files')
        .download(filePath);
      
      if (error) throw error;

      const url = window.URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success("Pobieranie zakończone.", { id: toastId });
    } catch (error: any) {
      console.error('Error downloading file:', error);
      toast.error(`Błąd podczas pobierania pliku: ${error.message}`, { id: toastId });
    }
  }

  return { files, loading, uploadFile, deleteFile, downloadFile, refetch: fetchFiles };
}; 