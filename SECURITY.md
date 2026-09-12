# Security Policy

## Overview

**TogetherCare** is an intergenerational mobile platform handling sensitive user data, including elderly personal details, volunteer identity verification documents (NIC / Student IDs), location data, and remote caregiver access[cite: 8, 9]. Maintaining strong security, privacy, and data protection standard is a core priority for our project[cite: 8, 9].

---

## Supported Versions

Only the latest active development and release branches receive security updates.

| Version / Branch | Supported | Notes |
| :--- | :--- | :--- |
| `main` | :white_check_mark: | Production / Submission releases[cite: 1] |
| `dev` | :white_check_mark: | Primary integration branch[cite: 1] |
| `< 1.0.0` (Feature Branches) | :x: | Short-lived feature branches[cite: 1] |

---

## Reporting a Vulnerability

We take all security issues seriously. If you discover a security vulnerability or sensitive data exposure within the **TogetherCare** mobile application, backend API, or admin infrastructure, please report it directly to the development team[cite: 1, 9].

### How to Submit a Report

* **Email**: Contact the project security leads directly at `it23831254@my.sliit.lk` or `it23818620@my.sliit.lk`[cite: 7].
* **Do NOT open a public GitHub issue** for security vulnerabilities, exposed API keys, or personal data leaks[cite: 1].

### What to Include in Your Report

1. **Description**: Clear summary of the issue (e.g., unauthorized document access, API endpoint vulnerability, authentication bypass)[cite: 9].
2. **Steps to Reproduce**: Detailed steps or Proof of Concept (PoC) demonstrating the vulnerability.
3. **Impact**: Potential exposure level (e.g., PII leakage, privilege escalation)[cite: 9].

### Response Timeline

* **Initial Acknowledgment**: Within 24–48 hours[cite: 9].
* **Assessment & Fix Plan**: Within 3–5 business days.
* **Resolution Patch**: Deployed to `dev` and merged into `main` following peer review[cite: 1].

---

## Sensitive Data & Privacy Standards

1. **Identity Verification Assets**: Uploaded National Identity Cards (NIC) and Student IDs must be stored using encrypted cloud bucket storage (Amazon S3 / Firebase Storage) with restricted access control[cite: 8, 9].
2. **API Keys & Credentials**: Secrets, database credentials, and Firebase/AWS API keys must **never** be committed to the Git repository[cite: 1]. All keys must reside in `.env` files added to `.gitignore`[cite: 1].
3. **Authentication**: JWT tokens and Firebase Auth sessions must enforce secure expiration and encrypted local storage on mobile devices[cite: 9].

---

## Contributor Security Guidelines

All group members pushing code to this repository must follow these rules[cite: 1]:

* Run local security checks before pushing to feature branches[cite: 1].
* Never push raw credentials, private keys, or `.env` files[cite: 1].
* Ensure all dependencies pass vulnerability checks during automated code reviews[cite: 1].
