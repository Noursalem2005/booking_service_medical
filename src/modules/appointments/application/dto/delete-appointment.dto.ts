import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class DeleteAppointmentDto {
  @ApiProperty({ description: 'User ID of the person deleting the appointment', example: 'usr_12345' })
  @IsString()
  @IsNotEmpty()
  deletedBy: string;

  @ApiPropertyOptional({ description: 'Cancellation reason recorded if the appointment was still active', example: 'Booked by mistake' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}
