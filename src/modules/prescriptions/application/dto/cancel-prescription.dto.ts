import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CancelPrescriptionDto {
  @ApiProperty({ description: 'Why the prescription is being cancelled', example: 'Issued for the wrong patient' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  reason: string;

  @ApiProperty({ description: 'User ID of the person cancelling', example: 'doc_12345' })
  @IsString()
  @IsNotEmpty()
  cancelledBy: string;
}
