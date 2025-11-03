export interface UserDto {
  id: string;
  email: string;
  name: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface GetMeResponseDto {
  user: UserDto;
}

export interface SignOutResponseDto {
  message: string;
}
