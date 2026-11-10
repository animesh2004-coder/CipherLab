import type { ComparisonItem, Lesson, QuizQuestion } from './types.ts';

export const LESSONS: Lesson[] = [
  {
    id: 'symmetric-encryption',
    title: '1. What is Symmetric Encryption?',
    shortSummary: 'One single secret key performs both encryption and decryption.',
    readTime: '3 min read',
    category: 'fundamentals',
    sections: [
      {
        heading: 'The Shared Secret Model',
        content:
          'Symmetric encryption is the cornerstone of high-speed digital security. In symmetric cryptography, the exact same secret key is used to transform unreadable scrambled text back into readable text.',
        keyTakeaway: 'Symmetric = 1 shared secret key for both lock (encrypt) and unlock (decrypt).',
        callout: {
          type: 'info',
          title: 'Real-World Analogy',
          text: 'Imagine a physical safe. Alice puts a message inside and locks it with a bronze key. To read the message, Bob must use an identical copy of that same bronze key.',
        },
      },
      {
        heading: 'Why We Use It',
        content:
          'Symmetric ciphers are computationally lightweight and blisteringly fast. Modern hardware has dedicated CPU instructions (like Intel AES-NI and ARM Cryptography extensions) that can encrypt gigabytes of data per second with minimal battery or CPU impact.',
        keyTakeaway: 'Virtually all bulk data transfer on the internet is encrypted using symmetric algorithms.',
      },
    ],
  },
  {
    id: 'cipher-categories',
    title: '2. Block Ciphers vs. Stream Ciphers',
    shortSummary: 'The two foundational categories of symmetric ciphers.',
    readTime: '4 min read',
    category: 'ciphers',
    sections: [
      {
        heading: 'Block Ciphers: Working in Fixed Chunks',
        content:
          'A block cipher divides plaintext into fixed-size blocks (commonly 128 bits, or 16 bytes). It processes each block through several deterministic rounds of mathematical substitutions and permutations. The worldwide standard block cipher is AES (Advanced Encryption Standard).',
        keyTakeaway: 'Block ciphers process fixed-size chunks of data (e.g., 128 bits in AES).',
      },
      {
        heading: 'Stream Ciphers: The Continuous Keystream',
        content:
          'A stream cipher takes the secret key and a nonce to generate an endless pseudorandom stream of bits called a "keystream". It then combines this keystream with the plaintext bit-by-bit or byte-by-byte (typically using the XOR operation). A prominent modern stream cipher is ChaCha20, widely used in mobile networks and WireGuard VPNs.',
        keyTakeaway: 'Stream ciphers encrypt one byte or bit at a time using a generated pseudorandom keystream.',
        callout: {
          type: 'tip',
          title: 'ChaCha20 Mention',
          text: 'ChaCha20 is designed to be extremely fast in software without requiring specialized hardware crypto instructions. (In this MVP lab, we focus hands-on on AES-GCM).',
        },
      },
    ],
  },
  {
    id: 'terminology',
    title: '3. Ciphertext, Keys, IVs & Auth Tags',
    shortSummary: 'Mastering the vocabulary and avoiding common misconceptions.',
    readTime: '4 min read',
    category: 'fundamentals',
    sections: [
      {
        heading: 'Ciphertext is Data, Not an Algorithm',
        content:
          'A common misconception among beginners is thinking "ciphertext" is a category of cipher. It is simply the name for the scrambled, unreadable output produced by ANY encryption algorithm. Plaintext goes into a cipher; ciphertext comes out.',
        keyTakeaway: 'Plaintext = original message. Ciphertext = encrypted output.',
        callout: {
          type: 'warning',
          title: 'Crucial Concept',
          text: 'Ciphertext is NOT a type of cipher like block or stream ciphers. It is the encrypted data itself!',
        },
      },
      {
        heading: 'The Initialization Vector (IV or Nonce)',
        content:
          'An Initialization Vector (IV), or Nonce ("number used once"), is a random or unique value supplied at encryption time. If you encrypted the word "Hello" five times with the same key and no IV, every output would look identical—allowing eavesdroppers to detect patterns! With a fresh IV each time, the same text looks completely randomized every run.',
        keyTakeaway: 'The IV is NOT the secret key. It is needed for decryption and can be safely sent in public view.',
      },
      {
        heading: 'Authentication Tags (Integrity Check)',
        content:
          'Encryption protects secrecy (confidentiality), but what if an attacker alters the ciphertext in transit? Modern authenticated ciphers generate an "Authentication Tag" (a cryptographic checksum). If even a single bit of ciphertext is changed, the tag verification fails and decryption aborts.',
        keyTakeaway: 'The tag guarantees the data was not tampered with and came from the keyholder.',
      },
    ],
  },
  {
    id: 'aes-gcm',
    title: '4. Demystifying AES-GCM',
    shortSummary: 'The gold standard of modern authenticated encryption.',
    readTime: '3 min read',
    category: 'modern',
    sections: [
      {
        heading: 'What is AES-GCM?',
        content:
          'AES-GCM combines the AES block cipher with Galois/Counter Mode (GCM). In GCM, AES encrypts an incrementing counter value derived from the IV. This output is XORed with the plaintext, and a mathematical Galois field MAC calculates an authentication tag.',
        keyTakeaway: 'AES-GCM uses the AES block cipher in GCM mode to provide both confidentiality and authentication.',
        callout: {
          type: 'info',
          title: 'Accurate Classification',
          text: 'Do NOT describe AES-GCM as a stream cipher. AES itself is fundamentally a block cipher. GCM is an operational mode that provides authenticated encryption (AEAD).',
        },
      },
      {
        heading: 'Why Industry Prefers AES-GCM',
        content:
          'Before GCM, systems often had to run one algorithm for encryption and another separate algorithm for authentication (like AES-CBC + HMAC-SHA256). GCM performs both in a single, highly parallelizable pass, making it the default cipher suite in HTTPS (TLS 1.2 and 1.3).',
      },
    ],
  },
  {
    id: 'transit-vs-rest',
    title: '5. Data in Transit vs. Data at Rest',
    shortSummary: 'Where encryption protects your information in the digital world.',
    readTime: '3 min read',
    category: 'security',
    sections: [
      {
        heading: 'Data in Transit (Moving Data)',
        content:
          'Data in transit is information actively traveling across a network—between your browser and a web server, between two messaging apps, or between microservices. Examples include HTTPS/TLS, VPN tunnels, and encrypted instant messaging.',
        keyTakeaway: 'Protects against packet sniffing, man-in-the-middle attacks, and eavesdropping on Wi-Fi.',
      },
      {
        heading: 'Data at Rest (Stored Data)',
        content:
          'Data at rest is static information housed on physical media: NVMe drives, USB flash drives, backup tapes, cloud object storage, and databases. Examples include full-disk encryption like Windows BitLocker, Apple FileVault, and encrypted database tables.',
        keyTakeaway: 'Protects against stolen physical laptops, disposed hard drives, and unauthorized storage access.',
      },
    ],
  },
  {
    id: 'key-sharing',
    title: '6. The Key Sharing Dilemma',
    shortSummary: 'Sending encrypted data does not solve how to safely exchange the key.',
    readTime: '4 min read',
    category: 'security',
    sections: [
      {
        heading: 'The Fundamental Key Distribution Problem',
        content:
          'Symmetric encryption is powerful, but it has one glaring vulnerability: both parties MUST possess the exact same secret key before decryption can happen. If Alice sends the secret key over the same unencrypted channel as her ciphertext, any eavesdropper who intercepts the key can immediately decrypt the message!',
        keyTakeaway: 'Sending encrypted data does not by itself explain how sender and receiver safely share the key.',
        callout: {
          type: 'warning',
          title: 'The Out-of-Band Problem',
          text: 'Never include the secret key inside the transport package with the ciphertext! In real applications, keys are never sent with the data.',
        },
      },
      {
        heading: 'How Real Systems Solve This',
        content:
          'In the real world, symmetric encryption is paired with Asymmetric Cryptography (Public-Key Cryptography like Diffie-Hellman or ECDH). The two parties use asymmetric math to safely establish a shared symmetric secret key over an insecure network, and then use blazing-fast AES-GCM for the actual conversation.',
        keyTakeaway: 'Asymmetric cryptography solves key exchange; symmetric cryptography encrypts the bulk data.',
      },
    ],
  },
];

export const CIPHER_COMPARISON_DATA: ComparisonItem[] = [
  {
    feature: 'Basic Processing Unit',
    blockCipher: 'Fixed-size blocks (typically 128 bits / 16 bytes)',
    streamCipher: 'Continuous stream: bit-by-bit or byte-by-byte',
    explanation: 'Block ciphers require data to be grouped into blocks; stream ciphers operate on varying sizes directly.',
  },
  {
    feature: 'Primary Standard / Example',
    blockCipher: 'AES (Advanced Encryption Standard)',
    streamCipher: 'ChaCha20, Salsa20',
    explanation: 'AES is the global US NIST standard; ChaCha20 is widely adopted in modern networking.',
  },
  {
    feature: 'Internal Mechanism',
    blockCipher: 'Multiple rounds of SubBytes, ShiftRows, MixColumns, AddRoundKey',
    streamCipher: 'Pseudorandom keystream generator combined with data via XOR',
    explanation: 'Block ciphers rely on substitution-permutation networks; stream ciphers generate keystreams.',
  },
  {
    feature: 'Handling Incomplete Blocks',
    blockCipher: 'Needs padding (e.g. PKCS#7) or stream mode (like GCM/CTR)',
    streamCipher: 'No padding needed; exact length of plaintext matches',
    explanation: 'Plaintext does not need to be a multiple of 16 bytes in stream ciphers or counter modes.',
  },
  {
    feature: 'Hardware Acceleration',
    blockCipher: 'Extensive (dedicated AES-NI instructions in Intel/AMD/Apple/ARM)',
    streamCipher: 'High software speed without dedicated hardware registers',
    explanation: 'AES is extraordinarily fast when CPU instructions are available.',
  },
];

export const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: 'q1',
    question: 'In symmetric encryption, which key is used to decrypt the data?',
    options: [
      'The recipient’s public key',
      'The exact same secret key used to encrypt it',
      'A newly generated IV created during decryption',
      'The public certificate of the server',
    ],
    correctIndex: 1,
    explanation:
      'Symmetric encryption by definition uses one shared secret key for both encryption and decryption.',
  },
  {
    id: 'q2',
    question: 'What is "ciphertext"?',
    options: [
      'A third category of cipher alongside block and stream ciphers',
      'A legacy encryption standard from the 1970s',
      'The encrypted, unreadable output data produced by a cipher',
      'A special authentication tag generated only by stream ciphers',
    ],
    correctIndex: 2,
    explanation:
      'Ciphertext simply means encrypted data. It is not an algorithm, family, or separate cipher type.',
  },
  {
    id: 'q3',
    question: 'How should AES-GCM be accurately classified?',
    options: [
      'It is a pure stream cipher created as a replacement for ChaCha20',
      'It uses the AES block cipher with GCM mode to provide authenticated encryption',
      'It is an asymmetric public-key signature algorithm',
      'It is a hashing algorithm with no encryption capabilities',
    ],
    correctIndex: 1,
    explanation:
      'AES-GCM uses the AES block cipher in Galois/Counter Mode. GCM turns the block cipher into an authenticated AEAD scheme, but AES itself remains a block cipher.',
  },
  {
    id: 'q4',
    question: 'What is the role of the Initialization Vector (IV / Nonce)?',
    options: [
      'It is the secret key and must never be shared with anyone',
      'It provides fresh randomness so identical plaintexts produce different ciphertexts; it is needed for decryption but is not secret',
      'It replaces the need for a secret key entirely',
      'It compresses the plaintext so that encryption runs twice as fast',
    ],
    correctIndex: 1,
    explanation:
      'The IV is a unique value used once per encryption with a key. It is needed to decrypt the data, but it is not secret and can be transmitted openly in the package.',
  },
  {
    id: 'q5',
    question: 'Why does sending encrypted data NOT solve the key sharing problem?',
    options: [
      'Because symmetric keys are too large to fit in email or network packets',
      'Because both sender and receiver still need a secure way to share the secret key beforehand',
      'Because the Web Crypto API does not allow keys to leave memory',
      'Because symmetric encryption always requires an internet connection',
    ],
    correctIndex: 1,
    explanation:
      'If you send the secret key along with the ciphertext over an unsecure channel, an eavesdropper can intercept both and decrypt your data. Secure key distribution must happen beforehand or via asymmetric key exchange.',
  },
];

