const express = require('express');
const multer = require('multer');
const bodyParser = require('body-parser');
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

/* Імпорт сертифікатів до сховища криптографічної бібліотеки */
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

/* Зчитування особистого ключа */
/* Ос. ключ використовується в функціях накладання підпису, зашифрування та */
/* розшифрування даних */
function ReadPrivateKey(pKeyFilePath, password, certsFilePaths) {
    /* Імпорт сертифікатів ос. ключа */
    LoadCertificates(certsFilePaths);
    /* Зчитування ключа */
    let pKeyData = new Uint8Array(fss.readFileSync(pKeyFilePath));
    g_euSign.ReadPrivateKeyBinary(pKeyData, password)
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

// Start server
const PORT = process.env.PORT || 3770;
app.listen(PORT, () => {
    console.log(`Cryptographic API service running on port ${PORT}`);
});
