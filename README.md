# 📅 Booking Service (`booking-service`)

A high-performance, Domain-Driven Design (DDD) microservice in NestJS responsible for:
1. **Doctor Schedules & Real-Time Availability Slot Generation**
2. **Appointment Lifecycle Management** (Booking, Rescheduling, Cancelling, Searching, Updating, Soft Deleting)
3. **Digital Prescriptions Management** (Issuing, Searching, Detailed View, Cancelling)
4. **Domain Exception Handling, System Clock & Custom Domain Policies**

---

## 🏗️ Architecture & Modular DDD Structure

The microservice strictly enforces **Clean Architecture & Bounded Context Modular DDD**:

```
booking-service/src/
├── core/                               <-- Shared Kernel & Cross-Cutting Infrastructure
│   ├── application/
│   │   ├── clock.port.ts               <-- System Clock Port interface for deterministic testing
│   │   └── dto/
│   │       └── pagination-query.dto.ts <-- Standard Pagination Query DTO (page, limit)
│   ├── domain/
│   │   ├── exceptions/
│   │   │   └── domain.exception.ts     <-- Base Domain Exception class
│   │   ├── pagination.ts              <-- Pagination result wrapper
│   │   └── time.util.ts               <-- Time calculations & ISO string parsing utilities
│   ├── infrastructure/
│   │   ├── database/mongodb/           <-- Database connection module
│   │   └── system-clock.ts            <-- Real System Clock Implementation
│   ├── presentation/
│   │   └── filters/
│   │       └── domain-exception.filter.ts <-- Global Filter translating Domain Exceptions to HTTP responses
│   └── core.module.ts
│
└── modules/                            <-- Domain Bounded Context Feature Modules
    ├── appointments/                   <-- Appointment Lifecycle Context
    │   ├── application/
    │   │   ├── dto/                    <-- BookAppointmentDto, UpdateAppointmentDto, SearchAppointmentsDto, etc.
    │   │   └── use-cases/              <-- Book, Cancel, Reschedule, Search, Delete, Update Status Use Cases
    │   ├── domain/
    │   │   ├── entities/               <-- AppointmentEntity & status state machine
    │   │   ├── enums/                  <-- AppointmentStatus, AppointmentType
    │   │   ├── exceptions/             <-- AppointmentNotFoundException, InvalidSlotException, etc.
    │   │   ├── policies/               <-- AppointmentSlotPolicy, AppointmentStatusPolicy
    │   │   └── repositories/           <-- IAppointmentRepository interface
    │   ├── infrastructure/             <-- Mongo Schema & Mongo Repository Implementation
    │   ├── presentation/               <-- AppointmentsController (REST API)
    │   └── appointments.module.ts
    │
    ├── schedules/                      <-- Doctor Schedule & Slot Generation Context
    │   ├── application/
    │   │   ├── dto/                    <-- SetScheduleDto, AddScheduleExceptionDto
    │   │   └── use-cases/              <-- SetDoctorSchedule, AddScheduleException, GetAvailableSlots Use Cases
    │   ├── domain/
    │   │   ├── entities/               <-- DoctorScheduleEntity, ScheduleExceptionEntity
    │   │   ├── enums/                  <-- ExceptionType (HOLIDAY, LEAVE, etc.)
    │   │   ├── repositories/           <-- IDoctorScheduleRepository, IScheduleExceptionRepository
    │   │   └── services/               <-- SlotGeneratorService (real-time slot calculation)
    │   ├── infrastructure/             <-- Mongo Schemas & Mongo Repository Implementations
    │   ├── presentation/               <-- SchedulesController (REST API)
    │   └── schedules.module.ts
    │
    └── prescriptions/                  <-- Digital Prescriptions Context
        ├── application/
        │   ├── dto/                    <-- IssuePrescriptionDto, CancelPrescriptionDto, SearchPrescriptionsDto
        │   └── use-cases/              <-- Issue, Get, Search, Cancel Prescription Use Cases
        ├── domain/
        │   ├── entities/               <-- PrescriptionEntity
        │   ├── enums/                  <-- PrescriptionStatus (ACTIVE, FULFILLED, CANCELLED, EXPIRED)
        │   ├── exceptions/             <-- PrescriptionNotFoundException, PrescriptionAlreadyCancelledException
        │   ├── ports/                  <-- AppointmentLookupPort
        │   ├── repositories/           <-- IPrescriptionRepository interface
        │   └── value-objects/          <-- PrescriptionItemValueObject (medication details)
        ├── infrastructure/
        │   ├── adapters/               <-- AppointmentsModuleLookupAdapter
        │   ├── repositories/           <-- MongoPrescriptionRepository
        │   └── schemas/                <-- PrescriptionSchema
        ├── presentation/               <-- PrescriptionsController (REST API)
        └── prescriptions.module.ts
```

---

## 📡 API Catalog & Endpoints

### 1. Appointments Controller (`/appointments`)

| Method | Endpoint Path | Summary | Description & Payload / Query Params |
|---|---|---|---|
| `POST` | `/appointments` | Book Appointment | Books a new appointment slot with overlap validation & queue number calculation.<br>Payload: `patientId`, `doctorClinicId`, `scheduleId`, `appointmentDate`, `timeSlot`, `durationMinutes`, `type`, `reasonForVisit`, `notes`, `fee`. |
| `GET` | `/appointments` | Search Appointments | Search appointments with pagination.<br>Query: `patientId`, `doctorClinicId`, `status`, `startDate`, `endDate`, `page`, `limit`. |
| `GET` | `/appointments/:id` | Get Appointment | Fetch appointment details by ID. |
| `PUT` | `/appointments/:id` | Update Appointment | Update appointment details (`reasonForVisit`, `notes`, `fee`). |
| `PATCH` | `/appointments/:id/status` | Update Status | Update status (`CONFIRMED`, `COMPLETED`, `CANCELLED`, `NO_SHOW`). Enforces state machine policy. |
| `POST` | `/appointments/:id/reschedule` | Reschedule Appointment | Reschedule appointment to a new date and time slot with overlap validation. |
| `POST` | `/appointments/:id/cancel` | Cancel Appointment | Cancel appointment with cancellation reason and audit trail. |
| `DELETE` | `/appointments/:id` | Soft Delete Appointment | Soft-delete an appointment record (`isDeleted: true`). |

---

### 2. Schedules Controller (`/schedules`)

| Method | Endpoint Path | Summary | Description & Payload / Query Params |
|---|---|---|---|
| `POST` | `/schedules/doctor` | Set Doctor Schedule | Set or replace a doctor's weekly working schedule, shift hours, and slot duration.<br>Payload: `doctorClinicId`, `slotDurationMinutes`, `weeklySchedule: [{ dayOfWeek, isWorkingDay, shifts, breaks }]`. |
| `POST` | `/schedules/exception` | Add Schedule Exception | Add doctor day-off, holiday, or emergency leave exception.<br>Payload: `doctorClinicId`, `startDate`, `endDate`, `reason`, `type`. |
| `GET` | `/schedules/available-slots` | Get Available Slots | Calculate real-time available time slots for a doctor on a specific date.<br>Query: `doctorClinicId`, `date` (YYYY-MM-DD). |

---

### 3. Prescriptions Controller (`/prescriptions`)

| Method | Endpoint Path | Summary | Description & Payload / Query Params |
|---|---|---|---|
| `POST` | `/prescriptions` | Issue Prescription | Issue a new digital prescription for a patient.<br>Payload: `patientId`, `doctorId`, `clinicId`, `appointmentId`, `diagnosis`, `items: [{ medicineName, dosage, frequency, durationDays, instructions }]`, `notes`. |
| `GET` | `/prescriptions` | Search Prescriptions | Search prescriptions with pagination.<br>Query: `patientId`, `doctorId`, `clinicId`, `status`, `startDate`, `endDate`, `page`, `limit`. |
| `GET` | `/prescriptions/:id` | Get Prescription Details | Fetch prescription details by ID. |
| `POST` | `/prescriptions/:id/cancel` | Cancel Prescription | Revoke/cancel an issued prescription with a documented cancellation reason. |

---

## 🛡️ Business Rules & Domain Policies

1. **Appointment Slot Policy (`AppointmentSlotPolicy`)**:
   - Rejects bookings for dates/times in the past.
   - Enforces slot duration matching doctor schedule configuration.

2. **Appointment Status Policy (`AppointmentStatusPolicy`)**:
   - Enforces finite state machine rules:
     - `CONFIRMED` $\rightarrow$ `COMPLETED` \| `CANCELLED` \| `NO_SHOW`
     - `CANCELLED` is a terminal status (cannot transition back to `CONFIRMED`).
     - `COMPLETED` is a terminal status.

3. **Real-time Slot Generation Algorithm (`SlotGeneratorService`)**:
   - Parses doctor shift hours for the target day of week.
   - Subtracts configured break windows.
   - Subtracts existing active/confirmed bookings.
   - Evaluates schedule exceptions (holidays/leaves).

4. **Prescription Status State Machine (`PrescriptionEntity`)**:
   - Validates medication item fields (`medicineName`, `dosage`, `frequency`, `durationDays`).
   - Prevents cancelling an already cancelled or fulfilled prescription.

5. **Domain Exception Filter (`DomainExceptionFilter`)**:
   - Automatically catches domain exceptions and returns structured HTTP error responses (`400 Bad Request`, `404 Not Found`, `409 Conflict`).

---

## 💾 Database Schemas

### 1. `AppointmentSchema` (`appointments` collection)
- `_id`: ObjectId
- `bookingCode`: string (`BOOK-{id}`)
- `patientId`: string (indexed)
- `doctorClinicId`: string (indexed)
- `scheduleId`: string
- `appointmentDate`: Date
- `timeSlot`: string (`HH:mm`)
- `queueNumber`: number
- `estimatedEntryTime`: string
- `durationMinutes`: number
- `status`: enum (`CONFIRMED`, `COMPLETED`, `CANCELLED`, `NO_SHOW`)
- `type`: enum (`IN_PERSON`, `ONLINE`)
- `reasonForVisit`: string
- `notes`: string
- `cancellationReason`: string
- `cancelledBy`: string
- `fee`: number
- `isPaid`: boolean
- `isDeleted`: boolean

### 2. `PrescriptionSchema` (`prescriptions` collection)
- `_id`: ObjectId
- `prescriptionCode`: string (`RX-{id}`)
- `patientId`: string (indexed)
- `doctorId`: string (indexed)
- `clinicId`: string (indexed)
- `appointmentId`: string (optional)
- `diagnosis`: string
- `items`: Array of `{ medicineName, dosage, frequency, durationDays, instructions }`
- `status`: enum (`ACTIVE`, `FULFILLED`, `CANCELLED`, `EXPIRED`)
- `notes`: string
- `cancelledAt`: Date
- `cancellationReason`: string

---

## 🧪 Unit Testing Suite

The service includes **80 unit test cases** covering domain entities, policies, and use cases:

```bash
# Run all unit tests with Vitest
$ npm run test

# Run build
$ npm run build

# Start development server
$ npm run start:dev
```
