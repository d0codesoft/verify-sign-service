/**
 * Author: SCODE Alexandr
 * Created Date: 2025-01
 * Description: Service API for verify sign and add watermark to pdf file.
 * Version: 1.0
 */

const express = require('express');
const multer = require('multer');
const bodyParser = require('body-parser');
const { PDFDocument, rgb , StandardFonts } = require('pdf-lib');
const fontkit = require('@pdf-lib/fontkit');
const fss= require('fs');

const config = JSON.parse(fss.readFileSync('./config.json', 'utf8'));

// Setting storage settings depending on configuration
let storage;

if (config.fileStorage.destination === 'memory') {
    storage = multer.memoryStorage();
    console.log('Temporary files will be stored in memory')
} else {
    storage = multer.diskStorage({
        destination: (req, file, cb) => {
            const uploadPath = config.fileStorage.dest;
            if (!fs.existsSync(uploadPath)) {
                fs.mkdirSync(uploadPath);
            }
            cb(null, uploadPath);
        },
        filename: (req, file, cb) => {
            cb(null, Date.now() + path.extname(file.originalname)); // Генерация уникального имени файла
        },
    });
    console.log(`Temporary files will be stored in : ${config.fileStorage.dest}`)
}

const upload = multer({
    storage,
    limits: { fileSize: config.uploadLimits.fileSize },
});

//=============================================================================

let g_isLibraryLoaded = false;

/* Loading libraries JavaScript IIT */
eval(fss.readFileSync('./lib/euscpt.js')+'');
eval(fss.readFileSync('./lib/euscpm.js')+'');
eval(fss.readFileSync('./lib/euscp.js')+'');

//=============================================================================

/* Setting up the CSC servers */
let g_CAsFileName = (config.DebugMode === true ) ? "./data/CAs.Test.json" : "./data/CAs.json";

/* Масив з шляхом до кореневих сертификатів ЦЗО та ЦСК */
let g_CACerts = [
    (config.DebugMode === true ) ? "./data/CACertificates.Test.p7b" : "./data/CACertificates.p7b",
];

if (config.DebugMode) {
    console.log("Use Debug mode service, CA use test mode");
}

//=============================================================================

/* Ініціалізація налаштувань криптографічної бібліотеки */
function SetSettings(CAs, CASettings) {
    let offline = true;
    let useOCSP = false;
    let useCMP = false;

    offline = ((CASettings == null) ||
        (CASettings.address === ""));
    useOCSP = (!offline && (CASettings.ocspAccessPointAddress !== ""));
    useCMP = (!offline && (CASettings.cmpAddress !== ""));

    g_euSign.SetJavaStringCompliant(true);

    let settings = g_euSign.CreateFileStoreSettings();
    settings.SetPath('');
    settings.SetSaveLoadedCerts(false);
    g_euSign.SetFileStoreSettings(settings);

    settings = g_euSign.CreateModeSettings();
    settings.SetOfflineMode(offline);
    g_euSign.SetModeSettings(settings);

    settings = g_euSign.CreateProxySettings();
    g_euSign.SetProxySettings(settings);

    settings = g_euSign.CreateTSPSettings();
    settings.SetGetStamps(!offline);
    if (!offline) {
        if (CASettings.tspAddress !== "") {
            settings.SetAddress(CASettings.tspAddress);
            settings.SetPort(CASettings.tspAddressPort);
        }
    }
    g_euSign.SetTSPSettings(settings);

    settings = g_euSign.CreateOCSPSettings();
    if (useOCSP) {
        settings.SetUseOCSP(true);
        settings.SetBeforeStore(true);
        settings.SetAddress(CASettings.ocspAccessPointAddress);
        settings.SetPort(CASettings.ocspAccessPointPort);
    }
    g_euSign.SetOCSPSettings(settings);

    settings = g_euSign.CreateOCSPAccessInfoModeSettings();
    settings.SetEnabled(true);
    g_euSign.SetOCSPAccessInfoModeSettings(settings);
    settings = g_euSign.CreateOCSPAccessInfoSettings();
    for (let i = 0; i < CAs.length; i++) {
        settings.SetAddress(CAs[i].ocspAccessPointAddress);
        settings.SetPort(CAs[i].ocspAccessPointPort);

        for (let j = 0; j < CAs[i].issuerCNs.length; j++) {
            settings.SetIssuerCN(CAs[i].issuerCNs[j]);
            g_euSign.SetOCSPAccessInfoSettings(settings);
        }
    }

    settings = g_euSign.CreateCMPSettings();
    settings.SetUseCMP(useCMP);
    if (useCMP) {
        settings.SetAddress(CASettings.cmpAddress);
        settings.SetPort("80");
    }
    g_euSign.SetCMPSettings(settings);

    settings = g_euSign.CreateLDAPSettings();
    g_euSign.SetLDAPSettings(settings);
}

//-----------------------------------------------------------------------------

/* Import certificates to the cryptographic library storage */
function LoadCertificates(certsFilePaths) {
    if (!certsFilePaths)
        return;

    for (let i = 0; i < certsFilePaths.length; i++) {
        let path = certsFilePaths[i];
        let data = new Uint8Array(fss.readFileSync(path));
        if (path.substring(path.length - 3) === 'p7b') {
            g_euSign.SaveCertificates(data);
        } else {
            g_euSign.SaveCertificate(data);
        }
    }
}

//-----------------------------------------------------------------------------

/* Ініціалізація криптографічної бібліотеки та встановлення налаштувань */
function Initialize() {
    /* Перевірка необхідності ініціалізації криптографічної бібліотеки */
    if (!g_euSign.IsInitialized()) {
        /* Ініціалізація криптографічної бібліотеки */
        g_euSign.Initialize();
    }

    /* Перевірка необхідності встановлення налаштувань крипт. бібліотеки */
    if (g_euSign.DoesNeedSetSettings()) {
        /* Зчитування файлу з налаштуваннями ЦСК */
        let CAs = JSON.parse(fss.readFileSync(g_CAsFileName), 'utf8');

        /* Отримання налаштувань ЦСК для ос. ключа */
        let CASettings = null;
        for (let i = 0; i < CAs.length; i++) {
            for (let j = 0; j < CAs[i].issuerCNs.length; j++) {
                if (config.CADefault === CAs[i].issuerCNs[j]) {
                    CASettings = CAs[i];
                    break;
                }
            }

            if (CASettings)
                break;
        }

        /* Встановлення параметрів за замовчанням */
        SetSettings(CAs, CASettings);

        /* Завантаження сертифікатів ЦСК */
        LoadCertificates(g_CACerts);
    }
}

//=============================================================================

/* The function is called after loading the library */
/* Library functions can be called only after calling EUSignCPModuleInitialized */
function EUSignCPModuleInitialized(isInitialized) {
    g_isLibraryLoaded = isInitialized;
}

// Add watermark function
async function addImageWatermark(pdfBytes, configWatermark) {

    // Load the watermark image
    const watermarkImage = fss.readFileSync(configWatermark.image); // Path to watermark image

    // Load the PDF and image
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const pngImage = await pdfDoc.embedPng(watermarkImage);

    // Get dimensions of the image
    const { width, height } = pngImage.scale(
        (configWatermark.imageScaleFactor) ? configWatermark.imageScaleFactor : 0.5 ); // Scale the image down (optional)

    // Loop through each page to add the watermark
    const pages = pdfDoc.getPages();
    for (const page of pages) {
        const { width: pageWidth, height: pageHeight } = page.getSize();

        // Default position is center
        let positionX = (pageWidth - width) / 2;
        if (configWatermark.imagePageXPosition === "left") {
            positionX = (pageWidth * 0.1);
        }
        else if (configWatermark.imagePageXPosition === "right") {
            positionX = (pageWidth - (pageWidth * 0.1) - width);
        }
        else if (configWatermark.imagePageXPosition === "center") {
            positionX = (pageWidth - width) / 2;
        }

        // Default position is center
        let positionY = (pageHeight - height) / 2;
        if (configWatermark.imagePageYPosition === "top") {
            positionY = pageHeight - (pageHeight * 0.1) - height;
        }
        else if (configWatermark.imagePageYPosition === "center") {
            positionY = (pageHeight - height) / 2;
        }
        else if (configWatermark.imagePageYPosition === "bottom") {
            positionY = (pageHeight * 0.1);
        }

        // Draw the image watermark in the center of each page
        page.drawImage(pngImage, {
            x: positionX,
            y: positionY,
            width,
            height,
            opacity: (configWatermark.imageOpacity) ? configWatermark.imageOpacity : 0.3, // Adjust opacity (optional)
        });
    }

    // Save the modified PDF
    return await pdfDoc.save();
}

// Add watermark function with text
async function addImageWatermarkAndText(pdfBytes, configWatermark, SubjName) {

    // Load the watermark image
    const watermarkImage = fss.readFileSync(configWatermark.image); // Path to watermark image

    // Load the PDF and image
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const pngImage = await pdfDoc.embedPng(watermarkImage);

    // Register fontkit for load default font draw Ukrainian text
    pdfDoc.registerFontkit(fontkit);
    // Load the font on support Ukrainian language
    const fontBytes = fss.readFileSync(configWatermark.font);
    const customFont = await pdfDoc.embedFont(fontBytes);

    // Get dimensions of the image
    const { width, height } = pngImage.scale(
        (configWatermark.imageScaleFactor) ? configWatermark.imageScaleFactor : 0.5 ); // Scale the image down (optional)
    const lenghtText = (SubjName) ? SubjName.length : 0;

    // Loop through each page to add the watermark
    const pages = pdfDoc.getPages();
    for (const page of pages) {
        const { width: pageWidth, height: pageHeight } = page.getSize();

        // Default position is center
        let positionX = (pageWidth - width) / 2;
        let textX = positionX;
        if (configWatermark.imagePageXPosition === "left") {
            positionX = (pageWidth * 0.1);
            textX = positionX + width + 5; // Adjust X position for some padding
        }
        else if (configWatermark.imagePageXPosition === "right") {
            positionX = (pageWidth - (pageWidth * 0.1) - width);
            textX = positionX - lenghtText - 5; // Adjust X position for some padding
        }
        else if (configWatermark.imagePageXPosition === "center") {
            positionX = (pageWidth - width) / 2;
            if (configWatermark.imagePageYPosition === "top" || configWatermark.imagePageYPosition === "bottom") {
                textX = (pageWidth * 0.1);
            }
            else {
                textX = positionX;
            }
        }

        // Default position is center
        let positionY = (pageHeight - height) / 2;
        let textY= positionY;
        if (configWatermark.imagePageYPosition === "top") {
            positionY = pageHeight - (pageHeight * 0.1) - height;
            textY = positionY; // Adjust Y position for some padding
        }
        else if (configWatermark.imagePageYPosition === "center") {
            positionY = (pageHeight - height) / 2;
            textY = positionY;
        }
        else if (configWatermark.imagePageYPosition === "bottom") {
            positionY = (pageHeight * 0.1);
            textY = positionY;
        }

        // Draw the image watermark in the center of each page
        page.drawImage(pngImage, {
            x: positionX,
            y: positionY,
            width,
            height,
            opacity: (configWatermark.imageOpacity) ? configWatermark.imageOpacity : 0.5, // Adjust opacity (optional)
        });

        if (SubjName) {
            // Draw the SubjName text
            page.drawText(SubjName, {
                x: textX,
                y: textY, // Adjust Y position for some padding
                size: 12,
                font: customFont,
                color: rgb(0, 0, 0), // Black color for the text
                lineHeight : 24,
                opacity : (configWatermark.imageOpacity) ? configWatermark.imageOpacity : 0.5
            });
        }
    }

    // Save the modified PDF
    return await pdfDoc.save();
}

//=============================================================================
// Initialize app
const app = express();
app.use(bodyParser.json());

let g_euSign = EUSignCP();

// Endpoint to verify a signature
app.post('/verify', upload.single('file'), (req, res) => {

    if (!g_isLibraryLoaded) {
         return res.status(400).send({error: 'Failed init library Crypto ITT'})
    }

    const fileBuffer = req.file.buffer;
    const signature = req.body.signature;
    if (!fileBuffer || !signature) {
        return res.status(400).send({ error: 'Both data and signature are required for verification' });
    }

    try {
        Initialize();

        let datafile = new Uint8Array(fileBuffer)
        let hash_data = g_euSign.HashData(datafile, true);
        const verificationResult = g_euSign.VerifyHash(hash_data, signature)

        res.send({ verified: true, signerInfo: verificationResult.GetOwnerInfo() });
    } catch (error) {
        res.status(500).send({ verified: false, error: error.message });
    }
});

// POST endpoint to handle PDF file uploads and add watermark
app.post('/add-sign-watermark', upload.single('file'), async (req, res) => {

    try {
        if (!req.file) {
            return res.status(400).send({ error: 'No PDF file uploaded.' });
        }

        if (!config.watermark &&
            !fss.existsSync(config.watermark.image)
        ) {
            return res.status(400).send({ error: 'Invalid or missing watermark configuration.' });
        }

        // Add the watermark to the uploaded PDF
        const watermarkedPdf = await addImageWatermark(req.file.buffer, config.watermark );
        const pdfBuffer = Buffer.from(watermarkedPdf);
        // Send the watermarked PDF back to the client
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename=watermarked.pdf');
        res.send(pdfBuffer);
    } catch (error) {
        console.error('Error adding watermark:', error);
        res.status(500).send({ error: error.message });
    }
});

// POST endpoint to handle PDF file uploads and add watermark
app.post('/verify-file', upload.single('file'), async (req, res) => {

    try {
        if (!req.file) {
            return res.status(400).send({ error: 'No PDF file uploaded.' });
        }

        const fileBuffer = req.file.buffer;
        const signature = req.body.signature;
        if (!fileBuffer || !signature) {
            return res.status(400).send({ error: 'Both data and signature are required for verification' });
        }

        if (!config.watermark &&
            !fss.existsSync(config.watermark.image)
        ) {
            return res.status(400).send({ error: 'Invalid or missing watermark configuration.' });
        }

        Initialize();

        let datafile = new Uint8Array(fileBuffer)
        let hash_data = g_euSign.HashData(datafile, true);
        const verificationResult = g_euSign.VerifyHash(hash_data, signature)
        let signerInfo = verificationResult.GetOwnerInfo();
        let subjName = signerInfo.subjCN;

        // Add the watermark to the uploaded PDF
        const watermarkedPdf = await addImageWatermarkAndText(fileBuffer, config.watermark, subjName );
        const pdfBuffer = Buffer.from(watermarkedPdf);
        // Send the watermarked PDF back to the client
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename=watermarked.pdf');
        res.send(pdfBuffer);
    } catch (error) {
        console.error('Error adding watermark:', error);
        res.status(500).send({ error: error.message });
    }
});

// Start server
const PORT = process.env.PORT || 3770;
app.listen(PORT, () => {
    console.log(`Cryptographic API service running on port ${PORT}`);
});
