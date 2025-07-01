document.addEventListener('DOMContentLoaded', async function() {
    const infoListDiv = document.getElementById('infoList');
    const statusDiv = document.getElementById('status');
    const amazonOrderResultsDiv = document.getElementById('amazon-order-results'); // Yeni sonuç alanı
    let currentOrderData = null; // Depolanan veriyi saklamak için değişken
    let amazonOrderId = null;
    let amazonTrackingLink = null;

    // Durum mesajını "Son İşlem: " ön ekiyle güncelleyen yardımcı fonksiyon
    function updateStatus(message, color = 'grey') {
        if (statusDiv) {
            statusDiv.textContent = `Son İşlem: ${message}`;
            statusDiv.style.color = color;
        }
    }

    // Fonksiyon: Belirtilen ID'ye sahip bir alanı günceller.
    // Metin veya tıklanabilir bir link olarak ayarlayabilir.
    function updateField(fieldId, value, linkUrl = null, linkText = null) {
        const row = document.getElementById(`row-${fieldId}`);
        const valueElement = document.getElementById(`popup-value-${fieldId}`);

        if (!row || !valueElement) {
            // console.warn(`[Seller Order AI - Sidepanel] '${fieldId}' için element bulunamadı.`);
            return;
        }

        // Önceki içeriği temizle
        valueElement.innerHTML = '';

        if (value) {
            row.classList.remove('hidden');
            if (linkUrl) {
                const link = document.createElement('a');
                link.href = linkUrl;
                link.textContent = linkText || value; // Özel link metni yoksa değeri kullan
                link.target = '_blank';
                link.rel = 'noopener noreferrer';
                valueElement.appendChild(link);
            } else {
                valueElement.textContent = value;
            }
        } else {
            row.classList.add('hidden');
        }
    }
    
    // Helper function to update a URL link field and its row visibility
    // URL metnini ve tooltip'ini opsiyonel olarak alır
    function updateLinkField(linkId, url, rowId, linkText = null, linkTitle = null) {
        const linkElement = document.getElementById(linkId);
        const rowElement = document.getElementById(rowId);
        if (linkElement && rowElement && linkElement.tagName === 'A') {
            if (url) {
                linkElement.href = url;
                // Eğer özel link metni verilmediyse, URL'den oluştur
                if (linkText === null) {
                    try {
                        const urlObject = new URL(url);
                        linkElement.textContent = urlObject.pathname; // Sadece yolu göster
                    } catch (e) {
                        linkElement.textContent = url; // Geçersiz URL ise tamamını göster
                    }
                } else {
                    linkElement.textContent = linkText; // Verilen metni kullan
                }
                linkElement.title = linkTitle !== null ? linkTitle : url; // Tooltip ayarla (varsayılan: tam URL)

                linkElement.style.color = '#007bff'; // Link rengi
                linkElement.style.textDecoration = 'underline';
                rowElement.classList.remove('hidden');
            } else {
                linkElement.textContent = '-';
                linkElement.href = '#';
                linkElement.title = '';
                linkElement.style.color = 'inherit'; // Normal metin rengi
                linkElement.style.textDecoration = 'none';
                rowElement.classList.add('hidden'); // Hide row if no value
            }
        } else {
            console.warn(`Sidepanel link element not found or not an <a> tag: ${linkId}`);
        }
    }

    // Fonksiyon: city, state ve zip'i tek bir string'den ayrıştırır.
    function parseCityStateZip(czsString) {
        if (!czsString) return { city: null, state: null, zip: null };

        const parts = czsString.split(',');
        const city = parts[0]?.trim();
        const stateZip = parts[1]?.trim().split(/\s+/);
        const state = stateZip[0];
        const zip = stateZip.slice(1).join(' ');
        
        return { city, state, zip };
    }

    // Fonksiyon: Para birimi string'ini sayıya çevirir.
    function parseCurrency(str) {
        if (!str || typeof str !== 'string') return 0;
        // Binlik ayırıcı olarak kullanılan nokta ve virgülü dikkate alır.
        const cleaned = str.replace(/[^\d,.]/g, '');
        let numberStr;
        const lastComma = cleaned.lastIndexOf(',');
        const lastPeriod = cleaned.lastIndexOf('.');

        if (lastComma > lastPeriod) { // 1.234,56 formatı
            numberStr = cleaned.replace(/\./g, '').replace(',', '.');
        } else { // 1,234.56 formatı
            numberStr = cleaned.replace(/,/g, '');
        }
        
        return parseFloat(numberStr) || 0;
    }

    // Function to handle the copy action
    function handleCopyClick(event) {
        const button = event.target.closest('.copy-btn');
        if (!button) return;

        const targetId = button.dataset.target;
        const valueElement = document.getElementById(targetId);

        if (valueElement) {
            const valueToCopy = valueElement.textContent;
            navigator.clipboard.writeText(valueToCopy).then(() => {
                console.log('[Seller Order AI - Sidepanel] Copied to clipboard:', valueToCopy);
                // Provide feedback
                button.textContent = '✅'; // Change icon
                button.classList.add('copied');
                setTimeout(() => {
                    button.textContent = '📋'; // Revert icon
                    button.classList.remove('copied');
                }, 1500); // Revert after 1.5 seconds
            }).catch(err => {
                console.error('[Seller Order AI - Sidepanel] Failed to copy:', err);
                updateStatus('Kopyalama başarısız.', 'red');
            });
        }
    }

    // Helper function to add copy listeners
    function addCopyListeners(parentElement) {
        const copyButtons = parentElement.querySelectorAll('.copy-btn');
        copyButtons.forEach(button => {
            if (button.dataset.listenerAttached) return;
             button.addEventListener('click', function(event) {
                 const btn = event.target.closest('.copy-btn');
                 if (!btn) return;
                 let valueToCopy = null;
                 const targetId = btn.dataset.target;
                 const targetHrefId = btn.dataset.targetHref;
                 if (targetId) {
                     const valueElement = document.getElementById(targetId);
                     if (valueElement) valueToCopy = valueElement.textContent;
                 } else if (targetHrefId) {
                     const containerElement = document.getElementById(targetHrefId); // Bu, <span> elementini alır
                     if (containerElement) {
                        const linkElement = containerElement.querySelector('a'); // span içindeki <a> etiketini bul
                        if (linkElement) {
                           valueToCopy = linkElement.href; // linkin href'ini kopyala
                        }
                     }
                 }
                 if (valueToCopy) {
                     navigator.clipboard.writeText(valueToCopy).then(() => {
                         console.log('[Seller Order AI - Sidepanel] Copied to clipboard:', valueToCopy);
                         btn.textContent = '✅';
                         btn.classList.add('copied');
                         setTimeout(() => {
                             btn.textContent = '📋';
                             btn.classList.remove('copied');
                         }, 1500);
                     }).catch(err => {
                         console.error('[Seller Order AI - Sidepanel] Failed to copy:', err);
                         updateStatus('Kopyalama başarısız.', 'red');
                     });
                 } else {
                     console.warn('[Seller Order AI - Sidepanel] Copy target not found or empty:', targetId || targetHrefId);
                 }
             });
             button.dataset.listenerAttached = 'true';
        });
    }

    // Easync'e gönderme butonlarına listener ekleyen fonksiyon
    function addEasyncActionListeners() {
        const sendOrderBtn = document.getElementById('send-amazon-order-to-easync');
        const sendTrackingBtn = document.getElementById('send-tracking-to-easync');
        if (sendOrderBtn) {
            sendOrderBtn.addEventListener('click', function() {
                sendDataToEasync('fillEasyncOrderNumber', amazonOrderId, sendOrderBtn);
            });
        }
        if (sendTrackingBtn) {
             sendTrackingBtn.addEventListener('click', function() {
                sendDataToEasync('fillEasyncTrackingLink', amazonTrackingLink, sendTrackingBtn);
            });
        }
    }

    // Easync'e veri gönderme işlemini yapan helper fonksiyon
    function sendDataToEasync(action, data, buttonElement) {
        console.log(`[Seller Order AI - Sidepanel] Easync'e gönderiliyor: Action=${action}, Data=${data}`);
        updateStatus("Easync sayfası kontrol ediliyor...");
        buttonElement.disabled = true;
        buttonElement.textContent = "İşleniyor...";
        if (!data) {
            console.error('[Seller Order AI - Sidepanel] Hata: Gönderilecek veri yok');
            return;
        }
        chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
             if (!tabs || tabs.length === 0) {
                console.error('[Seller Order AI - Sidepanel] Hata: Aktif sekme yok');
                return;
             }
             const activeTab = tabs[0];
             if (!activeTab.url || !activeTab.url.includes('my.easync.io/stores/') || !activeTab.url.includes('/orders/')) {
                console.error('[Seller Order AI - Sidepanel] Hata: Easync sayfası değil');
                return;
             }
             console.log(`[Seller Order AI - Sidepanel] Easync sayfasına (${activeTab.id}) mesaj gönderiliyor.`);
             updateStatus("Easync'e veri gönderiliyor...", 'grey');
             chrome.tabs.sendMessage(activeTab.id, { action: action, value: data }, function(response) {
                 buttonElement.disabled = false;
                 buttonElement.textContent = action === 'fillEasyncOrderNumber' ? "Order numarasını Easync ye ekle" : "Takip numarasını Easync ye ekle";
                 if (chrome.runtime.lastError) {
                    console.error('[Seller Order AI - Sidepanel] Easync content scripte mesaj gönderme hatası:', chrome.runtime.lastError.message);
                    updateStatus(`Hata: ${chrome.runtime.lastError.message || 'Easync sayfası yanıt vermedi.'}`, 'red');
                 } else if (response && response.success) {
                    console.log(`[Seller Order AI - Sidepanel] Easync'ten başarılı yanıt: ${action}`);
                    updateStatus(response.message || "Easync'e başarıyla işlendi.", 'green');
                    buttonElement.style.backgroundColor = '#d4edda';
                 } else {
                    console.warn(`[Seller Order AI - Sidepanel] Easync'ten başarısız yanıt: ${action}`, response);
                    updateStatus(response?.message || "Easync'e işlenemedi.", 'orange');
                 }
             });
         });
    }

    // Amazon sipariş detayları butonunu ekleyen fonksiyon
    function addFindOrderDetailsButton(customerName) {
        const findAmazonDetailsButton = document.getElementById('find-amazon-order-details');
        if (findAmazonDetailsButton) {
            findAmazonDetailsButton.style.display = 'block';
            findAmazonDetailsButton.disabled = false;
            console.log('[Seller Order AI - Sidepanel] Amazon sipariş detayları butonu aktif edildi.');
        } else {
            console.warn('[Seller Order AI - Sidepanel] find-amazon-order-details butonu bulunamadı!');
        }
    }

    // Tabloya veri gönderme fonksiyonu (NİHAİ VERSİYON)
    async function sendDataToTable() {
        try {
            updateStatus('Tüm veriler toplanıyor...', 'blue');

            // Helper fonksiyonları
            const getText = (id) => document.getElementById(id)?.textContent?.trim() || '';
            const getInputValue = (id) => document.getElementById(id)?.value?.trim() || '';
            const getLinkHref = (id) => document.getElementById(id)?.querySelector('a')?.href || '';

            // 1. Transaction ID'yi al
            const ebaySearchUrl = getLinkHref('popup-value-ebay-url');
            let transactionId = '';
            if (ebaySearchUrl) {
                const match = ebaySearchUrl.match(/[?&]transid=([^&]+)/i);
                if (match && match[1]) transactionId = match[1];
            }
            if (!transactionId) {
                updateStatus('Geçerli bir Transaction ID bulunamadı!', 'red');
                return;
            }

            // 2. Diğer tüm verileri topla
            const easyncUrl = getLinkHref('popup-value-easync-url');
            const orderTotal = getInputValue('ebay-order-total');
            const netEarnings = getInputValue('ebay-earnings');
            const profitStr = getText('profit-value'); // Örn: "$12.31"

            // Amazon sipariş detayları (ID'si güncellendi)
            const amazonOrderUrl = getLinkHref('amazon-order-link-value'); // Metin yerine linki oku
            const amazonTotalStr = getText('amazon-total-value');
            const amazonTrackingLink = getLinkHref('amazon-tracking-link-value');

            // 3. ROI Hesaplaması için sayıları temizle
            const parseMoney = (str) => parseFloat(str.replace(/[^0-9.]/g, '')) || 0;
            const profit = parseMoney(profitStr);
            const amazonTotal = parseMoney(amazonTotalStr);
            
            let roi = 0;
            if (amazonTotal > 0) {
                roi = ((profit / amazonTotal) * 100).toFixed(2);
            }

            // 4. Nihai veri paketini oluştur
            const dataToSend = {
                transactionId,
                easyncUrl,
                ebaySearchUrl,
                orderTotal,
                netEarnings,
                profit: profitStr,
                roi: roi + '%',
                amazonOrderId: amazonOrderUrl, // Linki gönder
                amazonTotal: amazonTotalStr,
                amazonTrackingLink
            };
            
            updateStatus('Veriler tabloya gönderiliyor...', 'blue');

            // 5. Background script'e mesaj gönder
            const response = await chrome.runtime.sendMessage({
                action: 'sendToTable',
                data: dataToSend
            });

            // Yanıtı işle (Bu kısım background'dan dönecek cevaba göre ayarlanmalı)
            if (response.success) {
                updateStatus('Veriler tabloya başarıyla gönderildi!', 'green');
            } else {
                 if (response.error === "duplicate") {
                    updateStatus('Bu sipariş zaten tabloda mevcut.', 'orange');
                } else {
                    updateStatus('Veriler gönderilemedi: ' + (response.error || 'Bilinmeyen hata'), 'red');
                }
            }
        } catch (error) {
            console.error('[Seller Order AI - Sidepanel] Tabloya veri gönderme hatası:', error);
            updateStatus('İşlem sırasında bir hata oluştu: ' + error.message, 'red');
        }
    }

    // Tabloya gönder butonuna event listener ekle
    const sendToTableBtn = document.getElementById('send-to-table-btn');
    if (sendToTableBtn) {
        sendToTableBtn.addEventListener('click', sendDataToTable);
    }

    // --- Main Logic --- 
    updateStatus('Müşteri bilgileri alınıyor...', 'grey');

    try {
        const result = await chrome.storage.local.get('orderData');
        if (result.orderData) {
            currentOrderData = result.orderData;
            console.log('[Seller Order AI - Sidepanel] Alınan veriler:', currentOrderData);
            const { customer, product, transaction, easyncOrderUrl } = currentOrderData;
            
            // Ayrıştırma
            const { city, state, zip } = parseCityStateZip(customer.cityStateZip);
            const fullAddressForMap = `${customer.address1}, ${city}, ${state} ${zip}`;

            // Müşteri Bilgileri
            updateField('name', customer.name);
            updateField('phone', customer.phone);
            updateField('address1', customer.address1, `https://www.google.com/maps/place/${encodeURIComponent(fullAddressForMap)}`);
            updateField('address2', customer.address2);
            updateField('city', city); // Sadece metin olarak göster
            updateField('state', state);
            updateField('zip', zip);
            updateField('country', customer.country);

            // Ürün Bilgileri
            updateField('asin', product.asin, `https://www.amazon.com/dp/${product.asin}`);
            updateField('quantity', product.quantity);

            // Linkler
            updateField('easync-url', easyncOrderUrl, easyncOrderUrl, 'Sipariş Sayfasına Git');
            updateField('ebay-url', transaction.ebayUrl, transaction.ebayUrl, 'Sipariş Detaylarını Görüntüle');
            
            statusDiv.textContent = 'Müşteri bilgileri başarıyla alındı.';
            statusDiv.style.color = 'green';
            updateStatus('Müşteri bilgileri başarıyla alındı.', 'green');

            // Dinamik olarak Amazon sipariş detayları butonunu ekle
            addFindOrderDetailsButton(customer.name);
            addCopyListeners(infoListDiv);
            addEasyncActionListeners(); 

            updateStatus('Veriler başarıyla alındı. Amazon formunu doldurabilirsiniz.', 'green');

            // Müşteri adı varsa, manuel sipariş arama butonunu aktif et
            if (currentOrderData.customer && currentOrderData.customer.name) {
                document.getElementById('find-amazon-order-details').disabled = false;
            }

            // Müşteri adı varsa, sipariş arama butonunu aktif et
            if(customer.name) {
                addFindOrderDetailsButton(customer.name);
            }

        } else {
             console.log('[Seller Order AI - Sidepanel] Kayıtlı veri bulunamadı.');
             updateStatus('Henüz veri alınmadı. Lütfen Easync sayfasından verileri alın.', 'red');
             amazonOrderResultsDiv.innerHTML = ''; // Amazon sonuçlarını da temizle
        }
    } catch (error) {
        console.error('[Seller Order AI - Sidepanel] Müşteri bilgileri alınırken hata:', error);
        updateStatus(`Hata: Müşteri bilgileri alınırken hata oluştu. ${error.message}`, 'red');
        infoListDiv.innerHTML = '<p>Hata oluştu.</p>'; // Clear the list area
    }

    // --- Yeni Buton İşleyicisi: Amazon Formunu Doldur ---
    const fillAmazonButton = document.getElementById('fill-amazon-form');
    if (fillAmazonButton) {
        fillAmazonButton.addEventListener('click', function() {
            console.log('[Seller Order AI - Sidepanel] Amazon Adres Formunu Doldur butonuna tıklandı.');
            updateStatus('Amazon formu aranıyor ve dolduruluyor...', 'grey');
            updateStatus('Buton geçici olarak devre dışı bırakıldı.', 'grey');
            fillAmazonButton.disabled = true; // Butonu geçici olarak devre dışı bırak

            // Yan paneldeki mevcut değerleri oku
            const getValue = (id) => document.getElementById(id)?.textContent || '';
            const formData = {
                fullName: getValue('popup-value-name'),
                phone: getValue('popup-value-phone'),
                address1: getValue('popup-value-address1'),
                address2: getValue('popup-value-address2'),
                city: getValue('popup-value-city'),
                state: getValue('popup-value-state'),
                zip: getValue('popup-value-zip'),
                country: getValue('popup-value-country')
            };

            console.log('[Seller Order AI - Sidepanel] Content script\'e gönderilecek form verisi:', formData);

            // TÜM sekmeleri tara ve Amazon adres formunu içeren sekmeyi bul
            chrome.tabs.query({}, function(tabs) {
                console.log('[Seller Order AI - Sidepanel] Tüm sekmeler taranıyor:', tabs.length);
                let amazonTab = null;

                for (const tab of tabs) {
                    // Sekme URL'sini kontrol et
                    if (!tab.url) {
                        console.log('[Seller Order AI - Sidepanel] Sekme URL yok, atlanıyor:', tab.id);
                        continue;
                    }
                    
                    // Çok daha basit Amazon URL kontrolü
                    const isPotentialAmazonAddressPage = 
                        tab.url.includes('amazon.com') && 
                        (tab.url.includes('/gp/buy/addressselect') || tab.url.includes('/checkout'));
                        
                    console.log(`[Seller Order AI - Sidepanel] Sekme kontrol: ID=${tab.id}, URL=${tab.url}, UygunMu=${isPotentialAmazonAddressPage}`);

                    if (isPotentialAmazonAddressPage) {
                        amazonTab = tab;
                        console.log('[Seller Order AI - Sidepanel] Uygun Amazon sekmesi bulundu:', amazonTab);
                        break; // İlk uygun sekmeyi bulduk, döngüden çık
                    }
                }
                
                if (!amazonTab) {
                    console.error('[Seller Order AI - Sidepanel] Uygun Amazon adres formu sekmesi bulunamadı.');
                    updateStatus('Hata: Açık sekmelerde uygun bir Amazon adres formu bulunamadı.', 'red');
                    fillAmazonButton.disabled = false;
                    return;
                }
                
                try {
                    // Mesajı Amazon sekmesine gönder
                    chrome.tabs.sendMessage(amazonTab.id, {
                        action: "fillAmazonForm",
                        formData: formData
                    }, function(response) {
                        console.log('[Seller Order AI - Sidepanel] sendMessage callback BAŞLADI.'); // YENİ LOG
                        if (chrome.runtime.lastError) {
                            console.error('[Seller Order AI - Sidepanel] sendMessage callback - chrome.runtime.lastError:', chrome.runtime.lastError.message, chrome.runtime.lastError); // Detaylı log
                            updateStatus(`Hata (lastError): ${chrome.runtime.lastError.message || 'Content script yanıt vermedi.'}`, 'red');
                        } else if (response) { // response'un varlığını kontrol et
                            console.log('[Seller Order AI - Sidepanel] sendMessage callback - Yanıt alındı:', response); // YENİ LOG
                            if (response.success) {
                                console.log('[Seller Order AI - Sidepanel] Content script\'ten başarılı yanıt:', response.message);
                                updateStatus(response.message || 'Form başarıyla dolduruldu!', 'green');
                            } else {
                                console.warn('[Seller Order AI - Sidepanel] Content script\'ten başarısız yanıt (response.success false):', response);
                                updateStatus(response.message || 'Form doldurulamadı (başarısız).', 'orange');
                            }
                        } else {
                            // Bu durum, lastError yok ama response da yok demek. Bu da "Could not establish connection" gibi bir duruma işaret edebilir.
                            console.error('[Seller Order AI - Sidepanel] sendMessage callback - HATA: chrome.runtime.lastError yok AMA response da tanımsız/null!');
                            updateStatus('Hata: Content scriptten yanıt alınamadı (response tanımsız).', 'red');
                        }
                        fillAmazonButton.disabled = false; // Butonu tekrar etkinleştir
                        console.log('[Seller Order AI - Sidepanel] sendMessage callback BİTTİ.'); // YENİ LOG
                    });
                } catch (err) {
                    console.error('[Seller Order AI - Sidepanel] Mesaj gönderme hatası:', err);
                    updateStatus('Beklenmedik bir hata oluştu.', 'red');
                    fillAmazonButton.disabled = false;
                }
            });
        });
    } else {
        console.error('[Seller Order AI - Sidepanel] fill-amazon-form butonu bulunamadı!');
    }

    /**
     * Amazon sipariş detaylarını bulma işlemini tetikler.
     * Bu fonksiyon, hem manuel buton tıklamasıyla hem de otomatik olarak çağrılabilir.
     */
    function triggerFindOrderDetails() {
        updateStatus("Amazon sipariş sayfası kontrol ediliyor...", "blue");
            chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
            if (tabs.length === 0) {
                updateStatus("Aktif sekme bulunamadı.", "red");
                    return;
                }
                const activeTab = tabs[0];
            // URL kontrolünü genişlet: "order-history" VEYA "/your-orders/orders" içermeli
            if (activeTab.url && (activeTab.url.includes("order-history") || activeTab.url.includes("/your-orders/orders"))) {
                console.log(`[Seller Order AI - Sidepanel] Amazon sipariş sayfasında (${activeTab.id}) arama tetikleniyor.`);
                updateStatus("Sipariş detayları aranıyor...", "blue");
                chrome.tabs.sendMessage(activeTab.id, {
                    action: "findAmazonOrder",
                    customerName: currentOrderData.customer.name
                }, function(response) {
                    if (chrome.runtime.lastError) {
                        console.error('[Seller Order AI - Sidepanel] Mesaj gönderme hatası:', chrome.runtime.lastError.message);
                        updateStatus(`Amazon'a mesaj gönderilemedi: ${chrome.runtime.lastError.message}`, 'red');
                        return;
                    }
                    if (response && response.success) {
                        console.log('[Seller Order AI - Sidepanel] Amazon sipariş detayları bulundu:', response);
                        updateStatus('Amazon sipariş detayları başarıyla bulundu!', 'green');

                        // Gelen veriyi değişkenlere kaydet
                        amazonOrderId = response.orderId;
                        amazonTrackingLink = response.trackingLink;
                        
                        const resultsHTML = createOrderResultsHTML(response.orderId, response.purchasePrice, response.trackingLink);
                        amazonOrderResultsDiv.innerHTML = resultsHTML;

                        // Kopyalama butonlarına tekrar listener ekle
                        addCopyListeners(amazonOrderResultsDiv);

                        // Easync'e gönderme butonlarını ekle ve listener ata
                        amazonOrderResultsDiv.appendChild(createEasyncSendButtons(amazonOrderId, amazonTrackingLink));
                        addEasyncActionListeners();

                        // İşlem tamamlandıktan sonra Easync sekmesine geri dön
                        if (currentOrderData && currentOrderData.easyncOrderUrl) {
                            const easyncUrl = currentOrderData.easyncOrderUrl;
                            chrome.tabs.query({ url: easyncUrl }, function(tabs) {
                                if (tabs.length > 0) {
                                    const easyncTab = tabs[0];
                                    chrome.tabs.update(easyncTab.id, { active: true });
                                    console.log(`[Seller Order AI - Sidepanel] Easync sekmesine (${easyncTab.id}) geri dönüldü.`);
                                }
                            });
                        }

                    } else {
                        console.warn('[Seller Order AI - Sidepanel] Sipariş bulunamadı veya hata oluştu:', response);
                        updateStatus(`Sipariş bulunamadı: ${response.message}`, 'orange');
                    }
                });
            }
        });
    }

    // Amazon Sipariş Detaylarını Bulma Butonu (artık sadece tetikleyiciyi çağırıyor)
    document.getElementById('find-amazon-order-details').addEventListener('click', triggerFindOrderDetails);

    // Amazon Sipariş Sayfasına Git Butonu (artık arama işlemini otomatik tetikliyor)
    document.getElementById('go-to-amazon-orders-btn').addEventListener('click', () => {
        updateStatus('Amazon sipariş sayfasına gidiliyor...', 'grey');
        const orderHistoryUrl = 'https://www.amazon.com/gp/your-account/order-history';

        // Sayfa yüklendiğinde sipariş aramasını başlatacak olan dinleyici fonksiyonu
        const startOrderSearchOnLoad = (tabId) => {
            const listener = (updatedTabId, changeInfo, tab) => {
                // Sadece hedef sekme ve yükleme tamamlandığında devam et
                if (updatedTabId === tabId && changeInfo.status === 'complete' && tab.url && (tab.url.includes('order-history'))) {
                    updateStatus('Amazon sipariş sayfası yüklendi. Detaylar aranıyor...', 'grey');
                    
                    // Arama fonksiyonunu tetikle
                    triggerFindOrderDetails();
                    
                    // Dinleyiciyi kaldır, bu çok önemli!
                    chrome.tabs.onUpdated.removeListener(listener);
                }
            };
            chrome.tabs.onUpdated.addListener(listener);
        };

        // Açık bir Amazon sekmesi ara
        chrome.tabs.query({ url: "*://*.amazon.com/*" }, (tabs) => {
            if (tabs.length > 0) {
                const amazonTab = tabs[0];
                chrome.tabs.update(amazonTab.id, { url: orderHistoryUrl, active: true }, (updatedTab) => {
                    if (updatedTab) startOrderSearchOnLoad(updatedTab.id);
                });
            } else {
                chrome.tabs.create({ url: orderHistoryUrl, active: true }, (newTab) => {
                    if (newTab) startOrderSearchOnLoad(newTab.id);
                });
            }
        });
    });

    // eBay Bilgilerini Al butonu için olay dinleyici
    document.getElementById('get-ebay-details').addEventListener('click', async () => {
        updateStatus('eBay bilgileri alınıyor...', 'grey');
        const ebayUrl = document.querySelector('#popup-value-ebay-url a')?.href;
        const asinUrl = document.querySelector('#popup-value-asin a')?.href;

        if (!ebayUrl) {
            updateStatus('Hata: Geçerli bir eBay URL\'si bulunamadı.', 'red');
            return;
        }

        try {
            // Önce eBay sekmesini bul veya oluştur
            let [ebayTab] = await chrome.tabs.query({ url: ebayUrl });
            if (!ebayTab) {
                ebayTab = await chrome.tabs.create({ url: ebayUrl, active: true });
                        } else {
                await chrome.tabs.update(ebayTab.id, { active: true });
            }

            // Sayfanın tam olarak yüklenmesini beklemek için bir dinleyici kur
            const onEbayTabUpdated = (tabId, changeInfo) => {
                if (tabId === ebayTab.id && changeInfo.status === 'complete') {
                    // Dinleyiciyi hemen kaldır
                    chrome.tabs.onUpdated.removeListener(onEbayTabUpdated);

                    // Bilgileri almak için mesaj gönder
                    chrome.tabs.sendMessage(ebayTab.id, { action: "getEbayDetails" }, (response) => {
                        if (chrome.runtime.lastError || !response || !response.success) {
                            console.error('[Seller Order AI - Sidepanel] eBay bilgileri alınamadı:', chrome.runtime.lastError || response);
                            updateStatus('Hata: eBay bilgileri alınamadı.', 'red');
                            return;
                        }

                        // Arayüzü güncelle
                        updateStatus('eBay bilgileri başarıyla alındı.', 'green');
                        const { orderTotal, orderEarnings } = response.data.orderDetails;
                        document.getElementById('ebay-order-total').value = orderTotal || '';
                        document.getElementById('ebay-earnings').value = orderEarnings || '';
                        document.getElementById('get-ebay-details').classList.add('success-button');

                        // Amazon ürün sayfasını aç
                        if (asinUrl) {
                            chrome.tabs.create({ url: asinUrl, active: true });
                        }

                        // Son olarak eBay sekmesini kapat
                        chrome.tabs.remove(ebayTab.id);
                    });
                }
            };

            // Eğer sekme yeni açıldıysa veya henüz yüklenmediyse dinleyiciyi kur
            if (ebayTab.status !== 'complete') {
                 chrome.tabs.onUpdated.addListener(onEbayTabUpdated);
                    } else {
                // Sekme zaten yüklendiyse, dinleyiciyi taklit et ve doğrudan çalıştır
                onEbayTabUpdated(ebayTab.id, { status: 'complete' });
            }

        } catch (error) {
            console.error('[Seller Order AI - Sidepanel] eBay işlemi sırasında hata:', error);
            updateStatus(`Hata: ${error.message}`, 'red');
        }
    });

    /**
     * Amazon sipariş detayları bulunduğunda gösterilecek HTML'i oluşturur.
     */
    function createOrderResultsHTML(orderId, purchasePrice, trackingLink) {
        // Amazon sipariş detayları için tam URL oluştur
        const orderDetailsUrl = orderId ? `https://www.amazon.com/gp/your-account/order-details/?orderID=${orderId}` : '#';

        return `
            <div class="info-row" id="amazon-order-link-value">
                <span class="label">Amazon Order #:</span>
                <span class="value">
                    <a href="${orderDetailsUrl}" target="_blank" rel="noopener noreferrer">${orderId}</a>
                </span>
            </div>
            <div class="info-row">
                <span class="label">Total:</span>
                <span class="value" id="amazon-total-value">${purchasePrice}</span>
            </div>
            <div class="info-row" id="amazon-tracking-link-value">
                <span class="label">Track Link:</span>
                <span class="value">
                    <a href="${trackingLink}" target="_blank" rel="noopener noreferrer">Takip Et</a>
                </span>
            </div>
        `;
    }

    /**
     * Easync'e veri gönderme butonlarını içeren bir div elementi oluşturur.
     */
    function createEasyncSendButtons(orderId, trackingLink) {
        const container = document.createElement('div');
        container.id = 'easync-actions';
        container.style.cssText = "margin-top: 10px; padding-top: 8px; border-top: 1px dashed #ccc; text-align: center;";

        if (orderId) {
            const orderBtn = document.createElement('button');
            orderBtn.id = 'send-amazon-order-to-easync';
            orderBtn.className = 'action-btn';
            orderBtn.textContent = 'Order #\'ı Easync\'e Ekle';
            orderBtn.style.cssText = "padding: 4px 8px; font-size: 11px; margin-right: 5px; background-color: lightblue;";
            container.appendChild(orderBtn);
        }

        if (trackingLink) {
            const trackBtn = document.createElement('button');
            trackBtn.id = 'send-tracking-to-easync';
            trackBtn.className = 'action-btn';
            trackBtn.textContent = 'Takip Linkini Easync\'e Ekle';
            trackBtn.style.cssText = "padding: 4px 8px; font-size: 11px; background-color: lightgreen;";
            container.appendChild(trackBtn);
        }
        return container;
    }

    // Kar Hesaplama Butonu için olay dinleyici
    const calculateProfitBtn = document.getElementById('calculate-profit-btn');
    if (calculateProfitBtn) {
        calculateProfitBtn.addEventListener('click', function() {
            const ebayEarningsStr = document.getElementById('ebay-earnings')?.value;
            // Amazon maliyetini doğru ID'den oku
            const amazonCostStr = document.getElementById('amazon-total-value')?.textContent; 
            const profitRow = document.getElementById('row-profit');
            const profitValue = document.getElementById('profit-value');

            if (!amazonCostStr) {
                updateStatus('Önce Amazon sipariş detaylarını bulun.', 'orange');
                return;
            }

            const ebayNetValue = ebayEarningsStr;
            const amazonTotalValue = amazonCostStr;

            const ebayNet = parseCurrency(ebayNetValue);
            const amazonTotal = parseCurrency(amazonTotalValue);

            if (amazonTotal === 0) {
                 updateStatus('Amazon toplam tutarı alınamadı.', 'orange');
                                    return;
                                }

            const profit = ebayNet - amazonTotal;

            // Para birimi sembolünü eBay inputundan almayı dene, bulamazsa $ varsay
            const currencySymbol = ebayNetValue.trim().match(/^[^\d.,\s]+/)?.[0] || '$';

            profitValue.textContent = `${currencySymbol}${profit.toFixed(2)}`;
            profitValue.style.color = profit >= 0 ? '#1e8e3e' : '#d93025'; // Pozitifse yeşil, negatifse kırmızı

            profitRow.classList.remove('hidden');
            updateStatus('Kâr hesaplandı.', 'green');
        });
    }
}); 