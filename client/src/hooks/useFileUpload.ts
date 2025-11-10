import { useMutation } from '@tanstack/react-query';
import api from '@/services/api';
import { ApiResponse } from '@/types';
type PresignedURLOperation = 'get' | 'put'

interface PresignedURLParams {
  operation: PresignedURLOperation
  roomNumber: string
  contentType: string,
  meterType: string,
  fileName: string
}

interface UploadToS3Params {
  presignedUrl: string
  file: File
}

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
export const useGetPresignedURLMutation = () => {
  return useMutation({
    mutationFn: async ({
      operation,
      roomNumber,
      contentType,
      meterType,
      fileName,
    }: PresignedURLParams): Promise<string> => {
      // Build query params safely
      const params: Record<string, string> = { operation, roomNumber, contentType, meterType, fileName }

      const response = await api.get<ApiResponse<string>>(
        '/upload/get-presigned',
        { params }
      )

      if (response.data.data) {
        if (response.data.data === '') {
          throw new Error('Error getting presigned URL')
        } else {
          return response.data.data
        }
      } else {
        throw new Error('Error getting presigned URL')
      }
    },
  })
}

//Upload file directly to AWS S3 using a presigned URL
export const useUploadToS3Mutation = () => {
  return useMutation({
    mutationFn: async ({ presignedUrl, file }: UploadToS3Params): Promise<void> => {
      const response = await fetch(presignedUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type,
        },
      })

      if (!response.ok) {
        throw new Error(`Failed to upload file to S3: ${response.statusText}`)
      }
    },
  })
}