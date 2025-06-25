import { IsString, Length, Matches } from 'class-validator';

export class CreateUserDto {
  @IsString()
  @Length(32, 100, {
    message: 'walletAddress must be between 32 and 44 characters',
  })
  @Matches(/^[1-9A-HJ-NP-Za-km-z]+$/, {
    message: 'walletAddress must be a valid Base58 string',
  })
  walletAddress: string;
}
