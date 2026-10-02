import { InvalidPrescriptionException } from '../exceptions/prescription.exceptions';

export interface PrescriptionItemProps {
  medicationName: string;
  dosage: string;        // e.g. "500 mg"
  frequency: string;     // e.g. "twice daily"
  durationDays: number;  // how long to take it
  quantity?: number;     // units to dispense
  route?: string;        // e.g. "oral"
  instructions?: string; // e.g. "after meals"
}

/** One prescribed medication line. Immutable; has no identity apart from its values. */
export class PrescriptionItem {
  private constructor(
    public readonly medicationName: string,
    public readonly dosage: string,
    public readonly frequency: string,
    public readonly durationDays: number,
    public readonly quantity?: number,
    public readonly route?: string,
    public readonly instructions?: string,
  ) {}

  /** Validates – use when a doctor issues a new prescription. */
  static create(props: PrescriptionItemProps): PrescriptionItem {
    const medicationName = props.medicationName?.trim();
    const dosage = props.dosage?.trim();
    const frequency = props.frequency?.trim();

    if (!medicationName) throw new InvalidPrescriptionException('Each item needs a medication name.');
    if (!dosage) throw new InvalidPrescriptionException(`'${medicationName}': dosage is required.`);
    if (!frequency) throw new InvalidPrescriptionException(`'${medicationName}': frequency is required.`);
    if (!Number.isInteger(props.durationDays) || props.durationDays < 1 || props.durationDays > 365) {
      throw new InvalidPrescriptionException(`'${medicationName}': duration must be a whole number of days between 1 and 365.`);
    }
    if (props.quantity !== undefined && (!Number.isInteger(props.quantity) || props.quantity < 1)) {
      throw new InvalidPrescriptionException(`'${medicationName}': quantity must be a positive whole number.`);
    }

    return new PrescriptionItem(
      medicationName,
      dosage,
      frequency,
      props.durationDays,
      props.quantity,
      props.route?.trim() || undefined,
      props.instructions?.trim() || undefined,
    );
  }

  /** Rebuilds an item from storage WITHOUT re-validating, so old records never become unreadable if rules tighten. */
  static restore(props: PrescriptionItemProps): PrescriptionItem {
    return new PrescriptionItem(
      props.medicationName,
      props.dosage,
      props.frequency,
      props.durationDays,
      props.quantity ?? undefined,
      props.route ?? undefined,
      props.instructions ?? undefined,
    );
  }
}
