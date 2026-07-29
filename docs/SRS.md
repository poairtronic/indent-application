# Software Requirements Specification (SRS)

## 1. Introduction
This SRS document describes the system requirements for the Indent Management Application.

## 2. Functional Requirements
- **FR1: Authentication**: Users must be able to log in and access modules based on their roles.
- **FR2: Indent Creation**: Users can create material requisitions specifying items, quantities, and departments.
- **FR3: Approval Workflow**: Multi-level approvals configured by business logic.
- **FR4: Costing**: Ability to attach budget references and estimate unit prices.
- **FR5: Vendor Management**: Record vendor catalogs and historical pricing.

## 3. Non-Functional Requirements
- **Security**: Password hashing using bcrypt, HTTPS protocols, and JWT authentication.
- **Performance**: Sub-second API response times under standard loads.
- **Usability**: Responsive, intuitive dashboard UI.
