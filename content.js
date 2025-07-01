console.log('!!! SELLER ORDER AI CONTENT SCRIPT TESTING - TOP OF FILE !!!');

console.log('[Seller Order AI] Content script yüklendi.');

// Sayfa türünü belirle (Easync veya Amazon veya eBay)
const isEasyncPage = window.location.href.includes('easync.io');
const isAmazonPage = window.location.href.includes('amazon.com');
const isEbayPage = window.location.href.includes('ebay.com') && 
                   (window.location.href.includes('/vod/FetchOrderDetails') || 
                    window.location.href.includes('/ord/') ||
                    window.location.href.includes('/mesh/ord/details'));

console.log(`[Seller Order AI] Sayfa türü: ${isEasyncPage ? 'Easync' : isAmazonPage ? 'Amazon' : isEbayPage ? 'eBay' : 'Bilinmeyen'}`);

// Helper function to get text content using a base element
function getText(baseElement, selector) {
    if (!baseElement) return null;
    const element = baseElement.querySelector(selector);
    return element ? element.textContent?.trim() : null;
}

// Helper function to get input value using a base element
function getInputValue(baseElement, selector) {
    if (!baseElement) return null;
    const element = baseElement.querySelector(selector);
    return element ? element.value : null;
}

// Helper function to find the address box based on the Copy JSON button
function findAddressBox() {
    const buttons = document.querySelectorAll('button');
    for (const button of buttons) {
        if (button.textContent?.includes('COPY JSON') || button.textContent?.includes('Copy JSON')) {
            let container = button.closest('div.MuiPaper-root');
            if (container) {
                console.log('[Seller Order AI] Adres kutusu (MuiPaper-root) COPY JSON butonu üzerinden bulundu.');
                return container;
            }
            container = button.closest('div.MuiGrid-item');
            if (container) {
                console.log('[Seller Order AI] Adres kutusu (MuiGrid-item) COPY JSON butonu üzerinden bulundu.');
                return container;
            }
        }
    }
    console.error('[Seller Order AI] COPY JSON butonu veya içeren kutu bulunamadı.');
    return null;
}

// Helper function to check if a string is a US/CA postal code
function isPostalCode(str) {
    return /^\d{5}(-\d{4})?$/.test(str) || // US ZIP
           /^[A-Za-z]\d[A-Za-z] \d[A-Za-z]\d$/.test(str); // CA Postal
}

// Helper function to check if a string contains city, state, zip
function isCityStateZip(str) {
    // Regex to match common US/CA City, ST ZIP/Postal patterns
    // Example: "Anytown, ST 12345", "Anytown, ST 12345-6789", "City, BC A1B 2C3"
    const usCaCityStateZipRegex = /^[A-Za-z\s.-]+,\s*[A-Z]{2}\s+(\d{5}(-\d{4})?|[A-Za-z]\d[A-Za-z]\s?\d[A-Za-z]\d)$/;
    if (usCaCityStateZipRegex.test(str)) {
        console.log(`[Seller Order AI] isCityStateZip matched: ${str}`);
        return true;
    }
    // Add a simpler fallback for potential variations (less strict)
    if (str.includes(',') && /\d/.test(str) && str.length > 5) { // Contains comma, digit, and reasonable length
       console.log(`[Seller Order AI] isCityStateZip fallback matched: ${str}`);
       return true;
    }
    return false;
}

// Helper function to check if a string is a phone number
function isPhoneNumber(str) {
    return str.startsWith('P:') || /^\+?[\d\s-()]+$/.test(str);
}

// Global değişkenler butonlar ve durum alanı için
let amazonButtonElement = null;
let saveDataButtonElement = null;
let statusElement = null;
let currentAsinOnPage = null; // Sayfadaki güncel ASIN'i saklamak için
const amazonButtonId = 'seller-order-ai-amazon-button';
const saveDataButtonId = 'seller-order-ai-savedata-button';
const statusElementId = 'seller-order-ai-status';
const buttonContainerId = 'seller-order-ai-button-container';

// Sipariş bilgilerini DOM'dan okuyan fonksiyon
function getOrderDetails() {
    console.log('[Seller Order AI] getOrderDetails çağrıldı.');
    try {
        const addressBox = findAddressBox();
        if (!addressBox) {
            return { success: false, message: 'Adres bilgilerini içeren kutu bulunamadı (COPY JSON butonu üzerinden)' };
        }

        const customerName = getText(addressBox, 'strong');
        const nameElement = addressBox.querySelector('strong');
        const addressContainer = nameElement?.parentElement?.parentElement;
        const addressElements = addressContainer?.querySelectorAll(':scope > div');
        
        // Yeni adres ayrıştırma mantığı
        const customerInfo = {
            name: customerName,
            address1: null,
            address2: null,
            cityStateZip: null,
            country: null,
            phone: null
        };

        if (!addressElements) {
            console.error('[Seller Order AI] Adres elementleri bulunamadı.');
            return { success: false, message: 'Adres elementleri bulunamadı' };
        }

        let addressLines = [];
        for (let i = 1; i < addressElements.length; i++) { // i=1 ile başla çünkü ilk element isim
            const text = addressElements[i]?.textContent?.trim();
            if (text) addressLines.push(text);
        }

        console.log('[Seller Order AI] Bulunan adres satırları:', addressLines);

        // Satırları analiz et
        for (let i = 0; i < addressLines.length; i++) {
            const line = addressLines[i];
            
            if (isPhoneNumber(line)) {
                customerInfo.phone = line.replace('P:', '').trim();
            } else if (line === 'US' || line === 'CA') {
                customerInfo.country = line;
            } else if (isCityStateZip(line)) {
                customerInfo.cityStateZip = line;
            } else if (!customerInfo.address1) {
                customerInfo.address1 = line;
            } else if (!customerInfo.address2) { // Simplified: if it's not phone/country/cityStateZip and address1 is filled, it's address2
                customerInfo.address2 = line;
            }
        }

        // Ürün Bilgileri
        const productTableContainer = document.querySelector('div.MuiTableContainer-root table tbody');
        let asin = null;
        let quantity = "1";
        let transactionId = null;
        let ebayUrl = null;

        if (productTableContainer) {
            const asinElement = productTableContainer.querySelector('tr td a[href*="/dp/"] span');
            asin = asinElement ? asinElement.textContent?.trim() : null;

            // Transaction ID ve eBay URL'sini bul
            let transactionElement = null;
            if (productTableContainer) {
                const rows = productTableContainer.querySelectorAll('tr');
                rows.forEach(row => {
                    const cells = row.querySelectorAll('td');
                    if (cells.length >= 2) {
                        const labelCell = cells[0];
                        const valueCell = cells[1];
                        if (labelCell.textContent?.trim() === 'Transaction ID') {
                            const link = valueCell.querySelector('a[href*="ebay.com"]');
                            if (link) {
                                transactionElement = link;
                            }
                        }
                    }
                });
            }

            if (transactionElement) {
                transactionId = transactionElement.textContent?.trim();
                ebayUrl = transactionElement.href;
                console.log('[Seller Order AI] Transaction ID bulundu:', transactionId);
                console.log('[Seller Order AI] eBay URL bulundu:', ebayUrl);
            } else {
                console.warn('[Seller Order AI] Transaction ID elementi bulunamadı.');
            }

            const rows = productTableContainer.querySelectorAll('tr');
            for (const row of rows) {
                const labelCell = row.querySelector('td:first-child');
                if (labelCell && labelCell.textContent?.trim() === 'Qty') {
                    const inputElement = row.querySelector('td:nth-child(2) input');
                    quantity = inputElement ? inputElement.value : "1";
                    console.log('[Seller Order AI] Miktar (Qty) bulundu:', quantity);
                    break;
                }
            }
            if (quantity === "1") {
                console.warn('[Seller Order AI] Miktar (Qty) satırı bulunamadı, varsayılan 1 kullanılıyor.');
            }
        } else {
            console.warn('[Seller Order AI] Ürün tablosu bulunamadı.');
        }

        // Zorunlu alan kontrolü
        if (!customerInfo.name || !customerInfo.address1) {
            console.error('[Seller Order AI] Gerekli müşteri/adres bilgileri bulunamadı.', customerInfo);
            return { success: false, message: 'Gerekli müşteri/adres bilgileri bulunamadı' };
        }
        if (!asin) {
            console.warn('[Seller Order AI] ASIN bulunamadı.');
        }

        const orderData = {
            customer: customerInfo,
            product: {
                asin: asin, 
                quantity: quantity
            },
            transaction: {
                id: transactionId,
                ebayUrl: ebayUrl
            },
            easyncOrderUrl: isEasyncPage ? window.location.href : null 
        };

        console.log('[Seller Order AI] Okunan veriler:', orderData);
        return { success: true, data: orderData };

    } catch (error) {
        console.error('[Seller Order AI] Veri okuma hatası:', error);
        return { success: false, message: error.message };
    }
}

// Amazon linkini yeni sekmede açan fonksiyon (Affiliate tag eklendi)
function handleOpenAmazonLinkClick() {
    if (currentAsinOnPage) {
        // Affiliate tag'ını ekleyerek URL oluştur
        const amazonUrl = `https://www.amazon.com/dp/${currentAsinOnPage}?tag=amz_order-20`; 
        window.open(amazonUrl, '_blank');
        console.log(`[Seller Order AI] Amazon sayfası açılıyor (Affiliate ile): ${amazonUrl}`);
        statusElement.textContent = `Amazon sayfası (${currentAsinOnPage}) açıldı.`;
    } else {
        console.error('[Seller Order AI] Amazon butonu tıklaması - ASIN mevcut değil.');
        statusElement.textContent = 'Hata: Amazon\'u açmak için ASIN bulunamadı.';
    }
}

// Veriyi Storage'a kaydeden fonksiyon
function handleSaveDataClick() {
    console.log('[Seller Order AI] Bilgileri Al butonuna tıklandı.');
    statusElement.textContent = 'Veriler alınıyor ve kaydediliyor...'; // Önce metin olarak ayarla
    statusElement.style.color = 'grey'; // Rengi normale döndür
    saveDataButtonElement.disabled = true; // Geçici olarak pasif yap

    const orderDetails = getOrderDetails();

    if (orderDetails.success) {
        chrome.storage.local.set({ orderData: orderDetails.data }, () => {
            if (chrome.runtime.lastError) {
                console.error('[Seller Order AI] Veri kaydetme hatası:', chrome.runtime.lastError);
                statusElement.innerHTML = `Veri kaydedilemedi. Hata: ${chrome.runtime.lastError.message}`;
                statusElement.style.color = 'red';
            } else {
                console.log('[Seller Order AI] Veriler başarıyla kaydedildi.');
                currentAsinOnPage = orderDetails.data.product.asin;
                checkDataAndUpdateButtonState(); // Butonları ve durumu güncelle
                
                // OTOMATİK YAN PANELİ AÇMA
                chrome.runtime.sendMessage({ action: "openSidePanel" }, (response) => {
                    if (chrome.runtime.lastError) {
                        // Mesaj portu kapalıysa (örn. yan panel hiç açılmamışsa), bu beklenen bir durum olabilir.
                        // Sadece konsola loglayıp devam edebiliriz.
                        console.warn('[Seller Order AI] Yan paneli açma mesajı gönderilemedi:', chrome.runtime.lastError.message);
                    } else {
                        console.log('[Seller Order AI] Yan paneli açma isteği gönderildi.');
                    }
                });
                
                // Kullanıcıya bilgi mesajını yine de gösterelim, ancak daha kısa ve net
                statusElement.innerHTML = `${orderDetails.data.customer.name} verileri alındı. Yan panel açılıyor...`;
                statusElement.style.color = 'green';
            }
            saveDataButtonElement.disabled = false; // Butonu tekrar aktif yap
        });
    } else {
        console.error('[Seller Order AI] Veri okuma başarısız:', orderDetails.message);
        statusElement.textContent = `Hata: ${orderDetails.message}`;
        statusElement.style.color = 'red';
        saveDataButtonElement.disabled = false;
    }
}

// Verileri kontrol edip butonların durumunu güncelleyen fonksiyon (Eski Stillerle)
function checkDataAndUpdateButtonState() {
    // Elementlerin varlığını kontrol et
    if (!amazonButtonElement || !saveDataButtonElement || !statusElement) {
        console.warn('[Seller Order AI] Buton veya durum elementi henüz oluşturulmamış.');
        return;
    }

    console.log('[Seller Order AI] Veriler kontrol ediliyor ve buton durumları güncelleniyor...');
    statusElement.textContent = 'Veriler kontrol ediliyor...';
    statusElement.style.color = 'grey';
    // Başlangıç durumunu renk ile ayarla
    amazonButtonElement.disabled = true;
    amazonButtonElement.style.backgroundColor = '#ccc';
    saveDataButtonElement.disabled = true;
    saveDataButtonElement.style.backgroundColor = '#ccc';

    // Önceki listener'ları temizle
    amazonButtonElement.removeEventListener('click', handleOpenAmazonLinkClick);
    saveDataButtonElement.removeEventListener('click', handleSaveDataClick);

    // Kısa bir gecikmeyle kontrol yap
    setTimeout(() => {
        const orderDetails = getOrderDetails();
        let statusMessage = 'Veriler kontrol ediliyor...';
        let statusColor = 'grey';

        // Bilgileri Al Butonu Durumu (Renk ile)
        if (orderDetails.success) { 
             saveDataButtonElement.disabled = false;
             saveDataButtonElement.style.backgroundColor = 'lightblue'; // Renk ayarı
             saveDataButtonElement.addEventListener('click', handleSaveDataClick);
        } else {
             saveDataButtonElement.disabled = true;
             saveDataButtonElement.style.backgroundColor = '#ccc'; // Renk ayarı
             statusMessage = `Hata: ${orderDetails.message || 'Veri alınamadı.'}`;
             statusColor = 'red';
        }

        // Amazon Siparişini Ver Butonu Durumu (Renk ile)
        if (orderDetails.success && orderDetails.data?.product?.asin) {
            currentAsinOnPage = orderDetails.data.product.asin;
            amazonButtonElement.disabled = false;
            amazonButtonElement.style.backgroundColor = 'yellow'; // Renk ayarı
            amazonButtonElement.addEventListener('click', handleOpenAmazonLinkClick);
            if (statusColor !== 'red') {
                statusMessage = `ASIN (${currentAsinOnPage}) bulundu.`; 
                statusColor = 'grey';
            }
        } else {
            currentAsinOnPage = null;
            amazonButtonElement.disabled = true;
            amazonButtonElement.style.backgroundColor = '#ccc'; // Renk ayarı
            const asinErrorMessage = 'ASIN bulunamadı.';
            // Eğer Bilgileri Al butonu aktifse, ASIN hatasını ekle
            if (!saveDataButtonElement.disabled) {
                if (statusMessage === 'Veriler kontrol ediliyor...') statusMessage = `Veri alınabilir, ancak ${asinErrorMessage}`; else statusMessage += ` (${asinErrorMessage})`;
                statusColor = 'orange'; // Belki turuncu?
            } else if (statusColor !== 'red') { // Eğer genel bir hata yoksa, ASIN hatasını göster
                 statusMessage = `Hata: ${asinErrorMessage}`; 
                 statusColor = 'red';
            }
        }
        
        // Son durum mesajını ve rengini ayarla
        statusElement.textContent = statusMessage;
        statusElement.style.color = statusColor;

        console.log(`[Seller Order AI] Buton durumları güncellendi (Renk ile). Durum: ${statusMessage} (${statusColor})`);

    }, 300); 
}

// Sayfaya Butonları ve Durum Alanını ekleyen fonksiyon (Eski Stillerle)
function createButtonsAndStatus() {
    // Elementler zaten varsa tekrar ekleme
    if (document.getElementById(buttonContainerId)) {
        console.log('[Seller Order AI] Buton konteyneri zaten mevcut.');
        // Durumu tekrar kontrol et
        if (!amazonButtonElement) amazonButtonElement = document.getElementById(amazonButtonId);
        if (!saveDataButtonElement) saveDataButtonElement = document.getElementById(saveDataButtonId);
        if (!statusElement) statusElement = document.getElementById(statusElementId);
        checkDataAndUpdateButtonState(); 
        return;
    }

    const addressBox = findAddressBox();
    if (!addressBox) {
        console.warn('[Seller Order AI] Butonları eklemek için adres kutusu bulunamadı.');
        return;
    }

     // Konteyner Div oluştur
    const buttonContainer = document.createElement('div');
    buttonContainer.id = buttonContainerId;
    buttonContainer.style.marginTop = '10px';

    // Amazon Butonunu oluştur (Eski inline stillerle)
    amazonButtonElement = document.createElement('button');
    amazonButtonElement.id = amazonButtonId;
    amazonButtonElement.textContent = 'Amazon Siparişini Ver';
    amazonButtonElement.style.backgroundColor = '#ccc'; // Başlangıçta gri
    amazonButtonElement.style.color = 'black';
    amazonButtonElement.style.padding = '8px 12px';
    amazonButtonElement.style.border = 'none';
    amazonButtonElement.style.borderRadius = '5px';
    amazonButtonElement.style.cursor = 'pointer';
    amazonButtonElement.style.fontWeight = 'bold';
    amazonButtonElement.style.width = '100%';
    amazonButtonElement.style.marginBottom = '5px';
    amazonButtonElement.disabled = true; 

    // Bilgileri Al Butonunu oluştur (Eski inline stillerle)
    saveDataButtonElement = document.createElement('button');
    saveDataButtonElement.id = saveDataButtonId;
    saveDataButtonElement.textContent = 'Bilgileri Al';
    saveDataButtonElement.style.backgroundColor = '#ccc'; // Başlangıçta gri
    saveDataButtonElement.style.color = 'black';
    saveDataButtonElement.style.padding = '8px 12px';
    saveDataButtonElement.style.border = 'none';
    saveDataButtonElement.style.borderRadius = '5px';
    saveDataButtonElement.style.cursor = 'pointer';
    saveDataButtonElement.style.fontWeight = 'bold';
    saveDataButtonElement.style.width = '100%';
    saveDataButtonElement.disabled = true;

    // Durum alanını oluştur (Aynı kalır)
    statusElement = document.createElement('div');
    statusElement.id = statusElementId;
    statusElement.textContent = 'Başlatılıyor...';
    statusElement.style.fontSize = '0.8em';
    statusElement.style.color = 'grey';
    statusElement.style.marginTop = '10px';
    statusElement.style.textAlign = 'center';
    statusElement.style.width = '100%';

    // Elementleri konteynere ekle
    buttonContainer.appendChild(amazonButtonElement);
    buttonContainer.appendChild(saveDataButtonElement);

    // Konteyneri ve Durum Alanını sayfaya ekle
    const copyJsonButton = addressBox.querySelector('button:nth-of-type(2)');
    const insertionPoint = copyJsonButton?.parentElement || addressBox;
    insertionPoint.appendChild(buttonContainer);
    insertionPoint.appendChild(statusElement);
    console.log('[Seller Order AI] Butonlar ve durum alanı eklendi (Eski stillerle).');

    // Durumu kontrol et
    checkDataAndUpdateButtonState();
}

// --- Script Başlangıcı ---
console.log('[Seller Order AI] Content script yüklendi (v3 - iki butonlu).');

// Sayfa Easync.io ise normal initializeExtension çağır, değilse Amazon için sadece mesaj dinleyicisini ayarla
if (isEasyncPage) {
    function initializeExtension() {
        console.log('[Seller Order AI] initializeExtension çağrıldı (Easync sayfası için).');
        setTimeout(createButtonsAndStatus, 1500); 
    }

    if (document.readyState === 'complete') {
        initializeExtension();
    } else {
        window.addEventListener('load', initializeExtension);
    }

    // Dinamik sayfa güncellemelerini dinlemek için (MutationObserver) - Sadece Easync sayfalarında
    const observer = new MutationObserver((mutations) => {
        const containerExists = document.getElementById(buttonContainerId);
        const addressBoxExists = findAddressBox();

        if (addressBoxExists && !containerExists) {
            console.log('[Seller Order AI] Sayfa değişikliği algılandı (butonlar yok), butonlar ekleniyor...');
            setTimeout(createButtonsAndStatus, 500); 
        } 
    });

    observer.observe(document.body, { childList: true, subtree: true });
} else {
    console.log('[Seller Order AI] Easync sayfası olmadığı için buton oluşturma atlandı.');
}

// --- Amazon Adres Formu Doldurma ve Sipariş Arama İşlevleri ---

// Yan panelden ve arka plandan gelen mesajları dinle
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    console.log('[Seller Order AI - Content] ROOT MESSAGE LISTENER: Mesaj alındı:', request, 'Gönderen:', sender);

    if (request.action === "fillAmazonForm" || request.action === "fillAmazonAddressForm") {
        // fillAmazonAddressForm artık async, bu yüzden await kullanabiliriz
        // veya .then() ile işleyebiliriz. .then() kullanalım.
         fillAmazonAddressForm(request.formData)
            .then(result => {
                console.log('[Seller Order AI - Content] .then bloğuna girildi. Result:', result); // YENİ LOG
                sendResponse(result); 
                console.log('[Seller Order AI - Content] sendResponse çağrıldı.'); // YENİ LOG
            })
            .catch(error => { // Beklenmedik hataları yakala
                 console.error('[Seller Order AI - Content] fillAmazonAddressForm işlenirken hata:', error);
                 sendResponse({ success: false, message: "Adres doldurma sırasında beklenmedik hata." });
            });
        return true; // Asenkron işlem için true döndür

    } else if (request.action === "findAmazonOrder") {
        console.log('[Seller Order AI - Content] Amazon siparişi arama isteği alındı. Hedef Müşteri:', request.customerName);
        const orderDetails = findOrderDetailsOnPage(request.customerName);
        console.log('[Seller Order AI - Content] Arama sonucu:', orderDetails);
        sendResponse(orderDetails);
        return false; // Senkron ise false

    } else if (request.action === "fillEasyncOrderNumber") {
        if (!isEasyncPage) {
            sendResponse({ success: false, message: "Bu işlem sadece Easync sipariş sayfasında yapılabilir." });
            return false;
        }
        console.log('[Seller Order AI - Content] Easync sipariş numarası doldurma isteği alındı. Değer:', request.value);
        const addButtonSelector = 'button[aria-label="Add Order"]';
        const orderInputSelector = 'input[name="orderId"]';

        clickButtonAndWait(addButtonSelector)
            .then(clicked => {
                if (!clicked) {
                    sendResponse({ success: false, message: '"Sipariş Ekle" (+) butonu bulunamadı.' });
                    return;
                }
                const filled = fillEasyncInput(orderInputSelector, request.value);
                if (filled) {
                    sendResponse({ success: true, message: 'Sipariş numarası alanı dolduruldu (Kaydetmeniz gerekir).' });
                } else {
                    sendResponse({ success: false, message: 'Sipariş numarası input alanı bulunamadı.' });
                }
            });
        return true;

    } else if (request.action === "fillEasyncTrackingLink") {
        if (!isEasyncPage) {
            sendResponse({ success: false, message: "Bu işlem sadece Easync sipariş sayfasında yapılabilir." });
            return false;
        }
        console.log('[Seller Order AI - Content] Easync takip linki doldurma isteği alındı. Değer:', request.value);
        const trackButtonSelector = 'button[aria-label="Update Tracking URL"]';
        const trackInputSelector = 'input[name="trackingUrl"]';

        clickButtonAndWait(trackButtonSelector)
             .then(clicked => {
                if (!clicked) {
                    sendResponse({ success: false, message: '"Takip Linkini Güncelle" (✎) butonu bulunamadı.' });
                    return;
                }
                const filled = fillEasyncInput(trackInputSelector, request.value);
                if (filled) {
                    sendResponse({ success: true, message: 'Takip linki alanı dolduruldu (Kaydetmeniz gerekir).' });
                } else {
                    sendResponse({ success: false, message: 'Takip linki input alanı bulunamadı.' });
                }
            });
        return true;
    } else if (request.action === 'getEbayDetails') {
        console.log('[Seller Order AI] eBay bilgileri istendi');
        const ebayOrderDetails = getEbayOrderDetails();
        sendResponse(ebayOrderDetails);
        return true; // Asenkron yanıt için gerekli
    }
});

// Amazon sayfasında sipariş detaylarını arayan fonksiyon (GÜNCELLENDİ - Business Müşteri Adı Selektörü)
function findOrderDetailsOnPage(targetCustomerName) {
    console.log(`[Seller Order AI - Content] Sipariş aranıyor: ${targetCustomerName}`);

    // --- DENEME 1: Standart Hesap Yapısı ---
    console.log('[Seller Order AI - Content] Deneme 1: Standart hesap selektörleri kullanılıyor...');
    const standardOrderBlocks = document.querySelectorAll('div.order-card.js-order-card');
    console.log(`[Seller Order AI - Content] Standart blok bulundu: ${standardOrderBlocks.length}`);

    if (standardOrderBlocks.length > 0) {
        for (const orderBlock of standardOrderBlocks) {
            // Müşteri Adını Bul (Standart)
            let currentCustomerName = null;
            const customerNameLink = orderBlock.querySelector("div[id^='shipToInsertionNode-'] a.a-popover-trigger");
            if (customerNameLink) {
                currentCustomerName = customerNameLink.textContent.trim();
            } else {
                 const hiddenNameSpan = orderBlock.querySelector('span.a-truncate-full.a-offscreen');
                 if (hiddenNameSpan) {
                    currentCustomerName = hiddenNameSpan.textContent.trim();
                 }
            }

            if (currentCustomerName && currentCustomerName.toLowerCase() === targetCustomerName.toLowerCase()) {
                console.log(`[Seller Order AI - Content] Standart blokta eşleşen müşteri bulundu: ${currentCustomerName}`);
                let orderId = null;
                let trackingLink = null;
                let purchasePrice = null;

                // Sipariş Numarasını Bul (Standart)
                try {
                    let orderIdLabel = orderBlock.querySelector('span#orderIdLabel');
                    if (!orderIdLabel) {
                         const labels = orderBlock.querySelectorAll('span.a-color-secondary.a-text-caps');
                         for (const label of labels) { if (label.textContent.trim() === 'Order #') { orderIdLabel = label; break; } }
                    }
                    if (orderIdLabel && orderIdLabel.nextElementSibling) {
                        orderId = orderIdLabel.nextElementSibling.textContent.trim();
                    }
                } catch (e) { console.error('Standart Sipariş No alınırken hata:', e); }

                // Toplam Fiyatı Bul (Standart)
                try {
                    console.log('[Seller Order AI - Content] Standart hesap için fiyat aranıyor...');
                    let priceElement = null;

                    // 1. Yöntem: Fiyat container'ı içinde ara
                    const priceContainers = orderBlock.querySelectorAll('div.a-column.a-span2');
                    for (const container of priceContainers) {
                        const spans = container.querySelectorAll('span');
                        for (const span of spans) {
                            const text = span.textContent.trim();
                            if (text.startsWith('$') && /\$\d+\.\d{2}/.test(text)) {
                                priceElement = span;
                                console.log('[Seller Order AI - Content] Fiyat container içinde bulundu:', text);
                                break;
                            }
                        }
                        if (priceElement) break;
                    }
                    
                    // 2. Yöntem: Tüm span'ları tara (yedek yöntem)
                    if (!priceElement) {
                        console.log('[Seller Order AI - Content] Container araması başarısız, tüm span\'lar taranıyor...');
                        const spans = orderBlock.querySelectorAll('span.a-size-base');
                        for (const span of spans) {
                            const text = span.textContent.trim();
                            if (text.startsWith('$') && /\$\d+\.\d{2}/.test(text)) {
                                priceElement = span;
                                console.log('[Seller Order AI - Content] Fiyat genel tarama ile bulundu:', text);
                                break;
                            }
                        }
                    }

                    if (priceElement) {
                        purchasePrice = priceElement.textContent.trim();
                        console.log('[Seller Order AI - Content] Fiyat başarıyla çekildi:', purchasePrice);
                    } else {
                        console.warn('[Seller Order AI - Content] Fiyat elementi bulunamadı!');
                        console.log('[Seller Order AI - Content] Order block içeriği:', orderBlock.innerHTML);
                    }
                } catch (e) { 
                    console.error('Standart Toplam Fiyat alınırken hata:', e); 
                }

                // Takip Linkini Bul (Standart)
                try {
                    const trackLinkElement = orderBlock.querySelector("a.a-button-text[href*='ship-track']") || orderBlock.querySelector('a[href*="tracking"]'); // Genişletilmiş arama
                    if (trackLinkElement) {
                         const rawHref = trackLinkElement.getAttribute('href');
                         if (rawHref) { trackingLink = new URL(rawHref, 'https://www.amazon.com').href; }
                    }
                } catch (e) { console.error('Standart Takip Linki alınırken hata:', e); }

                console.log(`[Seller Order AI - Content] Standart Sonuç: ID=${orderId}, Link=${trackingLink}, Fiyat=${purchasePrice}`);
                return {
                    success: true,
                    orderId: orderId,
                    trackingLink: trackingLink,
                    purchasePrice: purchasePrice
                };
            }
        }
        // Standart bloklarda eşleşme bulunamadıysa, Business denemesine geçmeden önce logla
        console.log('[Seller Order AI - Content] Standart bloklarda hedef müşteri bulunamadı.');
    }

    // --- DENEME 2: Amazon Business Hesap Yapısı ---
    console.log('[Seller Order AI - Content] Deneme 2: Amazon Business selektörleri kullanılıyor...');
    const businessOrderBlocks = document.querySelectorAll('div#orderCard'); // Business ana blok
    console.log(`[Seller Order AI - Content] Business blok (div#orderCard) bulundu: ${businessOrderBlocks.length}`);

     if (businessOrderBlocks.length > 0) {
        for (const orderBlock of businessOrderBlocks) {
            // Müşteri Adını Bul (Business - YENİ SELEKTÖR)
            let currentCustomerName = null;
            try {
                 // Sağladığınız spesifik selektörü kullan
                 const nameSpan = orderBlock.querySelector('#orderCardHeader > div > div > div:nth-child(3) > div.a-row.a-size-base > span > div > span.popoverText > a > span > span.a-truncate-cut');
                 if (nameSpan) {
                     currentCustomerName = nameSpan.textContent.trim();
                     console.log(`[Seller Order AI - Content] Business blokta potansiyel isim bulundu (Yeni Selektörle): ${currentCustomerName}`);
                 } else {
                    // console.warn('[Seller Order AI - Content] Business blokta müşteri adı (yeni selektörle) bulunamadı.');
                 }
            } catch(e) { console.error('Business Müşteri Adı (yeni selektörle) alınırken hata:', e); }


            if (currentCustomerName && currentCustomerName.toLowerCase() === targetCustomerName.toLowerCase()) {
                console.log(`[Seller Order AI - Content] Business blokta eşleşen müşteri bulundu: ${currentCustomerName}`);
                let orderId = null;
                let trackingLink = null;
                let purchasePrice = null;

                // Sipariş Numarasını Bul (Business - Önceki mantıkla devam)
                try {
                    let orderIdLabel = null;
                    const labels = orderBlock.querySelectorAll('span.a-color-secondary, .order-number-label'); // Sınıflar örnektir
                    for (const label of labels) { if (label.textContent.trim().includes('Order #')) { orderIdLabel = label; break; } }
                    if (orderIdLabel) {
                        if(orderIdLabel.nextElementSibling) { orderId = orderIdLabel.nextElementSibling.textContent.trim(); }
                        else if (orderIdLabel.parentElement.querySelector('.order-number-value')) { orderId = orderIdLabel.parentElement.querySelector('.order-number-value').textContent.trim(); }
                        else { const containerText = orderIdLabel.closest('.a-box-inner')?.textContent || ''; const match = containerText.match(/Order #\s*([\d-]+)/); if (match && match[1]) orderId = match[1]; }
                    }
                } catch (e) { console.error('Business Sipariş No alınırken hata:', e); }

                // Toplam Fiyatı Bul (Business)
                try {
                    // Önce "Total" başlığını bul
                    const totalLabels = orderBlock.querySelectorAll('div.a-row.a-color-secondary');
                    let totalSection = null;
                    for (const label of totalLabels) {
                        if (label.textContent.trim() === 'Total') {
                            totalSection = label.nextElementSibling;
                            break;
                        }
                    }
                    
                    if (totalSection && totalSection.classList.contains('a-row') && totalSection.classList.contains('a-size-base')) {
                        purchasePrice = totalSection.textContent.trim();
                    }
                } catch (e) { console.error('Business Toplam Fiyat alınırken hata:', e); }

                // Takip Linkini Bul (Business - Önceki mantıkla devam)
                try {
                     const trackLinks = orderBlock.querySelectorAll('a.a-button-text');
                     for (const link of trackLinks) {
                         if (link.textContent.trim().toLowerCase() === 'track package') {
                              const rawHref = link.getAttribute('href');
                              if (rawHref) { trackingLink = new URL(rawHref, 'https://www.amazon.com').href; }
                              break;
                         }
                     }
                } catch (e) { console.error('Business Takip Linki alınırken hata:', e); }

                console.log(`[Seller Order AI - Content] Business Sonuç: ID=${orderId}, Link=${trackingLink}, Fiyat=${purchasePrice}`);
                return {
                    success: true,
                    orderId: orderId,
                    trackingLink: trackingLink,
                    purchasePrice: purchasePrice
                };
            }
        }
         // Business bloklarında da eşleşme bulunamadı.
        console.log('[Seller Order AI - Content] Business bloklarında hedef müşteri bulunamadı.');
    }

    // Her iki deneme de başarısız oldu
    console.log('[Seller Order AI - Content] Hedef müşteri adı sayfadaki siparişlerle eşleşmedi (Her iki yöntem de denendi).');
    return { success: false, message: "Eşleşen sipariş bulunamadı (Standart veya Business)." };
}

// Form alanı doldurma yardımcı fonksiyonu
function fillFormField(selector, value) {
    if (!selector || value === null || value === undefined || value === '...') {
        console.log(`[Seller Order AI - Content] Alan doldurulamadı: Selector='${selector}', Value='${value}' (geçersiz)`);
        return false; // Değer yoksa veya geçersizse doldurma
    }
    
    const element = document.querySelector(selector);
    if (element) {
        console.log(`[Seller Order AI - Content] Dolduruluyor: Selector='${selector}', Value='${value}'`);
        element.value = value;
        // React veya diğer frameworklerin state'ini güncellemek için input ve change olaylarını tetikle
        const eventInput = new Event('input', { bubbles: true });
        const eventChange = new Event('change', { bubbles: true });
        element.dispatchEvent(eventInput);
        element.dispatchEvent(eventChange);
        return true;
    } else {
        console.warn(`[Seller Order AI - Content] Form alanı bulunamadı: ${selector}`);
        return false;
    }
}

// Dropdown seçimi için yardımcı fonksiyon (Eyalet/State için)
function selectDropdownOption(selector, value) {
    if (!selector || !value || value === '...') {
        console.log(`[Seller Order AI - Content] Dropdown seçilemedi: Selector='${selector}', Value='${value}' (geçersiz)`);
        return false;
    }
    
    const selectElement = document.querySelector(selector);
    if (selectElement && selectElement.tagName === 'SELECT') {
        console.log(`[Seller Order AI - Content] Dropdown seçiliyor: Selector='${selector}', Value='${value}'`);
        const options = Array.from(selectElement.options);
        
        // Değere (value) veya metne (text) göre eşleşme ara
        let targetOption = options.find(opt => opt.value === value);
        if (!targetOption) {
            targetOption = options.find(opt => opt.text.trim().toLowerCase() === value.trim().toLowerCase());
        }
        // Kısmi eşleşme (örneğin sadece eyalet kodu varsa)
        if (!targetOption) {
             targetOption = options.find(opt => opt.text.trim().toLowerCase().startsWith(value.trim().toLowerCase()));
        }

        if (targetOption) {
            selectElement.value = targetOption.value;
             // Olayları tetikle
            const eventChange = new Event('change', { bubbles: true });
            selectElement.dispatchEvent(eventChange);
            console.log(`[Seller Order AI - Content] Dropdown seçildi: ${targetOption.value}`);
            return true;
        } else {
            console.warn(`[Seller Order AI - Content] Dropdown seçeneği bulunamadı: Selector='${selector}', Value='${value}'`);
            return false;
        }
    } else {
        console.warn(`[Seller Order AI - Content] Select elementi bulunamadı: ${selector}`);
        return false;
    }
}

// Amazon adres formunu dolduran ana fonksiyon (GÜNCELLENDİ)
async function fillAmazonAddressForm(formData) { // async olarak işaretlendi
    console.log('[Seller Order AI - Content] Amazon adres formu dolduruluyor:', formData);
    
    const standardSelectors = {
        fullName: "#address-ui-widgets-enterAddressFullName",
        phone: "#address-ui-widgets-enterAddressPhoneNumber",
        addressLine1: "#address-ui-widgets-enterAddressLine1",
        addressLine2: "#address-ui-widgets-enterAddressLine2", 
        city: "#address-ui-widgets-enterAddressCity",
        stateProvince: "#address-ui-widgets-enterAddressStateOrRegion-dropdown-nativeId",
        postalCode: "#address-ui-widgets-enterAddressPostalCode"
        // Country selector might be needed depending on the form variant
    };

    const addNewAddressLinkSelector = 'a#add-new-address-desktop-sasp-tango-link'; // AI'dan gelen selektör

    // Önce formun zaten görünür olup olmadığını kontrol et (isim alanına bakarak)
    let formVisible = document.querySelector(standardSelectors.fullName) !== null;
    console.log(`[Seller Order AI - Content] Form başlangıçta görünür mü? ${formVisible}`);

    if (!formVisible) {
        // Form görünür değilse, "Yeni adres ekle" linkini bul ve tıkla
        const addNewAddressLink = document.querySelector(addNewAddressLinkSelector);
        if (addNewAddressLink) {
            console.log('[Seller Order AI - Content] "Yeni adres ekle" linki bulundu, tıklanıyor...');
            addNewAddressLink.click();
            // Yeni formun yüklenmesi için bekle (Örnek: 1 saniye)
            console.log('[Seller Order AI - Content] Yeni formun yüklenmesi bekleniyor (1sn)...');
            await new Promise(resolve => setTimeout(resolve, 1000)); // async/await için Promise
            console.log('[Seller Order AI - Content] Bekleme tamamlandı, form tekrar kontrol ediliyor.');
            // Bekledikten sonra formun görünürlüğünü tekrar kontrol et
            formVisible = document.querySelector(standardSelectors.fullName) !== null;
            console.log(`[Seller Order AI - Content] Linke tıkladıktan sonra form görünür mü? ${formVisible}`);
        } else {
            console.error('[Seller Order AI - Content] HATA: Adres formu bulunamadı VE "Yeni adres ekle" linki de bulunamadı.');
            return {
                success: false,
                message: "Amazon adres formu veya 'Yeni adres ekle' linki bulunamadı."
            };
        }
    }

    // Bu noktada formun görünür olması beklenir (ya baştan vardı ya da linke tıklandı)
    if (!formVisible) {
         console.error('[Seller Order AI - Content] HATA: "Yeni adres ekle" linkine tıklandı ancak form yine de yüklenmedi/bulunamadı.');
         return {
            success: false,
            message: "Yeni adres formu yüklenemedi veya bulunamadı."
         };
    }

    // --- Form Doldurma Mantığı (Mevcut kod ile devam) ---
    console.log('[Seller Order AI - Content] Form alanları dolduruluyor...');
    let successCount = 0;
    let totalFields = 0; // Sadece gerekli alanları sayalım

    // Gerekli alanları doldur
    if (formData.fullName) { totalFields++; if(fillFormField(standardSelectors.fullName, formData.fullName)) successCount++; }
    if (formData.address1) { totalFields++; if(fillFormField(standardSelectors.addressLine1, formData.address1)) successCount++; }
    if (formData.city) { totalFields++; if(fillFormField(standardSelectors.city, formData.city)) successCount++; }
    if (formData.zip) { totalFields++; if(fillFormField(standardSelectors.postalCode, formData.zip)) successCount++; }
    if (formData.phone) { totalFields++; if(fillFormField(standardSelectors.phone, formData.phone)) successCount++; }
    
    // Eyalet (Dropdown)
    if (formData.state) { totalFields++; if(selectDropdownOption(standardSelectors.stateProvince, formData.state)) successCount++; }
    
    // Adres Satırı 2 (Opsiyonel)
    if (formData.address2 && formData.address2 !== '...') { 
        // Opsiyonel olduğu için totalFields'a eklemiyoruz
        fillFormField(standardSelectors.addressLine2, formData.address2);
    }

    // Ülke (Şimdilik varsayılan kullanılıyor, gerekirse eklenecek)
    // if (formData.country) { ... }

    console.log(`[Seller Order AI - Content] Form doldurma tamamlandı. ${successCount}/${totalFields} gerekli alan başarıyla dolduruldu.`);
    console.log(`[Seller Order AI - Content] Kontrol: successCount = ${successCount}, totalFields = ${totalFields}`);

    // Başarı durumunu kontrol et (Biraz daha toleranslı olabiliriz)
    if (successCount >= totalFields * 0.6 || (totalFields === 0 && successCount === 0)) { // Gerekli alanların çoğu veya hiç gerekli alan yoksa
         console.log('[Seller Order AI - Content] fillAmazonAddressForm: BAŞARI koşuluna girildi.');
         const responseResult = { success: true, message: `Form dolduruldu (${successCount}/${totalFields} gerekli alan).` };
         console.log('[Seller Order AI - Content] fillAmazonAddressForm PRE-SEND RESPONSE:', responseResult);
         return responseResult;
    } else if (successCount > 0) {
         console.log('[Seller Order AI - Content] fillAmazonAddressForm: KISMEN BAŞARI koşuluna girildi.');
         const responseResult = { success: false, message: `Form kısmen dolduruldu (${successCount}/${totalFields}). Lütfen kontrol edin.` };
         console.log('[Seller Order AI - Content] fillAmazonAddressForm PRE-SEND RESPONSE:', responseResult);
         return responseResult;
    } else {
        console.log('[Seller Order AI - Content] fillAmazonAddressForm: HATA (hiçbir alan doldurulamadı) koşuluna girildi.');
        console.error('[Seller Order AI - Content] Form göründü ancak hiçbir alan doldurulamadı. Selektörler yanlış olabilir.');
        const responseResult = { success: false, message: "Form alanları doldurulamadı. Selektörler güncel olmayabilir." };
        console.log('[Seller Order AI - Content] fillAmazonAddressForm PRE-SEND RESPONSE:', responseResult);
        return responseResult;
    }
}

// --- Easync Veri Girişi Yardımcı Fonksiyonları ---

// Belirtilen selektördeki butona tıklar ve popup'ın açılması için bekler
async function clickButtonAndWait(selector, waitTime = 500) {
    const button = document.querySelector(selector);
    if (button) {
        button.click();
        console.log(`[Seller Order AI - Content] Butona tıklandı: ${selector}`);
        // Basit bekleme - Daha sağlamı MutationObserver olabilir
        await new Promise(resolve => setTimeout(resolve, waitTime));
        return true;
    } else {
        console.error(`[Seller Order AI - Content] Buton bulunamadı: ${selector}`);
        return false;
    }
}

// Belirtilen input alanını bulur, değeri yazar ve olayları tetikler
function fillEasyncInput(selector, value) {
    const inputElement = document.querySelector(selector);
    if (inputElement) {
        inputElement.value = value;
        // Input ve change olaylarını tetikle (React vb. için)
        const eventInput = new Event('input', { bubbles: true });
        const eventChange = new Event('change', { bubbles: true });
        inputElement.dispatchEvent(eventInput);
        inputElement.dispatchEvent(eventChange);
        console.log(`[Seller Order AI - Content] Input dolduruldu: ${selector} = ${value}`);
        return true;
    } else {
        console.error(`[Seller Order AI - Content] Input alanı bulunamadı: ${selector}`);
        return false;
    }
}

// Sayfa yüklendiğinde çalışacak ana fonksiyon
function initializeExtension() {
    console.log('[Seller Order AI] initializeExtension çağrıldı' + (isEasyncPage ? ' (Easync sayfası için).' : isAmazonPage ? ' (Amazon sayfası için).' : isEbayPage ? ' (eBay sayfası için).' : '.'));

    if (isEbayPage) {
        // eBay sayfası için mesaj dinleyicisi ekle
        chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
            if (request.action === "ping") {
                // Content script'in hazır olduğunu bildir
                console.log('[Seller Order AI] Ping mesajına yanıt veriliyor');
                sendResponse({ status: "ready" });
            }
            return true;
        });
    } else if (isEasyncPage) {
        // Easync sayfası için butonları oluştur
        setTimeout(createButtonsAndStatus, 1500);
    } else if (isAmazonPage) {
        // Amazon sayfası için form doldurma işlemlerini hazırla
        setTimeout(createButtonsAndStatus, 1500);
    }
}

// Dinamik sayfa güncellemelerini dinlemek için (MutationObserver) - Sadece Easync sayfalarında
if (isEasyncPage) {
    const observer = new MutationObserver((mutations) => {
        const containerExists = document.getElementById(buttonContainerId);
        const addressBoxExists = findAddressBox();

        if (addressBoxExists && !containerExists) {
            console.log('[Seller Order AI] Sayfa değişikliği algılandı (butonlar yok), butonlar ekleniyor...');
            setTimeout(createButtonsAndStatus, 500);
        }
    });

    observer.observe(document.body, { childList: true, subtree: true });
}

// eBay sipariş detaylarını çeken fonksiyon
function getEbayOrderDetails() {
    console.log('[Seller Order AI] eBay sipariş detayları alınıyor...');
    
    try {
        // Tüm amount sınıflı dd elementlerini bul
        const amountElements = document.querySelectorAll('dd.amount');
        const orderData = {
            orderTotal: null,    // Toplam satış fiyatı
            orderEarnings: null  // Net kazanç
        };

        // Her bir amount elementi için kontrol et
        amountElements.forEach(element => {
            // Label'ı bul (önceki kardeş element)
            const labelElement = element.previousElementSibling;
            if (!labelElement) return;

            const label = labelElement.textContent.trim().toLowerCase();
            const valueElement = element.querySelector('div.value span.sh-bold');
            
            if (!valueElement) return;
            
            const value = valueElement.textContent.trim();

            // Label'a göre değeri kaydet
            if (label.includes('total')) {
                orderData.orderTotal = value;
                console.log('[Seller Order AI] Toplam satış fiyatı bulundu:', value);
            } else if (label.includes('earnings')) {
                orderData.orderEarnings = value;
                console.log('[Seller Order AI] Net kazanç bulundu:', value);
            }
        });

        const ebayOrderData = {
            orderDetails: orderData
        };

        console.log('[Seller Order AI] eBay veri yapısı oluşturuldu:', ebayOrderData);
        return { success: true, data: ebayOrderData };

    } catch (error) {
        console.error('[Seller Order AI] eBay veri okuma hatası:', error);
        return { success: false, message: error.message };
    }
}

// Sayfa yüklendiğinde eBay sayfası kontrolü ve veri çekme
if (isEbayPage) {
    console.log('[Seller Order AI] eBay sayfası tespit edildi. Veri çekme başlatılıyor...');
    const ebayOrderDetails = getEbayOrderDetails();
    console.log('[Seller Order AI] eBay sipariş detayları:', ebayOrderDetails);
}