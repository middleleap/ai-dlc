# CBUAE Open Finance Regulations

> Regenerated from public sources 9 Jun 2026 (original file lost) — provenance & full verification history: `verification-log.md`. Cross-check time-sensitive figures against the community hub / OF Confluence before relying on them.

Primary source: **CBUAE Rulebook — Open Finance Regulation, Circular No. 3/2025** (in force **10 July 2025**), which repealed and replaced the Open Finance Regulation issued via Circular No. 7/2023 (dated 31 December 2023, effective 15 April 2024). Article references below were verified against the published C 3/2025 text on rulebook.centralbank.ae.

## Table of Contents
1. [Regulation at a Glance](#regulation-at-a-glance)
2. [Scope and Mandatory Participation](#scope-and-mandatory-participation)
3. [Licensing Categories](#licensing-categories)
4. [Capital and Insurance Requirements](#capital-and-insurance-requirements)
5. [Limitations on Open Finance Providers (Article 4)](#limitations-on-open-finance-providers-article-4)
6. [Key Obligations of LFIs and TPPs](#key-obligations-of-lfis-and-tpps)
7. [API Hub Requirements (Part II)](#api-hub-requirements-part-ii)
8. [Supervision, Enforcement and Regularisation](#supervision-enforcement-and-regularisation)
9. [Relationship to Other CBUAE Regulations](#relationship-to-other-cbuae-regulations)
10. [Al Tareq / Nebras Legal Structure](#al-tareq--nebras-legal-structure)
11. [Article Map (C 3/2025)](#article-map-c-32025)

---

## Regulation at a Glance

| Aspect | Detail |
|--------|--------|
| Instrument | Open Finance Regulation, CBUAE Circular No. 3/2025 |
| In force | 10 July 2025 (replaces Circular 7/2023) |
| Application | Phased — "shall come into effect in phases as notified by the Central Bank" (Article 38) |
| Establishes | Licensing, supervision and operation of the Open Finance Framework: API Hub (incl. Trust Framework) + Common Infrastructural Services |
| Geographic scope | UAE "mainland" only — DIFC and ADGM (with their own DFSA/FSRA regimes) are excluded |
| TPP (Open Finance Provider) minimum capital | AED 1,000,000 (Article 6) |
| API Hub minimum paid-up capital | AED 20,000,000, standalone basis (Article 25) |
| Professional indemnity insurance (OFP) | AED 5,000,000 per single claim; aggregate the higher of AED 5,000,000 or 50% of annual OF income (Article 9) |
| Record retention | Minimum 5 years (Article 13) |
| Interpretation authority | CBUAE Regulatory Development Department (Article 37) |

## Scope and Mandatory Participation

Participation is **mandatory for all entities licensed by the CBUAE** to provide banking or financial services. All Licensees — whether or not they themselves provide Open Finance Services — must comply with the data sharing and service initiation requirements (Articles 18–22), including establishing and maintaining a dedicated interface to the API Hub.

Mandated Licensee categories include:

| Category | Notes |
|----------|-------|
| Banks incorporated in the UAE | Includes specialised, restricted-licence and Islamic banks / Islamic windows |
| Branches / representative offices of foreign banks | |
| Finance companies | |
| Payment service providers / retail payment system providers | |
| Stored value facility (SVF) providers | |
| Exchange houses | |
| Loan-based crowdfunding companies | |
| Insurance companies and insurance brokers | UAE-incorporated and foreign branches — insurers and brokers are in scope from the outset |

Products in scope (Article 5) span banking (current/savings accounts, credit cards, personal and auto loans, mortgages, overdrafts), insurance (motor, health, life, property, etc.), payments (SVFs, wallets, account information) and investment/wealth offerings. Accounts/products regulated by the Securities and Commodities Authority are excluded unless the SCA approves their inclusion.

## Licensing Categories

| Route | Who | Mechanics |
|-------|-----|-----------|
| **Open Finance Licence (TPP licence)** | Juridical persons not otherwise CBUAE-licensed, wanting to provide Data Sharing and/or Service Initiation | Apply to CBUAE; must satisfy legal form, minimum capital (AED 1,000,000) and fit-and-proper requirements (Article 2) |
| **Person Deemed Licensed ("deemed licence")** | Banks, finance companies, retail payment service providers, insurance brokers, insurance companies, SVF providers (Article 3) | No separate OF licence required. Must give **prior written notice** to CBUAE describing the intended OF service, resources and governance, and **obtain CBUAE approval before commencing**. CBUAE decides within **60 working days**; lapse without decision = implicit rejection |
| **Technical Service Provider (TSP)** | Pure technology suppliers supporting OFPs / deemed-licensed persons | No OF licence needed if limited to support services and not directly performing regulated activities. **Responsibility and liability cannot be transferred to the TSP** (Article 2(8)) |
| **API Hub licence** | The centralised API Hub operator | Separate licence under Part II (Articles 23–29) — see below |

Licence scope: an Open Finance Licence covers **Data Sharing** and/or **Service Initiation** only. It does not authorise any other licensed activity — no advice, no arranging/mediating transactions, no holding customer funds (see Article 4).

**Regularisation deadline:** deemed-licence participants must complete regularisation of their Open Finance activities (notification/approval and compliance posture) by **16 September 2026** (verify against source — date is carried from the skill's verified baseline; not present in the public rulebook text, which provides for phased application by CBUAE notification).

## Capital and Insurance Requirements

| Requirement | Open Finance Provider (TPP) | API Hub |
|-------------|------------------------------|---------|
| Minimum capital | **AED 1,000,000** (Article 6) | **AED 20,000,000** fully paid-up, standalone (Article 25) |
| Top-ups | CBUAE may impose additional capital at its discretion (risk/size/complexity) | Capital funding plan required at licensing; prior CBUAE approval for capital changes and profit distributions |
| Aggregate capital funds | At all times the higher of AED 1,000,000 or CBUAE's estimate of wind-down costs (Article 7); composed of paid-up capital, reserves (excl. revaluation) and retained earnings, less accumulated losses and goodwill (Article 8) | Breach (or likely breach) must be reported immediately with a restoration plan |
| Professional indemnity insurance | **AED 5,000,000 single claim**; aggregate higher of AED 5,000,000 or 50% of annual OF income; must cover unauthorised transactions, data loss/breaches, cyber risk, delayed/incorrect initiations (Article 9) | Guarantees/PII "if and to the extent required by the Central Bank" (Article 24(6)) |

## Limitations on Open Finance Providers (Article 4)

An Open Finance Provider must NOT:

1. Receive, hold or transfer funds for or on behalf of a User
2. Provide advice on a particular Account or Product
3. Provide personal/specific recommendations on a particular Account or Product
4. Receive any fee, commission or benefit from an Account/Product provider
5. Process Sensitive Data — even with explicit User consent
6. Negotiate, mediate, effect or enter into agreements/transactions on a User's behalf
7. Engage in insurance intermediation or underwriting

Providing non-specific, commercially-available product information (including analysis-based) is permitted; the limits also fall away where the OFP holds the relevant additional CBUAE licence.

## Key Obligations of LFIs and TPPs

| Article | Obligation | Applies to |
|---------|-----------|------------|
| Art 11–12 | Corporate governance; risk management, compliance and internal audit frameworks proportionate to nature/scale/complexity | OFPs |
| Art 13 | Record keeping (incl. consent records) — secure, durable, ≥ 5 years, promptly available to CBUAE | OFPs |
| Art 14 | Notification and regulatory reporting | OFPs |
| Art 15 | Obligations of Licensees (participate, maintain interfaces) | All Licensees |
| Art 16 | Data Sharing obligations — share User Data on consent; data holders must not discriminate; no use/storage beyond the explicitly requested service | Data Holders / Data Sharing Providers |
| Art 17 | Service Initiation obligations — execute initiated transactions; no use of information beyond the requested service | Service Owners / Service Initiation Providers |
| Art 18 | Authentication procedures (SCA) where a User accesses data or initiates payment | Licensees |
| Art 19 | Secure communication; dedicated interface; ISO 20022 message elements | Licensees |
| Art 20 | Obligations towards Users — clear T&Cs in Arabic and English; **60 calendar days' notice** of T&C changes; free termination right if changes rejected | OFPs |
| Art 21 | Liability for unauthorised/defective transactions and data breaches (see `liability-framework.md`) | OFPs, Service Owners |
| Art 22 | Data privacy and explicit consent; purpose limitation; no re-sharing of TPP-supplied data; **commercialisation of customer data prohibited**; **data scraping expressly prohibited**; destroy identifying personal data after purpose completion (subject to retention law) | OFPs and Licensees |
| Art 30 | AML/CFT policies + robust fraud controls (see `aml-fraud-guidelines.md`) | OFPs and API Hub |
| Art 31 | Technology risk and information security; cyber incident response plans; adherence to API Hub security standards | OFPs and API Hub |

## API Hub Requirements (Part II)

- Operating an API Hub in the UAE requires a dedicated CBUAE licence; its **exclusive business** is operating the API Hub/Trust Framework/Common Infrastructural Services (Article 23).
- 3-year business plan at application; operations must commence within **6 months** of licence approval; **6 months' prior approval** needed to cease/suspend activities, with continuity plan (Articles 23–24).
- Minimum **AED 20,000,000** fully paid-up capital (Article 25); governance, risk management, internal control (Articles 26–27).
- Article 28 permits the API Hub to charge **reasonable, transparent fees** — the legal basis for the Nebras commercial model (see `pricing-model.md`).
- Reporting and record keeping (Article 29); AML/fraud, tech-risk, supervision articles apply equally to the API Hub (Articles 30–32).

## Supervision, Enforcement and Regularisation

- **Supervision (Article 32):** CBUAE may conduct periodic examinations; OFPs and the API Hub must give full, unrestricted access to premises, senior management, employees, accounts and records.
- **Regulatory technical standards (Article 33):** CBUAE may issue further Regulations/RTS — this is the hook under which the Open Finance Standards (Catalogue of Standards, currently v2.1-final + errata3) are binding.
- **Enforcement (Article 34):** violations expose the OFP, API Hub and/or Licensee to administrative and financial sanctions under the Central Bank Law. The Commercial & Pricing Model document states a breach of the pricing model is a breach of the OF Regulations.
- **Consumer protection (Article 35):** OFPs and the API Hub remain subject to applicable consumer protection laws and regulations.
- **Regularisation:** deemed-licence holders providing OF services must be regularised by **16 September 2026** (verify against source). Banks operating as deemed-licence TPPs may request a **SOC 2 exemption via CISO attestation** (precedent exists at a major UAE bank; verify with Nebras/CBUAE) (verify against source — assurance posture also supported by the platform's published Ozone ISO/IEC 27001:2022 certificate, OF Confluence Jun 2026).

## Relationship to Other CBUAE Regulations

| Regulation | Relationship |
|------------|--------------|
| Central Bank Law (Decretal Federal Law 14/2018) | Parent law; licensed financial activities (Art 65), LFI register (Art 73), sanctions regime |
| Retail Payment Services & Card Schemes Regulation | PSPs licensed under it are deemed licensed for OF; domestic OF payments ride IPP (Aani) rails operated by Al Etihad Payments |
| Stored Value Facilities Regulation | SVF providers are deemed licensed for OF |
| Finance Companies Regulation | Finance companies are deemed licensed for OF |
| Insurance Law | Insurers and brokers are deemed licensed; insurance intermediation/underwriting stays outside the OF licence |
| Consumer Protection Regulation & Standards | Apply in full to OFPs (Article 35); violations carry liability-model compensation (see `liability-framework.md`) |
| Outsourcing Regulation (banks) | Use of a TSP does not transfer regulatory responsibility or liability (Article 2(8)); banks' outsourcing obligations apply to OF arrangements (verify against source for OF-specific guidance) |
| AML Laws and Regulations | Article 30 incorporates them wholesale; see `aml-fraud-guidelines.md` |
| UAE Personal Data Protection Law | Consent and privacy requirements in Article 22 operate alongside PDPL principles |

## Al Tareq / Nebras Legal Structure

| Entity | Role |
|--------|------|
| **CBUAE** | Regulator and supervisor; owns the framework; licenses the API Hub and TPPs |
| **Nebras Open Finance LLC** | CBUAE subsidiary ("spin-off") holding the API Hub licence — operates the API Hub, runs Trust Framework elements (participant directory, onboarding, certificates via Raidiam) and Common Infrastructural Services, publishes Standards/API Hub documentation, and sets/collects the commercial model under Article 28 |
| **Al Tareq** | Consumer-facing brand and governance layer of the framework — standardised consent management, centralised authentication/authorisation (CAAP), and the trusted A2A payments experience |
| **Al Etihad Payments (AEP)** | CBUAE subsidiary providing the national payment rails (Aani IPP, Jaywan) the framework executes on |
| **Ozone** | Technology vendor powering the API Hub (ISO/IEC 27001:2022 certified) |
| **Raidiam** | Technology vendor for the Trust Framework directory / certificate authority |

## Article Map (C 3/2025)

| Articles | Subject |
|----------|---------|
| 1 | Definitions |
| 2–4 | Licensing & procedures; Persons Deemed Licensed; Limitations |
| 5 | Accounts and Products in scope |
| 6–9 | Minimum capital; aggregate capital funds; capital instruments; professional indemnity insurance |
| 10–14 | Controllers; corporate governance; risk/compliance/audit; record keeping; notification & reporting |
| 15–17 | Obligations of Licensees; Data Sharing; Service Initiation |
| 18–19 | Authentication; secure communication (ISO 20022) |
| 20–22 | Obligations towards Users; liability; data privacy & consent |
| 23–29 | Part II — API Hub: licensing, conditions, AED 20M capital, governance, risk, fees, reporting |
| 30–31 | AML/CFT & fraud controls; technology risk & information security |
| 32–35 | Supervision; RTS; enforcement & sanctions; consumer protection |
| 36–38 | Repeal of C 7/2023; interpretation; publication & phased application |
| Schedule 1 | Details of the Open Finance Framework (Trust Framework, API Hub, Common Infrastructural Services) |
