import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize, ArrayMinSize, IsArray, IsInt, IsNotEmpty, IsOptional, IsString, Max, MaxLength, Min, ValidateNested,
} from 'class-validator';

export class PrescriptionItemDto {
  @ApiProperty({ description: 'Medication name', example: 'Amoxicillin' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  medicationName: string;

  @ApiProperty({ description: 'Dosage per intake', example: '500 mg' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  dosage: string;

  @ApiProperty({ description: 'How often to take it', example: 'Twice daily' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  frequency: string;

  @ApiProperty({ description: 'Treatment duration in days (1-365)', example: 7 })
  @IsInt()
  @Min(1)
  @Max(365)
  durationDays: number;

  @ApiPropertyOptional({ description: 'Units to dispense', example: 14 })
  @IsOptional()
  @IsInt()
  @Min(1)
  quantity?: number;

  @ApiPropertyOptional({ description: 'Route of administration', example: 'Oral' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  route?: string;

  @ApiPropertyOptional({ description: 'Extra instructions', example: 'Take after meals' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  instructions?: string;
}

export class IssuePrescriptionDto {
  @ApiProperty({ description: 'Appointment (visit) this prescription belongs to. The patient and clinic are taken from it.', example: '66f1a2b3c4d5e6f708192a3b' })
  @IsString()
  @IsNotEmpty()
  appointmentId: string;

  @ApiProperty({ description: 'Doctor issuing the prescription', example: 'doc_12345' })
  @IsString()
  @IsNotEmpty()
  doctorId: string;

  @ApiPropertyOptional({ description: 'Diagnosis', example: 'Acute sinusitis' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  diagnosis?: string;

  @ApiPropertyOptional({ description: 'Notes for the patient / pharmacist', example: 'Avoid alcohol during treatment' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;

  @ApiPropertyOptional({ description: 'How many days the prescription stays valid (default 30, max 365)', example: 30 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(365)
  validityDays?: number;

  @ApiProperty({ type: [PrescriptionItemDto], description: 'Prescribed medications (1-20)' })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => PrescriptionItemDto)
  items: PrescriptionItemDto[];
}
