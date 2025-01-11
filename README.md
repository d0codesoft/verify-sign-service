# Verify Sign File API Service

A Node.js service for verifying digital signatures of files using the cryptographic library IIT. This service supports file uploads, signature verification, and adding watermarks to PDF files via an API.

## Features

- Supports memory and disk storage for uploaded files.
- Verifies digital signatures against cryptographic standards.
- Adds image-based watermarks (e.g., signature stamps) to PDF files.
- Customizable through a configuration file (`config.json`).

---

## Configuration

The `config.json` file contains the following parameters:

### File Storage
```json
"fileStorage": {
  "destination": "memory", // "memory" for storing files in RAM, "disk" for saving on disk
  "dest": "./uploads"      // Directory for storing files when "destination" is set to "disk"
}
```

- **destination**: Determines where uploaded files are temporarily stored.
  - **"memory"**: Files are stored in memory (RAM).
  - **"disk"**: Files are saved to the directory specified by the `dest` parameter.
- **dest**: Directory for storing uploaded files when `destination` is "disk".

### Upload Limits
```json
"uploadLimits": {
  "fileSize": 52428800
}
```

- **fileSize**: Maximum size for uploaded files in bytes (default: 50 MB).

### Cryptographic Provider Settings
```json
"CADefault": "\"\u0414\u0456\u044f\". \u041a\u0432\u0430\u043b\u0456\u0444\u0456\u043a\u043e\u0432\u0430\u043d\u0438\u0439 \u043d\u0430\u0434\u0430\u0432\u0430\u0447 \u0435\u043b\u0435\u043a\u0442\u0440\u043e\u043d\u043d\u0438\u0445 \u0434\u043e\u0432\u0456\u0440\u0447\u0438\u0445 \u043f\u043e\u0441\u043b\u0443\u0433"
```

- **CADefault**: Name of the default Certification Authority (CA).

### Debug Mode
```json
"DebugMode": true
```

- **DebugMode**: Enables debug mode for testing purposes.
  - **true**: Loads test certificates and settings.
  - **false**: Loads production certificates and settings.

### Watermark Configuration
```json
"watermark": {
  "image": "./data/watermark_stamp.png",
  "imageScaleFactor": 0.5,
  "imagePageXPosition": "left",
  "imagePageYPosition": "bottom"
}
```

- **image**: Path to the PNG file used as the watermark.
- **imageScaleFactor**: Scaling factor for resizing the watermark image (default: 0.5).
- **imagePageXPosition**: Horizontal alignment of the watermark on the page. Possible values:
  - **"left"**: Positions watermark on the left.
  - **"center"**: Centers watermark horizontally.
  - **"right"**: Positions watermark on the right.
- **imagePageYPosition**: Vertical alignment of the watermark on the page. Possible values:
  - **"top"**: Positions watermark at the top.
  - **"center"**: Centers watermark vertically.
  - **"bottom"**: Positions watermark at the bottom.

---

## API Endpoints

### Verify File Signature
**POST /verify**

**Parameters:**
- **File (file)**: Binary file data (uploaded via form-data).
- **Signature (signature)**: Digital signature as a string (included in the request body).

**Example cURL Request:**
```bash
curl -X POST http://HOST/verify \
-F "file=@example.pdf" \
-F "signature=YOUR_SIGNATURE_STRING"
```

**Response:**
**Success:**
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

**Error:**
```json
{
  "verified": false,
  "error": "Signature verification failed"
}
```

### Add Watermark to PDF
**POST /add-sign-watermark**

**Parameters:**
- **File (file)**: Binary PDF file data (uploaded via form-data).

**Example cURL Request:**
```bash
curl -X POST http://HOST/add-sign-watermark \
-F "file=@example.pdf" \
--output watermarked_output.pdf
```

**Response:**
Returns the PDF file with the watermark applied as binary data.

---

## Prerequisites

- Node.js (v14+ recommended)
- NPM (v6+ recommended)

---

## License
This project is licensed under the MIT License. See the LICENSE file for details.
