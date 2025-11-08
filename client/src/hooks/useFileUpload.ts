import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
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
      // console.log('Uploading:', { roomId, meterType, fileName: file.name });

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

//Get presigned url
export const useGetPresignedURL = (
  operation: 'get' | 'put',
  roomNumber: string,
  contentType?: string
) => {
  return useQuery({
    queryKey: ['presigned-url', operation, roomNumber, contentType],
    queryFn: async (): Promise<string> => {
      const params: Record<string, string> = { operation, roomNumber }
      if (contentType) params.contentType = contentType

      const response = await api.get<ApiResponse<string>>(
        '/upload/get-presigned',
        { params }
      )
      return response.data.data ? response.data.data : ''
    },
    enabled: !!roomNumber && !!operation,
  })
}
