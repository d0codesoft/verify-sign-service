### Verify Sign file API Service
A Node.js service for verifying digital signatures of files using the cryptographic library IIT. This service supports file uploads and signature verification via an API.
Features

- Supports memory and disk storage for uploaded files.;
- Verifies digital signatures against cryptographic standards;
- Customizable through a configuration file (config.json);

# Verify Api Service

![](https://pandao.github.io/editor.md/images/logos/editormd-logo-180x180.png)

![](https://img.shields.io/github/stars/pandao/editor.md.svg) ![](https://img.shields.io/github/forks/pandao/editor.md.svg) ![](https://img.shields.io/github/tag/pandao/editor.md.svg) ![](https://img.shields.io/github/release/pandao/editor.md.svg) ![](https://img.shields.io/github/issues/pandao/editor.md.svg) ![](https://img.shields.io/bower/v/editor.md.svg)


**Description**

###Configuration

The config.json file contains the following parameters:

- File Storage
>"fileStorage": {
  "destination": "memory", // "memory" for storing files in RAM, "disk" for saving on disk
  "dest": "./uploads"      // Directory for storing files when "destination" is set to "disk"
}

* **destination**: Determines where uploaded files are temporarily stored. 
**"memory"**: Files are stored in memory (RAM).
**"disk"**: Files are saved to the directory specified by the dest parameter.
* **dest**: Directory for storing uploaded files when destination is "disk".                    

#####Upload Limits

`"uploadLimits": {
  "fileSize": 52428800
}`

* **fileSize**: Maximum size for uploaded files in bytes (default: 50 MB).

#####Cryptographic Provider Settings

`"CADefault": "\"Дія\". Кваліфікований надавач електронних довірчих послуг"`

* **CADefault**: Name of the default Certification Authority (CA).

#####Debug Mode

`"DebugMode": true`

* **DebugMode**: Enables debug mode for testing purposes. 
    - **true**: Loads test certificates and settings.
    - **false**: Loads production certificates and settings.

###Prerequisites

* Node.js (v14+ recommended)
* NPM (v6+ recommended)

##API Endpoints

**Verify File Signature**
POST /verify
Parameters:
- **File (file)**: Binary file data (uploaded via form-data).
- **Signature (signature)**: Digital signature as a string (included in request body).

Example cURL Request:
```curl -X POST http://localhost:3770/verify \
-F "file=@example.pdf" \
-F "signature=YOUR_SIGNATURE_STRING"```
Response:
**Success:**
```javascript
	{
	"verified": true,
	  "signerInfo": {
	    "subjectCN": "Signer Name",
	    "issuerCN": "CA Name",
	    "serial": "123456789"
	  }
	}```
**Error:**

	{
	  "verified": false,
	  "error": "Signature verification failed"
	}

###**License**
This project is licensed under the MIT License. See the LICENSE file for details.
