// Bu script, eklenti ikonuna tıklandığında yan paneli açar/kapatır.

// chrome.sidePanel
//   .setPanelBehavior({ openPanelOnActionClick: true })
//   .catch((error) => console.error(error));

console.log("[Seller Order AI - Background] Service worker yüklendi."); 

// content.js'den ve popup.js'den gelen mesajları dinlemek için tek bir listener
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    // Yan paneli açma isteği
    if (request.action === "openSidePanel") {
        console.log("[Seller Order AI - Background] Yan paneli açma isteği alındı.");
        if (sender.tab?.windowId) {
            chrome.sidePanel.open({ windowId: sender.tab.windowId });
        } else {
            console.error("[Seller Order AI - Background] Yan paneli açmak için windowId bulunamadı.");
        }
        return; // Senkron işlem
    }
    
    // Keepa API sorgusu
    if (request.action === 'keepa-query') {
        const url = request.url;

        if (!url) {
            sendResponse({ success: false, error: 'URL sağlanmadı.' });
            return true; // Asenkron yanıt
        }

        console.log('Background script Keepa isteğini aldı:', url);

        fetch(url, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP Hatası: ${response.status} ${response.statusText}`);
            }
            // Cevabı JSON olarak işlemeden önce ham metin olarak al
            return response.text();
        })
        .then(text => {
            console.log('Background script Keepa\'dan ham yanıt aldı:', text);
            try {
                // Metni manuel olarak JSON'a çevirmeyi dene
                const data = JSON.parse(text);
                sendResponse({ success: true, data: data, raw: text });
            } catch (e) {
                // Eğer JSON'a çevrilemezse, bu bir hatadır.
                console.error('JSON parse hatası:', e);
                throw new Error('Keepa\'dan gelen yanıt geçerli bir JSON formatında değil.');
            }
        })
        .catch(error => {
            console.error('Background script fetch hatası:', error);
            sendResponse({ success: false, error: error.message });
        });

        return true; // sendResponse'un asenkron olarak çağrılacağını belirtir
    }

    // YENİ VE DİNAMİK Tabloya Veri Gönderme İsteği
    if (request.action === 'sendToTable') {
        console.log('[Seller Order AI - Background] Apps Script\'e veri gönderme isteği alındı:', request.data);

        // Kaydedilmiş Web App URL'sini al
        chrome.storage.sync.get(['webAppUrl'], function(result) {
            const webAppUrl = result.webAppUrl;

            // URL kaydedilmiş mi diye kontrol et
            if (!webAppUrl) {
                console.error('[Seller Order AI - Background] Web App URL bulunamadı. Lütfen ayarlardan kaydedin.');
                sendResponse({ success: false, error: "Web App URL'si ayarlanmamış. Lütfen eklenti ayarlarına gidin." });
                return; // URL yoksa işlemi durdur
            }

            // URL varsa fetch isteğini gönder
            fetch(webAppUrl, {
                method: 'POST',
                mode: 'cors',
                cache: 'no-cache',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(request.data)
            })
            .then(response => response.json()) // Yanıtı JSON olarak işle
            .then(data => {
                // Apps Script'ten gelen yanıtı doğrudan geri gönder
                console.log('[Seller Order AI - Background] Apps Script\'ten yanıt alındı:', data);
                sendResponse(data);
            })
            .catch(error => {
                console.error('[Seller Order AI - Background] Apps Script\'e gönderme hatası:', error);
                sendResponse({ success: false, error: error.message });
            });
        });

        return true; // Asenkron yanıt olduğunu belirtir
    }
}); 

chrome.webNavigation.onBeforeNavigate.addListener(
  function (details) {
    // Check for any Amazon domain
    if (
      /^https?:\/\/www\.amazon\.(com|ca|co\.uk|com\.au|co\.jp|de|fr|it|es|in|com.mx|com.br|ae|com.tr|nl|pl|se|sg|eg|sa)/.test(
        details.url
      )
    ) {

      const newUrl = new URL(details.url);

      // Hedeflenecek URL'leri belirleyen koşullar
      const isProductPage = newUrl.pathname.includes('/dp/') || newUrl.pathname.includes('/gp/product/');
      const isBuyAgain = newUrl.pathname.includes('/gp/buyagain');
      const isMobileMission = newUrl.pathname.includes('/hz/mobile/mission');
      // "Sepete Ekle" linklerini hem yoldan hem de parametrelerden tanı
      const isCartAddAction = newUrl.pathname.includes('aws/cart/add.html') || newUrl.searchParams.has('ASIN.1') || newUrl.searchParams.has('AssociateTag');

      // Eğer koşullardan hiçbiri karşılanmıyorsa, işlem yapmadan çık
      if (!isProductPage && !isBuyAgain && !isMobileMission && !isCartAddAction) {
        return;
      }
      
      let shouldUpdate = false;

      // Mevcut "tag" parametrelerini kontrol et
      const tags = newUrl.searchParams.getAll("tag");
      if (tags.length > 0) {
        // Eğer etiket(ler) zaten bizimkiyle eşleşmiyorsa, güncelleme yap
        if (!(tags.length === 1 && tags[0] === "amz_order-20")) {
          shouldUpdate = true;
        }
      } else {
        // Hiç etiket yoksa, bizimkini ekle
        shouldUpdate = true;
      }

      if (shouldUpdate) {
        // "tag" dışındaki tüm parametreleri al
        const params = Array.from(newUrl.searchParams.entries()).filter(
          ([key]) => key !== "tag"
        );

        // Tüm parametreleri temizle
        newUrl.search = "";

        // Parametrelerin ilk yarısını ekle
        const midPoint = Math.floor(params.length / 2);
        for (let i = 0; i < midPoint; i++) {
          newUrl.searchParams.append(params[i][0], params[i][1]);
        }

        // Bizim etiketimizi ekle
        newUrl.searchParams.append("tag", "amz_order-20");

        // Parametrelerin kalanını ekle
        for (let i = midPoint; i < params.length; i++) {
          newUrl.searchParams.append(params[i][0], params[i][1]);
        }

        // Sekmeyi yeni URL ile güncelle
        chrome.tabs.update(details.tabId, {
          url: newUrl.toString(),
        });
      }
    }
  },
  {
    url: [
      {
        hostContains: "amazon",
      },
    ],
  }
); 

// Google Sheets API için yardımcı fonksiyonlar
async function getAuthToken() {
    try {
        const auth = await chrome.identity.getAuthToken({ interactive: true });
        return auth.token;
    } catch (error) {
        console.error('[Seller Order AI - Background] Auth token alma hatası:', error);
        throw error;
    }
}

async function getLastRow(sheetId) {
    try {
        const token = await getAuthToken();
        const response = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/A:C`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data.values ? data.values.length : 0;
    } catch (error) {
        console.error('[Seller Order AI - Background] Son satır bulma hatası:', error);
        throw error;
    }
}

async function writeToSheet(sheetId, range, values) {
    try {
        const token = await getAuthToken();
        const response = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${range}?valueInputOption=USER_ENTERED`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                values: values
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('[Seller Order AI - Background] Tabloya yazma hatası:', error);
        throw error;
    }
} 