Node.js Cryptographic API Service
A Node.js service for verifying digital signatures of files using the cryptographic library IIT. This service supports file uploads and signature verification via an API.
Features
  •	Supports memory and disk storage for uploaded files.
  •	Verifies digital signatures against cryptographic standards.
  •	Customizable through a configuration file (config.json).

________________________________________
Configuration
The config.json file contains the following parameters:
File Storage
"fileStorage": {
  "destination": "memory", // "memory" for storing files in RAM, "disk" for saving on disk
  "dest": "./uploads"      // Directory for storing files when "destination" is set to "disk"
}
•	destination: Determines where uploaded files are temporarily stored. 
o	"memory": Files are stored in memory (RAM).
o	"disk": Files are saved to the directory specified by the dest parameter.
•	dest: Directory for storing uploaded files when destination is "disk".
________________________________________
Upload Limits
"uploadLimits": {
  "fileSize": 52428800
}
•	fileSize: Maximum size for uploaded files in bytes (default: 50 MB).
________________________________________
Cryptographic Provider Settings
"CADefault": "\"Дія\". Кваліфікований надавач електронних довірчих послуг"
•	CADefault: Name of the default Certification Authority (CA).
________________________________________
Debug Mode
"DebugMode": true
•	DebugMode: Enables debug mode for testing purposes. 
o	true: Loads test certificates and settings.
o	false: Loads production certificates and settings.
________________________________________
Prerequisites
•	Node.js (v14+ recommended)
•	NPM (v6+ recommended)
________________________________________
Setup
1.	Clone the repository:
2.	git clone https://github.com/your-username/your-repo.git
3.	cd your-repo
4.	Install dependencies:
5.	npm install
6.	Ensure the cryptographic library files (euscpt.js, euscpm.js, euscp.js) are in the lib directory.
7.	Customize config.json as needed.
8.	Create the uploads directory (if using disk storage):
9.	mkdir uploads
________________________________________
Running the Service
Start the server:
node main.js
The service will run on the default port 3770. You can change this using the PORT environment variable.
________________________________________
API Endpoints
1. Verify File Signature
POST /verify
Parameters:
•	File (file): Binary file data (uploaded via form-data).
•	Signature (signature): Digital signature as a string (included in request body).
Example cURL Request:
curl -X POST http://localhost:3770/verify \
-F "file=@example.pdf" \
-F "signature=YOUR_SIGNATURE_STRING"
Response:
•	Success:
•	{
•	  "verified": true,
•	  "signerInfo": {
•	    "subjectCN": "Signer Name",
•	    "issuerCN": "CA Name",
•	    "serial": "123456789"
•	  }
•	}
•	Error:
•	{
•	  "verified": false,
•	  "error": "Signature verification failed"
•	}
________________________________________
Debugging
Enable debug logs by setting DebugMode to true in config.json. This loads test certificates and configuration.
________________________________________
License
This project is licensed under the MIT License. See the LICENSE file for details.
