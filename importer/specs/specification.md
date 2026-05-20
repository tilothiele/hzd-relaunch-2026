## Goal
Implement a Quarkus-based microservice that imports CSV data (members and dogs),
validates and transforms it, and synchronizes it with a remote system via GraphQL.

The service must follow hexagonal architecture principles and support both REST-triggered
and scheduled (cron) executions.

## Architecture

- Language: Java
- Framework: Quarkus
- Architecture: Hexagonal (Ports & Adapters)

### Layers

1. Domain
   - Core business logic
   - Entities: Member, Dog
   - No framework dependencies

2. Application
   - Use cases (ImportMembersUseCase)
   - Orchestration of import process

3. Ports
   - Input Ports: REST, Scheduler
   - Output Ports:
     - GraphQL client
     - File reader
     - Persistence (for job state)

4. Adapters
   - REST Controller (Quarkus)
   - Scheduler (Quarkus cron)
   - CSV parser
   - GraphQL client
   - Database (for job locking / state)

### Rules

- Domain must not depend on Quarkus
- All external systems accessed via ports
- Dependency direction: Adapters → Ports → Domain

## Use Cases

### Import Members and Dogs

Flow:

1. Triggered via REST or cron
2. Load CSV files (members.csv, dogs.csv)
3. Parse into domain objects
4. Validate data
5. For each member:
   - Check existence via GraphQL
   - Create or update
6. For each dog:
   - Link to member
   - Create or update via GraphQL
7. Persist job result

## Triggers

### REST

POST /import

- Starts import job
- Returns job ID

### Scheduler

- Cron-based execution (configurable)
- Must not start if another job is running

## Job Execution Constraints

- Only one import job may run at a time
- Implement job locking mechanism

### Requirements

- Prevent concurrent execution
- Persist job state (RUNNING, SUCCESS, FAILED)
- If a job is RUNNING, new triggers must be rejected

### Suggested Implementation

- Database-based lock (recommended)
- Alternative: distributed lock (optional)

## CSV Input

Two CSV types:

1. Members
2. Dogs

### Requirements

- Must handle malformed rows
- Must log and skip invalid entries
- Encoding: UTF-8

### Example

(→ hier dein CSV einfügen)

## External System (GraphQL)

- Communication via GraphQL API

### Requirements

- Query existing members
- Create or update members
- Create or update dogs

### Inputs

- GraphQL schema will be provided

### Constraints

- Idempotent operations required
- Handle network failures gracefully

## Error Handling

- CSV parsing errors → skip row, log
- GraphQL errors → retry (configurable)
- Fatal errors → mark job as FAILED

## Logging

- Structured logging
- Include job ID in all logs

## Configuration

- CSV file path
- Cron schedule
- GraphQL endpoint
- Retry configuration

## Expected Output

Generate:

- Full Quarkus project
- Domain model
- Ports & Adapters
- REST endpoint
- Scheduler
- CSV parser
- GraphQL client abstraction
- Job locking mechanism

## Non-Functional Requirements

- Clean code
- Testable architecture
- Unit tests for domain logic
- Integration tests for adapters
