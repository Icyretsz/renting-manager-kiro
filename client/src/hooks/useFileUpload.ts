import { useMutation } from '@tanstack/react-query';
import api from '@/services/api';
import { ApiResponse } from '@/types';

// Upload meter photo mutation
export const useUploadMeterPhotoMutation = () => {
  return useMutation({
    mutationFn: async ({ file, roomId, meterType }: { file: File; roomId: number; meterType: 'water' | 'electricity' }): Promise<string> => {
      const formData = new FormData();
      formData.append('photo', file);
      formData.append('roomId', roomId.toString());
      formData.append('meterType', meterType);
      console.log('Uploading:', { roomId, meterType, fileName: file.name });

      const response = await api.post<ApiResponse<{ photoUrl: string; filename: string }>>(
        '/upload/photo',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      if (!response.data.data?.photoUrl) {
        throw new Error('Upload failed');
      }

      return response.data.data.photoUrl;
    },
  });
};