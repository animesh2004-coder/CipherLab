# CipherLab 🔐

**CipherLab** is a modern student learning application for understanding symmetric cryptography, block and stream ciphers, and authenticated encryption via interactive exploration.

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Start the Development Server
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### 3. Build & Typecheck
```bash
npm run build
```

### 4. Run Automated Test Suite
```bash
npm test
```

---

## 🎯 Educational Goals & Cryptographic Accuracy

- **Symmetric Rule:** One shared secret key encrypts and decrypts. The key sharing dilemma explains why sending encrypted data does not solve key exchange on its own.
- **Two Foundational Cipher Classes:**
  - **Block Ciphers:** Divide data into fixed-size blocks (e.g. 128-bit blocks in AES) and apply substitution-permutation networks.
  - **Stream Ciphers:** Generate a pseudorandom continuous keystream (e.g. ChaCha20) and combine it with plaintext byte-by-byte via XOR.
- **Ciphertext Semantics:** Ciphertext is the encrypted data output by a cipher; it is **not** a category of cipher.
- **AES-GCM (Galois/Counter Mode):** Uses the AES block cipher in GCM mode to provide Authenticated Encryption with Associated Data (AEAD). It is **not** a stream cipher.
- **Initialization Vector (IV/Nonce):** A 12-byte (96-bit) fresh value generated for each encryption operation. It is required for decryption and public in the package, but is **not** the secret key.
- **Authentication Tag:** A 16-byte (128-bit) integrity tag. In Web Crypto AES-GCM, any change to the ciphertext, IV, or key causes immediate authentication rejection.

---

## 🔒 Security Architecture

- **Strict In-Memory Cryptography:** Plaintext and secret keys are stored exclusively in temporary JavaScript memory. They are **never** stored in local storage, cookies, session storage, or URL query parameters, and are never transmitted to any external server.
- **Standard Transport Package:**
  ```json
  {
    "version": 1,
    "algorithm": "AES-GCM",
    "keyBits": 256,
    "iv": "<base64 12-byte IV>",
    "data": "<base64 ciphertext + 16-byte auth tag>"
  }
  ```
- **Local Storage Boundary:** Only lesson read status and quiz scores are stored locally for learning continuity.

---

## 📁 Project Structure

```
CipherLab/
├── src/
│   ├── app/
│   │   └── App.tsx                 # Root application shell with navigation
│   ├── pages/
│   │   ├── HomePage.tsx            # Welcoming landing page with concept cards
│   │   ├── LearnPage.tsx           # Lessons, comparison matrix & quiz
│   │   └── LabPage.tsx             # Interactive Encrypt & Decrypt lab + visualizer
│   ├── components/
│   │   ├── Navbar.tsx              # Responsive navigation & progress pill
│   │   ├── Footer.tsx              # Security disclosures & cryptographic facts
│   │   ├── CopyButton.tsx          # Accessible copy-to-clipboard button
│   │   ├── Badge.tsx               # Semantic color badge
│   │   └── WebCryptoNotice.tsx     # Context availability banner
│   ├── features/
│   │   ├── encryption/
│   │   │   ├── cryptoService.ts    # Web Crypto AES-GCM engine & helpers
│   │   │   ├── packet.ts           # JSON transport package validation
│   │   │   ├── types.ts            # Cryptographic TypeScript interfaces
│   │   │   ├── EncryptSection.tsx  # Encryption input & output panels
│   │   │   ├── DecryptSection.tsx  # Decryption & tampering experiment
│   │   │   └── VisualizerSection.tsx # Conceptual data flow pipeline
│   │   ├── lessons/
│   │   │   ├── lessonData.ts       # Lessons, comparison data & 5 quiz questions
│   │   │   ├── LessonView.tsx      # Scannable curriculum with completion toggles
│   │   │   ├── ComparisonTable.tsx # Block vs. stream cipher matrix
│   │   │   └── QuizView.tsx        # Interactive knowledge check
│   │   └── progress/
│   │       ├── progressService.ts  # Local progress persistence boundary
│   │       ├── types.ts            # Student progress interfaces
│   │       └── ProgressSummary.tsx # Progress bar & score cards
│   ├── services/
│   │   └── apiService.ts           # Service boundary abstraction
│   └── styles/
│       └── index.css               # Clean design system & accessibility rules
├── test/
│   ├── crypto-pipeline.test.ts     # Automated crypto & tampering tests
│   ├── progress.test.ts            # Progress persistence tests
│   └── server-probe.mjs            # Production bundle & server probe
└── package.json
```

