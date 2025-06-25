import {
  IsString,
  IsNotEmpty,
  IsDateString,
  IsArray,
  IsOptional,
} from 'class-validator';

export class CreateNewVerification {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  clientWalletAddress: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsDateString()
  completedAt: string;

  @IsArray()
  @IsString({ each: true })
  skills: string[];

  @IsString()
  @IsOptional()
  files?: string;
}
