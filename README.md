# 🚀 Cleaning SaaS Platform

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Status](https://img.shields.io/badge/status-active-success.svg)
![Version](https://img.shields.io/badge/version-v3-blue.svg)
![Architecture](https://img.shields.io/badge/architecture-modular--monolith-purple)
![Multi-Tenant](https://img.shields.io/badge/multi--tenant-enabled-brightgreen)
![RBAC](https://img.shields.io/badge/security-RBAC-critical)

> Multi-tenant SaaS platform to manage cleaning service operations with scheduling, automation, and scalable architecture.

---

## 💡 The Problem

Cleaning service businesses often rely on:

- Manual scheduling (WhatsApp, spreadsheets)
- Lack of process standardization
- No access control (everyone sees everything)
- Difficulty scaling operations

This leads to inefficiency, errors, and lost revenue.

---

## 🎯 The Solution

A **centralized SaaS platform** that enables cleaning businesses to:

- Manage scheduling and operations
- Control access with role-based permissions
- Scale without losing organization
- Automate repetitive workflows

---

## 🧠 Vision

Build a **modular operational platform** that starts with cleaning services but can evolve into a **generic service management engine**.

---

## ⚙️ Core Features

- 🏢 Multi-tenant architecture (isolated tenants)
- 🔐 Secure authentication (JWT + refresh tokens)
- 🛡️ Role-Based Access Control (RBAC)
- 📅 Scheduling system
- 🧩 Modular domain architecture
- 📊 Observability-ready (logs, tracing)

---

## 🏗️ Architecture

- **Backend:** NestJS (Modular Monolith)
- **Frontend:** React + TypeScript
- **Database:** PostgreSQL
- **Auth:** JWT (Access + Refresh Tokens)
- **Authorization:** RBAC
- **Multi-tenancy:** Shared DB with tenant isolation

---

## 🧩 Domain Strategy (Important)

The system uses a **transitional core abstraction**:

- `Project` → will evolve into `Post` (generic content engine)

This ensures:

- Flexibility
- Future scalability
- Decoupled domain evolution

---

## 📦 Project Structure

/apps
/api → Backend (NestJS)
/web → Frontend (React)

/packages
/core → Shared logic
/config → Environment & configs

---

## 🚀 Getting Started

```bash
# install dependencies
npm install

# start backend
npm run start:dev

# start frontend
npm run dev

## 🧪 Testing
npm run test

## 🔐 Security
- JWT authentication (access + refresh tokens)
- Token rotation & reuse detection
- RBAC enforced at backend level
- Tenant isolation in all queries

## 🧠 Why This Project Matters
This is not just a CRUD system.
It is designed as:
- A scalable foundation for service-based SaaS products.

## 🤝 Contributing
Contributions are welcome. Please open an issue first to discuss changes.

## 📄 License
MIT
