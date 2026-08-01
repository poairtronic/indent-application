# IMCMS Enterprise Engineering Baseline (Post-Audit)

> This document supplements the IMCMS Knowledge Base. It records
> engineering constraints, audit-driven priorities, and mandatory
> development rules for all future phases.

## Source Priority

1.  IMCMS Knowledge Base
2.  Verified source code
3.  Verified audit findings
4.  New implementation

## Current Status

The project is functionally mature but requires ongoing hardening in
architecture, security, performance, and maintainability.

## Core Engineering Principles

-   One responsibility → One implementation.
-   No duplicate business logic.
-   No duplicate modules, providers, HTTP clients, repositories, or
    stores.
-   Reuse existing architecture before creating new components.
-   Prefer explicit module dependencies over hidden global dependencies.

## Communication Pipeline

Business Event → Event Bus → Template Engine → Queue → Worker → SMTP →
Email Log → Monitoring

Business modules must never communicate directly with SMTP.

## Workflow Rules

Maintain: - Two-loop manufacturing workflow - Zero-approval
architecture - RBAC - Audit logging - Notification flow

Never bypass the workflow engine.

## Engineering Backlog

### Critical

-   Resolve security vulnerabilities.
-   Fix RBAC mismatches.
-   Fix impossible workflow transitions.
-   Prevent cross-record mutations.

### High

-   Remove duplicate implementations.
-   Consolidate authentication and HTTP layers.
-   Validate retry and DLQ behavior.
-   Optimize analytics aggregation.

### Medium

-   Remove dead code.
-   Reduce oversized services.
-   Centralize configuration.
-   Remove magic values.

### Low

-   Documentation
-   Naming consistency
-   Minor refactoring

## Mandatory Validation

Every completed phase must pass:

-   Build
-   TypeScript
-   ESLint
-   Unit Tests
-   Integration Tests
-   Architecture Review
-   Business Validation
-   Security Review
-   Performance Review
-   Regression Testing

## Mandatory Audit Sequence

1.  Architecture Audit
2.  Static Code Audit
3.  Business Logic Audit
4.  Security & Performance Audit
5.  Production Readiness Audit

## AI Agent Rules

-   Never assume business rules.
-   Never redesign completed modules unless instructed.
-   Never duplicate functionality.
-   Always verify existing implementations before creating new ones.
-   Report architectural conflicts instead of making assumptions.

## Definition of Done

A phase is complete only if:

-   Architecture is consistent.
-   Business workflows remain intact.
-   Security review passes.
-   Performance is acceptable.
-   Tests pass.
-   Documentation is updated.
-   No unresolved critical issues remain.

## Long-Term Goal

Maintain IMCMS as a secure, maintainable, enterprise Modular Monolith
with consistent architecture and production-grade quality.
