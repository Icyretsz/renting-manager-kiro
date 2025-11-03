import { useMutation } from '@tanstack/react-query';
import api from '@/services/api';
import { ApiResponse } from '@/types';

// Upload meter photo mutation
export const useUploadMeterPhotoMutation = () => {
  return useMutation({
    mutationFn: async (file: File): Promise<string> => {
      const formData = new FormData();
      formData.append('photo', file);

      const response = await api.post<ApiResponse<{ filename: string; url: string }>>(
        '/upload/meter-photo',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      if (!response.data.data?.url) {
        throw new Error('Upload failed');
      }

      return response.data.data.url;
    },
  });
};