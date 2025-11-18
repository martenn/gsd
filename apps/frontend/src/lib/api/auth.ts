import type { GetMeResponseDto, SignOutResponseDto } from '@gsd/types';
import { apiClient } from './client';

export async function getMe(): Promise<GetMeResponseDto> {
  const result = await apiClient.get<GetMeResponseDto>('/auth/me');
  if (!result) {
    throw new Error('Failed to get user data');
  }
  return result;
}

export async function logout(): Promise<SignOutResponseDto> {
  const result = await apiClient.post<SignOutResponseDto>('/auth/signout');
  if (!result) {
    throw new Error('Failed to logout');
  }
  return result;
}
