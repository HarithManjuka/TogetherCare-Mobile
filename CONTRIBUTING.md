# Contributing Guidelines — TogetherCare Mobile

First off, thank you for contributing to **TogetherCare**! 

This project fulfills joint academic requirements for **Software Project Management (SE3080)** and **User Experience Engineering (SE3050)** at SLIIT. Following these guidelines ensures smooth integration, high code quality, and verifiable evidence for our module evaluations.

---

## 👥 Core Scrum Team & Roles (Group_003)

| Student ID | Name | UEE Persona Role | SPM Scrum Role |
| :--- | :--- | :--- | :--- |
| **IT23831254** | Abeykoon A.M.H.M. | Admin / Community Coordinator | Product Owner (PO) |
| **IT23819092** | Handaragama M.U. | Elderly User | Scrum Master (SM) |
| **IT23839106** | Jayakody J.R.I.C.S. | Student Volunteer | Mobile UI Developer |
| **IT23818620** | Karunanayake K.M.S.G.S.C. | Family Caregiver / Member | QA & DevOps Lead |

---

## 🌿 Git Branching Strategy

We follow a strict **Feature-Branch Workflow** off the `develop` integration branch.

```text
[ main ]  <────────────────────────────────────── [ develop ] (Sprint Release PR)
                                                     │
                                                     ├──► feature/IT238XXXXX/feature-name
```

**Branch Naming:**
* `main`: Production-ready code for milestone releases.
* `develop`: Integration branch.
* `feature/user-id/US-XX-short-desc`: (e.g., `feature/sandeepa/US-01-auth`)

---

## 📝 Commit Messages

We use structured commit messages to make our Git history readable and to ensure commit history reflects each team member's contribution for our agile review.

* `feat:` A new feature (e.g., `feat: add volunteer login screen`)
* `fix:` A bug fix
* `docs:` Documentation changes
* `style:` Formatting, missing semi-colons, etc.
* `refactor:` Code change that neither fixes a bug nor adds a feature
