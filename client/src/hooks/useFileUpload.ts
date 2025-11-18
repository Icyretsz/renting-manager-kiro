import { useMutation, useQuery } from '@tanstack/react-query';
import api from '@/services/api';
import { ApiResponse, ImageUploadPresignedURLType, PresignedURLParams, UploadToS3Params } from '@/types';

const fileUploadKeys = {
  all: ['fileUpload'] as const,
  getByFilename: (filename: string) => [...fileUploadKeys.all, 'get', filename] as const,
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

//Get presigned url (mutation for PUT operations)
export const useGetPresignedURLMutation = () => {
  return useMutation({
    mutationFn: async ({
      operation,
      roomNumber,
      contentType,
      imageType,
      fileName,
    }: PresignedURLParams): Promise<ImageUploadPresignedURLType> => {
      // Build query params safely
      const params: Record<string, string | undefined> = { operation, roomNumber, contentType, imageType, fileName }

      const response = await api.get<ApiResponse<ImageUploadPresignedURLType>>(
        '/upload/get-presigned',
        { params }
      )

      if (response.data.data) {
        if (!response.data.data.url) {
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

//Get presigned url (query for GET operations - with caching)
export const useGetPresignedURLQuery = (params: PresignedURLParams | null) => {
  return useQuery({
    queryKey: [...fileUploadKeys.all, 'presigned', params?.operation, params?.roomNumber, params?.imageType, params?.fileName],
    queryFn: async (): Promise<ImageUploadPresignedURLType> => {
      if (!params) throw new Error('No params provided');
      
      const queryParams: Record<string, string | undefined> = { 
        operation: params.operation, 
        roomNumber: params.roomNumber, 
        contentType: params.contentType, 
        imageType: params.imageType, 
        fileName: params.fileName 
      }

      const response = await api.get<ApiResponse<ImageUploadPresignedURLType>>(
        '/upload/get-presigned',
        { params: queryParams }
      )

      if (response.data.data?.url) {
        return response.data.data
      } else {
        throw new Error('Error getting presigned URL')
      }
    },
    enabled: !!params && !!params.fileName && !!params.roomNumber,
    staleTime: 30 * 60 * 1000, // 5 minutes - presigned URLs typically last 15 minutes
    gcTime: 30 * 60 * 1000, // 10 minutes
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