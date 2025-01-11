# Node.js API Service for Signature Verification and Watermarking

## Overview
This API service is built using Node.js to provide two main functionalities:
1. **Verify Digital Signatures** of uploaded files.
2. **Add Watermarks** (including issuer details) to PDF files.

## Features
- Verifies digital signatures against cryptographic standards.
- Adds image-based watermarks and optional issuer text to PDF files.
- Supports memory and disk storage for file uploads.
- Configurable settings via `config.json`.

---

## Configuration

The `config.json` file is used to configure the service. Key parameters include:

### File Storage
```json
"fileStorage": {
  "destination": "memory", // Options: "memory" (RAM) or "disk" (file system)
  "dest": "./uploads"      // Directory for storing files when "disk" is chosen
}
```

- **destination**: Determines where uploaded files are temporarily stored.
- **dest**: Directory for storing files when `destination` is set to "disk".

### Upload Limits
```json
"uploadLimits": {
  "fileSize": 52428800
}
```

- **fileSize**: Maximum file size for uploads, in bytes (default: 50 MB).

### Debug Mode
```json
"DebugMode": true
```

- **DebugMode**:
  - `true`: Uses test certificates and settings.
  - `false`: Uses production certificates and settings.

### Watermark Settings
```json
"watermark": {
  "image": "./data/watermark_stamp.png",
  "imageScaleFactor": 0.5,
  "imagePageXPosition": "center",
  "imagePageYPosition": "bottom",
  "font": "./data/arial.ttf"
}
```

- **image**: Path to the watermark image (PNG format).
- **imageScaleFactor**: Scaling factor for resizing the watermark image (default: 0.5).
- **imagePageXPosition**: Horizontal alignment of the watermark on the page. Options: `"left"`, `"center"`, `"right"`.
- **imagePageYPosition**: Vertical alignment of the watermark on the page. Options: `"top"`, `"center"`, `"bottom"`.
- **font**: Path to the font file used for drawing issuer text.

---

## API Endpoints

### 1. Verify Digital Signature
**POST /verify**

**Description**: Verifies the digital signature of an uploaded file.

**Parameters**:
- **file** (form-data): The file to verify.
- **signature** (string): The signature to verify.

**Example cURL Request**:
```bash
curl -X POST http://localhost:3770/verify \
-F "file=@example.pdf" \
-F "signature=YOUR_SIGNATURE_STRING"
```

**Responses**:
- **200 OK**:
  ```json
  {
    "verified": true,
    "signerInfo": {
      "subjectCN": "Signer Name",
      "issuerCN": "CA Name",
      "serial": "123456789"
    }
  }
  ```
- **400 Bad Request**:
  ```json
  {
    "error": "Both data and signature are required"
  }
  ```
- **500 Internal Server Error**:
  ```json
  {
    "verified": false,
    "error": "Description of the error"
  }
  ```

### 2. Add Watermark to PDF
**POST /add-sign-watermark**

**Description**: Adds a watermark to the uploaded PDF file.

**Parameters**:
- **file** (form-data): The PDF file to watermark.

**Example cURL Request**:
```bash
curl -X POST http://localhost:3770/add-sign-watermark \
-F "file=@example.pdf" \
--output watermarked_output.pdf
```

**Responses**:
- **200 OK**: Returns the PDF file with the watermark applied.
- **400 Bad Request**:
  ```json
  {
    "error": "Invalid or missing watermark configuration."
  }
  ```
- **500 Internal Server Error**:
  ```json
  {
    "error": "Description of the error"
  }
  ```

### 3. Verify File and Add Issuer Watermark
**POST /verify-file**

**Description**: Verifies the signature of the uploaded PDF file and adds the issuer's name as a watermark.

**Parameters**:
- **file** (form-data): The PDF file to verify.
- **signature** (string): The signature to verify.

**Example cURL Request**:
```bash
curl -X POST http://localhost:3770/verify-file \
-F "file=@example.pdf" \
-F "signature=YOUR_SIGNATURE_STRING" \
--output watermarked_output.pdf
```

**Responses**:
- **200 OK**: Returns the PDF file with the issuer's name and watermark applied.
- **400 Bad Request**:
  ```json
  {
    "error": "Both data and signature are required"
  }
  ```
- **500 Internal Server Error**:
  ```json
  {
    "error": "Description of the error"
  }
  ```

---

## Prerequisites

- Node.js (v19+ recommended)
- NPM (v6+ recommended)

---

## License
This project is licensed under the MIT License. See the LICENSE file for details.
