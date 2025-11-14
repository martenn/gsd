import type { GetMeResponseDto, SignOutResponseDto } from '@gsd/types';
import { apiClient } from './client';

export async function getMe(): Promise<GetMeResponseDto> {
  return apiClient.get('/auth/me');
}

export async function logout(): Promise<SignOutResponseDto> {
  return apiClient.post('/auth/logout');
}
