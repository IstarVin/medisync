```mermaid
classDiagram
    %% Core Entities
    class User {
        +ObjectId _id
        +string email
        +string passwordHash
        +string firstName
        +string lastName
        +UserRole role
        +string phoneNumber
        +string profileUrl
        +boolean isActive
        +Date lastLogin
        +Date createdAt
        +Date updatedAt
        +generateSessionToken()
        +validatePassword()
    }

    class Session {
        +string _id
        +ObjectId userId
        +Date expiresAt
        +validateToken()
        +isExpired()
    }

    class Student {
        +ObjectId _id
        +string studentId
        +string qrCodeId
        +string firstName
        +string lastName
        +string middleName
        +string email
        +Date dateOfBirth
        +Gender gender
        +string grade
        +string section
        +string address
        +string[] chronicHealthConditions
        +string[] currentMedications
        +ObjectId doctorId
        +string healthHistory
        +Date enrollmentDate
        +boolean isActive
        +string profileUrl
        +Date createdAt
        +Date updatedAt
        +getAge()
        +getFullName()
        +hasHealthConditions()
    }

    class EmergencyContact {
        +ObjectId _id
        +ObjectId studentId
        +string name
        +Relationship relationship
        +string phoneNumber
        +string alternatePhone
        +string email
        +string address
        +boolean isPrimary
        +number priority
        +Date createdAt
        +Date updatedAt
        +notifyContact()
    }

    class ClinicVisit {
        +ObjectId _id
        +number visitNumber
        +ObjectId studentId
        +ObjectId attendedById
        +VisitType visitType
        +VisitStatus status
        +Severity severity
        +Date checkInTime
        +Date checkOutTime
        +string chiefComplaint
        +string symptoms
        +VitalSigns vitalSigns
        +string diagnosis
        +string treatment
        +string medicationGiven
        +string instructions
        +boolean followUpRequired
        +Date followUpDate
        +string notes
        +boolean isEmergency
        +boolean parentNotified
        +Date createdAt
        +Date updatedAt
        +calculateDuration()
        +isActive()
        +requiresFollowUp()
    }

    class VitalSigns {
        <<value object>>
        +number temperature
        +number bloodPressureSystolic
        +number bloodPressureDiastolic
        +number pulse
        +number respiratoryRate
        +number oxygenSaturation
        +number heightCm
        +number weightKg
        +number bmi
        +number bloodSugar
        +string notes
        +calculateBMI()
        +isNormal()
    }

    class VisitAttachment {
        +ObjectId _id
        +ObjectId visitId
        +string fileName
        +string fileUrl
        +string fileType
        +number fileSize
        +string description
        +ObjectId uploadedById
        +Date createdAt
        +getFileExtension()
        +isImageFile()
    }

    class Notification {
        +ObjectId _id
        +ObjectId visitId
        +string recipientType
        +string recipientId
        +string recipientName
        +string recipientContact
        +string notificationType
        +string subject
        +string message
        +NotificationStatus status
        +Date sentAt
        +string errorMessage
        +number retryCount
        +Date createdAt
        +send()
        +retry()
        +markAsFailed()
    }

    class QrCodeLog {
        +ObjectId _id
        +string qrCodeId
        +ObjectId studentId
        +Date scannedAt
        +string scanLocation
        +boolean wasSuccessful
        +string errorMessage
        +logScan()
        +getRecentScans()
    }

    class SystemSetting {
        +ObjectId _id
        +string settingKey
        +string settingValue
        +string description
        +boolean isActive
        +Date createdAt
        +Date updatedAt
        +getValue()
        +setValue()
    }

    class AuditLog {
        +ObjectId _id
        +ObjectId userId
        +string action
        +string tableName
        +string recordId
        +object oldValues
        +object newValues
        +string ipAddress
        +string userAgent
        +Date createdAt
        +logAction()
        +getChanges()
    }

    %% Authentication Service
    class AuthService {
        <<service>>
        +generateSessionToken()
        +createSession(token, userId)
        +validateSessionToken(token)
        +deleteSession(sessionId)
        +deleteSessionTokenCookie(event)
        +setSessionTokenCookie(event, token, expiresAt)
    }

    %% Database Service
    class DatabaseService {
        <<service>>
        +connectMongoDB()
        +createClinicVisit(visitData)
        +getStudentById(id)
        +updateStudentRecord(id, data)
        +searchStudents(criteria)
    }

    %% Mail Service
    class MailService {
        <<service>>
        +sendEmergencyNotification(contact, visit)
        +sendFollowUpReminder(student, visit)
        +sendReportEmail(recipient, report)
        +queueNotification(notification)
    }

    %% Server State Management
    class ServerState {
        <<singleton>>
        +boolean init
        +object config
        +initialize()
        +isInitialized()
    }

    %% Client-side Components (Key ones)
    class StudentFormModal {
        <<svelte component>>
        +Student student
        +boolean isOpen
        +function onSubmit
        +validateForm()
        +submitStudent()
        +resetForm()
    }

    class VisitSummaryCards {
        <<svelte component>>
        +ClinicVisit[] visits
        +object stats
        +displayStats()
        +filterByDate()
    }

    class QRScanner {
        <<svelte component>>
        +boolean isActive
        +function onScan
        +startScanning()
        +stopScanning()
        +processQRCode(code)
    }

    class NewVisitModal {
        <<svelte component>>
        +Student student
        +User attendedBy
        +ClinicVisit visit
        +createVisit()
        +notifyContacts()
    }

    %% Enums
    class UserRole {
        <<enumeration>>
        ADMIN
        NURSE
        DOCTOR
        STAFF
    }

    class Gender {
        <<enumeration>>
        MALE
        FEMALE
        OTHER
        PREFER_NOT_TO_SAY
    }

    class VisitType {
        <<enumeration>>
        EMERGENCY
        ILLNESS
        INJURY
        MEDICATION
        CHECKUP
        MENTAL_HEALTH
        OTHER
    }

    class VisitStatus {
        <<enumeration>>
        ACTIVE
        COMPLETED
        CANCELLED
    }

    class Severity {
        <<enumeration>>
        LOW
        MEDIUM
        HIGH
        CRITICAL
    }

    class Relationship {
        <<enumeration>>
        PARENT
        GUARDIAN
        SIBLING
        GRANDPARENT
        ADVISER
        OTHER
    }

    class NotificationStatus {
        <<enumeration>>
        PENDING
        SENT
        FAILED
    }

    %% Relationships
    User ||--o{ Session : "has sessions"
    User ||--o{ ClinicVisit : "attends to"
    User ||--o{ Student : "doctor assigned"
    User ||--o{ VisitAttachment : "uploads"
    User ||--o{ AuditLog : "performs actions"

    Student ||--o{ EmergencyContact : "has contacts"
    Student ||--o{ ClinicVisit : "visits clinic"
    Student ||--o{ QrCodeLog : "QR code scanned"

    ClinicVisit ||--o{ VisitAttachment : "has attachments"
    ClinicVisit ||--o{ Notification : "generates notifications"
    ClinicVisit *-- VitalSigns : "contains"

    EmergencyContact ||--o{ Notification : "receives notifications"

    %% Service Dependencies
    AuthService ..> User : "manages"
    AuthService ..> Session : "manages"
    DatabaseService ..> Student : "persists"
    DatabaseService ..> ClinicVisit : "persists"
    DatabaseService ..> EmergencyContact : "persists"
    MailService ..> Notification : "sends"
    MailService ..> EmergencyContact : "notifies"

    %% Component Dependencies
    StudentFormModal ..> Student : "creates/edits"
    VisitSummaryCards ..> ClinicVisit : "displays"
    QRScanner ..> Student : "identifies"
    QRScanner ..> QrCodeLog : "logs scan"
    NewVisitModal ..> ClinicVisit : "creates"
    NewVisitModal ..> Notification : "triggers"

    %% Enum Usage
    User *-- UserRole
    Student *-- Gender
    ClinicVisit *-- VisitType
    ClinicVisit *-- VisitStatus
    ClinicVisit *-- Severity
    EmergencyContact *-- Relationship
    Notification *-- NotificationStatus
```
